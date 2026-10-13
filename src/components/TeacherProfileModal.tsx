import React, { useState } from 'react';
import {
  X,
  Award,
  BookOpen,
  Bookmark,
  Edit3,
  Check,
  Layers,
  ThumbsUp,
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';
import { TeacherProfile, ResourceItem } from '../types';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile | null;
  onUpdateTeacher?: (updated: TeacherProfile) => void;
  allResources: ResourceItem[];
  bookmarkedIds: string[];
  onSelectResource: (resource: ResourceItem) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onUpdateTeacher,
  allResources,
  bookmarkedIds,
  onSelectResource,
}) => {
  const [activeTab, setActiveTab] = useState<'contributions' | 'bookmarks' | 'badges'>('contributions');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(teacher?.name || '');
  const [editSchool, setEditSchool] = useState(teacher?.schoolName || '');
  const [editProvince, setEditProvince] = useState(teacher?.province || '');
  const [editSpecialty, setEditSpecialty] = useState(teacher?.subjectSpecialty || '');

  if (!isOpen || !teacher) return null;

  const myResources = allResources.filter((r) => r.author.id === teacher.id || r.author.name === teacher.name);
  const bookmarkedResources = allResources.filter((r) => bookmarkedIds.includes(r.id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updated: TeacherProfile = {
      ...teacher,
      name: editName.trim(),
      schoolName: editSchool.trim(),
      province: editProvince.trim(),
      subjectSpecialty: editSpecialty.trim(),
    };

    if (onUpdateTeacher) {
      onUpdateTeacher(updated);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header Cover & Avatar */}
        <div className="bg-slate-100 p-6 sm:p-8 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={teacher.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
              alt={teacher.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900">
                  {teacher.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                  {teacher.subjectSpecialty}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {teacher.schoolName} ({teacher.province})
              </p>
              <p className="text-xs font-bold text-teal-800">
                ★ {teacher.eduPoints} Điểm Cống Hiến (EduPoints) · Cấp độ {Math.floor(teacher.eduPoints / 500) + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Chỉnh sửa hồ sơ"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit Form (nếu bật) */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-5 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ tên Thầy/Cô</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Trường công tác</label>
                <input
                  type="text"
                  required
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tỉnh / Thành phố</label>
                <input
                  type="text"
                  required
                  value={editProvince}
                  onChange={(e) => setEditProvince(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bộ môn chuyên trách</label>
                <input
                  type="text"
                  required
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg"
              >
                Lưu hồ sơ
              </button>
            </div>
          </form>
        )}

        {/* Portfolio Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-bold text-slate-500">
          {[
            { id: 'contributions', label: `Học liệu đã đăng (${myResources.length})` },
            { id: 'bookmarks', label: `Tủ sách đã lưu (${bookmarkedResources.length})` },
            { id: 'badges', label: `Huy hiệu sư phạm (${teacher.badges.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 transition-colors cursor-pointer border-b-2 -mb-px ${
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
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          
          {/* My Contributions */}
          {activeTab === 'contributions' && (
            myResources.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Thầy/Cô chưa đăng học liệu nào. Hãy chia sẻ bài giảng đầu tiên để nhận ngay +50 EduPoints!
              </p>
            ) : (
              myResources.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    onClose();
                    onSelectResource(res);
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-900">
                      {res.resourceType.toUpperCase()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {res.subjects[0]} · {res.gradeLevels[0]}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0 text-slate-600">
                    <span className="flex items-center gap-1 font-bold">
                      <ThumbsUp className="w-3.5 h-3.5 text-teal-700" />
                      {res.upvotesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      {res.downloadsCount}
                    </span>
                  </div>
                </div>
              ))
            )
          )}

          {/* Bookmarks */}
          {activeTab === 'bookmarks' && (
            bookmarkedResources.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Thầy/Cô chưa lưu học liệu nào vào tủ sách. Khi xem bất kỳ bài giảng nào, bấm biểu tượng Bookmark để lưu lại dùng khi soạn bài!
              </p>
            ) : (
              bookmarkedResources.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    onClose();
                    onSelectResource(res);
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                      {res.resourceType.toUpperCase()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      Tác giả: {res.author.name} ({res.author.schoolName})
                    </p>
                  </div>

                  <span className="text-xs font-bold text-teal-800">
                    Mở học liệu →
                  </span>
                </div>
              ))
            )
          )}

          {/* Badges */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teacher.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center gap-3 text-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950">{badge}</h4>
                    <p className="text-[11px] text-amber-800">
                      Chứng nhận cống hiến tích cực cho cộng đồng GDPT 2018
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
