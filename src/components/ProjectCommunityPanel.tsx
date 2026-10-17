import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Check, ChevronDown, MessageSquarePlus, Send, ShieldAlert, Sparkles, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GRADE_LABELS, subjectsForGrades } from '../lib/curriculum';

type Feedback = { id: string; title: string; body: string; status: string; author_id: string; votes_count: number; created_at: string; author?: { full_name?: string } | null };
type Changelog = { id: string; version: string; title: string; body: string; created_at: string; author?: { full_name?: string } | null };
type ClassroomUse = { id: string; teacher_id: string; grade_level: string; subject: string; used_on: string; outcome: string; created_at: string; teacher?: { full_name?: string } | null };
const statusLabels: Record<string, string> = { open: 'Đang đề xuất', planned: 'Đã lên kế hoạch', in_progress: 'Đang thực hiện', completed: 'Đã hoàn thành', declined: 'Chưa phù hợp' };

export function ProjectCommunityPanel({ resourceId, authorId, currentUser, isAdmin, onRequireAuth, onNotice }: { resourceId?: string; authorId?: string; currentUser: User | null; isAdmin: boolean; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [tab, setTab] = useState<'feedback' | 'updates' | 'classroom'>('feedback');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [changelog, setChangelog] = useState<Changelog[]>([]);
  const [classroomUses, setClassroomUses] = useState<ClassroomUse[]>([]);
  const [classroomGrade, setClassroomGrade] = useState('Lớp 1');
  const [classroomSubject, setClassroomSubject] = useState('');
  const [classroomDate, setClassroomDate] = useState(new Date().toISOString().slice(0, 10));
  const [classroomOutcome, setClassroomOutcome] = useState('');
  const [voted, setVoted] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [version, setVersion] = useState('');
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('broken_link');
  const [reportDetails, setReportDetails] = useState('');
  const isAuthor = Boolean(currentUser && authorId && currentUser.id === authorId);

  const load = async () => {
    if (!supabase || !resourceId) return;
    const [{ data: ideas }, { data: updates }, { data: uses }] = await Promise.all([
      supabase.from('resource_feedback').select('id,title,body,status,author_id,votes_count,created_at,author:profiles!resource_feedback_author_id_fkey(full_name)').eq('resource_id', resourceId).order('created_at', { ascending: false }),
      supabase.from('resource_changelog').select('id,version,title,body,created_at,author:profiles!resource_changelog_author_id_fkey(full_name)').eq('resource_id', resourceId).order('created_at', { ascending: false }),
      supabase.from('resource_classroom_uses').select('id,teacher_id,grade_level,subject,used_on,outcome,created_at,teacher:profiles!resource_classroom_uses_teacher_id_fkey(full_name)').eq('resource_id', resourceId).order('used_on', { ascending: false }).limit(40),
    ]);
    setFeedback((ideas || []) as unknown as Feedback[]);
    setChangelog((updates || []) as unknown as Changelog[]);
    setClassroomUses((uses || []) as unknown as ClassroomUse[]);
  };
  useEffect(() => { void load(); }, [resourceId]);
  useEffect(() => {
    if (!supabase || !currentUser) { setVoted([]); return; }
    let active = true;
    void supabase.from('resource_feedback_votes').select('feedback_id').eq('user_id', currentUser.id)
      .then(({ data }) => { if (active && data) setVoted(data.map((item) => item.feedback_id)); });
    return () => { active = false; };
  }, [currentUser?.id, feedback.length]);

  const addFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !resourceId || !title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('resource_feedback').insert({ resource_id: resourceId, author_id: currentUser.id, title: title.trim(), body: body.trim() });
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    setTitle(''); setBody(''); onNotice('Đã gửi góp ý cho tác giả.'); await load();
  };
  const toggleVote = async (item: Feedback) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || item.author_id === currentUser.id) return;
    const exists = voted.includes(item.id);
    const result = exists
      ? await supabase.from('resource_feedback_votes').delete().eq('feedback_id', item.id).eq('user_id', currentUser.id)
      : await supabase.from('resource_feedback_votes').insert({ feedback_id: item.id, user_id: currentUser.id });
    if (result.error) { onNotice(result.error.message); return; }
    setVoted((items) => exists ? items.filter((id) => id !== item.id) : [...items, item.id]); await load();
  };
  const changeStatus = async (item: Feedback, status: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('resource_feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (error) onNotice(error.message); else await load();
  };
  const addUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !resourceId || !title.trim() || !body.trim() || !version.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('resource_changelog').insert({ resource_id: resourceId, author_id: currentUser.id, version: version.trim(), title: title.trim(), body: body.trim() });
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    setTitle(''); setBody(''); setVersion(''); onNotice('Đã đăng cập nhật dự án.'); await load();
  };
  const report = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !resourceId) return;
    setBusy(true);
    const { error } = await supabase.from('content_reports').insert({ resource_id: resourceId, reporter_id: currentUser.id, reason: reportReason, details: reportDetails.trim() });
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    setReportOpen(false); setReportDetails(''); onNotice('Đã gửi báo cáo để quản trị viên xem xét.');
  };
  const submitClassroomUse = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !resourceId || isAuthor || !classroomSubject || !classroomOutcome.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('resource_classroom_uses').upsert({
      resource_id: resourceId, teacher_id: currentUser.id, grade_level: classroomGrade,
      subject: classroomSubject, used_on: classroomDate, outcome: classroomOutcome.trim(), updated_at: new Date().toISOString(),
    }, { onConflict: 'resource_id,teacher_id' });
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    setClassroomOutcome(''); onNotice('Đã chia sẻ kinh nghiệm áp dụng học liệu.'); await load();
  };
  const classroomSubjects = subjectsForGrades([classroomGrade]);
  const myClassroomUse = classroomUses.find((item) => item.teacher_id === currentUser?.id);

  return <section className="project-community-panel">
    <div className="project-community-heading"><div><span className="section-kicker">CÙNG HOÀN THIỆN SẢN PHẨM</span><h3>Góp ý & cập nhật</h3><p>Đề xuất tính năng cho tác giả và theo dõi các phiên bản mới.</p></div>{resourceId && <button className="report-trigger" onClick={() => setReportOpen((open) => !open)}><ShieldAlert size={14} /> Báo nội dung</button>}</div>
    <div className="community-tabs"><button className={tab === 'feedback' ? 'active' : ''} onClick={() => setTab('feedback')}><MessageSquarePlus size={14} /> Góp ý <small>{feedback.length}</small></button><button className={tab === 'updates' ? 'active' : ''} onClick={() => setTab('updates')}><Sparkles size={14} /> Nhật ký phiên bản <small>{changelog.length}</small></button><button className={tab === 'classroom' ? 'active' : ''} onClick={() => setTab('classroom')}><Check size={14} /> Đã áp dụng <small>{classroomUses.length}</small></button></div>
    {!resourceId ? <p className="community-empty">Góp ý và cập nhật sẽ khả dụng khi dự án được đăng lên EduHub.</p> : tab === 'feedback' ? <>
      <form className="community-compose" onSubmit={addFeedback}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={currentUser ? 'Gợi ý điều gì sẽ giúp dự án hữu ích hơn?' : 'Đăng nhập để gửi góp ý'} maxLength={140} required /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Mô tả ngắn đề xuất (không bắt buộc)" maxLength={3000} rows={2} /><button className="button button-primary" disabled={busy || !title.trim()}><Send size={14} /> Gửi góp ý</button></form>
      <div className="feedback-list">{feedback.length ? feedback.map((item) => <article className="feedback-item" key={item.id}><div className="feedback-copy"><div className="feedback-title-row"><b>{item.title}</b><span className={`feedback-status status-${item.status}`}>{statusLabels[item.status] || item.status}</span></div>{item.body && <p>{item.body}</p>}<small>{item.author?.full_name || 'Giáo viên'} · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small>{(isAuthor || isAdmin) && <label className="feedback-status-edit">Trạng thái<select value={item.status} onChange={(event) => void changeStatus(item, event.target.value)}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}</div><button className={`feedback-vote${voted.includes(item.id) ? ' active' : ''}`} onClick={() => void toggleVote(item)} disabled={isAuthor}><ThumbsUp size={14} /><b>{item.votes_count || 0}</b></button></article>) : <p className="community-empty">Chưa có góp ý. Thầy cô có thể đề xuất tài liệu bổ sung hoặc cải thiện cách dùng.</p>}</div>
    </> : tab === 'updates' ? <>
      {(isAuthor || isAdmin) && <form className="community-compose changelog-compose" onSubmit={addUpdate}><div className="form-two-col"><input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="Phiên bản · vd. 1.2.0" maxLength={40} required /><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề cập nhật" maxLength={140} required /></div><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Nêu thay đổi, sửa lỗi hoặc hướng dẫn mới" maxLength={4000} rows={3} required /><button className="button button-primary" disabled={busy}><Sparkles size={14} /> Đăng cập nhật</button></form>}
      <div className="changelog-list">{changelog.length ? changelog.map((item) => <article className="changelog-item" key={item.id}><span className="changelog-version">v{item.version}</span><div><b>{item.title}</b><p>{item.body}</p><small>{item.author?.full_name || 'Tác giả'} · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small></div><Check size={15} /></article>) : <p className="community-empty">Tác giả có thể đăng các bản cập nhật, sửa lỗi và hướng dẫn mới tại đây.</p>}</div>
    </> : <>
      <div className="classroom-use-summary"><b>Học liệu đã được dùng trong lớp học?</b><p>Chia sẻ môn, khối lớp và điều hữu ích để đồng nghiệp biết tài liệu phù hợp với nhu cầu nào.</p></div>
      {isAuthor ? <p className="community-empty">Tác giả có thể xem chia sẻ từ giáo viên khác tại đây.</p> : <form className="classroom-use-compose" onSubmit={submitClassroomUse}>
        <div className="form-two-col"><label>Lớp<select value={classroomGrade} onChange={(event) => { setClassroomGrade(event.target.value); setClassroomSubject(''); }}>{GRADE_LABELS.map((grade) => <option key={grade}>{grade}</option>)}</select></label><label>Môn học<select value={classroomSubject} onChange={(event) => setClassroomSubject(event.target.value)} required><option value="">Chọn môn học</option>{classroomSubjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label></div>
        <label>Ngày áp dụng<input type="date" value={classroomDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setClassroomDate(event.target.value)} required /></label>
        <label>Chia sẻ ngắn<textarea value={classroomOutcome} onChange={(event) => setClassroomOutcome(event.target.value)} placeholder="Thầy cô đã dùng tài liệu trong hoạt động nào? Điều gì hiệu quả hoặc cần lưu ý?" maxLength={1200} rows={3} required /></label>
        <div className="classroom-use-submit"><small>Không đăng tên, hình ảnh hoặc thông tin nhận dạng học sinh. Mỗi giáo viên có một chia sẻ cho dự án và có thể cập nhật sau.</small><button className="button button-primary" disabled={busy || !classroomSubject || !classroomOutcome.trim()}><Send size={14} /> {myClassroomUse ? 'Cập nhật chia sẻ' : 'Chia sẻ đã áp dụng'}</button></div>
      </form>}
      <div className="classroom-use-list">{classroomUses.length ? classroomUses.map((item) => <article className="classroom-use-item" key={item.id}><div className="classroom-use-avatar">{(item.teacher?.full_name || 'G').slice(0, 1).toLocaleUpperCase('vi')}</div><div><div className="classroom-use-meta"><b>{item.teacher?.full_name || 'Giáo viên'}</b><span>{item.grade_level} · {item.subject}</span></div><p>{item.outcome}</p><small>Áp dụng {new Date(`${item.used_on}T00:00:00`).toLocaleDateString('vi-VN')}</small></div></article>) : <p className="community-empty">Chưa có chia sẻ áp dụng. Hãy là giáo viên đầu tiên ghi lại kinh nghiệm dùng học liệu này.</p>}</div>
    </>}
    {reportOpen && <form className="content-report-form" onSubmit={report}><div><b>Báo cáo nội dung</b><button type="button" onClick={() => setReportOpen(false)}>Đóng</button></div><select value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option value="broken_link">Liên kết tải / dùng thử bị hỏng</option><option value="copyright">Vi phạm bản quyền / thiếu ghi nguồn</option><option value="privacy">Lộ thông tin cá nhân</option><option value="spam">Spam hoặc quảng cáo</option><option value="misleading">Thông tin không chính xác</option><option value="unsafe">Liên kết hoặc tệp không an toàn</option><option value="other">Lý do khác</option></select><textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Mô tả để admin xác minh (không bắt buộc)" rows={3} maxLength={2000} /><button className="button button-primary" disabled={busy}><ShieldAlert size={14} /> Gửi báo cáo riêng tư</button></form>}
  </section>;
}

export function ContentReportQueue({ onNotice }: { onNotice: (message: string) => void }) {
  const [reports, setReports] = useState<Array<{ id: string; reason: string; details: string; status: string; created_at: string; resource?: { title?: string }; reporter?: { full_name?: string } }>>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const load = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('content_reports').select('id,reason,details,status,created_at,resource:resources!content_reports_resource_id_fkey(title),reporter:profiles!content_reports_reporter_id_fkey(full_name)').eq('status', statusFilter).order('created_at', { ascending: true });
    if (error) onNotice(error.message); else setReports((data || []) as unknown as typeof reports);
  };
  useEffect(() => { void load(); }, [statusFilter]);
  const resolve = async (id: string, status: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('content_reports').update({ status, reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) onNotice(error.message); else { onNotice('Đã cập nhật trạng thái báo cáo.'); await load(); }
  };
  const reasons: Record<string, string> = { copyright: 'Bản quyền', privacy: 'Quyền riêng tư', spam: 'Spam', misleading: 'Sai lệch', unsafe: 'Không an toàn', broken_link: 'Liên kết hỏng', other: 'Khác' };
  return <section className="admin-report-panel"><div className="report-queue-heading"><div><span className="section-kicker">AN TOÀN & BẢN QUYỀN</span><h3>Báo cáo nội dung</h3></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="pending">Chờ xử lý</option><option value="reviewing">Đang xác minh</option><option value="resolved">Đã xử lý</option><option value="dismissed">Không vi phạm</option></select></div>{reports.length ? reports.map((report) => <article className="report-queue-item" key={report.id}><div><b>{report.resource?.title || 'Dự án đã bị xóa'}</b><span>{reasons[report.reason] || report.reason} · {report.reporter?.full_name || 'Giáo viên'} · {new Date(report.created_at).toLocaleDateString('vi-VN')}</span>{report.details && <p>{report.details}</p>}</div><div><button onClick={() => void resolve(report.id, 'reviewing')}>Xác minh</button><button onClick={() => void resolve(report.id, 'dismissed')}>Bỏ qua</button><button onClick={() => void resolve(report.id, 'resolved')}>Đã xử lý</button></div></article>) : <p className="community-empty">Không có báo cáo ở trạng thái này.</p>}</section>;
}
