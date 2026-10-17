import { useEffect, useState } from 'react';
import { Check, Flag, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type TalkReport = { id: string; reason: string; details: string; status: string; created_at: string; talk?: { title?: string; content?: string } | null; reply?: { content?: string } | null; reporter?: { full_name?: string } | null };
const reasonText: Record<string, string> = { spam: 'Spam / quảng cáo', harassment: 'Quấy rối / xúc phạm', student_privacy: 'Thông tin học sinh', copyright: 'Bản quyền', other: 'Khác' };
export function TalkReportQueue({ onNotice }: { onNotice: (message: string) => void }) {
  const [reports, setReports] = useState<TalkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from('talk_content_reports').select('id,reason,details,status,created_at,talk:talks!talk_content_reports_talk_id_fkey(title,content),reply:talk_replies!talk_content_reports_reply_id_fkey(content),reporter:profiles!talk_content_reports_reporter_id_fkey(full_name)').order('created_at', { ascending: false }).limit(100);
    setLoading(false);
    if (error) onNotice(`Không tải được báo cáo thảo luận: ${error.message}`); else setReports((data || []) as unknown as TalkReport[]);
  };
  useEffect(() => { void load(); }, []);
  const setStatus = async (report: TalkReport, status: 'reviewing' | 'resolved' | 'dismissed') => {
    if (!supabase) return;
    const { error } = await supabase.from('talk_content_reports').update({ status, reviewed_at: status === 'reviewing' ? null : new Date().toISOString() }).eq('id', report.id);
    if (error) onNotice(error.message); else { onNotice('Đã cập nhật trạng thái báo cáo.'); await load(); }
  };
  if (loading) return <div className="admin-empty-note">Đang tải báo cáo thảo luận…</div>;
  return <div className="talk-report-queue"><header><div><Flag size={15} /><b>Báo cáo thảo luận và bình luận</b></div><button onClick={() => void load()}><RotateCw size={13} /> Làm mới</button></header>{reports.map((report) => <article key={report.id}><div><span className={`admin-resource-status status-${report.status}`}>{report.status === 'pending' ? 'Chờ xem' : report.status === 'reviewing' ? 'Đang xử lý' : report.status === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'}</span><small>{reasonText[report.reason] || 'Khác'} · {report.reporter?.full_name || 'Thành viên'} · {new Date(report.created_at).toLocaleString('vi-VN')}</small></div><b>{report.talk?.title || 'Chủ đề đã được gỡ'}</b><p>{report.reply?.content || report.talk?.content || 'Nội dung đích không còn khả dụng.'}</p>{report.details && <small>Ghi chú: {report.details}</small>}<div className="talk-report-actions"><button onClick={() => void setStatus(report, 'reviewing')}>Đang xử lý</button><button onClick={() => void setStatus(report, 'resolved')}><Check size={12} /> Đã xử lý</button><button onClick={() => void setStatus(report, 'dismissed')}>Bỏ qua</button></div></article>)}{reports.length === 0 && <div className="admin-empty-state"><span><Check size={17} /></span><b>Chưa có báo cáo thảo luận</b></div>}</div>;
}
