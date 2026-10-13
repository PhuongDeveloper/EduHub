import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getVietnamProvinces, getVietnamWards, type AdministrativeUnit } from '../lib/vietnamLocations';

export type TeacherAddress = {
  provinceCode: string;
  province: string;
  wardCode: string;
  ward: string;
  schoolName: string;
};

export function TeacherAddressFields({ value, onChange }: { value: TeacherAddress; onChange: (next: TeacherAddress) => void }) {
  const [provinces, setProvinces] = useState<AdministrativeUnit[]>([]);
  const [wards, setWards] = useState<AdministrativeUnit[]>([]);
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [manualProvince, setManualProvince] = useState('');
  const [manualWard, setManualWard] = useState('');

  useEffect(() => {
    let active = true;
    void getVietnamProvinces().then((items) => {
      if (active) setProvinces(items.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
    }).catch((error: unknown) => {
      if (active) setAddressError(error instanceof Error ? error.message : 'Không tải được tỉnh/thành. Thầy cô có thể nhập địa chỉ thủ công.');
    }).finally(() => { if (active) setLoadingProvinces(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!value.provinceCode) { setWards([]); return; }
    let active = true;
    setLoadingWards(true);
    setAddressError('');
    void getVietnamWards(Number(value.provinceCode)).then((items) => {
      if (active) setWards(items.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
    }).catch((error: unknown) => {
      if (active) setAddressError(error instanceof Error ? error.message : 'Không tải được phường/xã. Thầy cô có thể nhập thủ công.');
    }).finally(() => { if (active) setLoadingWards(false); });
    return () => { active = false; };
  }, [value.provinceCode]);

  useEffect(() => {
    if (!supabase || !value.province) { setSchoolSuggestions([]); return; }
    let active = true;
    void supabase.from('profiles').select('school_name').eq('province', value.province).not('school_name', 'is', null).limit(250)
      .then(({ data }) => {
        if (!active || !data) return;
        setSchoolSuggestions([...new Set(data.map((row) => row.school_name?.trim()).filter((name): name is string => Boolean(name)))].sort((a, b) => a.localeCompare(b, 'vi')));
      }, () => { if (active) setSchoolSuggestions([]); });
    return () => { active = false; };
  }, [value.province]);

  const selectedProvince = useMemo(() => provinces.find((item) => String(item.code) === value.provinceCode), [provinces, value.provinceCode]);
  const changeProvince = (code: string) => {
    const unit = provinces.find((item) => String(item.code) === code);
    setManualProvince(''); setManualWard('');
    onChange({ ...value, provinceCode: code, province: unit?.name || '', wardCode: '', ward: '' });
  };
  const changeWard = (code: string) => {
    const unit = wards.find((item) => String(item.code) === code);
    setManualWard('');
    onChange({ ...value, wardCode: code, ward: unit?.name || '' });
  };

  return <>
    <div className="teacher-address-grid">
      <label className="form-label">Tỉnh / thành phố
        {provinces.length ? <select value={value.provinceCode} onChange={(event) => changeProvince(event.target.value)}><option value="">{value.province || (loadingProvinces ? 'Đang tải danh sách…' : 'Chọn tỉnh / thành phố')}</option>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select> : <input value={manualProvince || value.province} onChange={(event) => { setManualProvince(event.target.value); onChange({ ...value, provinceCode: '', province: event.target.value, wardCode: '', ward: '' }); }} placeholder="Nhập tỉnh / thành phố" />}
      </label>
      <label className="form-label">Phường / xã
        {wards.length ? <select value={value.wardCode} onChange={(event) => changeWard(event.target.value)} disabled={!value.provinceCode || loadingWards}><option value="">{value.ward || (loadingWards ? 'Đang tải danh sách…' : 'Chọn phường / xã')}</option>{wards.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select> : <input value={manualWard || value.ward} onChange={(event) => { setManualWard(event.target.value); onChange({ ...value, wardCode: '', ward: event.target.value }); }} placeholder="Nhập phường / xã" />}
      </label>
    </div>
    {addressError && <div className="address-help"><MapPin size={13} /> {addressError}</div>}
    {selectedProvince && schoolSuggestions.length > 0 && <p className="address-help">Tên trường có thể chọn từ gợi ý của cộng đồng EduHub; thầy cô vẫn có thể nhập trường khác.</p>}
    <label className="form-label">Trường công tác<input list="eduhub-school-suggestions" value={value.schoolName} onChange={(event) => onChange({ ...value, schoolName: event.target.value })} placeholder="Nhập hoặc chọn tên trường" /><datalist id="eduhub-school-suggestions">{schoolSuggestions.map((school) => <option key={school} value={school} />)}</datalist></label>
  </>;
}
