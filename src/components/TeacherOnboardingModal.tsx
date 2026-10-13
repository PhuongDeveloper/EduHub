import { useState, type FormEvent } from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { TeacherAddressFields, type TeacherAddress } from './TeacherAddressFields';
import { supabase } from '../lib/supabase';

export function TeacherOnboardingModal({ userId, initialName, onComplete, onNotice }: { userId: string; initialName: string; onComplete: () => void; onNotice: (message: string) => void }) {
  const [name, setName] = useState(initialName || '');
  const [address, setAddress] = useState<TeacherAddress>({ provinceCode: '', province: '', wardCode: '', ward: '', schoolName: '' });
  const [specialty, setSpecialty] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [years, setYears] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = (level: string) => setLevels((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase || !name.trim()) return;
    setBusy(true); setError('');
    const { error: saveError } = await supabase.from('profiles').update({ full_name: name.trim(), school_name: address.schoolName.trim() || null, province: address.province || null, province_code: address.provinceCode || null, ward: address.ward || null, ward_code: address.wardCode || null, subject_specialty: specialty || null, teaching_levels: levels, years_experience: Math.max(0, Math.min(70, Number(years || 0))), profile_completed_at: new Date().toISOString() }).eq('id', userId);
    setBusy(false);
    if (saveError) { setError(saveError.message); return; }
    onComplete(); onNotice('Hồ sơ giáo viên đã sẵn sàng. Thầy cô có thể cập nhật thêm bất cứ lúc nào.');
  };
  const subjects = ['Toán học', 'Ngữ văn', 'Khoa học tự nhiên', 'Tiếng Anh', 'Lịch sử & Địa lí', 'Tin học & Công nghệ', 'Giáo dục mầm non', 'Giáo dục đặc biệt', 'Khác'];
  return <div className="modal-backdrop onboarding-backdrop"><section className="modal-panel onboarding-modal"><span className="onboarding-icon"><GraduationCap size={23} /></span><div className="section-kicker">CHÀO MỪNG ĐẾN VỚI EDUHUB</div><h2>Hoàn thiện hồ sơ giáo viên</h2><p className="modal-intro">Thêm vài thông tin để đồng nghiệp tìm đúng người, đúng chuyên môn. Các mục này có thể chỉnh sửa trên tường cá nhân.</p><form onSubmit={save}><label className="form-label">Họ và tên<input autoFocus value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label><TeacherAddressFields value={address} onChange={setAddress} /><div className="form-two-col"><label className="form-label">Môn chuyên môn<select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">Chọn môn</option>{subjects.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label className="form-label">Số năm kinh nghiệm<input type="number" min="0" max="70" value={years} onChange={(event) => setYears(event.target.value)} placeholder="Ví dụ: 8" /></label></div><div className="form-label"><span>Cấp học đang giảng dạy</span><div className="profile-level-choices">{['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Giáo dục nghề nghiệp'].map((level) => <label key={level}><input type="checkbox" checked={levels.includes(level)} onChange={() => toggle(level)} /> {level}</label>)}</div></div>{error && <div className="submit-error">{error}</div>}<button className="button button-primary login-submit" disabled={busy}><Sparkles size={15} /> {busy ? 'Đang lưu hồ sơ…' : 'Hoàn tất và vào EduHub'}</button></form></section></div>;
}
