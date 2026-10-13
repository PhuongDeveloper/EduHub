import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, X, Check, AlertCircle } from 'lucide-react';
import { AdminSession } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AdminSession) => void;
  currentSession: AdminSession | null;
  onLogout: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentSession,
  onLogout,
}) => {
  const [email, setEmail] = useState('ktxnoitruatk@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.admin) {
        localStorage.setItem('eduai_admin_session', JSON.stringify(data.admin));
        onLoginSuccess(data.admin);
        onClose();
      } else {
        setErrorMsg(data.error || 'Đăng nhập không thành công.');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác Thực Quản Trị Viên (Admin)
              </h3>
              <p className="text-xs text-slate-500">
                Cổng quản lý sửa, xoá và kiểm duyệt ứng dụng EduAI Hub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentSession ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Bạn đang đăng nhập với quyền Quản trị viên cao cấp:</span>
              </div>
              <p className="font-mono text-slate-700">{currentSession.email}</p>
              <p className="text-[11px] text-slate-500">
                Thời gian phiên: {new Date(currentSession.loggedInAt).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer"
              >
                Vào khu vực quản trị
              </button>
              <button
                onClick={() => {
                  onLogout();
                  localStorage.removeItem('eduai_admin_session');
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email quản trị viên
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ktxnoitruatk@gmail.com"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu quản trị
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Mật khẩu mặc định: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-mono">admin123</code>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer shadow-xs disabled:bg-slate-300"
              >
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập Quản trị viên'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
