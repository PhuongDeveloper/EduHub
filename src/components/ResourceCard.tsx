import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Gamepad2,
  Wrench,
  Download,
  ExternalLink,
  Star,
  ThumbsUp,
  Award,
  Layers,
  CheckCircle2,
  Calendar,
  Share2
} from 'lucide-react';
import { ResourceItem, ResourceType } from '../types';

interface ResourceCardProps {
  resource: ResourceItem;
  onUpvote: (id: string) => void;
  onSelect: (resource: ResourceItem) => void;
  isUpvoted?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onUpvote,
  onSelect,
  isUpvoted = false,
}) => {
  const [upvoteAnim, setUpvoteAnim] = useState(false);

  const getFormatBadge = (type: ResourceType, format?: string) => {
    switch (type) {
      case 'powerpoint':
        return { label: 'Slide PPTX', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: Layers };
      case 'khbd_5512':
        return { label: 'KHBD 5512', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: FileText };
      case 'exam_matrix':
        return { label: 'Ma Trận & Đề', bg: 'bg-purple-100 text-purple-900 border-purple-300', icon: FileCode };
      case 'game_interactive':
        return { label: 'Game Dạy Học', bg: 'bg-rose-100 text-rose-900 border-rose-300', icon: Gamepad2 };
      case 'tool_software':
        return { label: 'Công Cụ Số', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: Wrench };
      default:
        return { label: 'Tiện Ích Web', bg: 'bg-slate-100 text-slate-900 border-slate-300', icon: ExternalLink };
    }
  };

  const badgeInfo = getFormatBadge(resource.resourceType, resource.fileFormat);
  const IconComp = badgeInfo.icon;

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvoteAnim(true);
    setTimeout(() => setUpvoteAnim(false), 300);
    onUpvote(resource.id);
  };

  return (
    <div
      onClick={() => onSelect(resource)}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-400 p-5 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Header row: Badge format + Upvote button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeInfo.bg}`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{badgeInfo.label}</span>
            </span>

            {resource.fileSize && (
              <span className="text-[11px] text-slate-500 font-medium">
                {resource.fileSize}
              </span>
            )}
          </div>

          {/* Upvote Button with Micro-Interaction (21st.dev style) */}
          <button
            onClick={handleUpvoteClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-transform cursor-pointer border ${
              isUpvoted
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
            } ${upvoteAnim ? 'scale-115' : 'scale-100'}`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-current' : ''}`} />
            <span>{resource.upvotesCount}</span>
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug line-clamp-2">
          {resource.title}
        </h3>

        {/* Tagline */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {resource.tagline || resource.description}
        </p>

        {/* Taxonomy Chips: Môn, Lớp, Bộ Sách */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {resource.subjects.map((sub) => (
            <span
              key={sub}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200"
            >
              {sub}
            </span>
          ))}

          {resource.gradeLevels.map((grade) => (
            <span
              key={grade}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
            >
              {grade}
            </span>
          ))}

          {resource.curriculumBooks.map((book) => {
            const label =
              book === 'KetNoi'
                ? 'Kết Nối Tri Thức'
                : book === 'CanhDieu'
                ? 'Cánh Diều'
                : book === 'ChanTroi'
                ? 'Chân Trời Sáng Tạo'
                : 'Dùng Chung';
            return (
              <span
                key={book}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200"
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer: Author Info & Rating */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={
              resource.author.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={resource.author.name}
            className="w-6 h-6 rounded-full object-cover shrink-0"
          />
          <div className="truncate">
            <p className="font-semibold text-slate-800 truncate leading-none">
              {resource.author.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">
              {resource.author.schoolName} ({resource.author.province})
            </p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1 shrink-0 font-bold text-slate-800">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{resource.ratingAverage.toFixed(1)}</span>
          <span className="text-[11px] font-normal text-slate-400">
            ({resource.ratingCount})
          </span>
        </div>
      </div>
    </div>
  );
};
