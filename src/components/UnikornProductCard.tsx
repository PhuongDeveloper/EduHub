import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronUp,
  Star,
  Layers,
  FileText,
  FileCode,
  Wrench,
  Gamepad2,
  ExternalLink,
  Crown
} from 'lucide-react';
import { ResourceItem, ResourceType } from '../types';

interface UnikornProductCardProps {
  resource: ResourceItem;
  rankIndex?: number;
  onUpvote: (id: string) => void;
  onSelect: (resource: ResourceItem) => void;
  isUpvoted?: boolean;
}

export const UnikornProductCard: React.FC<UnikornProductCardProps> = ({
  resource,
  rankIndex,
  onUpvote,
  onSelect,
  isUpvoted = false,
}) => {
  // Pastel Soft Palette for Squircle Icons
  const getFormatBadge = (type: ResourceType) => {
    switch (type) {
      case 'powerpoint':
        return {
          label: 'Slide PPTX',
          wrapperBg: 'bg-amber-50 text-amber-700 border-amber-200/70',
          iconBg: 'bg-amber-500 text-white',
          icon: Layers,
        };
      case 'khbd_5512':
        return {
          label: 'KHBD 5512',
          wrapperBg: 'bg-blue-50 text-blue-700 border-blue-200/70',
          iconBg: 'bg-blue-600 text-white',
          icon: FileText,
        };
      case 'exam_matrix':
        return {
          label: 'Ma Trận & Đề',
          wrapperBg: 'bg-purple-50 text-purple-700 border-purple-200/70',
          iconBg: 'bg-purple-600 text-white',
          icon: FileCode,
        };
      case 'game_interactive':
        return {
          label: 'Game Dạy Học',
          wrapperBg: 'bg-rose-50 text-rose-700 border-rose-200/70',
          iconBg: 'bg-rose-500 text-white',
          icon: Gamepad2,
        };
      case 'tool_software':
        return {
          label: 'Công Cụ Số',
          wrapperBg: 'bg-teal-50 text-teal-800 border-teal-200/70',
          iconBg: 'bg-teal-700 text-white',
          icon: Wrench,
        };
      default:
        return {
          label: 'Tiện Ích',
          wrapperBg: 'bg-slate-100 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-700 text-white',
          icon: ExternalLink,
        };
    }
  };

  const badge = getFormatBadge(resource.resourceType);
  const IconComp = badge.icon;

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpvote(resource.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(resource)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300/90 p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-card hover:shadow-card-hover flex items-center justify-between gap-4"
    >
      {/* Left: Icon & Clean Text Hierarchy */}
      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
        
        {/* Squircle Icon 52x52 Soft Pastel */}
        <div
          className={`w-13 h-13 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-104 ${badge.wrapperBg}`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${badge.iconBg}`}>
            <IconComp className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Text Details Area */}
        <div className="space-y-1 min-w-0 flex-1">
          {/* Top Row: Title + Format Badge + Rank */}
          <div className="flex items-center gap-2 flex-wrap">
            {typeof rankIndex === 'number' && (
              <span
                className={`inline-flex items-center gap-1 font-extrabold text-[11px] px-2 py-0.5 rounded-lg tracking-tight ${
                  rankIndex === 1
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : rankIndex === 2
                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                    : rankIndex === 3
                    ? 'bg-orange-100 text-orange-900 border border-orange-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {rankIndex === 1 && <Crown className="w-3 h-3 text-amber-700" />}
                #{rankIndex}
              </span>
            )}

            <h3 className="text-[15px] sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug truncate">
              {resource.title}
            </h3>

            {resource.fileFormat && (
              <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60 uppercase">
                .{resource.fileFormat}
              </span>
            )}
          </div>

          {/* 1-Line Minimal Tagline */}
          <p className="text-[13px] text-slate-500 font-normal line-clamp-1 leading-relaxed">
            {resource.tagline || resource.description}
          </p>

          {/* Metadata Row: Teacher Info, Subject Pill, Rating */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5 flex-wrap">
            <span className="font-semibold text-slate-700">
              {resource.author.name}
            </span>
            <span>·</span>
            <span className="text-slate-500">{resource.author.schoolName}</span>
            <span>·</span>
            <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
              {resource.subjects[0]} {resource.gradeLevels[0]}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{resource.ratingAverage.toFixed(1)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Unikorn Vertical Upvote Box with Spring Animation */}
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleUpvoteClick}
        className={`flex flex-col items-center justify-center min-w-[54px] sm:min-w-[58px] h-[58px] sm:h-[62px] rounded-2xl border transition-all duration-150 cursor-pointer shrink-0 select-none ${
          isUpvoted
            ? 'bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-700/25 ring-2 ring-teal-700/20'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
        title="Bình chọn bài giảng hữu ích"
      >
        <motion.div
          animate={isUpvoted ? { y: [-2, 0] } : { y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp className={`w-5 h-5 -mb-0.5 stroke-[2.75] ${isUpvoted ? 'text-white' : 'text-slate-500 group-hover:text-teal-700'}`} />
        </motion.div>
        <span className="text-xs font-black tracking-tight leading-none tabular-nums mt-0.5">
          {resource.upvotesCount}
        </span>
      </motion.button>
    </motion.div>
  );
};
