import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, Plus, ShieldCheck, Download, Upload, Trash2, Eye, FileText, Check, AlertCircle, Sparkles } from 'lucide-react';
import { encryptLesson, decryptLesson } from '../lib/crypto';
import { EncryptedLessonItem, DecryptedLessonItem } from '../types';

const VAULT_STORAGE_KEY = 'eduai_encrypted_cloud_vault_v1';

export const EncryptedCloudVault: React.FC = () => {
  const [passphrase, setPassphrase] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [encryptedItems, setEncryptedItems] = useState<EncryptedLessonItem[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [activeDecryptedItem, setActiveDecryptedItem] = useState<DecryptedLessonItem | null>(null);

  // New item form
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Toán học');
  const [newGrade, setNewGrade] = useState<string>('Lớp 10');
  const [newLessonType, setNewLessonType] = useState<EncryptedLessonItem['lessonType']>('KHBD_5512');
  const [newContent, setNewContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load only data created by this teacher; never seed the vault with example content.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) setEncryptedItems(parsed as EncryptedLessonItem[]);
    } catch (e) {
      console.error('Error loading vault:', e);
    }
  }, []);

  const saveVault = (items: EncryptedLessonItem[]) => {
    setEncryptedItems(items);
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
  };

  const handleUnlockVault = async () => {
    if (!passphrase.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu bảo vệ két dữ liệu.');
      return;
    }
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const newCache: Record<string, string> = {};
      for (const item of encryptedItems) {
        try {
          const plain = await decryptLesson(item.encryptedPayload, item.iv, item.salt, passphrase);
          newCache[item.id] = plain;
        } catch (e) {
          throw new Error('Mật khẩu bảo vệ không chính xác. Không thể giải mã dữ liệu an toàn.');
        }
      }

      setDecryptedCache(newCache);
      setIsUnlocked(true);
      setSuccessMessage('Đã mở khóa an toàn thành công!');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Mật khẩu không đúng.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLockVault = () => {
    setIsUnlocked(false);
    setDecryptedCache({});
    setActiveDecryptedItem(null);
    setPassphrase('');
  };

  const handleSaveNewLesson = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tiêu đề và nội dung bài giảng.');
      return;
    }
    if (!passphrase.trim()) {
      setErrorMessage('Cần có mật khẩu mở khóa để tiến hành mã hóa AES-256.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const encrypted = await encryptLesson(newContent, passphrase);
      const newItem: EncryptedLessonItem = {
        id: `lesson-${Date.now()}`,
        title: newTitle.trim(),
        subject: newSubject,
        grade: newGrade,
        lessonType: newLessonType,
        encryptedPayload: encrypted.encryptedPayload,
        iv: encrypted.iv,
        salt: encrypted.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileSize: newContent.length,
      };

      const updatedList = [newItem, ...encryptedItems];
      saveVault(updatedList);
      setDecryptedCache((prev) => ({ ...prev, [newItem.id]: newContent }));

      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      setSuccessMessage('Đã mã hóa và lưu bài giảng vào kho an toàn thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Mã hóa thất bại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Thầy cô có chắc chắn muốn xóa bài giảng này khỏi kho lưu trữ?')) {
      const updated = encryptedItems.filter((i) => i.id !== id);
      saveVault(updated);
      if (activeDecryptedItem?.id === id) {
        setActiveDecryptedItem(null);
      }
    }
  };

  const handleViewItem = (item: EncryptedLessonItem) => {
    const content = decryptedCache[item.id] || '';
    setActiveDecryptedItem({
      id: item.id,
      title: item.title,
      subject: item.subject,
      grade: item.grade,
      lessonType: item.lessonType,
      content: content,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(encryptedItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EduAI_Encrypted_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          saveVault(imported);
          setSuccessMessage(`Đã khôi phục thành công ${imported.length} tài liệu mã hóa.`);
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrorMessage('Tệp sao lưu không đúng định dạng chuẩn.');
        }
      } catch (err) {
        setErrorMessage('Không thể đọc tệp sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header and Security Guarantee */}
      <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Kho lưu trữ đám mây an toàn tuyệt đối · Zero-knowledge</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Bảo mật dữ liệu bài giảng và học liệu sư phạm (AES-256)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Mọi kế hoạch bài dạy, ma trận đề thi và sáng kiến kinh nghiệm được mã hóa trực tiếp trong trình duyệt bằng mật khẩu riêng của thầy cô trước khi lưu trữ. Không một bên thứ ba hay máy chủ nào có thể giải mã.
            </p>
          </div>

          {/* Vault Key Status & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked ? (
              <button
                onClick={handleLockVault}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa két an toàn</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Mật khẩu (VD: giao-vien-2018)"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
                  className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52"
                />
                <button
                  onClick={handleUnlockVault}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 rounded-xl transition-colors cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Mở khóa</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Notification Alerts */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Vault Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 tabular-nums">
              {encryptedItems.length}
            </span>
            <span>tài liệu đã mã hóa trong kho</span>
            <span aria-hidden="true">·</span>
            <span className={isUnlocked ? 'text-emerald-700 font-semibold flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isUnlocked ? 'Trạng thái: Đã mở khóa' : 'Trạng thái: Đang khóa bảo vệ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất tệp sao lưu (.json)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập bản sao lưu</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            {isUnlocked && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tài liệu mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add New Lesson Form (when unlocked) */}
      {isUnlocked && isAdding && (
        <div className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Mã hóa và lưu trữ tài liệu mới vào két đám mây
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tiêu đề tài liệu
              </label>
              <input
                type="text"
                placeholder="VD: Kế hoạch bài dạy KHTN 7 - Bài 12 Ánh sáng"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Loại tài liệu
              </label>
              <select
                value={newLessonType}
                onChange={(e) => setNewLessonType(e.target.value as any)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="KHBD_5512">Kế hoạch bài dạy (KHBD 5512)</option>
                <option value="De_Kiem_Tra">Ma trận và bảng đặc tả đề kiểm tra</option>
                <option value="Slide_Hoc_Lieu">Dàn ý slide và học liệu số</option>
                <option value="Prompt_Mau">Bộ prompt AI sư phạm tâm đắc</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Môn học
                </label>
                <input
                  type="text"
                  placeholder="VD: Toán học"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Khối lớp
                </label>
                <input
                  type="text"
                  placeholder="VD: Lớp 7"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nội dung bài giảng hoặc ma trận đề (sẽ được mã hóa AES-256)
            </label>
            <textarea
              rows={8}
              placeholder="Dán nội dung bài soạn hoặc dữ liệu quan trọng cần lưu trữ bí mật tại đây..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveNewLesson}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Mã hóa và lưu vào két</span>
            </button>
          </div>
        </div>
      )}

      {/* List of Encrypted Items */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Danh mục tài liệu bảo mật
          </h3>
          <span className="text-xs text-slate-500">
            Thuật toán: AES-GCM 256-bit + PBKDF2
          </span>
        </div>

        {encryptedItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Kho lưu trữ hiện đang trống. Thầy cô hãy mở khóa và tạo tài liệu đầu tiên để bảo vệ bài giảng của mình.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {encryptedItems.map((item) => {
              const isDecrypted = Boolean(decryptedCache[item.id]);

              return (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {item.title}
                      </span>
                      {isDecrypted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <Unlock className="w-3 h-3 text-emerald-700" />
                          Đã giải mã
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Mã hóa bảo vệ
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>{item.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.grade}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isUnlocked && isDecrypted ? (
                      <button
                        onClick={() => handleViewItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Xem nội dung</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlockVault()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nhập mật khẩu để xem</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decrypted Content Viewer Modal */}
      {activeDecryptedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dữ liệu đã giải mã thành công</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {activeDecryptedItem.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  {activeDecryptedItem.subject} · {activeDecryptedItem.grade}
                </div>
              </div>

              <button
                onClick={() => setActiveDecryptedItem(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <pre className="text-xs sm:text-sm font-mono text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                {activeDecryptedItem.content}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeDecryptedItem.content);
                  setSuccessMessage('Đã sao chép nội dung vào khay nhớ tạm.');
                  setTimeout(() => setSuccessMessage(''), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sao chép toàn bộ</span>
              </button>

              <button
                onClick={() => setActiveDecryptedItem(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
