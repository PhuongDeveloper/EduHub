import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Teacher = { id: string; full_name: string; school_name: string | null; province: string | null; ward: string | null; show_school: boolean; show_location: boolean; subject_specialty: string | null; teaching_levels: string[] | null; years_experience: number | null; expertise_tags: string[] | null; avatar_url: string | null; bio: string | null; teacher_verified: boolean };
export function TeacherDirectoryPage({ onOpenProfile, onNotice }: { onOpenProfile: (id: string) => void; onNotice: (message: string) => void }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [province, setProvince] = useState('');
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    void supabase.from('profiles').select('id,full_name,school_name,province,ward,show_school,show_location,subject_specialty,teaching_levels,years_experience,expertise_tags,avatar_url,bio,teacher_verified').order('full_name').limit(250).then(({ data, error }) => {
      if (!active) return;
      if (error) onNotice(`Không tải được danh bạ giáo viên: ${error.message}`); else setTeachers(((data || []) as Teacher[]).map((teacher) => ({ ...teacher, school_name: teacher.show_school ? teacher.school_name : null, province: teacher.show_location ? teacher.province : null, ward: teacher.show_location ? teacher.ward : null })));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const subjects = [...new Set(teachers.map((teacher) => teacher.subject_specialty).filter((item): item is string => Boolean(item)))].sort((a, b) => a.localeCompare(b, 'vi'));
  const provinces = [...new Set(teachers.map((teacher) => teacher.province).filter((item): item is string => Boolean(item)))].sort((a, b) => a.localeCompare(b, 'vi'));
  const filtered = useMemo(() => teachers.filter((teacher) => {
    const haystack = `${teacher.full_name} ${teacher.subject_specialty || ''} ${teacher.school_name || ''} ${teacher.province || ''} ${teacher.ward || ''} ${(teacher.expertise_tags || []).join(' ')} ${(teacher.teaching_levels || []).join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi');
    return (!query || haystack.includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi')))
      && (!subject || teacher.subject_specialty === subject)
      && (!level || (teacher.teaching_levels || []).includes(level))
      && (!province || teacher.province === province);
  }), [teachers, query, subject, level, province]);
  return <section className="teacher-directory-page"><header className="directory-hero"><span><UsersRound size={22} /></span><div><span className="section-kicker">TÌM ĐỒNG NGHIỆP CÙNG CHUYÊN MÔN</span><h2>Danh bạ giáo viên</h2><p>Hồ sơ công khai giúp thầy cô tìm người cùng môn, cấp dạy hoặc địa phương. Thông tin liên hệ cá nhân không hiển thị ở danh sách.</p></div><b>{filtered.length} hồ sơ</b></header><div className="directory-filters"><label className="directory-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, thế mạnh, trường học..." /></label><select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Tất cả chuyên môn</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Mọi cấp dạy</option>{['Tiểu học', 'THCS', 'THPT'].map((item) => <option key={item}>{item}</option>)}</select><select value={province} onChange={(event) => setProvince(event.target.value)}><option value="">Mọi tỉnh thành</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></div>{loading ? <div className="directory-grid">{[0,1,2,3,4,5].map((item) => <div className="directory-card-skeleton" key={item}><span /><i /><i /></div>)}</div> : filtered.length ? <div className="directory-grid">{filtered.map((teacher) => <button className="directory-teacher-card" key={teacher.id} onClick={() => onOpenProfile(teacher.id)}><span className="directory-avatar">{teacher.avatar_url ? <img src={teacher.avatar_url} alt="" loading="lazy" /> : teacher.full_name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</span><span className="directory-teacher-copy"><b>{teacher.full_name}{teacher.teacher_verified && <ShieldCheck size={14} />}</b><small>{teacher.subject_specialty || 'Chưa cập nhật chuyên môn'}</small><small>{(teacher.teaching_levels || []).join(' · ') || 'Chưa cập nhật cấp dạy'}</small>{(teacher.province || teacher.school_name) && <small className="directory-location"><MapPin size={12} /> {[teacher.school_name, teacher.province].filter(Boolean).join(' · ')}</small>}{teacher.bio && <p>{teacher.bio}</p>}<span className="directory-expertise">{(teacher.expertise_tags || []).slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}</span></span><span className="directory-experience">{teacher.years_experience ? `${teacher.years_experience} năm` : 'Mở hồ sơ'}</span></button>)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={20} /></div><h3>Chưa tìm thấy hồ sơ phù hợp</h3><p>Thử bỏ bớt bộ lọc hoặc tìm bằng một tên môn học khác.</p></div>}</section>;
}
