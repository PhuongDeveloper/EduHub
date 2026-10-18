import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import WebSocket from 'ws';

async function waitPort(port, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
          let buf = '';
          res.on('data', chunk => buf += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(buf)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  throw new Error('Port wait timeout: ' + port);
}

async function run() {
  const url = process.argv[2] || 'http://localhost:5173/';
  const outputPath = process.argv[3] || 'screenshot.png';
  const width = parseInt(process.argv[4] || '390', 10);
  const height = parseInt(process.argv[5] || '844', 10);
  const clickSelector = process.argv[6] || null;
  const isMobile = width < 768;

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempDir = `C:\\Users\\PhuongDev\\AppData\\Local\\Temp\\chrome_shot_${Date.now()}`;
  const port = 9333 + Math.floor(Math.random() * 500);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--window-size=${width},${height}`,
    `--user-data-dir=${tempDir}`,
    'about:blank'
  ], { detached: false });

  try {
    const targets = await waitPort(port);
    const page = targets.find(t => t.type === 'page') || targets[0];
    if (!page) throw new Error('No target page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        pending.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise((resolve) => { ws.onopen = resolve; });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const res = pending.get(msg.id);
        pending.delete(msg.id);
        res(msg.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Console.enable');
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        }
      } catch (e) {}
    });
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile
    });

    console.log(`Navigating to ${url} (${width}x${height})...`);
    await send('Page.navigate', { url });

    // Wait for initial load and Supabase data
    await new Promise(r => setTimeout(r, 7000));

    if (clickSelector) {
      if (clickSelector.startsWith('scroll:')) {
        const y = parseInt(clickSelector.split(':')[1], 10);
        console.log('Scrolling window by:', y);
        await send('Runtime.evaluate', {
          expression: `window.scrollTo({ top: ${y}, behavior: 'instant' })`
        });
        await new Promise(r => setTimeout(r, 600));
      } else {
        console.log('Clicking selector:', clickSelector);
        await send('Runtime.evaluate', {
          expression: `document.querySelector('${clickSelector}')?.click()`
        });
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    const pageState = await send('Runtime.evaluate', {
      expression: `({
        filter: localStorage.getItem('eduhub-project-filters-v2'),
        url: window.location.href,
        projectsCount: document.querySelectorAll('.project-card').length,
        loading: document.querySelector('.project-loading-label')?.textContent,
        error: document.querySelector('.submit-error, .detail-load-error')?.textContent
      })`,
      returnByValue: true
    });
    console.log('[PAGE STATE]', pageState?.result?.value);

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    if (screenshot && screenshot.data) {
      fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
      console.log('Saved screenshot successfully:', outputPath);
    } else {
      throw new Error('Screenshot data empty');
    }

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch (e) {}
  }
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
