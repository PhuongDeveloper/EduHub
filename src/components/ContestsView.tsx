import React from 'react';
import {
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Gift,
  ArrowRight,
  Plus,
  Users,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { TeacherProfile } from '../types';

interface ContestsViewProps {
  currentTeacher: TeacherProfile | null;
  onOpenLogin: () => void;
  onOpenSubmit: () => void;
}

export const ContestsView: React.FC<ContestsViewProps> = ({
  currentTeacher,
  onOpenLogin,
  onOpenSubmit,
}) => {
  const contests = [
    {
      id: 'contest-1',
      title: 'Sáng tạo Bài giảng Số & Tiết học STEM Tháng 10',
      subtitle: 'Tôn vinh các bài giảng PowerPoint tương tác, video ngắn mở đầu 45s và mô hình thực hành không tốn kinh phí.',
      reward: 'Giấy chứng nhận Nhà giáo Sáng tạo + Huy hiệu Vàng Cổng EduHub',
      participantsCount: 142,
      daysLeft: 'Còn 06 ngày',
      deadline: '23:59 ngày 31/10/2026',
      criteria: [
        'Bám sát 4 hoạt động Công văn 5512/BGDĐT',
        'Có tính thực tế cao, học sinh chủ động chiếm lĩnh tri thức',
        'Chia sẻ 100% miễn phí cho đồng nghiệp tham khảo',
      ]
    },
    {
      id: 'contest-2',
      title: 'Thiết kế Ma Trận & Đề Kiểm Tra Định Dạng Mới (Thông tư 22)',
      subtitle: 'Xây dựng ngân hàng câu hỏi trắc nghiệm Đúng/Sai 4 ý và Trả lời ngắn phân hóa năng lực học sinh.',
      reward: 'Giấy khen Đổi mới Đánh giá + Tài trợ bộ phần mềm trộn đề bản quyền',
      participantsCount: 89,
      daysLeft: 'Còn 18 ngày',
      deadline: '23:59 ngày 15/11/2026',
      criteria: [
        'Đúng cấu trúc định dạng mới của Bộ Giáo dục và Đào tạo',
        'Có bảng đặc tả chi tiết mức độ Biết, Hiểu, Vận dụng',
        'Barem điểm phân hóa rõ rệt',
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
            <Award className="w-4 h-4 text-teal-700" />
            <span>EduHub Sáng Kiến Sư Phạm — Phi Lợi Nhuận</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Vinh danh sáng kiến dạy học đổi mới GDPT 2018
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Sân chơi phi lợi nhuận nhằm phát hiện và lan tỏa những bài dạy hay nhất, hữu ích nhất đến giáo viên toàn quốc.
          </p>
        </div>

        <button
          onClick={onOpenSubmit}
          className="px-5 py-3 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-2xl transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nộp bài giảng dự thi</span>
        </button>
      </div>

      {/* Contests List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contests.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg font-bold bg-teal-50 text-teal-900 border border-teal-200">
                  {c.daysLeft}
                </span>
                <span className="text-slate-400">
                  Hạn chót: {c.deadline}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.subtitle}
                </p>
              </div>

              {/* Reward Block */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1 text-xs">
                <span className="font-bold text-amber-950 block">Hình thức vinh danh:</span>
                <p className="text-amber-900 font-semibold">{c.reward}</p>
              </div>

              {/* Criteria */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">Tiêu chí thẩm định:</span>
                <div className="space-y-1.5 text-slate-600">
                  {c.criteria.map((cr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>{cr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{c.participantsCount} thầy cô đã đăng ký</span>
              </div>

              <button
                onClick={onOpenSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-xl transition-colors cursor-pointer"
              >
                <span>Nộp học liệu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
