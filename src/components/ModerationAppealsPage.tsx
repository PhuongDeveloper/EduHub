import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Check,
  FileQuestion,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  X,
  AlertTriangle,
  Send,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ResolutionNoticeCard } from './ResolutionNoticeCard';

type RejectedResource = { id: string; title: string; moderation_status: string; moderation_note?: string | null };

type Appeal = {
  id: string;
  resource_id: string;
  author_id: string;
  request: string;
  status: 'pending' | 'reviewing' | 'reinstated' | 'upheld';
  admin_note: string;
  created_at: string;
  resource?: { title?: string; moderation_status?: string; moderation_note?: string };
  author?: { full_name?: string };
};

const statusText: Record<string, string> = {
  pending: 'Chờ thẩm định viên xem xét',
  reviewing: 'Đang phúc tra & kiểm tra lại',
  reinstated: 'Đã giải quyết · Khôi phục công khai',
  upheld: 'Giữ quyết định điều chỉnh',
};

const SAMPLE_APPEALS: Appeal[] = [
  {
    id: 'sample-appeal-1',
    resource_id: 'sample-p4',
    author_id: 'user-sample',
    request: 'Em đã chỉnh lại quyền chia sẻ thư mục Google Drive sang "Bất kỳ ai có liên kết đều có thể xem" theo đúng hướng dẫn của Thẩm định viên. Nhờ ban kiểm duyệt kiểm tra và mở lại giúp em ạ.',
    status: 'pending',
    admin_note: '',
    created_at: '2026-10-18T14:20:00Z',
    resource: {
      title: 'Phiếu học tập và ma trận đề kiểm tra giữa kì 1 môn Ngữ văn 8',
      moderation_status: 'rejected',
      moderation_note: JSON.stringify({
        status: 'rejected',
        guidelineId: 'g-2-1',
        guidelineCode: 'Tiêu chuẩn 2.1',
        guidelineTitle: 'Quyền truy cập Google Drive / Tệp tải về bị khóa',
        reason: 'Tệp Google Drive liên kết đang ở chế độ giới hạn ("Chỉ người được thêm mới có thể mở"), khiến các thầy cô khác không thể tải file Word ma trận đề.',
        location: 'Liên kết tải bài giảng trong mục "Đường dẫn tải học liệu / tệp đính kèm".',
        instructions: 'Thầy cô vui lòng mở Google Drive cá nhân -> Nhấp chuột phải vào file -> Chọn Chia sẻ -> Đổi thành "Bất kỳ ai có đường liên kết" (Quyền Người xem) -> Dán lại link mới vào EduHub rồi gửi lại thẩm định.',
        reviewerName: 'Ban Thẩm định EduHub',
        reviewedAt: '2026-10-18T10:30:00Z',
      }),
    },
    author: { full_name: 'Cô Hoàng Thị Yến' },
  },
];

export function ModerationAppealsPage({
  currentUser,
  isAdmin,
  onRequireAuth,
  onNotice,
}: {
  currentUser: User | null;
  isAdmin: boolean;
  onRequireAuth: () => void;
  onNotice: (message: string) => void;
}) {
  const [resources, setResources] = useState<RejectedResource[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>(SAMPLE_APPEALS);
  const [resourceId, setResourceId] = useState('');
  const [request, setRequest] = useState('');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!currentUser || !supabase) return;
    const appealQuery = supabase
      .from('resource_moderation_appeals')
      .select(
        'id,resource_id,author_id,request,status,admin_note,created_at,resource:resources!resource_moderation_appeals_resource_id_fkey(title,moderation_status,moderation_note),author:profiles!resource_moderation_appeals_author_id_fkey(full_name)'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    const [appealResult, resourceResult] = await Promise.all([
      appealQuery,
      isAdmin
        ? Promise.resolve({ data: [], error: null })
        : supabase
            .from('resources')
            .select('id,title,moderation_status,moderation_note')
            .eq('author_id', currentUser.id)
            .eq('moderation_status', 'rejected')
            .order('created_at', { ascending: false }),
    ]);

    if (appealResult.error) {
      onNotice(`Không tải được đề nghị xem lại: ${appealResult.error.message}`);
    } else if (appealResult.data && appealResult.data.length > 0) {
      setAppeals(appealResult.data as unknown as Appeal[]);
    }

    if (resourceResult.error) {
      onNotice(`Không tải được dự án bị từ chối: ${resourceResult.error.message}`);
    } else if (resourceResult.data) {
      setResources(resourceResult.data as RejectedResource[]);
    }
  };

  useEffect(() => {
    void load();
  }, [currentUser?.id, isAdmin]);

  const createAppeal = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!resourceId || request.trim().length < 20) {
      onNotice('Giải thích ít nhất 20 ký tự để thẩm định viên có đủ thông tin xem xét.');
      return;
    }

    setBusy(true);
    if (supabase) {
      const { error } = await supabase
        .from('resource_moderation_appeals')
        .insert({ resource_id: resourceId, author_id: currentUser.id, request: request.trim() });
      if (error) {
        setBusy(false);
        onNotice(error.code === '23505' ? 'Học liệu này đã có một yêu cầu đang chờ giải quyết.' : error.message);
        return;
      }
    }

    // Local state fallback update
    const selectedRes = resources.find((r) => r.id === resourceId);
    const newAppeal: Appeal = {
      id: `appeal-${Date.now()}`,
      resource_id: resourceId,
      author_id: currentUser.id,
      request: request.trim(),
      status: 'pending',
      admin_note: '',
      created_at: new Date().toISOString(),
      resource: {
        title: selectedRes?.title || 'Học liệu đã gửi',
        moderation_status: 'rejected',
        moderation_note: selectedRes?.moderation_note || undefined,
      },
      author: { full_name: 'Thầy cô EduHub' },
    };

    setAppeals((prev) => [newAppeal, ...prev]);
    setResourceId('');
    setRequest('');
    setBusy(false);
    onNotice('Đã gửi phản hồi tới Ban Thẩm định thành công.');
  };

  const review = async (appeal: Appeal, status: 'reviewing' | 'reinstated' | 'upheld') => {
    setBusy(true);
    const replyNote = adminNotes[appeal.id]?.trim() || appeal.admin_note || '';

    if (supabase && isAdmin) {
      const { error } = await supabase
        .from('resource_moderation_appeals')
        .update({
          status,
          admin_note: replyNote,
          reviewed_by: currentUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appeal.id);

      if (!error && status === 'reinstated') {
        await supabase
          .from('resources')
          .update({
            moderation_status: 'approved',
            moderation_note: 'Đã hoàn tất chỉnh sửa và khôi phục qua Resolution Center.',
            moderated_by: currentUser?.id,
            moderated_at: new Date().toISOString(),
          })
          .eq('id', appeal.resource_id);
      }
    }

    // Update local state
    setAppeals((prev) =>
      prev.map((item) =>
        item.id === appeal.id
          ? {
              ...item,
              status,
              admin_note: replyNote || (status === 'reinstated' ? 'Đã xác minh và khôi phục thành công.' : 'Cần tiếp tục bổ sung theo hướng dẫn.'),
            }
          : item
      )
    );

    setBusy(false);
    onNotice(
      status === 'reinstated'
        ? 'Đã khôi phục và xuất bản học liệu lên EduHub!'
        : status === 'upheld'
        ? 'Đã bảo lưu quyết định yêu cầu chỉnh sửa.'
        : 'Đã chuyển trạng thái sang Đang phúc tra.'
    );
  };

  const selectedResource = resources.find((r) => r.id === resourceId);

  return (
    <section className="appeals-page apple-resolution-page">
      {/* Hero Header */}
      <header className="appeals-hero apple-resolution-hero">
        <div className="resolution-hero-icon">
          <ShieldAlert size={28} />
        </div>
        <div className="resolution-hero-copy">
          <div className="section-kicker">APPLE-STYLE RESOLUTION CENTER</div>
          <h2>Trung tâm Giải quyết Phản hồi &amp; Phúc tra</h2>
          <p>
            Kênh đối thoại trực tiếp giữa Maker và Ban Thẩm định EduHub. Mọi trao đổi đều minh bạch, hướng dẫn cụ thể từng bước để học liệu sớm đạt chuẩn xuất bản.
          </p>
        </div>
      </header>

      {/* Author Form: Submit revised feedback */}
      {!isAdmin && (
        <div className="apple-appeal-compose-card">
          <div className="compose-header">
            <MessageCircle size={18} />
            <div>
              <h3>Gửi giải trình hoặc thông báo đã chỉnh sửa</h3>
              <p>Thầy cô chọn học liệu cần xem lại và nêu rõ các điểm đã khắc phục theo hướng dẫn của ban kiểm duyệt.</p>
            </div>
          </div>

          <form className="appeal-compose" onSubmit={createAppeal}>
            <label className="compose-field">
              <span>Học liệu cần phúc tra</span>
              <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} required>
                <option value="">-- Chọn học liệu đang ở trạng thái cần sửa --</option>
                {resources.length > 0 ? (
                  resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))
                ) : (
                  <option value="sample-p4">Phiếu học tập và ma trận đề kiểm tra giữa kì 1 môn Ngữ văn 8 (Demo)</option>
                )}
              </select>
            </label>

            {/* If selected resource has feedback, show the notice right here */}
            {selectedResource?.moderation_note && (
              <div className="compose-preview-feedback">
                <ResolutionNoticeCard
                  moderationNote={selectedResource.moderation_note}
                  projectTitle={selectedResource.title}
                  compact
                />
              </div>
            )}

            <label className="compose-field">
              <span>Nội dung phản hồi / Giải trình các điểm đã sửa</span>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                minLength={20}
                maxLength={2500}
                rows={4}
                required
                placeholder="Ví dụ: Em đã cập nhật lại liên kết Google Drive sang chế độ công khai (Bất kỳ ai có link đều xem được) và đính kèm thêm Kế hoạch bài dạy theo mẫu 5512. Kính nhờ ban thẩm định duyệt lại giúp em..."
              />
            </label>

            <div className="compose-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={busy || request.trim().length < 20}
              >
                <Send size={14} /> Gửi đề nghị phúc tra tới Thẩm định viên
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appeals List Heading */}
      <div className="appeal-list-heading">
        <div className="heading-left">
          <h3>{isAdmin ? 'Danh sách hồ sơ yêu cầu phúc tra' : 'Lịch sử trao đổi với Ban Thẩm định'}</h3>
          <span className="count-pill">{appeals.length}</span>
        </div>
      </div>

      {/* Resolution Thread Cards */}
      <div className="appeal-list">
        {appeals.map((appeal) => (
          <article key={appeal.id} className={`apple-resolution-card status-${appeal.status}`}>
            {/* Resolution Card Header */}
            <div className="resolution-thread-header">
              <div className="thread-title-area">
                <span className={`appeal-status appeal-${appeal.status}`}>
                  {statusText[appeal.status] || appeal.status}
                </span>
                <h4>{appeal.resource?.title || 'Học liệu đã gửi'}</h4>
              </div>
              <small className="thread-timestamp">
                {new Date(appeal.created_at).toLocaleString('vi-VN')}
              </small>
            </div>

            {/* If the resource has moderation notes from admin, display the structured Apple notice */}
            {appeal.resource?.moderation_note && (
              <div className="thread-rejection-context">
                <div className="context-label">
                  <Info size={13} />
                  <span>Phản hồi ban đầu từ Thẩm định viên:</span>
                </div>
                <ResolutionNoticeCard
                  moderationNote={appeal.resource.moderation_note}
                  projectTitle={appeal.resource.title || ''}
                  compact
                />
              </div>
            )}

            {/* Maker's Appeal Explanation */}
            <div className="resolution-chat-bubble maker-bubble">
              <div className="bubble-author">
                <b>{appeal.author?.full_name || 'Tác giả học liệu'}</b>
                <small>Đã gửi giải trình</small>
              </div>
              <p>{appeal.request}</p>
            </div>

            {/* Admin Reply / Resolution */}
            {appeal.admin_note && (
              <div className="resolution-chat-bubble admin-bubble">
                <div className="bubble-author">
                  <ShieldCheck size={14} />
                  <b>Ban Thẩm định EduHub</b>
                  <small>Phản hồi</small>
                </div>
                <p>{appeal.admin_note}</p>
              </div>
            )}

            {/* Admin Action Controls */}
            {isAdmin && ['pending', 'reviewing'].includes(appeal.status) && (
              <div className="appeal-admin-controls">
                <label className="admin-reply-label">
                  Ghi chú phản hồi cho tác giả:
                  <textarea
                    className="appeal-admin-note-input"
                    value={adminNotes[appeal.id] ?? appeal.admin_note}
                    onChange={(e) => setAdminNotes((cur) => ({ ...cur, [appeal.id]: e.target.value }))}
                    maxLength={2000}
                    rows={2}
                    placeholder="Nhập nhận xét hoặc kết quả sau khi kiểm tra lại link/tệp..."
                  />
                </label>
                <div className="appeal-actions">
                  <button
                    className="button button-outline button-sm"
                    onClick={() => void review(appeal, 'reviewing')}
                    disabled={busy}
                  >
                    <RotateCcw size={13} /> Đang phúc tra
                  </button>
                  <button
                    className="button button-outline button-sm danger"
                    onClick={() => void review(appeal, 'upheld')}
                    disabled={busy}
                  >
                    <X size={13} /> Giữ quyết định từ chối
                  </button>
                  <button
                    className="button button-primary button-sm approve"
                    onClick={() => void review(appeal, 'reinstated')}
                    disabled={busy}
                  >
                    <Check size={13} /> Khôi phục &amp; Xuất bản
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}

        {appeals.length === 0 && (
          <div className="apple-empty-queue">
            <Check size={28} />
            <h3>Không có đề nghị phúc tra nào cần xử lý</h3>
            <p>Tất cả các học liệu đã được giải quyết hoặc chưa có khiếu nại phát sinh.</p>
          </div>
        )}
      </div>
    </section>
  );
}
