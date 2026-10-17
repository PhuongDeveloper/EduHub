import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Award, CalendarDays, Check, FileText, Plus, Send, ShieldCheck, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Challenge = { id: string; title: string; description: string; criteria: string[]; reward: string; deadline: string; status: 'draft' | 'open' | 'closed'; created_at: string };
type Entry = { id: string; challenge_id: string; resource_id: string; author_id: string; status: string; created_at: string; resource?: { title?: string }; author?: { full_name?: string } };
type Resource = { id: string; title: string; moderation_status?: string };
const entryLabels: Record<string, string> = { submitted: 'Đã gửi', shortlisted: 'Vào vòng nổi bật', winner: 'Được vinh danh', rejected: 'Chưa phù hợp' };

export function TeachingChallengesPage({ currentUser, isAdmin, onRequireAuth, onNotice }: { currentUser: User | null; isAdmin: boolean; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteriaText, setCriteriaText] = useState('');
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('teaching_challenges').select('id,title,description,criteria,reward,deadline,status,created_at').order('created_at', { ascending: false });
    if (error) { onNotice(`Không tải được thử thách: ${error.message}`); return; }
    const rows = (data || []) as Challenge[]; setChallenges(rows);
    const ids = rows.map((item) => item.id);
    const result = ids.length ? await supabase.from('teaching_challenge_entries').select('id,challenge_id,resource_id,author_id,status,created_at,resource:resources!teaching_challenge_entries_resource_id_fkey(title),author:profiles!teaching_challenge_entries_author_id_fkey(full_name)').in('challenge_id', ids).order('created_at', { ascending: false }) : { data: [], error: null };
    if (result.error) { onNotice(`Không tải được bài tham gia: ${result.error.message}`); return; }
    setEntries((result.data || []) as unknown as Entry[]);
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!supabase || !currentUser) { setResources([]); return; }
    void supabase.from('resources').select('id,title,moderation_status').eq('author_id', currentUser.id).eq('moderation_status', 'approved').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) onNotice(`Không tải được học liệu của thầy cô: ${error.message}`); else setResources((data || []) as Resource[]); });
  }, [currentUser?.id]);
  const createChallenge = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase || !isAdmin || !title.trim() || !deadline) return;
    setBusy(true);
    const { error } = await supabase.from('teaching_challenges').insert({ title: title.trim(), description: description.trim(), criteria: criteriaText.split('\n').map((item) => item.trim()).filter(Boolean), reward: reward.trim(), deadline: new Date(deadline).toISOString(), status: 'open', created_by: currentUser?.id });
    setBusy(false); if (error) { onNotice(`Không tạo được thử thách: ${error.message}`); return; }
    setTitle(''); setDescription(''); setCriteriaText(''); setReward(''); setDeadline(''); onNotice('Đã mở thử thách cho cộng đồng.'); await load();
  };
  const submitEntry = async (challenge: Challenge, resourceId: string) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || challenge.status !== 'open' || new Date(challenge.deadline).getTime() < Date.now()) return;
    const { error } = await supabase.from('teaching_challenge_entries').insert({ challenge_id: challenge.id, resource_id: resourceId, author_id: currentUser.id });
    if (error) { onNotice(error.code === '23505' ? 'Học liệu này đã được gửi cho thử thách.' : `Không gửi được bài tham gia: ${error.message}`); return; }
    onNotice('Đã gửi học liệu vào thử thách.'); await load();
  };
  const reviewEntry = async (entry: Entry, status: string) => {
    if (!supabase || !isAdmin) return;
    const { error } = await supabase.from('teaching_challenge_entries').update({ status, reviewed_by: currentUser?.id, reviewed_at: new Date().toISOString() }).eq('id', entry.id);
    if (error) onNotice(error.message); else { onNotice('Đã cập nhật kết quả bài tham gia.'); await load(); }
  };
  const toggleChallenge = async (challenge: Challenge) => {
    if (!supabase || !isAdmin) return;
    const status = challenge.status === 'closed' ? 'open' : 'closed';
    const { error } = await supabase.from('teaching_challenges').update({ status, updated_at: new Date().toISOString() }).eq('id', challenge.id);
    if (error) onNotice(error.message); else { onNotice(status === 'open' ? 'Đã mở lại thử thách.' : 'Đã đóng thử thách.'); await load(); }
  };
  return <section className="challenges-page">
    <header className="challenges-hero"><span className="challenges-mark"><Award size={24} /></span><div><span className="section-kicker">SÁNG KIẾN TỪ LỚP HỌC</span><h2>Thử thách sư phạm</h2><p>Chia sẻ học liệu đã được duyệt, cùng đồng nghiệp giải quyết một bài toán dạy học cụ thể và ghi nhận những cách làm hiệu quả.</p></div></header>
    {isAdmin && <form className="challenge-create" onSubmit={createChallenge}><div className="challenge-create-heading"><ShieldCheck size={17} /><b>Tạo thử thách mới</b><small>Chỉ admin nhìn thấy biểu mẫu này</small></div><label>Tên thử thách<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="Ví dụ: Hoạt động STEM ít thiết bị cho lớp 6" required /></label><label>Mục tiêu và bối cảnh<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={1600} required placeholder="Nêu vấn đề thực tế mà giáo viên có thể cùng giải quyết…" /></label><label>Tiêu chí đánh giá<textarea value={criteriaText} onChange={(event) => setCriteriaText(event.target.value)} rows={3} placeholder="Mỗi dòng là một tiêu chí rõ ràng" /></label><div className="form-two-col"><label>Hình thức ghi nhận<input value={reward} onChange={(event) => setReward(event.target.value)} maxLength={240} placeholder="Ví dụ: giới thiệu ở trang chủ, huy hiệu cộng đồng" /></label><label>Hạn gửi bài<input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></label></div><button className="button button-primary" disabled={busy}><Plus size={14} /> {busy ? 'Đang tạo…' : 'Mở thử thách'}</button></form>}
    <div className="challenge-list">{challenges.map((challenge) => { const submitted = entries.filter((entry) => entry.challenge_id === challenge.id); const mine = submitted.filter((entry) => entry.author_id === currentUser?.id); const visibleEntries = isAdmin ? submitted : submitted.filter((entry) => entry.author_id === currentUser?.id || entry.status === 'shortlisted' || entry.status === 'winner'); const ended = challenge.status !== 'open' || new Date(challenge.deadline).getTime() < Date.now(); return <article className="challenge-card" key={challenge.id}><div className="challenge-card-top"><span className={`challenge-status ${ended ? 'closed' : ''}`}>{ended ? 'Đã khép lại' : 'Đang nhận bài'}</span><span className="challenge-deadline"><CalendarDays size={13} /> Hạn {new Date(challenge.deadline).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div><h3>{challenge.title}</h3><p>{challenge.description}</p>{challenge.criteria?.length > 0 && <div className="challenge-criteria"><b>Tiêu chí</b>{challenge.criteria.map((criterion) => <span key={criterion}><Check size={13} /> {criterion}</span>)}</div>}{challenge.reward && <div className="challenge-reward"><Trophy size={14} /> {challenge.reward}</div>}<div className="challenge-card-footer"><span><FileText size={14} /> {submitted.length} bài tham gia{mine.length ? ` · ${mine.length} bài của thầy cô` : ''}</span>{isAdmin ? <button className="button button-outline" onClick={() => void toggleChallenge(challenge)}>{challenge.status === 'closed' ? 'Mở lại' : 'Đóng thử thách'}</button> : !ended && currentUser && resources.length > 0 ? <select aria-label={`Gửi học liệu cho ${challenge.title}`} defaultValue="" onChange={(event) => { if (event.target.value) void submitEntry(challenge, event.target.value); event.target.value = ''; }}><option value="">Chọn học liệu đã duyệt để gửi…</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}</select> : !ended && !currentUser ? <button className="button button-outline" onClick={onRequireAuth}>Đăng nhập để tham gia</button> : <small>{ended ? 'Thử thách không nhận thêm bài.' : 'Cần có học liệu đã duyệt để tham gia.'}</small>}</div>{visibleEntries.length > 0 && <div className="challenge-entry-list">{visibleEntries.map((entry) => <div key={entry.id}><span><b>{entry.resource?.title || 'Học liệu'}</b><small>{entry.author?.full_name || 'Giáo viên'} · {entryLabels[entry.status] || entry.status}</small></span>{isAdmin && <div><button onClick={() => void reviewEntry(entry, 'shortlisted')}>Nổi bật</button><button onClick={() => void reviewEntry(entry, 'winner')}>Vinh danh</button><button onClick={() => void reviewEntry(entry, 'rejected')}>Không chọn</button></div>}</div>)}</div>}</article>; })}{challenges.length === 0 && <div className="empty-state"><div className="empty-icon"><Award size={20} /></div><h3>Chưa có thử thách đang mở</h3><p>Khi admin công bố một chủ đề, bài tham gia và kết quả sẽ xuất hiện tại đây.</p></div>}</div>
  </section>;
}
