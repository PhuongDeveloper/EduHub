import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Award,
  ThumbsUp,
  Layers,
  ChevronRight,
  Sparkles,
  Crown,
  Medal
} from 'lucide-react';
import { ResourceItem, TeacherProfile } from '../types';

interface LeaderboardViewProps {
  resources: ResourceItem[];
  teachers: TeacherProfile[];
  onSelectResource: (resource: ResourceItem) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  resources,
  teachers,
  onSelectResource,
}) => {
  const [boardType, setBoardType] = useState<'resources' | 'teachers'>('resources');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const sortedResources = [...resources].sort((a, b) => b.upvotesCount - a.upvotesCount);
  const sortedTeachers = [...teachers].sort((a, b) => b.eduPoints - a.eduPoints);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center justify-center text-xs shadow-xs">
            <Crown className="w-4 h-4 text-amber-700" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 font-extrabold flex items-center justify-center text-xs shadow-xs">
            <Medal className="w-4 h-4 text-slate-600" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-900 border border-orange-300 font-extrabold flex items-center justify-center text-xs shadow-xs">
            <Medal className="w-4 h-4 text-orange-700" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 font-bold flex items-center justify-center text-xs border border-slate-200/80">
            {rank}
          </div>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header controls: Switch Between Resource Board & Teacher Board */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card">
        
        {/* Board Category Toggle with Sliding Animation */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full sm:w-auto">
          {[
            { id: 'resources', label: 'Học liệu & Dự án tiêu biểu', icon: Layers },
            { id: 'teachers', label: 'Thầy Cô cống hiến', icon: Award },
          ].map((tab) => {
            const isActive = boardType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setBoardType(tab.id as any)}
                className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer select-none ${
                  isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBoardTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                  />
                )}
                <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Period Filter Chips */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-bold mr-1 hidden md:inline text-[11px] uppercase tracking-wider">
            Giai đoạn:
          </span>
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: 'week', label: 'Tuần này' },
            { id: 'month', label: 'Tháng này' },
            { id: 'all', label: 'Toàn thời gian' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                period === item.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaderboard List with AnimatePresence */}
      <AnimatePresence mode="wait">
        {boardType === 'resources' ? (
          <motion.div
            key="resources-board"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-card divide-y divide-slate-100"
          >
            <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Xếp hạng bài giảng ({sortedResources.length})</span>
              <span>Tương tác đồng nghiệp</span>
            </div>

            {sortedResources.map((res, index) => {
              const rank = index + 1;
              return (
                <motion.div
                  key={res.id}
                  whileHover={{ x: 3 }}
                  onClick={() => onSelectResource(res)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {getRankBadge(rank)}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                          {res.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {res.resourceType.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {res.tagline}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                        <span className="font-semibold text-slate-700">{res.author.name}</span>
                        <span>·</span>
                        <span>{res.author.schoolName} ({res.author.province})</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Upvotes */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 text-teal-900 font-bold text-xs border border-teal-200/80">
                        <ThumbsUp className="w-3.5 h-3.5 text-teal-700 fill-current" />
                        <span className="tabular-nums">{res.upvotesCount}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium tabular-nums">
                        {res.downloadsCount} lượt tải
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="teachers-board"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-card divide-y divide-slate-100"
          >
            <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Thầy Cô cống hiến xuất sắc ({sortedTeachers.length})</span>
              <span>Điểm cống hiến</span>
            </div>

            {sortedTeachers.map((tc, index) => {
              const rank = index + 1;
              return (
                <motion.div
                  key={tc.id}
                  whileHover={{ x: 3 }}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {getRankBadge(rank)}

                    <img
                      src={tc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={tc.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {tc.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-900 border border-teal-200/80">
                          {tc.subjectSpecialty}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        {tc.schoolName}, {tc.province} · {tc.resourcesCount} học liệu chia sẻ
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {tc.badges.map((b) => (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Points */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-teal-800 tabular-nums">
                      +{tc.eduPoints}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      EduPoints
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
