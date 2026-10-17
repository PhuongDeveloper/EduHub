import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Clipboard, ExternalLink, Globe2, Lightbulb, MonitorPlay, Send, WandSparkles, X } from 'lucide-react';
import { CurriculumPicker } from './CurriculumPicker';
import { sandboxWebsiteHtml } from '../lib/sandboxWebsite';
import { WebsiteVisualEditor } from './WebsiteVisualEditor';

export type TeacherWebsiteDraft = { title: string; description: string; subjects: string[]; grades: string[]; websiteHtml: string };
type Step = 'idea' | 'prompt' | 'code' | 'publish';

const aiProviders = [
  { name: 'ChatGPT', href: 'https://chatgpt.com/', mark: 'C', tone: 'chatgpt' },
  { name: 'Gemini', href: 'https://gemini.google.com/app', mark: '✦', tone: 'gemini' },
  { name: 'Claude', href: 'https://claude.ai/new', mark: '✳', tone: 'claude' },
];

function createInterviewPrompt(title: string, idea: string) {
  return `Bạn là người đồng hành giúp giáo viên Việt Nam biến ý tưởng thành một website giáo dục đơn giản, dễ dùng. Hãy phỏng vấn tôi trước khi viết mã.

Ý tưởng ban đầu của giáo viên:
Tên tạm: ${title.trim() || 'Chưa đặt tên'}
Mô tả: ${idea.trim() || 'Giáo viên sẽ bổ sung trong cuộc phỏng vấn'}

QUY TẮC PHỎNG VẤN BẮT BUỘC:
- Mở đầu bằng đúng ý: “Sau đây em sẽ hỏi thầy/cô 10 câu hỏi để hiểu ý tưởng của thầy/cô nhé.”
- Hỏi chính xác 10 lượt, mỗi lượt chỉ có MỘT câu hỏi ngắn, dễ trả lời. Hỏi xong phải dừng lại và chờ tôi trả lời; tuyệt đối không liệt kê trước, không hỏi gộp, không gửi nhiều câu trong cùng một lượt.
- Bốn câu đầu lần lượt làm rõ: (1) mục đích chính của công cụ, (2) ai sẽ dùng và dùng cho lớp/độ tuổi nào, (3) việc quan trọng nhất người dùng cần làm, (4) thiết bị và hoàn cảnh sử dụng (điện thoại/máy tính, có mạng yếu hay không).
- Từ câu 5 đến câu 10, tự chọn từng câu hỏi tiếp theo dựa trên câu trả lời trước đó. Ưu tiên làm rõ nội dung, các bước sử dụng, cách tính/hiển thị kết quả, hình ảnh và phong cách, trường hợp đặc biệt, yêu cầu dễ tiếp cận. Không hỏi lại điều đã rõ; không bắt buộc hỏi về tính năng không phù hợp với ý tưởng.
- Nếu câu trả lời ngắn hoặc chưa rõ, dùng một câu hỏi tiếp theo trong tổng số 10 để làm rõ; không thêm câu ngoài giới hạn.
- Sau câu trả lời thứ 10, không hỏi xin xác nhận và không viết phần giải thích dài. Hãy tạo ngay MỘT file HTML hoàn chỉnh trong duy nhất một khối mã HTML, bắt đầu bằng <!doctype html> và kết thúc bằng </html>, không viết lời dẫn ở ngoài khối mã.

YÊU CẦU FILE HTML:
- Tự chạy độc lập khi lưu thành một file .html; viết giao diện, CSS và JavaScript ngay trong file. Không cần cài đặt, máy chủ, tài khoản, API key hay dịch vụ bên ngoài.
- Tạo trải nghiệm hoàn chỉnh theo đúng câu trả lời của giáo viên; nội dung tiếng Việt tự nhiên, phù hợp lớp học Việt Nam, giao diện ưu tiên điện thoại, dễ đọc, có trạng thái rỗng/lỗi và hỗ trợ bàn phím.
- Không dùng thư viện hoặc script bên ngoài. Không giả vờ có AI, đăng nhập, lưu đám mây hay tính năng máy chủ. Dữ liệu chỉ tồn tại trong lúc mở trang; không dùng localStorage, cookie hay API mạng.
- Dùng dữ liệu mẫu minh họa khi cần; không đưa tên, ảnh hay thông tin nhận dạng thật của học sinh vào ví dụ. Không yêu cầu hoặc nhúng bí mật, token, API key.
- Sau khi đưa khối mã, dừng lại để tôi sao chép HTML về EduHub.`;
}

export function WebsiteBuilderModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (draft: TeacherWebsiteDraft) => Promise<string | null> }) {
  const [step, setStep] = useState<Step>('idea');
  const [title, setTitle] = useState('');
  const [idea, setIdea] = useState('');
  const [prompt, setPrompt] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [html, setHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2200);
    } catch {
      setError('Trình duyệt chưa cho phép sao chép tự động. Thầy cô chọn toàn bộ prompt rồi sao chép thủ công.');
    }
  };

  const buildPrompt = async (event: FormEvent) => {
    event.preventDefault();
    const next = createInterviewPrompt(title, idea);
    setPrompt(next);
    setStep('prompt');
    setError('');
    try {
      await navigator.clipboard.writeText(next);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2200);
    } catch { setPromptCopied(false); }
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !html.trim()) { setError('Điền tên, mô tả và mã HTML trước khi gửi.'); return; }
    if (!/<html\b/i.test(html) || !/<\/html\s*>/i.test(html)) { setError('Mã cần là một file HTML hoàn chỉnh, có thẻ <html> và </html>. Hãy quay lại kiểm tra phần mã AI tạo.'); return; }
    if (html.length > 500_000) { setError('File HTML vượt quá 500 KB. Hãy yêu cầu AI rút gọn mã và bỏ tài nguyên nhúng quá lớn.'); return; }
    if (!subjects.length || !grades.length) { setError('Chọn ít nhất một môn học và một khối lớp để gửi duyệt.'); return; }
    setSaving(true); setError('');
    const result = await onSubmit({ title: title.trim(), description: description.trim(), subjects, grades, websiteHtml: html });
    setSaving(false);
    if (result) setError(result);
  };

  const steps: Array<{ id: Step; label: string }> = [{ id: 'idea', label: 'Ý tưởng' }, { id: 'prompt', label: 'Phỏng vấn AI' }, { id: 'code', label: 'Dán mã HTML' }, { id: 'publish', label: 'Gửi duyệt' }];
  const activeIndex = steps.findIndex((item) => item.id === step);

  return <div className="modal-backdrop website-builder-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section className="modal-panel website-builder-modal" role="dialog" aria-modal="true" aria-labelledby="website-builder-title">
      <header className="website-builder-header"><div className="website-builder-brand"><span><Globe2 size={19} /></span><div><b id="website-builder-title">Tạo website giáo dục</b><small>Ý tưởng của thầy cô, thành website dùng được</small></div></div><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={18} /></button></header>
      <nav className="website-builder-steps" aria-label="Các bước tạo website">{steps.map((item, index) => <div key={item.id} className={index === activeIndex ? 'active' : index < activeIndex ? 'complete' : ''}><span>{index < activeIndex ? <Check size={12} /> : index + 1}</span>{item.label}</div>)}</nav>

      {step === 'idea' && <form className="website-builder-content" onSubmit={(event) => void buildPrompt(event)}><span className="section-kicker">BƯỚC 1 · BẮT ĐẦU TỪ Ý TƯỞNG</span><h2>Thầy cô muốn tạo công cụ gì?</h2><p className="website-builder-intro">Chưa cần biết lập trình. Mô tả ý tưởng bằng lời của mình; prompt sẽ hướng dẫn AI hỏi từng câu để hiểu rõ hơn.</p><label className="form-label">Tên ý tưởng<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ví dụ: Trò chơi ôn phép chia lớp 4" required /></label><label className="form-label">Mô tả ý tưởng<textarea value={idea} onChange={(event) => setIdea(event.target.value)} rows={5} maxLength={1800} placeholder="Thầy cô muốn học sinh làm gì? Điều gì đang khó trong tiết học? Cứ mô tả tự nhiên, chưa cần nghĩ tên tính năng." required /></label><div className="website-builder-tip"><Lightbulb size={16} /><span><b>Không cần viết prompt giỏi.</b><small>AI sẽ hỏi thầy cô 10 câu, mỗi lần đúng một câu rồi mới làm website.</small></span></div><button className="button button-primary website-builder-next" type="submit"><WandSparkles size={16} /> Tạo prompt phỏng vấn <ArrowRight size={15} /></button></form>}

      {step === 'prompt' && <div className="website-builder-content"><span className="section-kicker">BƯỚC 2 · NHỜ AI PHỎNG VẤN</span><h2>Chọn AI quen thuộc với thầy cô</h2><p className="website-builder-intro">Prompt đã được sao chép nếu trình duyệt cho phép. Mở một AI, dán prompt vào ô chat, rồi trả lời từng câu cho đến khi nhận được file HTML.</p><div className="website-ai-buttons">{aiProviders.map((provider) => <a className={`website-ai-link ${provider.tone}`} href={provider.href} target="_blank" rel="noopener noreferrer" key={provider.name} onClick={() => { void copyPrompt(); }}><span>{provider.mark}</span><b>Mở {provider.name}</b><ExternalLink size={14} /></a>)}</div><label className="form-label website-prompt-label">Prompt của thầy cô<textarea readOnly value={prompt} rows={8} onFocus={(event) => event.currentTarget.select()} /></label><div className="website-prompt-actions"><button className="button button-outline" onClick={() => void copyPrompt()}>{promptCopied ? <Check size={14} /> : <Clipboard size={14} />}{promptCopied ? 'Đã sao chép prompt' : 'Sao chép lại'}</button><button className="button button-primary" onClick={() => setStep('code')}>Tôi đã có file HTML <ArrowRight size={14} /></button></div><p className="website-builder-footnote">AI có thể diễn đạt khác nhau, nhưng prompt yêu cầu hỏi đúng 10 lượt và chờ câu trả lời sau mỗi lượt.</p></div>}

      {step === 'code' && <div className="website-builder-content website-code-step"><span className="section-kicker">BƯỚC 3 · DÁN FILE AI TẠO</span><h2>Đưa website vào xem thử</h2><p className="website-builder-intro">Dán toàn bộ HTML. Thầy cô có thể chọn trực tiếp phần tử trên canvas để sửa nội dung, kích thước, căn chữ và vị trí; vẫn có thể mở mã để chỉnh sâu.</p><details className="website-source-editor" open={!html.trim()}><summary>{html.trim() ? 'Mở mã HTML để chỉnh sửa' : 'Dán mã HTML'}</summary><label className="form-label">Mã HTML<textarea className="website-html-editor" value={html} onChange={(event) => { setHtml(event.target.value); setError(''); }} maxLength={500_000} rows={html.trim() ? 8 : 12} spellCheck={false} placeholder="Dán toàn bộ file HTML ở đây…" /></label></details><div className="website-code-toolbar"><small>{html.length.toLocaleString('vi-VN')} / 500.000 ký tự</small><button className="button button-outline" disabled={!html.trim()} onClick={() => setPreviewOpen((open) => !open)}><MonitorPlay size={15} /> {previewOpen ? 'Đóng canvas' : 'Mở canvas chỉnh sửa'}</button></div>{previewOpen && html.trim() && <WebsiteVisualEditor html={html} onSave={setHtml} />}<div className="website-prompt-actions"><button className="button button-quiet" onClick={() => setStep('prompt')}><ArrowLeft size={14} /> Quay lại prompt</button><button className="button button-primary" onClick={() => { setDescription(idea.trim()); setStep('publish'); }}>{html.trim() ? 'Tiếp tục hoàn thiện' : 'Tiếp tục'} <ArrowRight size={14} /></button></div></div>}

      {step === 'publish' && <form className="website-builder-content website-publish-step" onSubmit={(event) => void publish(event)}><span className="section-kicker">BƯỚC 4 · HOÀN THIỆN & GỬI DUYỆT</span><h2>Chuẩn bị trang chia sẻ</h2><p className="website-builder-intro">Thêm thông tin để đồng nghiệp tìm đúng website. Admin sẽ xem trước mã và duyệt trước khi website được xuất bản.</p><div className="form-two-col"><label className="form-label">Tên website<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label><div className="website-published-route"><small>Đường dẫn sau khi được duyệt</small><b>eduhub.vn/web/{title.trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ten-website'}-xxxxxxxxxx</b><small>Mã ngẫu nhiên sẽ được thêm để đường dẫn không bị trùng.</small></div></div><label className="form-label">Mô tả ngắn<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={800} rows={3} required placeholder="Website giúp giáo viên và học sinh làm được gì?" /></label><CurriculumPicker grades={grades} subjects={subjects} onGradesChange={setGrades} onSubjectsChange={setSubjects} /><details className="website-final-preview"><summary><MonitorPlay size={15} /> Xem lại website trước khi gửi</summary><iframe className="website-preview-frame" title="Bản xem trước website trước khi gửi duyệt" sandbox="allow-scripts allow-popups" referrerPolicy="no-referrer" srcDoc={sandboxWebsiteHtml(html)} /></details>{error && <div className="submit-error">{error}</div>}<div className="website-prompt-actions"><button className="button button-quiet" type="button" onClick={() => setStep('code')}><ArrowLeft size={14} /> Chỉnh sửa mã</button><button className="button button-primary" type="submit" disabled={saving}><Send size={14} /> {saving ? 'Đang gửi…' : 'Gửi admin duyệt'}</button></div><p className="website-builder-footnote">Sau khi duyệt, website sẽ có đường dẫn riêng trên tên miền EduHub và có thể chia sẻ cho mọi người.</p></form>}
    </section>
  </div>;
}
