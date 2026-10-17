import { useEffect, useRef, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Check, Move, Save, Type } from 'lucide-react';
import { sandboxWebsiteEditorHtml } from '../lib/sandboxWebsite';

type Selection = { id: string; tag: string; text: string; editableText: boolean; width: number; height: number; fontSize: number; x: number; y: number; align: string };

export function WebsiteVisualEditor({ html, onSave }: { html: string; onSave: (html: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.source !== 'eduhub-visual-editor') return;
      if (event.data.type === 'selection') setSelection(event.data as Selection);
      if (event.data.type === 'serialized' && typeof event.data.html === 'string') { onSave(event.data.html); setSaved(true); window.setTimeout(() => setSaved(false), 1800); }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onSave]);

  const update = (property: string, value: string | number) => frame.current?.contentWindow?.postMessage({ source: 'eduhub-visual-editor-host', type: 'update', property, value }, '*');
  const save = () => frame.current?.contentWindow?.postMessage({ source: 'eduhub-visual-editor-host', type: 'serialize', requestId: crypto.randomUUID() }, '*');

  return <section className="website-canvas-editor" aria-label="Bộ chỉnh sửa website trực quan">
    <div className="website-canvas-toolbar"><span><Move size={14} /> Chọn phần tử trên trang để chỉnh sửa</span><button type="button" className="button button-primary" onClick={save}><Save size={14} /> {saved ? 'Đã lưu chỉnh sửa' : 'Lưu vào mã HTML'}</button></div>
    <div className="website-canvas-workspace">
      <div className="website-canvas-stage"><iframe ref={frame} title="Canvas chỉnh sửa website" sandbox="allow-scripts allow-popups" referrerPolicy="no-referrer" srcDoc={sandboxWebsiteEditorHtml(html)} /></div>
      <aside className="website-inspector">
        <div className="website-inspector-heading"><b>Thuộc tính</b>{selection && <small>&lt;{selection.tag}&gt;</small>}</div>
        {selection ? <>
          {selection.editableText && <label className="website-inspector-field"><span><Type size={13} /> Nội dung chữ</span><textarea value={selection.text} onChange={(e) => { setSelection({ ...selection, text: e.target.value }); update('text', e.target.value); }} rows={4} /></label>}
          <div className="website-inspector-grid"><label className="website-inspector-field"><span>Rộng (px)</span><input type="number" min="1" value={selection.width} onChange={(e) => { const width = Number(e.target.value); setSelection({ ...selection, width }); update('width', width); }} /></label><label className="website-inspector-field"><span>Cao (px)</span><input type="number" min="1" value={selection.height} onChange={(e) => { const height = Number(e.target.value); setSelection({ ...selection, height }); update('height', height); }} /></label></div>
          <label className="website-inspector-field"><span>Cỡ chữ (px)</span><input type="number" min="8" max="120" value={selection.fontSize} onChange={(e) => { const fontSize = Number(e.target.value); setSelection({ ...selection, fontSize }); update('fontSize', fontSize); }} /></label>
          <div className="website-inspector-field"><span>Căn chữ</span><div className="website-align-buttons">{(['left','center','right'] as const).map((align) => { const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight; return <button key={align} type="button" aria-label={`Căn ${align}`} className={selection.align === align ? 'active' : ''} onClick={() => { setSelection({ ...selection, align }); update('align', align); }}><Icon size={15} /></button>; })}</div></div>
          <div className="website-inspector-grid"><label className="website-inspector-field"><span>Dịch ngang (px)</span><input type="number" value={selection.x} onChange={(e) => { const x = Number(e.target.value); setSelection({ ...selection, x }); update('x', x); }} /></label><label className="website-inspector-field"><span>Dịch dọc (px)</span><input type="number" value={selection.y} onChange={(e) => { const y = Number(e.target.value); setSelection({ ...selection, y }); update('y', y); }} /></label></div>
          <p className="website-inspector-note">Vị trí là độ dịch so với bố cục gốc. Chọn lại phần tử bất cứ lúc nào để chỉnh tiếp.</p>
        </> : <div className="website-inspector-empty"><Move size={20} /><p>Chọn một phần tử trên khung xem trước để mở các tùy chỉnh.</p></div>}
      </aside>
    </div>
    <div className="website-canvas-save-note"><Check size={13} /> Nhấn “Lưu vào mã HTML” trước khi tiếp tục để giữ lại các thay đổi.</div>
  </section>;
}
