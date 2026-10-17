import { forwardRef, useEffect, useRef, type Ref } from 'react';
import { sandboxWebsiteHtml } from '../lib/sandboxWebsite';

type BrowserRequest = { source: 'eduhub-browser-bridge'; type: 'hello' | 'media' | 'geolocation' | 'watch' | 'clearWatch' | 'clipboard-read' | 'clipboard-write' | 'video-ready' | 'stop-media'; id?: string; constraints?: MediaStreamConstraints; method?: string; options?: PositionOptions; value?: string };
type TeacherWebsiteFrameProps = { title: string; html: string; className?: string };
const bridgeSource = 'eduhub-browser-bridge';
const hostSource = 'eduhub-browser-bridge-host';

function assignRef(ref: Ref<HTMLIFrameElement> | undefined, frame: HTMLIFrameElement | null) {
  if (typeof ref === 'function') ref(frame);
  else if (ref) ref.current = frame;
}

export const TeacherWebsiteFrame = forwardRef<HTMLIFrameElement, TeacherWebsiteFrameProps>(function TeacherWebsiteFrame({ title, html, className }, forwardedRef) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const watches = new Map<string, number>();
    const videoRelays = new Map<string, { stream: MediaStream; video: HTMLVideoElement; frameId: number; sending: boolean; lastFrame: number }>();
    const stopVideoRelay = (id: string) => {
      const relay = videoRelays.get(id);
      if (!relay) return;
      cancelAnimationFrame(relay.frameId);
      relay.video.pause();
      relay.video.srcObject = null;
      relay.stream.getTracks().forEach((track) => track.stop());
      videoRelays.delete(id);
    };
    const handleMessage = async (event: MessageEvent<BrowserRequest>) => {
      const frame = frameRef.current;
      const target = frame?.contentWindow;
      const message = event.data;
      if (!target || event.source !== target || !message || message.source !== bridgeSource) return;
      if (message.type === 'hello') {
        target.postMessage({ source: hostSource, type: 'ready' }, '*');
        return;
      }
      const replyError = (error: unknown) => {
        const failure = error instanceof Error ? error : new Error('Không thể sử dụng tính năng trên thiết bị này.');
        target.postMessage({ source: hostSource, type: 'error', id: message.id, name: failure.name, message: failure.message, code: 'code' in failure ? failure.code : undefined }, '*');
      };
      if ((message.type === 'stop-media' || message.type === 'video-ready') && typeof message.id === 'string') {
        if (message.type === 'stop-media') { stopVideoRelay(message.id); return; }
        const relay = videoRelays.get(message.id);
        if (!relay) return;
        const drawFrame = (time: number) => {
          if (videoRelays.get(message.id!) !== relay) return;
          if (!relay.sending && time - relay.lastFrame >= 40 && relay.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            relay.sending = true;
            relay.lastFrame = time;
            void createImageBitmap(relay.video).then((bitmap) => {
              if (videoRelays.get(message.id!) !== relay) { bitmap.close(); return; }
              try { target.postMessage({ source: hostSource, type: 'video-frame', id: message.id, bitmap }, '*', [bitmap]); }
              catch { bitmap.close(); stopVideoRelay(message.id!); }
            }).catch(() => {}).finally(() => { relay.sending = false; });
          }
          relay.frameId = requestAnimationFrame(drawFrame);
        };
        relay.frameId = requestAnimationFrame(drawFrame);
        return;
      }
      if (message.type === 'clearWatch' && typeof message.id === 'string') {
        const watchId = watches.get(message.id);
        if (watchId !== undefined) navigator.geolocation?.clearWatch(watchId);
        watches.delete(message.id);
        return;
      }
      if (message.type === 'clipboard-read' || message.type === 'clipboard-write') {
        try {
          if (!navigator.clipboard) throw new DOMException('Trình duyệt không hỗ trợ clipboard.', 'NotSupportedError');
          const value = message.type === 'clipboard-read' ? await navigator.clipboard.readText() : await navigator.clipboard.writeText(message.value || '');
          target.postMessage({ source: hostSource, type: 'result', id: message.id, value }, '*');
        } catch (error) { replyError(error); }
        return;
      }
      if (!['media', 'geolocation', 'watch'].includes(message.type) || typeof message.id !== 'string') return;
      if (message.type === 'geolocation' || message.type === 'watch') {
        if (!navigator.geolocation) { replyError(new DOMException('Trình duyệt không hỗ trợ vị trí.', 'NotSupportedError')); return; }
        const positionMessage = (position: GeolocationPosition) => {
          const serialized = { coords: { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, altitude: position.coords.altitude, altitudeAccuracy: position.coords.altitudeAccuracy, heading: position.coords.heading, speed: position.coords.speed }, timestamp: position.timestamp };
          if (frameRef.current?.contentWindow === target) target.postMessage({ source: hostSource, type: 'position', id: message.id, position: serialized }, '*');
        };
        const errorMessage = (error: GeolocationPositionError) => replyError(Object.assign(new Error(error.message), { name: 'GeolocationPositionError', code: error.code }));
        try {
          if (message.type === 'geolocation') navigator.geolocation.getCurrentPosition((position) => target.postMessage({ source: hostSource, type: 'result', id: message.id, value: { coords: { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, altitude: position.coords.altitude, altitudeAccuracy: position.coords.altitudeAccuracy, heading: position.coords.heading, speed: position.coords.speed }, timestamp: position.timestamp } }, '*'), errorMessage, message.options);
          else { const watchId = navigator.geolocation.watchPosition(positionMessage, errorMessage, message.options); watches.set(message.id, watchId); }
        } catch (error) { replyError(error); }
        return;
      }
      try {
        const mediaDevices = navigator.mediaDevices;
        if (!mediaDevices?.getUserMedia) throw new DOMException('Trình duyệt này không hỗ trợ camera hoặc micro.', 'NotSupportedError');
        let stream: MediaStream | null = null;
        let tracks: MediaStreamTrack[] = [];
        try {
          stream = await mediaDevices.getUserMedia(message.constraints || { video: true });
          tracks = stream.getTracks().map((track) => track.clone());
          if (frameRef.current?.contentWindow !== target) {
            tracks.forEach((track) => track.stop());
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          try {
            target.postMessage({ source: hostSource, type: 'result', id: message.id, tracks }, '*', tracks);
            stream.getTracks().forEach((track) => track.stop());
          } catch (transferError) {
            tracks.forEach((track) => track.stop());
            const wantsAudio = Boolean(message.constraints && typeof message.constraints === 'object' && message.constraints.audio);
            const videoTrack = stream.getVideoTracks()[0];
            if (wantsAudio || !videoTrack) throw new DOMException('Trình duyệt hiện không hỗ trợ chuyển micro qua khung website an toàn.', 'NotSupportedError');
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.srcObject = stream;
            await video.play();
            videoRelays.set(message.id, { stream, video, frameId: 0, sending: false, lastFrame: 0 });
            target.postMessage({ source: hostSource, type: 'video-relay', id: message.id, width: video.videoWidth || videoTrack.getSettings().width || 640, height: video.videoHeight || videoTrack.getSettings().height || 480 }, '*');
            void transferError;
          }
        } catch (error) {
          tracks.forEach((track) => track.stop());
          stream?.getTracks().forEach((track) => track.stop());
          throw error;
        }
      } catch (error) {
        replyError(error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => { window.removeEventListener('message', handleMessage); watches.forEach((id) => navigator.geolocation?.clearWatch(id)); videoRelays.forEach((_, id) => stopVideoRelay(id)); };
  }, []);

  return <iframe
    ref={(frame) => { frameRef.current = frame; assignRef(forwardedRef, frame); }}
    title={title}
    className={className}
    sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-modals"
    allow="camera; microphone; geolocation; clipboard-read; clipboard-write; fullscreen; autoplay; display-capture; picture-in-picture; web-share"
    referrerPolicy="no-referrer"
    srcDoc={sandboxWebsiteHtml(html)}
  />;
});
