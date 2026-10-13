import React from 'react';
import { Search, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalResources: number;
  totalTeachers: number;
  onExploreClick: () => void;
  onOpenSubmit: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  totalResources,
  totalTeachers,
  onExploreClick,
  onOpenSubmit,
}) => {
  return (
    <section className="bg-white border-b border-slate-200 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Hệ sinh thái học liệu mở chuẩn Công văn 5512 & Thông tư 22</span>
        </div>

        {/* Crisp Headline without gradient */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Học liệu số & Sáng kiến dạy học
          <br className="hidden sm:inline" />
          <span className="text-emerald-800"> do Thầy Cô Việt Nam xây dựng</span>
        </h1>

        {/* Minimal Description */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Khám phá Slide PowerPoint tương tác, Kế hoạch bài dạy chuẩn, Ma trận đề định dạng mới và Công cụ sư phạm — 100% miễn phí vì cộng đồng giáo dục.
        </p>

        {/* Fast Action Search Box (MagicUI / 21st.dev clean style) */}
        <div className="max-w-2xl mx-auto pt-2">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm theo tên bài dạy, môn học (Toán, Văn, KHTN...), lớp hoặc từ khóa..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-hidden shadow-xs"
            />
          </div>
        </div>

        {/* Quick Micro Stats Counter */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-sm">{totalResources}+</span>
            <span>Học liệu & Dự án</span>
          </div>
          <span className="text-slate-300 font-normal">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-sm">{totalTeachers}+</span>
            <span>Giáo viên sáng tạo</span>
          </div>
          <span className="text-slate-300 font-normal">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-800 text-sm">100%</span>
            <span>Phi thương mại & Sạch quảng cáo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
