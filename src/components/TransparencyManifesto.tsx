import React, { useState } from 'react';
import { ShieldCheck, Code2, AlertTriangle, Send, Check, HeartHandshake, Eye, Lock, FileCode, CheckCircle2 } from 'lucide-react';

export const TransparencyManifesto: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'crypto' | 'server' | 'agent'>('crypto');
  const [bugTitle, setBugTitle] = useState('');
  const [bugType, setBugType] = useState('bug');
  const [bugDescription, setBugDescription] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDescription.trim()) return;

    setIsSendingReport(true);
    try {
      const response = await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bugTitle.trim(),
          type: bugType,
          description: bugDescription.trim(),
          userContact: reporterContact.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReportSuccess(true);
        setBugTitle('');
        setBugDescription('');
        setReporterContact('');
        setTimeout(() => setReportSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingReport(false);
    }
  };

  const codeSnippets = {
    crypto: `// THUẬT TOÁN MÃ HÓA PHÍA CLIENT (ZERO-KNOWLEDGE ENCRYPTION)
// Toàn bộ dữ liệu bài giảng được mã hóa AES-GCM 256-bit trong trình duyệt.
// Máy chủ và bên thứ ba hoàn toàn không thể đọc được nội dung gốc.

export async function encryptLesson(plainText: string, passphrase: string) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Dẫn xuất khóa mã hóa từ mật khẩu cá nhân của giáo viên (PBKDF2 SHA-256)
  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  return {
    encryptedPayload: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}`,
    server: `// CAM KẾT KHÔNG THU THẬP DỮ LIỆU CÁ NHÂN VÀ KHÔNG QUẢNG CÁO
// Hệ thống không sử dụng cookies theo dõi, không quảng cáo thương mại.
// Không lưu trữ email, số điện thoại của học sinh hay giáo viên trái phép.

app.post('/api/apps', (req, res) => {
  // Bắt buộc xác minh tiêu chí 100% miễn phí và không quảng cáo
  const { title, platformUrl, author } = req.body;
  if (!isFreeVerified(req.body)) {
    return res.status(403).json({ error: 'Nghiêm cấm ứng dụng thương mại hóa hoặc thu phí ngầm' });
  }
  // Lưu trữ minh bạch và công khai cho toàn thể thầy cô giáo
  saveToOpenCatalog(req.body);
  res.json({ success: true });
});`,
    agent: `// AI AGENT TÌM KIẾM VÀ THẨM ĐỊNH GDPT 2018 ĐỘC LẬP
// Tự động phân tích cấu trúc 4 hoạt động Công văn 5512 và rà soát an toàn.
// Tự động gửi thư xin phép tác giả với văn phong sư phạm trân trọng.

const systemInstruction = \`
1. 100% Phi lợi nhuận, KHÔNG thu phí, KHÔNG quảng cáo rác, KHÔNG lừa đảo.
2. Tuyệt đối bám sát Công văn 5512/BGDĐT, Thông tư 27/2020, Thông tư 22/2021.
3. Đề cao tính nhân văn, an toàn dữ liệu và tôn trọng bản quyền tác giả.
\`;

const scanResult = await ai.models.generateContent({
  model: 'gemini-3.1-pro-preview',
  config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } },
  contents: prompt
});`
  };

  return (
    <div className="space-y-8">
      {/* Manifesto Banner */}
      <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 md:p-8 shadow-xs space-y-6">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Tuyên ngôn đạo đức và minh bạch tuyệt đối</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Cam kết phi lợi nhuận và bảo vệ giáo viên toàn diện
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Dự án EduAI Hub được khởi xướng với mục tiêu duy nhất: Tương trợ cộng đồng giáo viên Việt Nam thích ứng với chuyển đổi số và chương trình GDPT 2018. Dự án không thuộc sở hữu của bất kỳ tập đoàn thương mại nào và mãi mãi hoạt động phi lợi nhuận.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-2 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Miễn phí 100% và không quảng cáo</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Tuyệt đối không thu phí người dùng, không gắn banner quảng cáo phiền toái, không tiếp thị liên kết bán ứng dụng và không yêu cầu đăng ký gói trả phí.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>2. Bảo mật mã hóa tuyệt đối</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Mọi dữ liệu bài giảng được mã hóa đầu cuối AES-256 ngay trong trình duyệt. Không thu thập thông tin cá nhân và không bao giờ chia sẻ cho bên thứ ba.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>3. Mã nguồn mở để cộng đồng giám sát</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Toàn bộ kiến trúc và logic của ứng dụng được mở để cộng đồng giáo viên và các chuyên gia an toàn thông tin cùng kiểm tra, phòng chống gian lận.
            </p>
          </div>
        </div>
      </div>

      {/* Code Inspector (Trình Xem Mã Nguồn Mở Trực Tiếp) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Thanh tra mã nguồn mở độc lập</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Trình kiểm tra logic hệ thống và bảo mật
            </h3>
          </div>

          {/* Code Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setActiveCodeTab('crypto')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'crypto'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mã hóa AES-256
            </button>
            <button
              onClick={() => setActiveCodeTab('agent')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'agent'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI Agent GDPT 2018
            </button>
            <button
              onClick={() => setActiveCodeTab('server')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'server'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Máy chủ không lưu dữ liệu
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto leading-relaxed max-h-96">
            {codeSnippets[activeCodeTab]}
          </pre>
        </div>
      </div>

      {/* Fast Bug Report & Anti-Scam Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Phản hồi và cơ chế báo cáo vi phạm nhanh 24/7</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            Báo cáo lỗi kỹ thuật hoặc phát hiện ứng dụng lừa đảo, thương mại hóa
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Mọi ý kiến đóng góp của thầy cô sẽ được rà soát và xử lý trong vòng 24 giờ để đảm bảo không gian sư phạm luôn trong sạch.
          </p>
        </div>

        {reportSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Cảm ơn thầy cô đã báo cáo! Ban điều phối sẽ kiểm tra và phản hồi qua email ngay lập tức.</span>
          </div>
        )}

        <form onSubmit={handleSubmitBug} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phân loại phản hồi
              </label>
              <select
                value={bugType}
                onChange={(e) => setBugType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="bug">Lỗi kỹ thuật hoặc lỗi giao diện hiển thị</option>
                <option value="scam">Cảnh báo: Phát hiện ứng dụng có dấu hiệu lừa đảo hoặc thu phí</option>
                <option value="ads">Cảnh báo: Ứng dụng chèn quảng cáo gây phiền nhiễu</option>
                <option value="feature">Đề xuất tính năng mới cho cộng đồng giáo viên</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tiêu đề vấn đề *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Không giải mã được file khi quên mật mã / Link app X bị chết"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mô tả chi tiết sự việc hoặc liên kết cần rà soát *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Xin thầy cô miêu tả rõ ràng các bước dẫn đến lỗi hoặc liên kết ứng dụng có nghi vấn..."
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email hoặc số điện thoại của thầy cô (để nhận kết quả xử lý)
              </label>
              <input
                type="text"
                placeholder="thayco.edu@gmail.com"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                type="submit"
                disabled={isSendingReport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingReport ? 'Đang gửi phản hồi...' : 'Gửi báo cáo xử lý ngay'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
