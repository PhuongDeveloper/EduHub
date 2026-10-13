import React, { useState } from 'react';
import {
  X,
  Upload,
  Check,
  Layers,
  FileText,
  FileCode,
  Wrench,
  Gamepad2,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ResourceItem, ResourceType, SchoolLevel, CurriculumBook, TeacherProfile } from '../types';

interface SubmitAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceSubmitted: (resource: ResourceItem) => void;
  currentTeacher: TeacherProfile | null;
}

export const SubmitAppModal: React.FC<SubmitAppModalProps> = ({
  isOpen,
  onClose,
  onResourceSubmitted,
  currentTeacher,
}) => {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('powerpoint');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [fileSize, setFileSize] = useState('15 MB');
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>(['thcs']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Toán']);
  const [selectedBooks, setSelectedBooks] = useState<CurriculumBook[]>(['KetNoi']);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(['Lớp 7']);
  const [authorName, setAuthorName] = useState(currentTeacher?.name || '');
  const [schoolName, setSchoolName] = useState(currentTeacher?.schoolName || '');
  const [province, setProvince] = useState(currentTeacher?.province || '');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher || !title.trim() || !tagline.trim()) return;

    const newResource: ResourceItem = {
      id: 'res-' + Date.now(),
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim() || tagline.trim(),
      resourceType,
      fileSize,
      downloadUrl: downloadUrl.trim(),
      platformUrl: platformUrl.trim(),
      schoolLevels: selectedLevels,
      gradeLevels: selectedGrades,
      subjects: selectedSubjects,
      curriculumBooks: selectedBooks,
      purpose: ['Học liệu số', 'Soạn KHBD 5512'],
      author: currentTeacher,
      upvotesCount: 0,
      viewsCount: 0,
      downloadsCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      gdpt2018FitScore: 0,
      isFreeVerified: false,
      hasNoAdsVerified: false,
      isCopyrightVerified: false,
      tags: [selectedSubjects[0], ...selectedGrades],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onResourceSubmitted(newResource);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Đóng góp học liệu & Sáng kiến dạy học
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chia sẻ Slide, Giáo án 5512, Đề thi hoặc Công cụ số cho đồng nghiệp toàn quốc
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Đã đăng học liệu thành công!
            </h3>
            <p className="text-xs text-slate-500">
              Học liệu của thầy/cô đã sẵn sàng để đồng nghiệp cả nước tải về và bình chọn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Loại học liệu */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                Định dạng học liệu <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'powerpoint', label: 'Slide PowerPoint' },
                  { id: 'khbd_5512', label: 'KHBD 5512' },
                  { id: 'exam_matrix', label: 'Ma Trận & Đề' },
                  { id: 'tool_software', label: 'Công Cụ Số' },
                  { id: 'game_interactive', label: 'Game Dạy Học' },
                  { id: 'utility_web', label: 'Tiện Ích Khác' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setResourceType(item.id as any)}
                    className={`py-2 px-3 rounded-xl border text-left font-semibold transition-colors cursor-pointer ${
                      resourceType === item.id
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tiêu đề & Tagline */}
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Tên học liệu / Dự án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bộ Slide tương tác & Video Khởi động 45s môn KHTN 7"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-700 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Mô tả ngắn gọn (Tagline) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Điểm nổi bật nhất (Ví dụ: Chuẩn 4 hoạt động CV 5512, dùng thử trên 2 lớp)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-700 outline-hidden"
                />
              </div>
            </div>

            {/* Môn học, Cấp học, Bộ sách */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Cấp học</label>
                <select
                  value={selectedLevels[0]}
                  onChange={(e) => setSelectedLevels([e.target.value as any])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="tieuhoc">Tiểu học</option>
                  <option value="thcs">THCS (Lớp 6-9)</option>
                  <option value="thpt">THPT (Lớp 10-12)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Môn học</label>
                <select
                  value={selectedSubjects[0]}
                  onChange={(e) => setSelectedSubjects([e.target.value])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  {['Toán', 'Ngữ văn', 'KHTN', 'Tiếng Anh', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử & Địa lí', 'Tin học', 'Công nghệ', 'GDCD'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Bộ sách</label>
                <select
                  value={selectedBooks[0]}
                  onChange={(e) => setSelectedBooks([e.target.value as any])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="KetNoi">Kết Nối Tri Thức</option>
                  <option value="CanhDieu">Cánh Diều</option>
                  <option value="ChanTroi">Chân Trời Sáng Tạo</option>
                  <option value="DungChung">Dùng Chung</option>
                </select>
              </div>
            </div>

            {/* Link Download */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Đường dẫn tải file (Google Drive / OneDrive / GitHub) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-700 outline-hidden font-mono"
              />
            </div>

            {/* Thông tin tác giả (nếu chưa đăng nhập) */}
            {!currentTeacher && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên Thầy/Cô</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trường công tác</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="THCS Chu Văn An"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Hà Nội"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Cam kết phi lợi nhuận */}
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <p>
                Bằng việc đăng tải, Thầy/Cô cam kết học liệu này hoàn toàn <strong>miễn phí</strong>, không chèn link độc hại hoặc quảng cáo lừa đảo, phục vụ đồng nghiệp vì sự nghiệp giáo dục.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Hoàn tất & Đăng ngay
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
