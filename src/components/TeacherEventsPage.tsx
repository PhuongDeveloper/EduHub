import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Clock3, MapPin, MonitorPlay, Plus, Users, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type TeacherEvent = { id: string; title: string; description: string; subject: string; starts_at: string; location: string; meeting_url: string | null; organizer_id: string; attendee_count?: number; attendees?: { user_id: string }[] };

export function TeacherEventsPage({ user, onRequireAuth, onNotice }: { user: User | null; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [events, setEvents] = useState<TeacherEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Liên môn');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from('teacher_events').select('id,title,description,subject,starts_at,location,meeting_url,organizer_id,teacher_event_attendees(user_id)').gte('starts_at', new Date(Date.now() - 86400000).toISOString()).order('starts_at').limit(60);
    if (error) onNotice(`Không tải được lịch sinh hoạt: ${error.message}`);
    else { const rows = (data || []) as TeacherEvent[]; const counts = rows.length ? await supabase.rpc('teacher_event_attendee_counts', { p_event_ids: rows.map((item) => item.id) }) : { data: [] }; setEvents(rows.map((item) => ({ ...item, attendee_count: (counts.data || []).find((count) => count.event_id === item.id)?.attendee_count || 0 }))); }
    setLoading(false);
  }, [onNotice]);
  useEffect(() => { void load(); }, [load]);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) { onRequireAuth(); return; }
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from('teacher_events').insert({ organizer_id: user.id, title: title.trim(), description: description.trim(), subject, starts_at: new Date(startsAt).toISOString(), location: location.trim(), meeting_url: meetingUrl.trim() || null });
    setBusy(false);
    if (error) { onNotice(`Chưa tạo được sự kiện: ${error.message}`); return; }
    setTitle(''); setDescription(''); setStartsAt(''); setLocation(''); setMeetingUrl(''); setShowForm(false); onNotice('Đã đăng lịch sinh hoạt chuyên môn.'); await load();
  };
  const toggleAttendance = async (item: TeacherEvent) => {
    if (!user) { onRequireAuth(); return; }
    if (!supabase) return;
    const attending = item.attendees?.some((attendee) => attendee.user_id === user.id);
    const result = attending ? await supabase.from('teacher_event_attendees').delete().eq('event_id', item.id).eq('user_id', user.id) : await supabase.from('teacher_event_attendees').insert({ event_id: item.id, user_id: user.id });
    if (result.error) { onNotice(`Không cập nhật được đăng ký: ${result.error.message}`); return; }
    await load();
  };
  return <section className="teacher-events-page">
    <header className="teacher-events-header"><span className="teacher-events-mark"><img src="/assets/openmoji-calendar.svg" alt="" /></span><div><span className="section-kicker">SINH HOẠT CỘNG ĐỒNG</span><h1>Lịch hội thảo giáo viên</h1><p>Chia sẻ buổi tập huấn, tọa đàm bộ môn và sinh hoạt chuyên môn sắp diễn ra.</p></div><button className="button button-primary" onClick={() => user ? setShowForm((value) => !value) : onRequireAuth()}><Plus size={15} /> Tạo sự kiện</button><span className="teacher-events-watermark" aria-hidden="true" /></header>
    {showForm && <form className="teacher-event-form" onSubmit={(event) => void create(event)}><div className="teacher-event-form-top"><h2>Đăng buổi sinh hoạt mới</h2><button type="button" aria-label="Đóng biểu mẫu" onClick={() => setShowForm(false)}><X size={16} /></button></div><label>Tên buổi sinh hoạt<input required minLength={5} maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Chia sẻ dạy học dự án môn Khoa học" /></label><label>Mô tả<textarea rows={3} maxLength={3000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Nội dung, đối tượng phù hợp, cách tham gia…" /></label><div className="teacher-event-fields"><label>Môn / chủ đề<input required value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={80} /></label><label>Thời gian (giờ Việt Nam)<input type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label>Địa điểm hoặc hình thức<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={180} placeholder="Trực tuyến / tên trường, tỉnh thành" /></label><label>Liên kết tham gia<input type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://…" /></label></div><button className="button button-primary" disabled={busy}>{busy ? 'Đang đăng…' : 'Đăng sự kiện'}</button></form>}
    {loading ? <div className="teacher-event-grid" aria-label="Đang tải lịch"><div className="teacher-event-skeleton" /><div className="teacher-event-skeleton" /></div> : events.length ? <div className="teacher-event-grid">{events.map((item) => { const attending = item.attendees?.some((attendee) => attendee.user_id === user?.id); const date = new Date(item.starts_at); return <article className="teacher-event-card" key={item.id}><div className="teacher-event-card-date"><b>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)}</b><small>{new Intl.DateTimeFormat('vi-VN', { month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)}</small></div><div className="teacher-event-card-main"><span className="teacher-event-subject">{item.subject}</span><h2>{item.title}</h2><p>{item.description || 'Buổi sinh hoạt do giáo viên trong cộng đồng tổ chức.'}</p><div className="teacher-event-meta"><span><Clock3 size={13} />{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)} (GMT+7)</span>{item.location && <span><MapPin size={13} />{item.location}</span>}<span><Users size={13} />{item.attendees?.length || 0} người tham gia</span></div></div><div className="teacher-event-actions">{item.meeting_url && <a className="button button-outline" href={item.meeting_url} target="_blank" rel="noreferrer"><MonitorPlay size={14} /> Tham gia</a>}<button className={`button ${attending ? 'button-primary' : 'button-outline'}`} onClick={() => void toggleAttendance(item)}>{attending ? 'Đã đăng ký' : 'Đăng ký'}</button></div></article>; })}</div> : <div className="empty-state teacher-event-empty"><span><CalendarDays size={22} /></span><h2>Chưa có buổi sinh hoạt sắp tới</h2><p>Chia sẻ một buổi tập huấn hoặc tọa đàm để đồng nghiệp cùng tham gia.</p><button className="button button-primary" onClick={() => user ? setShowForm(true) : onRequireAuth()}><Plus size={14} /> Tạo sự kiện đầu tiên</button></div>}
  </section>;
}
