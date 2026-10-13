import React, { useState } from 'react';
import { Send, Sparkles, Brain, BookOpen, RefreshCw, Copy, Check, MessageSquare } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinkingNote?: string;
  timestamp: string;
}

export const AdvisorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Kính chào thầy cô! Tôi là **Cố vấn sư phạm AI 24/7** của EduAI Hub.

Tôi sẵn sàng đồng hành cùng thầy cô giải quyết các bài toán chuyên môn:
1. **Soạn Kế hoạch bài dạy (KHBD theo Công văn 5512)**: Xây dựng mục tiêu năng lực, thiết kế 4 hoạt động dạy học, tiêu chí đánh giá quá trình.
2. **Ma trận và bảng đặc tả đề kiểm tra**: Định dạng trắc nghiệm mới (Đúng/Sai 4 ý, Trả lời ngắn, Nhiều lựa chọn) theo chuẩn Bộ Giáo dục và Đào tạo.
3. **Đổi mới phương pháp**: Dạy học phân hóa, tích hợp STEM/STEAM liên môn, kỹ thuật vi mô trong lớp học.
4. **Ứng dụng AI thực tiễn**: Tận dụng tối đa các công cụ AI miễn phí của Việt Nam mà không tốn chi phí.

Thầy cô đang quan tâm đến nội dung bài học hay môn học nào?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Lớp 7');
  const [selectedSubject, setSelectedSubject] = useState('Khoa học tự nhiên');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sampleQuestions = [
    'Cách thiết kế Hoạt động Khởi động (5 phút) môn KHTN 7 theo CV 5512 gây tò mò?',
    'Lập ma trận và bảng đặc tả đề kiểm tra môn Toán 10 định dạng mới của Bộ GD&ĐT?',
    'Gợi ý biện pháp dạy học phân hóa cho học sinh tiếp thu chậm trong tiết học?',
    'Cách tổ chức 1 dự án STEM liên môn Vật lí - Hóa học không cần kinh phí lớn?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          grade: selectedGrade,
          subject: selectedSubject,
          context: 'Chương trình GDPT 2018 - Việt Nam',
        }),
      });

      const data = await response.json();
      if (data.success && data.answer) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.answer,
          thinkingNote: data.thinkingNote || 'Đã phân tích sâu với chế độ tư duy cao (gemini-3.1-pro-preview).',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Lỗi phản hồi từ AI.');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi thầy cô, hiện tại hệ thống AI đang quá tải lượt hỏi đáp. Thầy cô vui lòng thử lại sau giây lát hoặc chọn một câu hỏi mẫu.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col h-[750px] overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Cố vấn sư phạm 24/7
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              <Brain className="w-3 h-3 text-emerald-700" />
              <span>Chế độ tư duy sâu: Cao</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ tư vấn kế hoạch bài dạy chuẩn Công văn 5512, ma trận đề và phương pháp giảng dạy GDPT 2018
          </p>
        </div>

        {/* Grade and Subject context selectors */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {['Tiểu học', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {['Toán học', 'Ngữ văn', 'Khoa học tự nhiên', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Lịch sử & Địa lí', 'Tin học', 'Hoạt động trải nghiệm'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/40">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 px-1">
              <span>{msg.role === 'user' ? 'Thầy cô' : 'Cố vấn sư phạm'}</span>
              <span>·</span>
              <span className="tabular-nums">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
              }`}
            >
              {msg.thinkingNote && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg mb-3 font-medium">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{msg.thinkingNote}</span>
                </div>
              )}

              <div className="whitespace-pre-line space-y-2">
                {msg.content}
              </div>

              {msg.role === 'assistant' && (
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép câu trả lời</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="text-[11px] text-slate-400 mb-1 px-1">Cố vấn sư phạm đang phân tích sâu...</div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-800">
                  Đang phân tích cấu trúc Công văn 5512 và đối chiếu chuẩn năng lực...
                </div>
                <div className="text-[11px] text-slate-500">
                  Chế độ tư duy cao (gemini-3.1-pro-preview) đang tổng hợp giải pháp sư phạm tối ưu
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      <div className="px-6 py-2.5 bg-white border-t border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap text-xs">
          <span className="text-slate-400 font-medium shrink-0">Gợi ý nhanh:</span>
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shrink-0 truncate max-w-[280px]"
              title={q}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Đặt câu hỏi sư phạm (VD: Thiết kế mục tiêu năng lực bài X, ma trận đề giữa kỳ Y...)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gửi câu hỏi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
