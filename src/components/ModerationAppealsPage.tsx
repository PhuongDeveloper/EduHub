import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Check, FileQuestion, MessageCircle, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RejectedResource = { id: string; title: string; moderation_status: string };
type Appeal = { id: string; resource_id: string; author_id: string; request: string; status: string; admin_note: string; created_at: string; resource?: { title?: string; moderation_status?: string }; author?: { full_name?: string } };
const statusText: Record<string, string> = { pending: 'Chờ xem xét', reviewing: 'Đang xác minh', reinstated: 'Đã khôi phục', upheld: 'Giữ quyết định từ chối' };
export function ModerationAppealsPage({ currentUser, isAdmin, onRequireAuth, onNotice }: { currentUser: User | null; isAdmin: boolean; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [resources, setResources] = useState<RejectedResource[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [resourceId, setResourceId] = useState('');
  const [request, setRequest] = useState('');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!currentUser || !supabase) return;
    const appealQuery = supabase.from('resource_moderation_appeals').select('id,resource_id,author_id,request,status,admin_note,created_at,resource:resources!resource_moderation_appeals_resource_id_fkey(title,moderation_status),author:profiles!resource_moderation_appeals_author_id_fkey(full_name)').order('created_at', { ascending: false }).limit(100);
    const [appealResult, resourceResult] = await Promise.all([appealQuery, isAdmin ? Promise.resolve({ data: [], error: null }) : supabase.from('resources').select('id,title,moderation_status').eq('author_id', currentUser.id).eq('moderation_status', 'rejected').order('created_at', { ascending: false })]);
    if (appealResult.error) onNotice(`Không tải được đề nghị xem lại: ${appealResult.error.message}`); else setAppeals((appealResult.data || []) as unknown as Appeal[]);
    if (resourceResult.error) onNotice(`Không tải được dự án bị từ chối: ${resourceResult.error.message}`); else setResources((resourceResult.data || []) as RejectedResource[]);
  };
  useEffect(() => { void load(); }, [currentUser?.id, isAdmin]);
  const createAppeal = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !resourceId || request.trim().length < 20) { onNotice('Giải thích ít nhất 20 ký tự để admin có đủ thông tin xem lại.'); return; }
    setBusy(true); const { error } = await supabase.from('resource_moderation_appeals').insert({ resource_id: resourceId, author_id: currentUser.id, request: request.trim() }); setBusy(false);
    if (error) { onNotice(error.code === '23505' ? 'Dự án này đã có một đề nghị đang chờ xử lý.' : `Không gửi được đề nghị: ${error.message}`); return; }
    setResourceId(''); setRequest(''); onNotice('Đã gửi đề nghị xem lại cho admin.'); await load();
  };
  const review = async (appeal: Appeal, status: 'reviewing' | 'reinstated' | 'upheld') => {
    if (!supabase || !isAdmin) return;
    setBusy(true);
    const { error } = await supabase.from('resource_moderation_appeals').update({ status, admin_note: adminNotes[appeal.id]?.trim() || appeal.admin_note || '', reviewed_by: currentUser?.id, reviewed_at: new Date().toISOString() }).eq('id', appeal.id);
    if (!error && status === 'reinstated') {
      const result = await supabase.from('resources').update({ moderation_status: 'approved', moderated_by: currentUser?.id, moderated_at: new Date().toISOString() }).eq('id', appeal.resource_id);
      if (result.error) { setBusy(false); onNotice(`Đã cập nhật đề nghị nhưng không khôi phục được dự án: ${result.error.message}`); await load(); return; }
    }
    setBusy(false); if (error) onNotice(error.message); else { onNotice(status === 'reinstated' ? 'Đã khôi phục dự án và thông báo trạng thái.' : status === 'upheld' ? 'Đã giữ quyết định từ chối.' : 'Đã chuyển đề nghị sang xác minh.'); await load(); }
  };
  if (!currentUser) return <div className="empty-state"><div className="empty-icon"><FileQuestion size={20} /></div><h3>Đăng nhập để gửi yêu cầu xem lại</h3><p>Nếu dự án bị từ chối, thầy cô có thể bổ sung thông tin để admin cân nhắc lại.</p><button className="button button-primary" onClick={onRequireAuth}>Đăng nhập</button></div>;
  return <section className="appeals-page"><header className="appeals-hero"><span><FileQuestion size={22} /></span><div><span className="section-kicker">QUY TRÌNH MINH BẠCH</span><h2>Đề nghị xem lại dự án</h2><p>Trao đổi riêng với admin khi thầy cô cho rằng quyết định từ chối cần được xem xét thêm.</p></div></header>{!isAdmin && resources.length > 0 && <form className="appeal-compose" onSubmit={createAppeal}><b>Gửi yêu cầu mới</b><label>Chọn dự án<select value={resourceId} onChange={(event) => setResourceId(event.target.value)} required><option value="">Chọn dự án bị từ chối</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}</select></label><label>Thông tin bổ sung<textarea value={request} onChange={(event) => setRequest(event.target.value)} minLength={20} maxLength={2500} rows={3} required placeholder="Cho biết thầy cô đã bổ sung nguồn, quyền chia sẻ hoặc chỉnh sửa điểm nào…" /></label><button className="button button-primary" disabled={busy || request.trim().length < 20}><MessageCircle size={14} /> Gửi đề nghị</button></form>}{!isAdmin && resources.length === 0 && <div className="appeal-no-rejected"><Check size={17} /> Không có dự án nào đang ở trạng thái từ chối cần xem lại.</div>}<div className="appeal-list-heading"><h3>{isAdmin ? 'Đề nghị từ giáo viên' : 'Lịch sử đề nghị'}</h3><span>{appeals.length}</span></div><div className="appeal-list">{appeals.map((appeal) => <article key={appeal.id}><div className="appeal-list-top"><span className={`appeal-status appeal-${appeal.status}`}>{statusText[appeal.status] || appeal.status}</span><small>{new Date(appeal.created_at).toLocaleString('vi-VN')}</small></div><h4>{appeal.resource?.title || 'Dự án'}</h4>{isAdmin && <small className="appeal-author">{appeal.author?.full_name || 'Giáo viên'}</small>}<p>{appeal.request}</p>{appeal.admin_note && <div className="appeal-admin-note"><ShieldCheck size={14} /> {appeal.admin_note}</div>}{isAdmin && ['pending', 'reviewing'].includes(appeal.status) && <><textarea className="appeal-admin-note-input" value={adminNotes[appeal.id] ?? appeal.admin_note} onChange={(event) => setAdminNotes((current) => ({ ...current, [appeal.id]: event.target.value }))} maxLength={2000} rows={2} placeholder="Ghi rõ lý do và thông tin cho tác giả" /><div className="appeal-actions"><button onClick={() => void review(appeal, 'reviewing')} disabled={busy}><RotateCcw size={13} /> Đang xác minh</button><button onClick={() => void review(appeal, 'upheld')} disabled={busy}><X size={13} /> Giữ từ chối</button><button className="approve" onClick={() => void review(appeal, 'reinstated')} disabled={busy}><Check size={13} /> Khôi phục</button></div></>}</article>)}{appeals.length === 0 && <p className="community-empty">Chưa có đề nghị xem lại nào.</p>}</div></section>;
}
