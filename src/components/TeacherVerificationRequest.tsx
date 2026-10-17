import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RequestRow = { status: string; admin_note: string; evidence_url: string; created_at: string };
export function TeacherVerificationRequest({ userId, verified, onNotice }: { userId: string; verified: boolean; onNotice: (message: string) => void }) {
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [url, setUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!supabase) return; void supabase.from('teacher_verification_requests').select('status,admin_note,evidence_url,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => setRequest(data as RequestRow | null)); }, [userId]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase) return;
    try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { onNotice('Nhập liên kết https:// tới trang trường, hồ sơ nghề nghiệp hoặc minh chứng công khai.'); return; }
    setBusy(true); const { error } = await supabase.from('teacher_verification_requests').insert({ user_id: userId, evidence_url: url.trim(), explanation: explanation.trim() }); setBusy(false);
    if (error) { onNotice(error.code === '23505' ? 'Đã có một yêu cầu xác minh đang chờ.' : `Chưa gửi được yêu cầu: ${error.message}`); return; }
    setRequest({ status: 'pending', admin_note: '', evidence_url: url.trim(), created_at: new Date().toISOString() }); setUrl(''); setExplanation(''); onNotice('Đã gửi yêu cầu xác minh để admin xem xét.');
  };
  return <article className="profile-card verification-request-card"><div className="profile-card-title"><div><h3>Xác minh hồ sơ giáo viên</h3><p>Huy hiệu giúp đồng nghiệp nhận biết hồ sơ đã được rà soát.</p></div><ShieldCheck size={16} /></div>{verified ? <div className="verification-result approved"><BadgeCheck size={16} /> Hồ sơ giáo viên đã được xác minh.</div> : request?.status === 'pending' ? <div className="verification-result"><Clock3 size={16} /> Yêu cầu gửi ngày {new Date(request.created_at).toLocaleDateString('vi-VN')} đang chờ admin xem xét.</div> : <form onSubmit={(event) => void submit(event)}><label>Liên kết minh chứng công khai<input type="url" value={url} required onChange={(event) => setUrl(event.target.value)} placeholder="Trang trường hoặc hồ sơ nghề nghiệp" /></label><label>Ghi chú ngắn<textarea rows={2} maxLength={1200} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Nêu cách admin có thể xác nhận thông tin nghề nghiệp…" /></label><small>Không tải lên căn cước, bằng cấp có mã số hoặc giấy tờ chứa dữ liệu nhạy cảm.</small><button className="button button-outline" disabled={busy}>{busy ? 'Đang gửi…' : request?.status === 'rejected' ? 'Gửi lại yêu cầu' : 'Yêu cầu xác minh'} <ExternalLink size={13} /></button>{request?.status === 'rejected' && request.admin_note && <p className="verification-admin-note">Phản hồi trước đó: {request.admin_note}</p>}</form>}</article>;
}
