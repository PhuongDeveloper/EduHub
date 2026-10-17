import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { CalendarDays, Check, Clock3, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PlanOption = { id: string; title: string; subject: string; grade_level: string };
type ScheduleItem = { id: string; plan_id: string | null; class_label: string; scheduled_for: string; status: 'preparing' | 'ready' | 'taught'; note: string; plan?: { title?: string; subject?: string } | null };
export function LessonSchedulePage({ currentUser, onRequireAuth, onNotice }: { currentUser: User | null; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [planId, setPlanId] = useState('');
  const [classLabel, setClassLabel] = useState('');
  const [date, setDate] = useState(() => { const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); return today.toISOString().slice(0, 10); });
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'taught'>('all');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!supabase || !currentUser) return;
    const [plansResult, scheduleResult] = await Promise.all([
      supabase.from('lesson_plans').select('id,title,subject,grade_level').eq('author_id', currentUser.id).order('updated_at', { ascending: false }),
      supabase.from('lesson_schedule_entries').select('id,plan_id,class_label,scheduled_for,status,note,plan:lesson_plans!lesson_schedule_entries_plan_id_fkey(title,subject)').eq('owner_id', currentUser.id).order('scheduled_for', { ascending: true }).limit(150),
    ]);
    if (plansResult.error) onNotice(`Không tải được kế hoạch: ${plansResult.error.message}`); else setPlans((plansResult.data || []) as PlanOption[]);
    if (scheduleResult.error) onNotice(`Không tải được lịch dạy: ${scheduleResult.error.message}`); else setItems((scheduleResult.data || []) as unknown as ScheduleItem[]);
  };
  useEffect(() => { if (currentUser) void load(); }, [currentUser?.id]);
  const add = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !classLabel.trim()) return;
    setBusy(true); const { error } = await supabase.from('lesson_schedule_entries').insert({ owner_id: currentUser.id, plan_id: planId || null, class_label: classLabel.trim(), scheduled_for: date, note: note.trim() }); setBusy(false);
    if (error) { onNotice(`Không thêm được tiết dạy: ${error.message}`); return; }
    setClassLabel(''); setNote(''); setPlanId(''); onNotice('Đã thêm tiết dạy vào lịch riêng.'); await load();
  };
  const setStatus = async (item: ScheduleItem, status: ScheduleItem['status']) => {
    if (!supabase) return;
    const { error } = await supabase.from('lesson_schedule_entries').update({ status, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (error) onNotice(error.message); else { setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry)); }
  };
  const remove = async (item: ScheduleItem) => {
    if (!supabase || !window.confirm(`Xóa lịch dạy ${item.class_label} ngày ${new Date(`${item.scheduled_for}T00:00:00`).toLocaleDateString('vi-VN')}?`)) return;
    const { error } = await supabase.from('lesson_schedule_entries').delete().eq('id', item.id);
    if (error) onNotice(`Không xóa được lịch dạy: ${error.message}`); else { setItems((current) => current.filter((entry) => entry.id !== item.id)); onNotice('Đã xóa lịch dạy.'); }
  };
  const visibleItems = items.filter((item) => filter === 'all' || (filter === 'taught' ? item.status === 'taught' : item.status !== 'taught'));
  if (!currentUser) return <div className="empty-state"><div className="empty-icon"><CalendarDays size={20} /></div><h3>Đăng nhập để lập lịch dạy riêng</h3><p>Ngày dạy, tên lớp và ghi chú chỉ hiển thị với tài khoản của thầy cô.</p><button className="button button-primary" onClick={onRequireAuth}>Đăng nhập</button></div>;
  return <section className="lesson-schedule-page"><header><span><CalendarDays size={22} /></span><div><span className="section-kicker">CHUẨN BỊ TIẾT DẠY CỦA THẦY CÔ</span><h2>Lịch áp dụng kế hoạch</h2><p>Lên lịch cho từng lớp, ghi chú chuẩn bị và đánh dấu sau khi đã dạy. Lịch này là riêng tư.</p></div></header><form className="lesson-schedule-form" onSubmit={add}><label>Kế hoạch tiết dạy<select value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">Chưa gắn kế hoạch</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · {plan.subject} · {plan.grade_level}</option>)}</select></label><div className="form-two-col"><label>Lớp / nhóm<input value={classLabel} onChange={(event) => setClassLabel(event.target.value)} required maxLength={80} placeholder="Ví dụ: 7A2" /></label><label>Ngày dạy<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label></div><label>Ghi chú chuẩn bị<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Thiết bị, học liệu cần in, điều chỉnh cho lớp..." /></label><button className="button button-primary" disabled={busy || !classLabel.trim()}><Plus size={14} /> {busy ? 'Đang lưu…' : 'Thêm vào lịch riêng'}</button></form><div className="lesson-schedule-heading"><h3>Sắp tới & đã dạy</h3><div className="schedule-filters"><span>{items.length} tiết</span><select aria-label="Lọc lịch dạy" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Tất cả</option><option value="upcoming">Chưa dạy</option><option value="taught">Đã dạy</option></select></div></div><div className="lesson-schedule-list">{visibleItems.map((item) => <article key={item.id} className={`schedule-item schedule-${item.status}`}><span className="schedule-date"><b>{new Date(`${item.scheduled_for}T00:00:00`).getDate()}</b><small>{new Date(`${item.scheduled_for}T00:00:00`).toLocaleDateString('vi-VN', { month: 'short' })}</small></span><span className="schedule-copy"><b>{item.class_label} · {item.plan?.title || 'Tiết dạy'}</b><small>{new Date(`${item.scheduled_for}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {item.plan?.subject || 'Chưa gắn môn'} · {item.status === 'taught' ? 'Đã dạy' : item.status === 'ready' ? 'Đã chuẩn bị' : 'Đang chuẩn bị'}</small>{item.note && <p>{item.note}</p>}</span><div className="schedule-actions">{item.status === 'preparing' && <button onClick={() => void setStatus(item, 'ready')}><Check size={13} /> Đã chuẩn bị</button>}{item.status !== 'taught' && <button onClick={() => void setStatus(item, 'taught')}><Check size={13} /> Đã dạy</button>}{item.status === 'taught' && <button onClick={() => void setStatus(item, 'preparing')}><RotateCcw size={13} /> Mở lại</button>}<button aria-label="Xóa lịch dạy" onClick={() => void remove(item)}><Trash2 size={13} /></button></div></article>)}{visibleItems.length === 0 && <div className="empty-state"><div className="empty-icon"><Clock3 size={20} /></div><h3>{items.length === 0 ? 'Lịch dạy của thầy cô đang trống' : 'Không có tiết dạy trong mục này'}</h3><p>Gắn một kế hoạch tiết dạy với ngày và lớp để bắt đầu theo dõi việc chuẩn bị.</p></div>}</div></section>;
}
