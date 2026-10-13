import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Layers,
  FileText,
  FileCode,
  Wrench,
  Gamepad2,
  FolderOpen
} from 'lucide-react';
import { ResourceItem, ResourceType, SchoolLevel, CurriculumBook } from '../types';
import { UnikornProductCard } from './UnikornProductCard';
import { SkeletonList } from './SkeletonCard';

export const removeVietnameseTones = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

interface AppDirectoryProps {
  resources: ResourceItem[];
  isLoading?: boolean;
  onUpvote: (id: string) => void;
  onSelectResource: (resource: ResourceItem) => void;
  upvotedIds?: Record<string, boolean>;
  searchQuery: string;
  selectedLevel: string;
  selectedSubject: string;
  selectedBook: string;
}

export const AppDirectory: React.FC<AppDirectoryProps> = ({
  resources,
  isLoading = false,
  onUpvote,
  onSelectResource,
  upvotedIds = {},
  searchQuery,
  selectedLevel,
  selectedSubject,
  selectedBook,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const resourceTypes: Array<{ id: string; label: string; icon: any }> = [
    { id: 'all', label: 'Tất cả học liệu', icon: Sparkles },
    { id: 'powerpoint', label: 'Slide PPTX', icon: Layers },
    { id: 'khbd_5512', label: 'KHBD 5512', icon: FileText },
    { id: 'exam_matrix', label: 'Ma Trận & Đề', icon: FileCode },
    { id: 'tool_software', label: 'Công Cụ Số', icon: Wrench },
    { id: 'game_interactive', label: 'Game Dạy Học', icon: Gamepad2 },
  ];

  // Filtering
  const filtered = resources.filter((item) => {
    // Search
    if (searchQuery.trim()) {
      const q = removeVietnameseTones(searchQuery);
      const titleMatch = removeVietnameseTones(item.title).includes(q);
      const tagMatch = item.tags.some((t) => removeVietnameseTones(t).includes(q));
      const subMatch = item.subjects.some((s) => removeVietnameseTones(s).includes(q));
      const authorMatch = removeVietnameseTones(item.author.name).includes(q);
      if (!titleMatch && !tagMatch && !subMatch && !authorMatch) return false;
    }

    // Level
    if (selectedLevel !== 'all' && !item.schoolLevels.includes(selectedLevel as SchoolLevel)) {
      return false;
    }

    // Subject
    if (selectedSubject !== 'Tất cả môn' && !item.subjects.includes(selectedSubject)) {
      return false;
    }

    // Book
    if (selectedBook !== 'all' && !item.curriculumBooks.includes(selectedBook as CurriculumBook)) {
      return false;
    }

    // Type
    if (selectedType !== 'all' && item.resourceType !== selectedType) {
      return false;
    }

    return true;
  });

  // Sort by upvotes
  const sorted = [...filtered].sort((a, b) => b.upvotesCount - a.upvotesCount);

  return (
    <div className="space-y-4">
      {/* Minimalist Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card space-y-3.5">
        
        {/* Row 1: Time Tabs (Tuần này / Hôm nay / Tháng này) với sliding indicator */}
        <div className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {[
              { id: 'week', label: 'Nổi bật tuần này' },
              { id: 'today', label: 'Hôm nay' },
              { id: 'month', label: 'Tháng này' },
              { id: 'all', label: 'Toàn thời gian' },
            ].map((t) => {
              const isActive = timeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTimeFilter(t.id as any)}
                  className={`relative px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer select-none ${
                    isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTimeTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-semibold hidden sm:inline tabular-nums">
            {sorted.length} học liệu chuẩn GDPT 2018
          </span>
        </div>

        {/* Row 2: Format Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs py-0.5">
          <span className="text-slate-500 font-bold mr-1 shrink-0 text-[11px] uppercase tracking-wider">
            Định dạng:
          </span>
          {resourceTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer border select-none ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List with Shimmer Skeleton or AnimatePresence Cards */}
      {isLoading ? (
        <SkeletonList count={5} />
      ) : sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3 shadow-card"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              Không tìm thấy học liệu phù hợp với bộ lọc
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thầy/Cô vui lòng thử chọn môn học hoặc cấp học khác ở cột điều hướng bên trái.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((item, index) => (
              <UnikornProductCard
                key={item.id}
                resource={item}
                rankIndex={index + 1}
                onUpvote={onUpvote}
                onSelect={onSelectResource}
                isUpvoted={upvotedIds[item.id]}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
