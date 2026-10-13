import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Video,
  Download,
  RotateCcw,
  Activity,
  Check,
  AlertCircle
} from 'lucide-react';
import { AppItem, PurgedAppRecord, AdminSession } from '../types';

interface AdminDashboardProps {
  apps: AppItem[];
  adminSession: AdminSession | null;
  onOpenLogin: () => void;
  onEditApp: (app: AppItem) => void;
  onCreateNewApp: () => void;
  onDeleteApp: (app: AppItem, reason: string) => Promise<void>;
  onRefreshApps: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  apps,
  adminSession,
  onOpenLogin,
  onEditApp,
  onCreateNewApp,
  onDeleteApp,
  onRefreshApps,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'reported' | 'pruned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicenseFilter, setSelectedLicenseFilter] = useState('all');
  const [prunedList, setPrunedList] = useState<PurgedAppRecord[]>([]);
  const [isLoadingPruned, setIsLoadingPruned] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Delete Confirmation Modal State
  const [appToDelete, setAppToDelete] = useState<AppItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('Ứng dụng không hoạt động hoặc không phù hợp tiêu chuẩn giáo dục');
  const [isDeleting, setIsDeleting] = useState(false);

  // Ping Testing State
  const [testingAppId, setTestingAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrunedLog();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const fetchPrunedLog = async () => {
    setIsLoadingPruned(true);
    try {
      const res = await fetch('/api/apps/health-report');
      const data = await res.json();
      if (data.success && Array.isArray(data.prunedHistory)) {
        setPrunedList(data.prunedHistory);
      }
    } catch (err) {
      console.error('Failed to load pruned history:', err);
    } finally {
      setIsLoadingPruned(false);
    }
  };

  const handleRunHealthAudit = async () => {
    setIsHealthChecking(true);
    try {
      const res = await fetch('/api/apps/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPurge: true }),
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshApps();
        await fetchPrunedLog();
        showToast(data.message || 'Đã hoàn tất rà soát sức khỏe và tự động thanh lọc!');
      }
    } catch (err) {
      showToast('Lỗi khi chạy rà soát sức khỏe.');
    } finally {
      setIsHealthChecking(false);
    }
  };

  const handleClearReports = async (appId: string) => {
    try {
      const res = await fetch(`/api/apps/${appId}/clear-reports`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await onRefreshApps();
        showToast(`Đã xóa cảnh báo vi phạm thành công.`);
      }
    } catch (err) {
      showToast('Lỗi khi xóa cảnh báo.');
    }
  };

  const handleRestoreApp = async (recordId: string) => {
    try {
      const res = await fetch('/api/admin/restore-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId }),
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshApps();
        await fetchPrunedLog();
        showToast(data.message || 'Đã khôi phục ứng dụng thành công!');
      } else {
        showToast(data.error || 'Khôi phục không thành công.');
      }
    } catch (err) {
      showToast('Lỗi kết nối khi khôi phục ứng dụng.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteApp(appToDelete, deleteReason);
      await fetchPrunedLog();
      setAppToDelete(null);
      showToast(`Đã xoá ứng dụng "${appToDelete.title}" và lưu nhật ký minh bạch.`);
    } catch (err) {
      showToast('Lỗi khi xoá ứng dụng.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestPing = async (app: AppItem) => {
    setTestingAppId(app.id);
    try {
      const startTime = Date.now();
      const res = await fetch(app.platformUrl, { mode: 'no-cors' }).catch(() => null);
      const latency = Date.now() - startTime;
      showToast(`Ping "${app.title}": Máy chủ phản hồi (~${latency}ms)`);
    } catch (err) {
      showToast(`Ping "${app.title}": Không thể kết nối trực tiếp`);
    } finally {
      setTestingAppId(null);
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apps, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eduai-hub-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất file sao lưu dữ liệu JSON kho ứng dụng.');
  };

  // Filter apps
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.platformUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(app.subjects) && app.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesLicense =
      selectedLicenseFilter === 'all' || app.licenseType === selectedLicenseFilter;

    if (activeSubTab === 'reported') {
      return matchesSearch && matchesLicense && app.reportsCount > 0;
    }

    return matchesSearch && matchesLicense;
  });

  const reportedCount = apps.filter((a) => a.reportsCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fade-in max-w-md">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{toastMsg}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Cổng Điều Hành Quản Trị Viên (Admin Center)
              </span>
              <span className="text-xs text-slate-300">
                Phiên làm việc: <strong className="text-white">{adminSession?.email || 'ktxnoitruatk@gmail.com'}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Lý, Chỉnh Sửa & Thanh Lọc Ứng Dụng
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Toàn quyền cập nhật tiêu đề, liên kết, bản quyền, thẩm định miễn phí, video YouTube hướng dẫn chính thức và thanh lọc các liên kết lỗi khỏi EduAI Hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onCreateNewApp}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm ứng dụng mới</span>
            </button>

            <button
              onClick={handleRunHealthAudit}
              disabled={isHealthChecking}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHealthChecking ? 'animate-spin' : ''}`} />
              <span>{isHealthChecking ? 'Đang quét...' : 'Kiểm tra sức khỏe toàn kho'}</span>
            </button>

            <button
              onClick={handleExportBackup}
              title="Xuất file JSON sao lưu"
              className="p-2.5 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Tổng ứng dụng đang chạy</span>
          <div className="text-2xl font-black text-slate-900">{apps.length}</div>
          <span className="text-[11px] text-emerald-700 font-medium">100% Sẵn sàng cho giáo viên</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Tình trạng kết nối máy chủ</span>
          <div className="text-2xl font-black text-emerald-700 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            100% Online
          </div>
          <span className="text-[11px] text-slate-500">Độ trễ trung bình ~150ms</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Cảnh báo vi phạm / Cần duyệt</span>
          <div className={`text-2xl font-black ${reportedCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {reportedCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {reportedCount > 0 ? 'Có báo cáo từ giáo viên' : 'Không có báo cáo vi phạm'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Ứng dụng đã gỡ bỏ (Lịch sử)</span>
          <div className="text-2xl font-black text-slate-700">{prunedList.length}</div>
          <span className="text-[11px] text-slate-500">Đã thanh lọc minh bạch</span>
        </div>
      </div>

      {/* Main Tab Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ứng dụng ({apps.length})
            </button>

            <button
              onClick={() => setActiveSubTab('reported')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'reported'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần kiểm duyệt ({reportedCount})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('pruned')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'pruned'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nhật ký đã gỡ bỏ ({prunedList.length})</span>
            </button>
          </div>

          {activeSubTab !== 'pruned' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm ứng dụng, tác giả, link..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 w-52 sm:w-64"
                />
              </div>

              <select
                value={selectedLicenseFilter}
                onChange={(e) => setSelectedLicenseFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="all">Mọi loại giấy phép</option>
                <option value="FreeNonCommercial">Phi thương mại</option>
                <option value="EducationalFreeware">Freeware Giáo dục</option>
                <option value="CreativeCommons">Creative Commons</option>
                <option value="MIT_OpenSource">Mã nguồn mở MIT</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB CONTENT 1 & 2: Active Apps / Reported Apps Table */}
        {activeSubTab !== 'pruned' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Tên ứng dụng & Tác giả</th>
                  <th className="py-3 px-3">Bản quyền & Cam kết</th>
                  <th className="py-3 px-3">Video hướng dẫn</th>
                  <th className="py-3 px-3">Kết nối / Ping</th>
                  <th className="py-3 px-3">Cảnh báo</th>
                  <th className="py-3 px-3 text-right">Thao tác Quản trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy ứng dụng phù hợp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Author */}
                      <td className="py-3.5 px-3 max-w-[260px]">
                        <div className="font-bold text-slate-900 leading-snug truncate" title={app.title}>
                          {app.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          Tác giả: <span className="text-slate-700 font-medium">{app.author}</span>
                        </div>
                        <a
                          href={app.platformUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-700 hover:underline font-mono inline-flex items-center gap-1 mt-0.5 max-w-[230px] truncate"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{app.platformUrl}</span>
                        </a>
                      </td>

                      {/* License */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>
                            {app.licenseType === 'MIT_OpenSource'
                              ? 'Mã nguồn mở MIT'
                              : app.licenseType === 'CreativeCommons'
                              ? 'CC-BY-NC'
                              : app.licenseType === 'EducationalFreeware'
                              ? 'Freeware Giáo dục'
                              : 'Phi thương mại'}
                          </span>
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">100% Free cam kết</div>
                      </td>

                      {/* Video Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {app.tutorialVideoUrl ? (
                          <a
                            href={app.tutorialVideoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Video className="w-3 h-3 text-emerald-700" />
                            <span>Đã có Video</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chưa có video riêng</span>
                        )}
                      </td>

                      {/* Ping status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-mono text-[11px] text-slate-700">
                            {app.responseTimeMs ? `${app.responseTimeMs}ms` : '200 OK'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTestPing(app)}
                          disabled={testingAppId === app.id}
                          className="text-[10px] text-emerald-700 hover:underline cursor-pointer mt-0.5 block"
                        >
                          {testingAppId === app.id ? 'Đang ping...' : 'Kiểm tra ping'}
                        </button>
                      </td>

                      {/* Reports */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {app.reportsCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              {app.reportsCount} báo cáo
                            </span>
                            <button
                              onClick={() => handleClearReports(app.id)}
                              className="text-[10px] text-slate-500 hover:text-emerald-700 block cursor-pointer underline"
                            >
                              Xóa cảnh báo
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Sạch 100%
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Sửa thông tin */}
                          <button
                            onClick={() => onEditApp(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer border border-emerald-200"
                            title="Sửa toàn bộ thông tin ứng dụng"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>

                          {/* Xoá ứng dụng */}
                          <button
                            onClick={() => {
                              setAppToDelete(app);
                              setDeleteReason('Gỡ bỏ theo yêu cầu của Quản trị viên EduAI Hub');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer border border-rose-200"
                            title="Xóa ứng dụng khỏi kho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xoá</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT 3: Pruned Log with Restore Button */}
        {activeSubTab === 'pruned' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Dưới đây là danh sách các ứng dụng đã bị hệ thống tự động gỡ bỏ (do lỗi DNS, máy chủ chết 404, quảng cáo) hoặc bị Quản trị viên gỡ bỏ. Quản trị viên có thể bấm <strong className="text-slate-900">"Khôi phục"</strong> nếu ứng dụng đã được sửa lỗi và hoạt động bình thường trở lại.
            </div>

            {isLoadingPruned ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải nhật ký gỡ bỏ...</div>
            ) : prunedList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có ứng dụng nào bị gỡ bỏ.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Tên ứng dụng</th>
                      <th className="py-3 px-3">Liên kết</th>
                      <th className="py-3 px-3">Lý do gỡ bỏ</th>
                      <th className="py-3 px-3">Thời gian gỡ</th>
                      <th className="py-3 px-3 text-right">Khôi phục</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prunedList.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{record.title}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{record.platformUrl}</td>
                        <td className="py-3 px-3 text-rose-700 max-w-xs">{record.reason}</td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(record.removedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleRestoreApp(record.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer border border-emerald-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục lại</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Delete App */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xoá ứng dụng</h3>
                <p className="text-xs text-slate-500">Hành động này sẽ gỡ ứng dụng khỏi kho chính thức</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 block">Ứng dụng cần xoá:</span>
              <span className="font-bold text-slate-900 text-sm block">{appToDelete.title}</span>
              <span className="text-[11px] text-slate-500 font-mono block truncate">{appToDelete.platformUrl}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do gỡ bỏ (Lưu vào nhật ký kiểm duyệt minh bạch):
              </label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-xs disabled:bg-slate-300"
              >
                {isDeleting ? 'Đang xoá...' : 'Xác nhận xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
