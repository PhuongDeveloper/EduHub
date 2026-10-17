import { useEffect, useState, type FormEvent } from 'react';
import { Clock3, FileClock, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Revision = { id: string; version_no: number; release_notes: string; created_at: string; snapshot: { title?: string; description?: string } };
type Request = { id: string; release_notes: string; status: string; admin_note: string; created_at: string };
type Editable = { title: string; description: string; usage_guide: string; platform_url: string; download_url: string; video_url: string };
const LABELS: Record<keyof Editable, string> = { title: 'Tên dự án', description: 'Mô tả', usage_guide: 'Hướng dẫn sử dụng', platform_url: 'Liên kết mở dùng thử', download_url: 'Liên kết tải', video_url: 'Video demo' };

export function ResourceRevisionPanel({ resourceId, authorId, currentUserId, canEdit, current, onNotice }: { resourceId: string | undefined; authorId: string | undefined; currentUserId: string | undefined; canEdit: boolean; current: Editable; onNotice: (message: string) => void }) {
  const [history, setHistory] = useState<Revision[]>([]); const [requests, setRequests] = useState<Request[]>([]); const [draft, setDraft] = useState(current); const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false);
  const reload = async () => {
    if (!supabase || !resourceId) return;
    const revisions = await supabase.from('resource_revisions').select('id,version_no,release_notes,created_at,snapshot').eq('resource_id', resourceId).order('version_no', { ascending: false }).limit(20);
    if (!revisions.error) setHistory((revisions.data || []) as Revision[]);
    if (canEdit && currentUserId === authorId) { const own = await supabase.from('resource_revision_requests').select('id,release_notes,status,admin_note,created_at').eq('resource_id', resourceId).order('created_at', { ascending: false }).limit(10); if (!own.error) setRequests((own.data || []) as Request[]); }
  };
  useEffect(() => { setDraft(current); void reload(); }, [resourceId, current.title, current.description, current.usage_guide, current.platform_url, current.download_url, current.video_url]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase || !resourceId || !currentUserId) return;
    const changes = Object.fromEntries((Object.keys(LABELS) as Array<keyof Editable>).filter((key) => draft[key].trim() !== current[key].trim()).map((key) => [key, draft[key].trim()]));
    if (!Object.keys(changes).length) { onNotice('Chưa có nội dung nào thay đổi.'); return; }
    if (notes.trim().length < 8) { onNotice('Ghi chú phiên bản cần ít nhất 8 ký tự.'); return; }
    setBusy(true); const { error } = await supabase.from('resource_revision_requests').insert({ resource_id: resourceId, author_id: currentUserId, changes, release_notes: notes.trim() }); setBusy(false);
    if (error) { onNotice(`Không gửi được đề nghị cập nhật: ${error.message}`); return; }
    setDraft(current); setNotes(''); onNotice('Đã gửi phiên bản mới vào hàng chờ duyệt. Bản công khai hiện tại vẫn được giữ nguyên.'); await reload();
  };
  if (!resourceId) return null;
  return <section className="resource-revision-panel"><header><div><span className="section-kicker">LỊCH SỬ CẬP NHẬT</span><h3><FileClock size={17}/> Phiên bản & thay đổi</h3></div><span>{history.length} phiên bản</span></header>
    {history.length ? <ol className="resource-revision-history">{history.map((item) => <li key={item.id}><span>v{item.version_no}</span><div><b>{item.snapshot.title || 'Phiên bản dự án'}</b><p>{item.release_notes}</p><small><Clock3 size={12}/> {new Date(item.created_at).toLocaleString('vi-VN')}</small></div></li>)}</ol> : <p className="resource-revision-empty">Tác giả chưa gửi bản cập nhật nào được duyệt.</p>}
    {canEdit && currentUserId === authorId && <details className="resource-revision-submit"><summary>Đề nghị cập nhật dự án</summary><p>Nội dung đang công khai vẫn hoạt động trong lúc admin xem bản mới.</p><form onSubmit={submit}><div className="resource-revision-fields">{(Object.keys(LABELS) as Array<keyof Editable>).map((key) => <label key={key}>{LABELS[key]}{key === 'description' || key === 'usage_guide' ? <textarea value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} rows={key === 'description' ? 3 : 4} /> : <input value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />}</label>)}</div><label>Ghi chú phiên bản<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={2000} minLength={8} required placeholder="Ví dụ: Sửa lỗi liên kết tải, bổ sung hướng dẫn dùng phiên bản mới…" /></label><button className="button button-primary" disabled={busy}><Send size={14}/>{busy ? 'Đang gửi…' : 'Gửi admin duyệt'}</button></form>{requests.length > 0 && <div className="revision-request-history"><b>Các đề nghị gần đây</b>{requests.map((item) => <p key={item.id}><span className={`revision-state revision-${item.status}`}>{item.status === 'pending' ? 'Chờ duyệt' : item.status === 'approved' ? 'Đã duyệt' : 'Cần chỉnh sửa'}</span> {item.release_notes}{item.admin_note && <small> · Ghi chú admin: {item.admin_note}</small>}</p>)}</div>}</details>}
  </section>;
}
