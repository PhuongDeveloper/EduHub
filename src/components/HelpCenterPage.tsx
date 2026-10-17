import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BookOpenCheck, ChevronDown, CircleHelp, FileQuestion, LifeBuoy, Send } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const articles = [
  { title: 'Đăng một học liệu để đồng nghiệp sử dụng', category: 'Chia sẻ học liệu', body: 'Chọn “Chia sẻ học liệu”, điền tên, môn học, khối lớp và hướng dẫn. Thầy cô có thể lưu bản nháp; nội dung sẽ xuất hiện công khai sau khi được duyệt.' },
  { title: 'Quyền tác giả và thông tin học sinh', category: 'An toàn cộng đồng', body: 'Chỉ đăng tài liệu do thầy cô có quyền chia sẻ. Xóa tên, ảnh, điểm số và thông tin nhận diện học sinh khỏi ảnh chụp, video hoặc tệp trước khi tải lên.' },
  { title: 'Sửa hoặc thay thế một tài liệu đã đăng', category: 'Quản lý dự án', body: 'Mở trang dự án của mình để cập nhật mô tả, liên kết và phiên bản. Khi tài liệu không còn dùng được, hãy báo admin để tạm ẩn và dẫn người xem sang bản thay thế.' },
  { title: 'Báo nội dung vi phạm hoặc liên kết hỏng', category: 'An toàn cộng đồng', body: 'Dùng nút báo cáo ngay tại nội dung. Gửi kèm lý do cụ thể; nhóm quản trị sẽ xem xét theo hàng chờ và cập nhật trạng thái xử lý.' },
  { title: 'Kiểm soát hồ sơ và liên hệ', category: 'Tài khoản', body: 'Trong trang cá nhân, chỉ điền email và liên kết liên hệ nếu thầy cô muốn chia sẻ công khai. Không đăng thông tin riêng tư của học sinh hoặc đồng nghiệp khi chưa được đồng ý.' },
];

export function HelpCenterPage({ user, onRequireAuth, onNotice }: { user: User | null; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [open, setOpen] = useState(0);
  const [category, setCategory] = useState('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [myRequests, setMyRequests] = useState<Array<{ id: string; subject: string; message: string; status: string; admin_reply: string; created_at: string }>>([]);
  const loadMine = useCallback(async () => { if (!supabase || !user) { setMyRequests([]); return; } const { data, error } = await supabase.from('support_requests').select('id,subject,message,status,admin_reply,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20); if (error) onNotice(`Không tải được yêu cầu của thầy cô: ${error.message}`); else setMyRequests(data || []); }, [user?.id, onNotice]);
  useEffect(() => { void loadMine(); }, [loadMine]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) { onRequireAuth(); return; }
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from('support_requests').insert({ user_id: user.id, category, subject: subject.trim(), message: message.trim() });
    setBusy(false);
    if (error) { onNotice(`Chưa gửi được yêu cầu: ${error.message}`); return; }
    setSubject(''); setMessage(''); onNotice('Đã gửi yêu cầu hỗ trợ.'); await loadMine();
  };
  return <section className="help-center-page">
    <header className="help-center-hero"><span><LifeBuoy size={23} /></span><div><small>EDUHUB · TRUNG TÂM TRỢ GIÚP</small><h1>Hỗ trợ thầy cô</h1><p>Hướng dẫn ngắn, quy tắc cộng đồng và một nơi để gửi vấn đề cần người hỗ trợ.</p></div></header>
    <div className="help-center-layout"><section className="help-articles"><div className="help-section-title"><div><span className="section-kicker">TỰ TÌM CÂU TRẢ LỜI</span><h2>Hướng dẫn thường dùng</h2></div><BookOpenCheck size={19} /></div>{articles.map((article, index) => <article className={`help-article ${open === index ? 'is-open' : ''}`} key={article.title}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span><small>{article.category}</small><b>{article.title}</b></span><ChevronDown size={17} /></button>{open === index && <p>{article.body}</p>}</article>)}<div className="help-community-note"><CircleHelp size={17} /><span><b>Không thấy câu trả lời?</b><small>Gửi yêu cầu bên cạnh; vui lòng không đưa mật khẩu hoặc dữ liệu học sinh vào nội dung.</small></span></div></section>
      <form className="help-request-card" onSubmit={(event) => void submit(event)}><div className="help-section-title"><div><span className="section-kicker">ĐỘI NGŨ EDUHUB</span><h2>Gửi yêu cầu hỗ trợ</h2><p>Thông tin này chỉ thầy cô và quản trị viên xem được.</p></div><FileQuestion size={19} /></div><label>Vấn đề thuộc mục<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="account">Tài khoản</option><option value="project">Dự án / học liệu</option><option value="discussion">Thảo luận</option><option value="technical">Lỗi kỹ thuật</option><option value="privacy">Quyền riêng tư</option><option value="other">Vấn đề khác</option></select></label><label>Tiêu đề<input required minLength={5} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Tóm tắt vấn đề cần hỗ trợ" /></label><label>Mô tả<textarea required minLength={15} maxLength={3000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nêu các bước gặp lỗi và trang đang sử dụng…" /><small>{message.length}/3000 ký tự</small></label><button className="button button-primary" disabled={busy}><Send size={14} />{busy ? 'Đang gửi…' : user ? 'Gửi riêng cho quản trị viên' : 'Đăng nhập để gửi yêu cầu'}</button>{!user && <button className="help-login-link" type="button" onClick={onRequireAuth}>Đăng nhập để theo dõi phản hồi của mình</button>}</form></div>
    {user && <section className="help-my-requests"><div className="help-section-title"><div><span className="section-kicker">THEO DÕI TRAO ĐỔI</span><h2>Yêu cầu của thầy cô</h2></div></div>{myRequests.length ? myRequests.map((request) => <article key={request.id}><header><b>{request.subject}</b><span className={`help-request-status status-${request.status}`}>{request.status === 'open' ? 'Mới gửi' : request.status === 'in_progress' ? 'Đang xử lý' : request.status === 'answered' ? 'Đã phản hồi' : 'Đã đóng'}</span></header><p>{request.message}</p>{request.admin_reply && <div className="help-admin-response"><b>Phản hồi từ EduHub</b><p>{request.admin_reply}</p></div>}<small>{new Date(request.created_at).toLocaleString('vi-VN')}</small></article>) : <p className="help-request-empty">Các yêu cầu đã gửi và phản hồi của quản trị viên sẽ lưu tại đây.</p>}</section>}
  </section>;
}
