import { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, FileClock, MessageSquareText, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SupportRequest = { id: string; user_id: string; category: string; subject: string; message: string; status: string; admin_reply: string; created_at: string; profile?: { full_name?: string } | null };
type AuditRow = { id: number; actor_name: string; action: string; entity_type: string; entity_id: string; summary: string; created_at: string };
type VerificationRow = { id: string; user_id: string; evidence_url: string; explanation: string; status: string; admin_note: string; created_at: string; profile?: { full_name?: string; school_name?: string } | null };
type RevisionRequest = { id: string; resource_id: string; author_id: string; changes: Record<string, string>; release_notes: string; status: string; created_at: string; author?: { full_name?: string } | null; resource?: { title?: string } | null };

export function AdminOperationsPanel({ mode, onNotice }: { mode: 'support' | 'audit' | 'verification' | 'revisions'; onNotice: (message: string) => void }) {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [verification, setVerification] = useState<VerificationRow[]>([]);
  const [revisionRequests, setRevisionRequests] = useState<RevisionRequest[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    if (mode === 'support') {
      const { data, error } = await supabase.from('support_requests').select('id,user_id,category,subject,message,status,admin_reply,created_at,profile:profiles!support_requests_user_id_fkey(full_name)').order('created_at', { ascending: true }).limit(200);
      if (error) onNotice(`Không tải được yêu cầu hỗ trợ: ${error.message}`); else setRequests((data || []) as SupportRequest[]);
    } else if (mode === 'audit') {
      const { data, error } = await supabase.from('admin_audit_log').select('id,actor_name,action,entity_type,entity_id,summary,created_at').order('created_at', { ascending: false }).limit(300);
      if (error) onNotice(`Không tải được nhật ký quản trị: ${error.message}`); else setAudit((data || []) as AuditRow[]);
    } else if (mode === 'verification') {
      const { data, error } = await supabase.from('teacher_verification_requests').select('id,user_id,evidence_url,explanation,status,admin_note,created_at,profile:profiles!teacher_verification_requests_user_id_fkey(full_name,school_name)').order('created_at').limit(150);
      if (error) onNotice(`Không tải được yêu cầu xác minh: ${error.message}`); else setVerification((data || []) as VerificationRow[]);
    } else {
      const { data, error } = await supabase.from('resource_revision_requests').select('id,resource_id,author_id,changes,release_notes,status,created_at,author:profiles!resource_revision_requests_author_id_fkey(full_name),resource:resources!resource_revision_requests_resource_id_fkey(title)').eq('status','pending').order('created_at').limit(150);
      if (error) onNotice(`Không tải được đề nghị cập nhật: ${error.message}`); else setRevisionRequests((data || []) as unknown as RevisionRequest[]);
    }
    setLoading(false);
  }, [mode, onNotice]);
  useEffect(() => { void load(); }, [load]);
  const update = async (item: SupportRequest, status: string) => {
    if (!supabase) return;
    setBusyId(item.id);
    const { error } = await supabase.from('support_requests').update({ status, admin_reply: replies[item.id] ?? item.admin_reply, updated_at: new Date().toISOString() }).eq('id', item.id);
    setBusyId('');
    if (error) { onNotice(`Không cập nhật được yêu cầu: ${error.message}`); return; }
    onNotice('Đã cập nhật yêu cầu hỗ trợ.'); await load();
  };
  const reviewVerification = async (item: VerificationRow, status: 'approved' | 'rejected') => {
    if (!supabase) return;
    const note = window.prompt(status === 'approved' ? 'Ghi chú nội bộ (không bắt buộc):' : 'Nêu ngắn lý do từ chối để giáo viên gửi lại đúng hơn:') || '';
    setBusyId(item.id);
    const { error } = await supabase.from('teacher_verification_requests').update({ status, admin_note: note, reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString() }).eq('id', item.id);
    if (!error && status === 'approved') { const result = await supabase.from('profiles').update({ teacher_verified: true }).eq('id', item.user_id); if (result.error) onNotice(`Yêu cầu đã duyệt nhưng không cập nhật được hồ sơ: ${result.error.message}`); }
    setBusyId('');
    if (error) { onNotice(`Không xử lý được yêu cầu xác minh: ${error.message}`); return; }
    onNotice(status === 'approved' ? 'Đã xác minh giáo viên.' : 'Đã từ chối yêu cầu; giáo viên có thể gửi lại.'); await load();
  };
  const reviewRevision = async (item: RevisionRequest, decision: 'approved' | 'rejected') => {
    if (!supabase) return;
    const note = decision === 'rejected' ? (window.prompt('Ghi chú để tác giả biết cần chỉnh gì:') || '') : '';
    setBusyId(item.id); const { error } = await supabase.rpc('review_resource_revision', { p_request_id: item.id, p_decision: decision, p_admin_note: note }); setBusyId('');
    if (error) { onNotice(`Không xử lý được đề nghị cập nhật: ${error.message}`); return; }
    onNotice(decision === 'approved' ? 'Đã duyệt và phát hành phiên bản mới.' : 'Đã từ chối đề nghị cập nhật.'); await load();
  };
  if (mode === 'support') return <section className="admin-operations-panel"><header className="admin-panel-heading"><div><span className="admin-section-eyebrow">TRAO ĐỔI RIÊNG TƯ</span><h2>Yêu cầu hỗ trợ</h2><p>Chỉ người gửi và quản trị viên xem được nội dung này.</p></div><MessageSquareText size={19} /></header>{loading ? <div className="admin-empty-note">Đang tải yêu cầu…</div> : requests.length ? <div className="admin-support-list">{requests.map((item) => <article key={item.id}><div className="admin-support-top"><span className={`admin-support-status support-${item.status}`}>{item.status === 'open' ? 'Mới' : item.status === 'in_progress' ? 'Đang xử lý' : item.status === 'answered' ? 'Đã phản hồi' : 'Đã đóng'}</span><small>{item.profile?.full_name || 'Giáo viên'} · {new Date(item.created_at).toLocaleString('vi-VN')}</small></div><h3>{item.subject}</h3><p>{item.message}</p><small className="admin-support-category">{item.category}</small><label>Phản hồi riêng<textarea rows={3} maxLength={3000} value={replies[item.id] ?? item.admin_reply} onChange={(event) => setReplies((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Viết hướng xử lý hoặc câu trả lời…" /></label><div className="admin-support-actions"><button className="button button-outline" disabled={busyId === item.id} onClick={() => void update(item, 'in_progress')}>Đang xử lý</button><button className="button button-primary" disabled={busyId === item.id} onClick={() => void update(item, 'answered')}>Lưu phản hồi</button><button className="button button-outline" disabled={busyId === item.id} onClick={() => void update(item, 'closed')}>Đóng yêu cầu</button></div></article>)}</div> : <div className="admin-empty-state"><span><MessageSquareText size={18} /></span><b>Chưa có yêu cầu hỗ trợ</b></div>}</section>;
  if (mode === 'verification') return <section className="admin-operations-panel"><header className="admin-panel-heading"><div><span className="admin-section-eyebrow">UY TÍN CỘNG ĐỒNG</span><h2>Yêu cầu xác minh giáo viên</h2><p>Chỉ xem minh chứng công khai; không yêu cầu tải giấy tờ nhạy cảm.</p></div><ShieldCheck size={19} /></header>{loading ? <div className="admin-empty-note">Đang tải yêu cầu…</div> : verification.filter((item) => item.status === 'pending').length ? <div className="admin-support-list">{verification.filter((item) => item.status === 'pending').map((item) => <article key={item.id}><div className="admin-support-top"><span className="admin-support-status support-open">Chờ xem</span><small>{item.profile?.full_name || 'Giáo viên'} · {item.profile?.school_name || 'Chưa khai trường'} · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small></div><p>{item.explanation || 'Không kèm ghi chú.'}</p><a href={item.evidence_url} target="_blank" rel="noreferrer">Mở minh chứng công khai</a><div className="admin-support-actions"><button className="button button-outline" disabled={busyId === item.id} onClick={() => void reviewVerification(item, 'rejected')}>Từ chối</button><button className="button button-primary" disabled={busyId === item.id} onClick={() => void reviewVerification(item, 'approved')}>Xác minh giáo viên</button></div></article>)}</div> : <div className="admin-empty-state"><span><ShieldCheck size={18} /></span><b>Không có yêu cầu đang chờ</b></div>}</section>;
  if (mode === 'revisions') return <section className="admin-operations-panel"><header className="admin-panel-heading"><div><span className="admin-section-eyebrow">GIỮ HỌC LIỆU LUÔN DÙNG ĐƯỢC</span><h2>Đề nghị cập nhật dự án</h2><p>Bản mới chỉ thay thế nội dung đang công khai sau khi được duyệt.</p></div><FileClock size={19}/></header>{loading ? <div className="admin-empty-note">Đang tải đề nghị…</div> : revisionRequests.length ? <div className="admin-support-list">{revisionRequests.map((item) => <article key={item.id}><div className="admin-support-top"><span className="admin-support-status support-open">Chờ duyệt</span><small>{item.author?.full_name || 'Giáo viên'} · {new Date(item.created_at).toLocaleString('vi-VN')}</small></div><h3>{item.resource?.title || 'Dự án'}</h3><p>{item.release_notes}</p><details className="revision-admin-changes"><summary>Xem các trường đề nghị thay đổi ({Object.keys(item.changes || {}).length})</summary>{Object.entries(item.changes || {}).map(([key,value]) => <div key={key}><b>{({title:'Tên dự án',description:'Mô tả',usage_guide:'Hướng dẫn sử dụng',platform_url:'Liên kết mở dùng thử',download_url:'Liên kết tải',video_url:'Video demo'} as Record<string,string>)[key] || key}</b>{key.endsWith('_url') ? <a href={value} target="_blank" rel="noopener noreferrer">{value || 'Gỡ liên kết'}</a> : <p>{value}</p>}</div>)}</details><div className="admin-support-actions"><button className="button button-outline" disabled={busyId === item.id} onClick={() => void reviewRevision(item,'rejected')}><X size={14}/> Yêu cầu chỉnh sửa</button><button className="button button-primary" disabled={busyId === item.id} onClick={() => void reviewRevision(item,'approved')}><Check size={14}/> Duyệt phiên bản</button></div></article>)}</div> : <div className="admin-empty-state"><span><Check size={18}/></span><b>Không có bản cập nhật chờ duyệt</b></div>}</section>;
  return <section className="admin-operations-panel"><header className="admin-panel-heading"><div><span className="admin-section-eyebrow">LỊCH SỬ CÓ THỂ RÀ SOÁT</span><h2>Nhật ký quản trị</h2><p>Thao tác kiểm duyệt và quyền tài khoản, mới nhất trước.</p></div><ShieldCheck size={19} /></header>{loading ? <div className="admin-empty-note">Đang tải nhật ký…</div> : audit.length ? <div className="admin-audit-list">{audit.map((item) => <article key={item.id}><span><Clock3 size={15} /></span><div><b>{item.summary}</b><small>{item.actor_name} · {item.action} · {item.entity_type} · {new Date(item.created_at).toLocaleString('vi-VN')}</small></div></article>)}</div> : <div className="admin-empty-state"><span><ShieldCheck size={18} /></span><b>Chưa ghi nhận thao tác quản trị</b><small>Các thao tác mới sẽ được lưu tại đây.</small></div>}</section>;
}
