import React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Trophy,
  MessageSquare,
  Award,
  FolderHeart,
  Sparkles,
  Lock,
  Radio,
  Bookmark,
  Check
} from 'lucide-react';

interface LeftSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  selectedSubject: string;
  setSelectedSubject: (sub: string) => void;
  selectedBook: string;
  setSelectedBook: (book: string) => void;
  bookmarkedCount: number;
  onOpenBookmarks: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedLevel,
  setSelectedLevel,
  selectedSubject,
  setSelectedSubject,
  selectedBook,
  setSelectedBook,
  bookmarkedCount,
  onOpenBookmarks,
}) => {
  const mainNav = [
    { id: 'directory', label: 'Khám phá học liệu', icon: Compass },
    { id: 'feed', label: 'Dòng tin hoạt động', icon: Radio, badge: 'Live' },
    { id: 'leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
    { id: 'talks', label: 'Diễn đàn bộ môn', icon: MessageSquare },
    { id: 'contests', label: 'Sáng kiến sư phạm', icon: Award, badge: 'Hot' },
    { id: 'collections', label: 'Bộ sưu tập tuyển chọn', icon: FolderHeart },
    { id: 'advisor', label: 'Cố vấn AI 5512', icon: Sparkles },
    { id: 'vault', label: 'Két bảo mật', icon: Lock },
  ];

  const levels: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Tất cả cấp học' },
    { id: 'tieuhoc', label: 'Tiểu học (Lớp 1-5)' },
    { id: 'thcs', label: 'THCS (Lớp 6-9)' },
    { id: 'thpt', label: 'THPT (Lớp 10-12)' },
  ];

  const subjects = [
    'Tất cả môn',
    'Toán',
    'Ngữ văn',
    'KHTN',
    'Tiếng Anh',
    'Tin học',
    'Lịch sử & Địa lí',
    'Vật lí',
    'Hóa học',
    'Sinh học',
    'GDCD',
    'Công nghệ',
  ];

  const books: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Tất cả bộ sách' },
    { id: 'KetNoi', label: 'Kết Nối Tri Thức' },
    { id: 'CanhDieu', label: 'Cánh Diều' },
    { id: 'ChanTroi', label: 'Chân Trời Sáng Tạo' },
  ];

  return (
    <aside className="w-64 shrink-0 space-y-5 text-xs select-none">
      
      {/* 1. Main Navigation Block */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-card space-y-1">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-100' : 'text-slate-500'}`} />
                <span className="text-[13px]">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isActive
                      ? 'bg-teal-800 text-teal-100'
                      : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bookmark quick access Card */}
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenBookmarks}
        className="w-full bg-white hover:bg-slate-50/90 rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center justify-between text-slate-800 font-bold cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2.5">
          <Bookmark className="w-4.5 h-4.5 text-amber-600 fill-amber-500/20" />
          <span className="text-xs">Tủ sách cá nhân đã lưu</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/70">
          {bookmarkedCount}
        </span>
      </motion.button>

      {/* 2. Cấp Học Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
        <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
          Cấp học
        </h4>
        <div className="space-y-0.5">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevel(lvl.id);
                  if (activeTab !== 'directory') setActiveTab('directory');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{lvl.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tổ Bộ Môn Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
        <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
          Tổ bộ môn GDPT 2018
        </h4>
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
          {subjects.map((sub) => {
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  if (activeTab !== 'directory') setActiveTab('directory');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{sub}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bộ Sách GDPT 2018 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
        <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
          Bộ sách giáo khoa
        </h4>
        <div className="space-y-0.5">
          {books.map((b) => {
            const isSelected = selectedBook === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBook(b.id);
                  if (activeTab !== 'directory') setActiveTab('directory');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{b.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-2 text-[11px] text-slate-400 space-y-0.5 leading-relaxed">
        <p className="font-semibold text-slate-500">© 2026 EduHub Việt Nam</p>
        <p>Cộng đồng phi lợi nhuận đổi mới sáng tạo GDPT 2018</p>
      </div>
    </aside>
  );
};
