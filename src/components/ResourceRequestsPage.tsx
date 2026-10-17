import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { CircleHelp, HandHelping, Plus, Search, ThumbsUp, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GRADE_LABELS, SUBJECT_NAMES } from '../lib/curriculum';

type RequestRow = { id: string; author_id: string; title: string; details: string; subject: string; grade_level: string; status: string; votes_count: number; created_at: string; author?: { full_name?: string; avatar_url?: string | null } | null };
const statusNames: Record<string, string> = { open: 'Đang cần', in_progress: 'Đang chuẩn bị', fulfilled: 'Đã có học liệu', closed: 'Đã đóng' };

export function ResourceRequestsPage({ currentUser, isAdmin, onRequireAuth, onNotice }: { currentUser: User | null; isAdmin: boolean; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [subject, setSubject] = useState('Tất cả môn');
  const [grade, setGrade] = useState('Tất cả khối');
  const [status, setStatus] = useState('open');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!supabase) return;
    let request = supabase.from('resource_requests').select('id,author_id,title,details,subject,grade_level,status,votes_count,created_at,author:profiles!resource_requests_author_id_fkey(full_name,avatar_url)').order('created_at', { ascending: false }).limit(150);
    if (status !== 'all') request = request.eq('status', status);
    const { data, error } = await request;
    if (error) { onNotice(`Không tải được bảng nhu cầu: ${error.message}`); return; }
    setRows((data || []) as unknown as RequestRow[]);
  };
  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    if (!supabase || !currentUser) { setMyVotes([]); return; }
    void supabase.from('resource_request_votes').select('request_id').eq('user_id', currentUser.id).then(({ data, error }) => { if (!error && data) setMyVotes(data.map((item) => item.request_id)); });
  }, [currentUser?.id]);

  const visibleRows = useMemo(() => rows.filter((row) =>
    (subject === 'Tất cả môn' || row.subject === subject)
    && (grade === 'Tất cả khối' || row.grade_level === grade)
    && (!query.trim() || `${row.title} ${row.details}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
  ), [grade, query, rows, subject]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !title.trim() || !details.trim() || !formSubject || !formGrade) return;
    setBusy(true);
    const { error } = await supabase.from('resource_requests').insert({ author_id: currentUser.id, title: title.trim(), details: details.trim(), subject: formSubject, grade_level: formGrade });
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    setTitle(''); setDetails(''); setFormSubject(''); setFormGrade(''); setFormOpen(false); onNotice('Đã đăng nhu cầu học liệu.'); await load();
  };
  const toggleVote = async (row: RequestRow) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || row.author_id === currentUser.id) return;
    const voted = myVotes.includes(row.id);
    const result = voted
      ? await supabase.from('resource_request_votes').delete().eq('request_id', row.id).eq('user_id', currentUser.id)
      : await supabase.from('resource_request_votes').insert({ request_id: row.id, user_id: currentUser.id });
    if (result.error) { onNotice(result.error.message); return; }
    setMyVotes((ids) => voted ? ids.filter((id) => id !== row.id) : [...ids, row.id]);
    setRows((items) => items.map((item) => item.id === row.id ? { ...item, votes_count: Math.max(0, item.votes_count + (voted ? -1 : 1)) } : item));
  };
  const updateStatus = async (row: RequestRow, next: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('resource_requests').update({ status: next, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) { onNotice(error.message); return; }
    onNotice('Đã cập nhật trạng thái nhu cầu.'); await load();
  };

  return <section className="requests-page">
    <header className="requests-hero"><div className="requests-icon"><HandHelping size={23} /></div><div><span className="section-kicker">KẾT NỐI NGƯỜI CẦN VỚI NGƯỜI CÓ</span><h2>Nhu cầu học liệu</h2><p>Đang cần tài liệu, đề kiểm tra hay công cụ cho lớp học? Đăng nhu cầu để đồng nghiệp cùng hỗ trợ.</p></div><button className="button button-primary" onClick={() => currentUser ? setFormOpen((open) => !open) : onRequireAuth()}><Plus size={15} /> Đăng nhu cầu</button></header>
    {formOpen && <form className="request-form" onSubmit={submit}><div className="request-form-heading"><div><b>Thầy cô đang cần học liệu gì?</b><small>Nêu rõ mục đích để đồng nghiệp tìm đúng tài liệu giúp mình.</small></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Đóng"><X size={16} /></button></div><label>Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="Ví dụ: Phiếu ôn tập phân số lớp 5 theo 3 mức độ" required /></label><label>Mô tả nhu cầu<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1200} rows={3} placeholder="Mục tiêu, định dạng mong muốn, thời điểm cần hoặc yêu cầu cụ thể…" required /></label><div className="form-two-col"><label>Môn học<select value={formSubject} onChange={(event) => setFormSubject(event.target.value)} required><option value="">Chọn môn</option>{SUBJECT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></label><label>Khối lớp<select value={formGrade} onChange={(event) => setFormGrade(event.target.value)} required><option value="">Chọn khối</option>{GRADE_LABELS.map((item) => <option key={item}>{item}</option>)}</select></label></div><button className="button button-primary" disabled={busy || !title.trim() || !details.trim()}>{busy ? 'Đang đăng…' : 'Đăng nhu cầu'}</button></form>}
    <div className="requests-controls"><label className="request-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhu cầu học liệu" /></label><select value={subject} onChange={(event) => setSubject(event.target.value)}><option>Tất cả môn</option>{SUBJECT_NAMES.map((name) => <option key={name}>{name}</option>)}</select><select value={grade} onChange={(event) => setGrade(event.target.value)}><option>Tất cả khối</option>{GRADE_LABELS.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="open">Đang cần</option><option value="in_progress">Đang chuẩn bị</option><option value="fulfilled">Đã có học liệu</option><option value="closed">Đã đóng</option><option value="all">Mọi trạng thái</option></select></div>
    <div className="requests-summary"><b>{visibleRows.length}</b> nhu cầu trong danh sách <span>·</span> ưu tiên các nhu cầu đang mở</div>
    <div className="request-list">{visibleRows.map((row) => <article className="request-card" key={row.id}><div className="request-status-line"><span className={`request-status status-${row.status}`}>{statusNames[row.status] || row.status}</span><small>{new Date(row.created_at).toLocaleDateString('vi-VN')}</small></div><h3>{row.title}</h3><p>{row.details}</p><div className="request-tags"><span>{row.subject}</span><span>{row.grade_level}</span></div><div className="request-card-footer"><span className="request-author"><span className="avatar avatar-mint">{(row.author?.full_name || 'G').slice(0, 1).toLocaleUpperCase('vi')}</span>{row.author?.full_name || 'Giáo viên EduHub'}</span><button className={`request-vote${myVotes.includes(row.id) ? ' active' : ''}`} onClick={() => void toggleVote(row)} disabled={row.author_id === currentUser?.id}><ThumbsUp size={14} /> Cần tài liệu này <b>{row.votes_count}</b></button>{(row.author_id === currentUser?.id || isAdmin) && <select className="request-status-control" value={row.status} onChange={(event) => void updateStatus(row, event.target.value)} aria-label="Cập nhật trạng thái"><option value="open">Đang cần</option><option value="in_progress">Đang chuẩn bị</option><option value="fulfilled">Đã có học liệu</option><option value="closed">Đã đóng</option></select>}</div></article>)}{visibleRows.length === 0 && <div className="request-empty"><CircleHelp size={23} /><b>Chưa có nhu cầu nào phù hợp.</b><span>Thử đổi môn/khối hoặc đăng nhu cầu đầu tiên.</span></div>}</div>
    <p className="request-guideline"><CircleHelp size={13} /> Không đăng thông tin cá nhân của học sinh. Nhu cầu cần mô tả rõ mục đích dạy học và không chứa quảng cáo.</p>
  </section>;
}
