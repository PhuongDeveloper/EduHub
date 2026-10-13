import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  TrendingUp,
  ThumbsUp,
  ArrowRight,
  Sparkles,
  Medal
} from 'lucide-react';
import { ResourceItem, TeacherProfile } from '../types';

interface RightSidebarProps {
  teachers: TeacherProfile[];
  trendingResources: ResourceItem[];
  onSelectResource: (resource: ResourceItem) => void;
  onOpenContests: () => void;
  onSelectTeacher?: (teacher: TeacherProfile) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  teachers,
  trendingResources,
  onSelectResource,
  onOpenContests,
  onSelectTeacher,
}) => {
  const topTeachers = [...teachers].sort((a, b) => b.eduPoints - a.eduPoints).slice(0, 4);

  return (
    <aside className="w-80 shrink-0 space-y-5 text-xs select-none">
      
      {/* 1. Sáng Kiến Sư Phạm / Vinh Danh Sư Phạm GDPT 2018 */}
      <div className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-card space-y-3.5 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300/80">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Sáng kiến tháng 10
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            EduHub Vinh Danh
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">
            Sáng tạo Bài giảng Số & Tiết học STEM
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dành cho giáo viên chia sẻ Slide PowerPoint tương tác và mô hình thực hành không tốn kinh phí.
          </p>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Danh hiệu</span>
            <span className="text-xs font-bold text-teal-800">Giấy khen Nhà giáo Sáng tạo</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Thời hạn</span>
            <span className="text-xs font-bold text-slate-700">Còn 06 ngày</span>
          </div>
        </div>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenContests}
          className="w-full py-2.5 px-3 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shadow-teal-700/20"
        >
          <span>Xem thể lệ & Nộp bài giảng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* 2. Thầy Cô Tiêu Biểu Trong Tuần (Leaderboard Widget) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Thầy Cô tiêu biểu tuần
            </h4>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Cống hiến</span>
        </div>

        <div className="space-y-2">
          {topTeachers.map((tc, idx) => (
            <motion.div
              key={tc.id}
              whileHover={{ x: 2 }}
              onClick={() => onSelectTeacher && onSelectTeacher(tc)}
              className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : idx === 1
                      ? 'bg-slate-200 text-slate-800'
                      : idx === 2
                      ? 'bg-orange-100 text-orange-900'
                      : 'text-slate-400 font-mono'
                  }`}
                >
                  {idx + 1}
                </span>

                <img
                  src={tc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={tc.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />

                <div className="truncate">
                  <p className="font-bold text-slate-900 truncate leading-none text-xs">
                    {tc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-1 leading-none">
                    {tc.schoolName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-teal-800 tabular-nums">
                  +{tc.eduPoints}
                </span>
                <span className="text-[9px] block text-slate-400 font-medium">pts</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Bài giảng nổi bật 24h */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <TrendingUp className="w-4 h-4 text-teal-700" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Bài giảng nổi bật 24h
          </h4>
        </div>

        <div className="space-y-2.5">
          {trendingResources.slice(0, 4).map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 2 }}
              onClick={() => onSelectResource(item)}
              className="p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-bold text-slate-900 line-clamp-1 leading-snug text-xs group-hover:text-teal-700">
                  {item.title}
                </h5>
                <span className="flex items-center gap-1 text-[11px] font-bold text-teal-800 shrink-0 tabular-nums">
                  <ThumbsUp className="w-3 h-3 fill-current" />
                  {item.upvotesCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {item.subjects[0]} {item.gradeLevels[0]} · {item.author.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </aside>
  );
};
