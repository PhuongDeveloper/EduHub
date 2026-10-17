import { forwardRef, useEffect, useRef, type Ref } from 'react';
import { sandboxWebsiteHtml } from '../lib/sandboxWebsite';

type BrowserRequest = { source: 'eduhub-browser-bridge'; type: 'hello' | 'media' | 'geolocation' | 'watch' | 'clearWatch' | 'clipboard-read' | 'clipboard-write'; id?: string; constraints?: MediaStreamConstraints; method?: string; options?: PositionOptions; value?: string };
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
          target.postMessage({ source: hostSource, type: 'result', id: message.id, tracks }, '*', tracks);
          stream.getTracks().forEach((track) => track.stop());
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
    return () => { window.removeEventListener('message', handleMessage); watches.forEach((id) => navigator.geolocation?.clearWatch(id)); };
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
