import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { BellRing, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GRADE_LABELS, SUBJECT_NAMES } from '../lib/curriculum';

type AlertRule = { id: string; keywords: string; subjects: string[]; grade_levels: string[]; resource_types: string[]; created_at: string };
export function ResourceAlertsPage({ currentUser, onRequireAuth, onNotice }: { currentUser: User | null; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [keywords, setKeywords] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!supabase || !currentUser) return;
    const { data, error } = await supabase.from('resource_search_subscriptions').select('id,keywords,subjects,grade_levels,resource_types,created_at').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (error) onNotice(`Không tải được thông báo tìm kiếm: ${error.message}`); else setRules((data || []) as AlertRule[]);
  };
  useEffect(() => { if (currentUser) void load(); }, [currentUser?.id]);
  const add = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || (!keywords.trim() && !subject && !grade)) { onNotice('Chọn ít nhất một môn, khối hoặc từ khóa để đặt thông báo.'); return; }
    if (rules.length >= 20) { onNotice('Mỗi tài khoản lưu tối đa 20 bộ lọc để thông báo luôn có ý nghĩa.'); return; }
    setBusy(true);
    const { error } = await supabase.from('resource_search_subscriptions').insert({ user_id: currentUser.id, keywords: keywords.trim(), subjects: subject ? [subject] : [], grade_levels: grade ? [grade] : [], resource_types: [] });
    setBusy(false); if (error) { onNotice(error.message); return; }
    setKeywords(''); setSubject(''); setGrade(''); onNotice('Đã lưu bộ lọc. EduHub sẽ thông báo khi có học liệu mới được duyệt phù hợp.'); await load();
  };
  const remove = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('resource_search_subscriptions').delete().eq('id', id);
    if (error) onNotice(error.message); else { setRules((current) => current.filter((item) => item.id !== id)); onNotice('Đã xóa bộ lọc thông báo.'); }
  };
  if (!currentUser) return <div className="empty-state"><div className="empty-icon"><BellRing size={19} /></div><h3>Đăng nhập để nhận thông báo học liệu</h3><p>Lưu môn, khối hoặc chủ đề mình quan tâm để nhận cập nhật khi có bài mới được duyệt.</p><button className="button button-primary" onClick={onRequireAuth}>Đăng nhập</button></div>;
  return <section className="resource-alerts-page"><header><span><BellRing size={22} /></span><div><span className="section-kicker">THEO DÕI NHU CẦU DẠY HỌC</span><h2>Thông báo học liệu mới</h2><p>Nhận thông báo trong EduHub khi có dự án đã duyệt khớp bộ lọc. Không gửi email quảng cáo.</p></div></header><form className="resource-alert-form" onSubmit={add}><label>Từ khóa<input value={keywords} onChange={(event) => setKeywords(event.target.value)} maxLength={80} placeholder="Ví dụ: phân số, STEM, kiểm tra giữa kỳ" /></label><div className="form-two-col"><label>Bộ môn<select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Mọi bộ môn</option>{SUBJECT_NAMES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Khối lớp<select value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">Mọi khối</option>{GRADE_LABELS.map((item) => <option key={item}>{item}</option>)}</select></label></div><button className="button button-primary" disabled={busy || rules.length >= 20}><Plus size={14} /> {rules.length >= 20 ? 'Đã đạt giới hạn 20 bộ lọc' : busy ? 'Đang lưu…' : 'Lưu bộ lọc thông báo'}</button></form><div className="resource-alert-list-heading"><h3>Bộ lọc đang theo dõi</h3><span>{rules.length}/20</span></div><div className="resource-alert-list">{rules.map((rule) => <article key={rule.id}><span className="resource-alert-icon"><BellRing size={15} /></span><span><b>{[rule.keywords, ...(rule.subjects || []), ...(rule.grade_levels || [])].filter(Boolean).join(' · ')}</b><small>Tạo {new Date(rule.created_at).toLocaleDateString('vi-VN')}</small></span><button aria-label="Xóa bộ lọc" onClick={() => void remove(rule.id)}><Trash2 size={15} /></button></article>)}{rules.length === 0 && <p className="community-empty">Thầy cô chưa lưu bộ lọc nào. Tạo bộ lọc đầu tiên phía trên.</p>}</div></section>;
}
