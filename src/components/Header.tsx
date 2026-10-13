import React from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Search,
  Plus,
  Bookmark,
  LogIn,
  ShieldCheck,
  Command
} from 'lucide-react';
import { TeacherProfile } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSubmitModal: () => void;
  teacherSession: TeacherProfile | null;
  onOpenProfile: () => void;
  onLogoutTeacher: () => void;
  bookmarkedCount: number;
  onOpenBookmarks: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  onSearchChange,
  onOpenSubmitModal,
  teacherSession,
  onOpenProfile,
  onLogoutTeacher,
  bookmarkedCount,
  onOpenBookmarks,
  isAdmin = false,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 select-none transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. Brand Logo: EduHub Việt Nam */}
          <div
            onClick={() => setActiveTab('directory')}
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs shadow-teal-700/20 transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="w-5.5 h-5.5 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  EduHub
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200/70 rounded-md">
                  GDPT 2018
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Cộng đồng giáo viên chuyển đổi số Việt Nam
              </p>
            </div>
          </div>

          {/* 2. Global Search Box (Spotlight Input with Shortcut Badge) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (activeTab !== 'directory') setActiveTab('directory');
                }}
                placeholder="Tìm bài học, môn Toán, Văn, KHTN, slide, đề thi..."
                className="w-full pl-10 pr-12 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-hidden transition-all shadow-xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-400 shadow-2xs pointer-events-none">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </div>
          </div>

          {/* 3. Action CTAs & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Submit Button with Motion Tap */}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all cursor-pointer shadow-xs shadow-teal-700/20"
            >
              <Plus className="w-4 h-4 stroke-[2.75]" />
              <span className="hidden sm:inline">Đăng học liệu</span>
              <span className="sm:hidden">Đăng</span>
            </motion.button>

            {/* Bookmarks Shortcut */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onOpenBookmarks}
              title="Tủ sách cá nhân đã lưu"
              className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer relative shadow-xs"
            >
              <Bookmark className="w-4 h-4 text-amber-600 fill-amber-500/20" />
              {bookmarkedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                  {bookmarkedCount}
                </span>
              )}
            </motion.button>

            {/* Teacher Profile / Login */}
            {teacherSession ? (
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 pl-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 cursor-pointer transition-colors shadow-2xs"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {teacherSession.name}
                  </p>
                  <p className="text-[10px] text-teal-700 font-bold mt-0.5 leading-none">
                    ★ {teacherSession.eduPoints} pts
                  </p>
                </div>
                <img
                  src={
                    teacherSession.avatar ||
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={teacherSession.name}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              </motion.div>
            ) : (
              <button
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}

            {/* Admin Toggle */}
            {isAdmin && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                title="Bảng Quản Trị Hệ Thống"
                className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
