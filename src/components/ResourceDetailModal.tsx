import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  ThumbsUp,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ResourceItem } from '../types';

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
  onUpvote: (id: string) => void;
  isUpvoted?: boolean;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  isOpen,
  onClose,
  resource,
  onUpvote,
  isUpvoted = false,
  onBookmark,
  isBookmarked = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'reviews'>('overview');
  const [copiedKHBD, setCopiedKHBD] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // Reviews
  const [reviewsList, setReviewsList] = useState<Array<{
    name: string;
    school: string;
    rating: number;
    comment: string;
    date: string;
  }>>([
    {
      name: 'Cô Hoàng Thị Lan',
      school: 'THCS Cầu Giấy, Hà Nội',
      rating: 5,
      comment: 'Tôi đã áp dụng bài này vào tiết dạy chuyên đề cấp quận. Hoạt động Khởi động rất lôi cuốn, học sinh thảo luận sôi nổi.',
      date: '3 ngày trước',
    },
    {
      name: 'Thầy Trần Đình Trọng',
      school: 'THPT Ngô Quyền, Hải Phòng',
      rating: 5,
      comment: 'Slide thiết kế khoa học, font chữ chuẩn không bị vỡ. Rất cảm ơn thầy cô đã chia sẻ miễn phí cho cộng đồng.',
      date: '1 tuần trước',
    }
  ]);
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newReviewerSchool, setNewReviewerSchool] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!isOpen || !resource) return null;

  const slidesPreview = [
    { title: 'Slide 1: Khởi động (Warm-up)', desc: 'Tình huống thực tế kích thích tư duy, video AI 45s và câu hỏi gợi mở.' },
    { title: 'Slide 2: Hình thành kiến thức', desc: 'Nội dung cốt lõi, phiếu học tập số hóa và thảo luận nhóm.' },
    { title: 'Slide 3: Luyện tập tương tác', desc: 'Hệ thống câu hỏi củng cố bấm trả lời trực tiếp trên màn hình.' },
    { title: 'Slide 4: Vận dụng sáng tạo', desc: 'Nhiệm vụ thực hành liên hệ đời sống, tích hợp giáo dục STEM.' },
  ];

  const handleCopyKHBD = () => {
    navigator.clipboard.writeText(resource.description);
    setCopiedKHBD(true);
    setTimeout(() => setCopiedKHBD(false), 2500);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?resource=' + resource.id);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    const newRev = {
      name: newReviewerName.trim() || 'Thầy/Cô Đồng Nghiệp',
      school: newReviewerSchool.trim() || 'Giáo viên GDPT 2018',
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      date: 'Vừa xong',
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewReviewComment('');
    setIsSubmittingReview(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden my-6"
      >
        
        {/* Header bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded-lg font-bold bg-teal-50 text-teal-900 border border-teal-200">
                {resource.resourceType.toUpperCase()}
              </span>
              {resource.fileFormat && (
                <span className="px-2 py-0.5 rounded-lg font-mono font-bold bg-slate-100 text-slate-700">
                  .{resource.fileFormat}
                </span>
              )}
              <span className="text-slate-500 font-medium">
                {resource.fileSize}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-teal-800 font-semibold">
                Chuẩn GDPT 2018: {resource.gdpt2018FitScore}/5.0
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {resource.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
              {resource.tagline}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyShareLink}
              title="Sao chép liên kết chia sẻ"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-5 h-5 text-teal-700" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar: Author info + Pure Educational CTAs (No Money) */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Author Badge */}
          <div className="flex items-center gap-2.5">
            <img
              src={
                resource.author.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={resource.author.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="font-bold text-slate-900">{resource.author.name}</p>
              <p className="text-[11px] text-slate-500">
                {resource.author.schoolName} ({resource.author.province}) · <span className="text-teal-800 font-bold">{resource.author.eduPoints} EduPoints</span>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Bookmark button */}
            {onBookmark && (
              <button
                onClick={() => onBookmark(resource.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-600' : ''}`} />
                <span>{isBookmarked ? 'Đã lưu tủ sách' : 'Lưu tủ sách'}</span>
              </button>
            )}

            {/* Upvote button */}
            <button
              onClick={() => onUpvote(resource.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                isUpvoted
                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-current' : ''}`} />
              <span>{resource.upvotesCount} Bình chọn</span>
            </button>

            {/* Direct Download Button */}
            {resource.downloadUrl && (
              <a
                href={resource.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Tải học liệu ({resource.downloadsCount})</span>
              </a>
            )}
          </div>
        </div>

        {/* Modal Subtabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-bold text-slate-500">
          {[
            { id: 'overview', label: 'Nội dung bài dạy & 5512' },
            { id: 'preview', label: 'Xem trước bài giảng' },
            { id: 'reviews', label: `Nhận xét thực chiến (${reviewsList.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-teal-800 border-teal-800'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Kế hoạch bài dạy (KHBD chuẩn Công văn 5512)
                </h4>
                <button
                  onClick={handleCopyKHBD}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedKHBD ? <Check className="w-3.5 h-3.5 text-teal-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKHBD ? 'Đã sao chép KHBD' : 'Sao chép KHBD 5512'}</span>
                </button>
              </div>

              {/* Text KHBD box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs whitespace-pre-line text-slate-800 leading-relaxed max-h-72 overflow-y-auto">
                {resource.description}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Khối lớp:</span>
                  <span className="font-bold text-slate-900">
                    {resource.gradeLevels.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Môn học:</span>
                  <span className="font-bold text-slate-900">
                    {resource.subjects.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Bộ sách:</span>
                  <span className="font-bold text-slate-900">
                    {resource.curriculumBooks.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Bản quyền & Độ an toàn:</span>
                  <span className="font-bold text-teal-800">
                    100% Miễn phí & Đã duyệt
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SLIDE PREVIEWER */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Xem trước tiến trình bài giảng ({previewSlideIdx + 1}/{slidesPreview.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={previewSlideIdx === 0}
                    onClick={() => setPreviewSlideIdx((prev) => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={previewSlideIdx === slidesPreview.length - 1}
                    onClick={() => setPreviewSlideIdx((prev) => Math.min(slidesPreview.length - 1, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slide Mock Screen */}
              <div className="w-full aspect-16/9 bg-slate-900 rounded-2xl border-2 border-slate-800 p-6 sm:p-10 flex flex-col justify-between text-white relative shadow-inner select-none">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 text-xs text-slate-400">
                  <span>{resource.subjects[0]} · {resource.gradeLevels[0]}</span>
                  <span>Chương trình GDPT 2018</span>
                </div>

                <div className="space-y-2 text-center my-auto">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-700 text-teal-100 inline-block">
                    {slidesPreview[previewSlideIdx].title}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white max-w-xl mx-auto">
                    {resource.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                    {slidesPreview[previewSlideIdx].desc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-3 text-[11px] text-slate-400">
                  <span>Tác giả: {resource.author.name}</span>
                  <span>Slide {previewSlideIdx + 1} / {slidesPreview.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>{resource.ratingAverage.toFixed(1)} / 5.0</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dựa trên {reviewsList.length} lượt đánh giá thực nghiệm từ đồng nghiệp
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmittingReview(!isSubmittingReview)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {isSubmittingReview ? 'Đóng form' : 'Viết nhận xét thực chiến'}
                </button>
              </div>

              {/* Review Input Form */}
              {isSubmittingReview && (
                <form onSubmit={handleAddReview} className="p-4 bg-white rounded-2xl border border-slate-300 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Họ tên Thầy/Cô (VD: Thầy Hoàng Nam)"
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <input
                      type="text"
                      placeholder="Trường công tác (VD: THCS Chu Văn An, Hà Nội)"
                      value={newReviewerSchool}
                      onChange={(e) => setNewReviewerSchool(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Chấm điểm bài học:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= newReviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Chia sẻ cảm nhận sau khi thầy cô dạy thử trên lớp (Học sinh hào hứng không? Câu hỏi nào cần chỉnh sửa?)"
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSubmittingReview(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg"
                    >
                      Gửi nhận xét
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews Stream */}
              <div className="space-y-3">
                {reviewsList.map((rev, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{rev.name}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="text-slate-500">{rev.school}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-bold">{rev.rating}★</span>
                        <span className="text-slate-400 text-[10px]">({rev.date})</span>
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
