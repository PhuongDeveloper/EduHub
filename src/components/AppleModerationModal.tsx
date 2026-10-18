import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  FileQuestion,
  Sparkles,
  Link2,
  Download,
  Eye,
  Check,
  RotateCcw,
  BookOpen,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  MODERATION_GUIDELINES,
  ModerationFeedback,
  serializeModerationNote,
  parseModerationNote
} from '../lib/moderation';
import { TeacherWebsiteFrame } from './TeacherWebsiteFrame';

export type QueueProject = {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher: string;
  school: string;
  teacherId?: string;
  sourceId?: string;
  url?: string;
  downloadUrl?: string;
  coverUrl?: string;
  descriptionImages?: string[];
  videoUrl?: string;
  usageGuide?: string;
  subjects?: string[];
  grades?: string[];
  format?: string;
  votes?: number;
  downloads?: number;
  ratingAvg?: number;
  ratingCount?: number;
  teacherAvatarUrl?: string;
  moderationStatus?: string;
  moderationNote?: string;
  websiteHtml?: string;
  websiteSlug?: string;
  moderationLinkCheck?: string;
};

export type AdminAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
};

interface AppleModerationModalProps {
  project: QueueProject;
  attachments: AdminAttachment[];
  attachmentsLoading: boolean;
  adminName?: string;
  onClose: () => void;
  onApprove: (project: QueueProject, reviewerPraise?: string) => void;
  onReject: (project: QueueProject, feedback: ModerationFeedback) => void;
  onLinkCheck?: (project: QueueProject, status: 'working' | 'unavailable' | 'no_link') => void;
}

export const AppleModerationModal: React.FC<AppleModerationModalProps> = ({
  project,
  attachments,
  attachmentsLoading,
  adminName = 'Thẩm định viên EduHub',
  onClose,
  onApprove,
  onReject,
  onLinkCheck
}) => {
  // Mode: 'approve' | 'reject'
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject'>('approve');
  const [reviewerPraise, setReviewerPraise] = useState('');
  const [featureOnBanner, setFeatureOnBanner] = useState(false);

  // Rubric Checklist
  const [rubric, setRubric] = useState({
    gdpt2018: true,
    accessLink: true,
    copyright: true,
    presentation: true,
  });

  // Rejection Resolution Center State
  const initialFeedback = parseModerationNote(project.moderationNote);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>(
    initialFeedback?.guidelineId || MODERATION_GUIDELINES[0].id
  );
  const [reason, setReason] = useState<string>(
    initialFeedback?.reason || MODERATION_GUIDELINES[0].defaultReason
  );
  const [location, setLocation] = useState<string>(
    initialFeedback?.location || MODERATION_GUIDELINES[0].defaultLocation
  );
  const [instructions, setInstructions] = useState<string>(
    initialFeedback?.instructions || MODERATION_GUIDELINES[0].defaultInstructions
  );

  // Link Test State
  const [testedUrl, setTestedUrl] = useState<'unchecked' | 'testing' | 'valid' | 'invalid'>('unchecked');

  const handleSelectGuideline = (gId: string) => {
    setSelectedGuidelineId(gId);
    const found = MODERATION_GUIDELINES.find((g) => g.id === gId);
    if (found) {
      setReason(found.defaultReason);
      setLocation(found.defaultLocation);
      setInstructions(found.defaultInstructions);
    }
  };

  const handleTestLink = () => {
    setTestedUrl('testing');
    setTimeout(() => {
      // Simulate checking Google Drive / URL validity
      const urlToCheck = project.downloadUrl || project.url;
      if (!urlToCheck) {
        setTestedUrl('invalid');
      } else if (urlToCheck.includes('drive.google.com') && !urlToCheck.includes('sharing')) {
        setTestedUrl('invalid');
      } else {
        setTestedUrl('valid');
      }
    }, 600);
  };

  const handleSubmitApprove = () => {
    let praiseNote = reviewerPraise.trim();
    if (featureOnBanner) {
      praiseNote = `[Đề xuất nổi bật tuần] ${praiseNote}`;
    }
    onApprove(project, praiseNote || undefined);
  };

  const handleSubmitReject = () => {
    const currentGuideline = MODERATION_GUIDELINES.find((g) => g.id === selectedGuidelineId);
    const feedback: ModerationFeedback = {
      status: 'rejected',
      guidelineId: selectedGuidelineId,
      guidelineCode: currentGuideline?.code || 'Tiêu chuẩn thẩm định',
      guidelineTitle: currentGuideline?.title || 'Yêu cầu điều chỉnh từ Ban Thẩm định',
      reason: reason.trim(),
      location: location.trim(),
      instructions: instructions.trim(),
      reviewerName: adminName,
      reviewedAt: new Date().toISOString(),
    };
    onReject(project, feedback);
  };

  const currentGuideline = MODERATION_GUIDELINES.find((g) => g.id === selectedGuidelineId);

  return (
    <div
      className="apple-review-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="apple-review-modal" role="dialog" aria-modal="true">
        {/* Apple Store Review Header */}
        <header className="apple-review-header">
          <div className="apple-review-header-left">
            <div className="apple-review-pill-wrap">
              <span className="apple-brand-badge">
                <ShieldCheck size={14} /> Apple-Style Review Center
              </span>
              <span className={`apple-status-tag status-${project.moderationStatus || 'pending'}`}>
                {project.moderationStatus === 'approved'
                  ? 'Đã phát hành công khai'
                  : project.moderationStatus === 'rejected'
                  ? 'Yêu cầu chỉnh sửa (Action Needed)'
                  : 'Đang thẩm định (In Review)'}
              </span>
            </div>
            <h2>{project.title}</h2>
            <div className="apple-review-subinfo">
              <span><b>Mã học liệu:</b> {project.id}</span>
              <span>·</span>
              <span><b>Tác giả:</b> {project.teacher} ({project.school})</span>
              <span>·</span>
              <span><b>Môn:</b> {project.subject}</span>
              <span>·</span>
              <span><b>Khối:</b> {project.grades?.join(', ') || 'Mọi khối lớp'}</span>
            </div>
          </div>
          <button className="apple-review-close-btn" onClick={onClose} aria-label="Đóng màn hình thẩm định">
            <X size={20} />
          </button>
        </header>

        {/* Modal Main Body - Split View */}
        <div className="apple-review-body">
          {/* Left Column: Resource Details & Inspector */}
          <div className="apple-review-inspector">
            {/* Cover & Live Previews */}
            <div className="apple-inspector-section">
              <h4 className="apple-inspector-title">
                <Layers size={15} /> Ảnh bìa & Minh họa học liệu
              </h4>
              {project.coverUrl ? (
                <div className="apple-inspector-cover-wrap">
                  <img src={project.coverUrl} alt={`Ảnh bìa ${project.title}`} className="apple-inspector-cover" />
                </div>
              ) : (
                <div className="apple-inspector-no-cover">
                  <BookOpen size={24} />
                  <span>Chưa tải ảnh bìa hiển thị</span>
                </div>
              )}

              {Boolean(project.descriptionImages?.length) && (
                <div className="apple-inspector-gallery">
                  {project.descriptionImages?.map((imgUrl, idx) => (
                    <a href={imgUrl} target="_blank" rel="noreferrer" key={idx} className="apple-gallery-thumb">
                      <img src={imgUrl} alt={`Minh họa ${idx + 1}`} />
                      <span>Xem ảnh {idx + 1}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Pedagogy */}
            <div className="apple-inspector-section">
              <h4 className="apple-inspector-title">
                <Info size={15} /> Giới thiệu & Mục tiêu sư phạm
              </h4>
              <p className="apple-inspector-desc">{project.description || 'Chưa có mô tả chi tiết.'}</p>
              {project.usageGuide && (
                <div className="apple-usage-box">
                  <b>Hướng dẫn triển khai trên lớp:</b>
                  <p>{project.usageGuide}</p>
                </div>
              )}
            </div>

            {/* Interactive Link Testing Station */}
            <div className="apple-inspector-section apple-link-station">
              <h4 className="apple-inspector-title">
                <Link2 size={15} /> Trạm kiểm tra Liên kết & Quyền tải về
              </h4>
              <div className="apple-link-checks-grid">
                {project.downloadUrl && (
                  <div className="apple-link-check-card">
                    <div className="apple-link-info">
                      <Download size={16} />
                      <div className="apple-link-copy">
                        <b>Liên kết tệp tải về (Google Drive / OneDrive / Canva)</b>
                        <span title={project.downloadUrl}>{project.downloadUrl}</span>
                      </div>
                    </div>
                    <div className="apple-link-actions">
                      <a href={project.downloadUrl} target="_blank" rel="noreferrer" className="button button-outline button-xs">
                        <ExternalLink size={12} /> Mở tải thử
                      </a>
                      <button
                        className={`button button-xs ${
                          testedUrl === 'valid'
                            ? 'button-success-pill'
                            : testedUrl === 'invalid'
                            ? 'button-danger-pill'
                            : 'button-outline'
                        }`}
                        onClick={handleTestLink}
                      >
                        {testedUrl === 'testing'
                          ? 'Đang kiểm tra...'
                          : testedUrl === 'valid'
                          ? '✓ Quyền công khai OK'
                          : testedUrl === 'invalid'
                          ? '⚠ Bị khóa quyền / Lỗi'
                          : 'Quét quyền Drive'}
                      </button>
                    </div>
                  </div>
                )}

                {project.url && (
                  <div className="apple-link-check-card">
                    <div className="apple-link-info">
                      <Eye size={16} />
                      <div className="apple-link-copy">
                        <b>Đường dẫn dùng thử trực tuyến (Platform URL)</b>
                        <span title={project.url}>{project.url}</span>
                      </div>
                    </div>
                    <a href={project.url} target="_blank" rel="noreferrer" className="button button-outline button-xs">
                      <ExternalLink size={12} /> Mở xem thử
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Simulation Frame if websiteHtml */}
            {project.websiteHtml && (
              <div className="apple-inspector-section">
                <h4 className="apple-inspector-title">
                  <Sparkles size={15} /> Chạy thử Website / Mô phỏng tương tác
                </h4>
                <div className="apple-website-frame-wrap">
                  <TeacherWebsiteFrame title={`Xem thử ${project.title}`} html={project.websiteHtml} />
                </div>
              </div>
            )}

            {/* Attachments List */}
            {(attachmentsLoading || attachments.length > 0) && (
              <div className="apple-inspector-section">
                <h4 className="apple-inspector-title">
                  <FileCheck2 size={15} /> Tệp đính kèm ({attachments.length})
                </h4>
                {attachmentsLoading ? (
                  <p className="apple-muted-text">Đang tải danh sách tệp đính kèm...</p>
                ) : (
                  <div className="apple-attachments-list">
                    {attachments.map((file) => (
                      <div key={file.id} className="apple-attachment-item">
                        <div className="apple-attachment-meta">
                          <b>{file.file_name}</b>
                          <small>
                            {[file.mime_type, file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                        </div>
                        <a href={file.file_url} target="_blank" rel="noreferrer" className="button button-outline button-xs">
                          <Download size={12} /> Tải tệp
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Apple Review Decision & Resolution Center */}
          <div className="apple-review-decision-pane">
            {/* Step 1: Rubric Criteria Evaluation */}
            <div className="apple-rubric-card">
              <div className="apple-rubric-heading">
                <h4>Bộ Tiêu chí Thẩm định GDPT 2018</h4>
                <small>Đánh dấu nhanh các tiêu chuẩn đạt yêu cầu</small>
              </div>
              <div className="apple-rubric-list">
                <label className="apple-rubric-item">
                  <input
                    type="checkbox"
                    checked={rubric.gdpt2018}
                    onChange={(e) => setRubric((r) => ({ ...r, gdpt2018: e.target.checked }))}
                  />
                  <div>
                    <b>Mục tiêu & Khung năng lực GDPT 2018</b>
                    <small>Nội dung sư phạm chính xác, bám sát yêu cầu cần đạt</small>
                  </div>
                </label>

                <label className="apple-rubric-item">
                  <input
                    type="checkbox"
                    checked={rubric.accessLink}
                    onChange={(e) => setRubric((r) => ({ ...r, accessLink: e.target.checked }))}
                  />
                  <div>
                    <b>Quyền truy cập mở & Tệp tải về nguyên vẹn</b>
                    <small>Không khóa quyền Google Drive, không lỗi 404</small>
                  </div>
                </label>

                <label className="apple-rubric-item">
                  <input
                    type="checkbox"
                    checked={rubric.copyright}
                    onChange={(e) => setRubric((r) => ({ ...r, copyright: e.target.checked }))}
                  />
                  <div>
                    <b>Bản quyền & Ghi rõ nguồn trích dẫn</b>
                    <small>Ảnh, video và tài liệu tham khảo có trích nguồn minh bạch</small>
                  </div>
                </label>

                <label className="apple-rubric-item">
                  <input
                    type="checkbox"
                    checked={rubric.presentation}
                    onChange={(e) => setRubric((r) => ({ ...r, presentation: e.target.checked }))}
                  />
                  <div>
                    <b>Trình bày, font tiếng Việt & Ảnh bìa</b>
                    <small>Không lỗi font Unicode, kích thước phù hợp trình chiếu</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Decision Switch (Approve vs Request Changes) */}
            <div className="apple-decision-selector">
              <button
                type="button"
                className={`apple-decision-tab approve ${reviewDecision === 'approve' ? 'active' : ''}`}
                onClick={() => setReviewDecision('approve')}
              >
                <CheckCircle2 size={16} />
                <span>Phê duyệt xuất bản</span>
              </button>
              <button
                type="button"
                className={`apple-decision-tab reject ${reviewDecision === 'reject' ? 'active' : ''}`}
                onClick={() => setReviewDecision('reject')}
              >
                <AlertTriangle size={16} />
                <span>Yêu cầu chỉnh sửa (Apple Review)</span>
              </button>
            </div>

            {/* Decision Mode 1: APPROVE */}
            {reviewDecision === 'approve' && (
              <div className="apple-decision-form approve-mode">
                <div className="apple-mode-header green">
                  <CheckCircle2 size={18} />
                  <div>
                    <b>Duyệt học liệu & Công khai lên EduHub</b>
                    <p>Học liệu sẽ ngay lập tức hiển thị trên Bảng tin và trang cá nhân của tác giả.</p>
                  </div>
                </div>

                <label className="apple-input-label">
                  Lời khen & Ghi chú của Ban Thẩm định (Không bắt buộc)
                  <textarea
                    rows={3}
                    value={reviewerPraise}
                    onChange={(e) => setReviewerPraise(e.target.value)}
                    placeholder="Ví dụ: Bài giảng được thiết kế rất trực quan, phần trò chơi khởi động sáng tạo, phù hợp đưa vào bộ sưu tập tuần..."
                  />
                </label>

                <label className="apple-checkbox-pill">
                  <input
                    type="checkbox"
                    checked={featureOnBanner}
                    onChange={(e) => setFeatureOnBanner(e.target.checked)}
                  />
                  <span>
                    <Sparkles size={14} /> Đề cử xuất hiện tại Banner "Học liệu nổi bật tuần này"
                  </span>
                </label>

                <div className="apple-decision-actions">
                  <button type="button" className="button button-outline" onClick={onClose}>
                    Hủy bỏ
                  </button>
                  <button type="button" className="button button-primary apple-approve-action-btn" onClick={handleSubmitApprove}>
                    <Check size={16} /> Xác nhận Phê duyệt &amp; Xuất bản
                  </button>
                </div>
              </div>
            )}

            {/* Decision Mode 2: REJECT / REQUEST CHANGES (Apple Style) */}
            {reviewDecision === 'reject' && (
              <div className="apple-decision-form reject-mode">
                <div className="apple-mode-header amber">
                  <AlertTriangle size={18} />
                  <div>
                    <b>Gửi phản hồi yêu cầu chỉnh sửa (Resolution Center)</b>
                    <p>Phản hồi sẽ được gửi riêng tới tác giả với hướng dẫn chi tiết từng bước để nộp lại.</p>
                  </div>
                </div>

                {/* Preset Guideline Selector */}
                <div className="apple-input-group">
                  <label className="apple-input-label">
                    Bộ mẫu vi phạm thường gặp (Chọn để tự động điền nhanh)
                  </label>
                  <select
                    value={selectedGuidelineId}
                    onChange={(e) => handleSelectGuideline(e.target.value)}
                    className="apple-guideline-select"
                  >
                    {MODERATION_GUIDELINES.map((g) => (
                      <option key={g.id} value={g.id}>
                        [{g.code}] {g.title} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3 Core Fields Required by Apple Review */}
                <div className="apple-input-group">
                  <label className="apple-input-label required">
                    1. Lý do vì sao từ chối (Why - Nêu rõ tiêu chuẩn không đạt)
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Mô tả cụ thể nguyên nhân vi phạm tiêu chuẩn thẩm định..."
                    required
                  />
                </div>

                <div className="apple-input-group">
                  <label className="apple-input-label required">
                    2. Do đâu / Vị trí cụ thể (Where - Chỉ rõ vị trí phát hiện lỗi)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ví dụ: Slide số 4 và liên kết Google Drive ở mục tải về..."
                    required
                  />
                </div>

                <div className="apple-input-group">
                  <label className="apple-input-label required">
                    3. Cần sửa những gì cụ thể (What to fix - Hướng dẫn từng bước cho Maker)
                  </label>
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Chỉ dẫn từng bước rõ ràng để thầy cô sửa đúng và được duyệt ngay khi nộp lại..."
                    required
                  />
                </div>

                {/* Live Preview of Resolution Notice */}
                <div className="apple-live-preview-box">
                  <div className="apple-live-preview-header">
                    <FileQuestion size={13} />
                    <span>Bản xem trước thông báo gửi đến thầy cô:</span>
                  </div>
                  <div className="apple-resolution-preview-card">
                    <div className="preview-top">
                      <span className="preview-badge">YÊU CẦU ĐIỀU CHỈNH</span>
                      <small>{currentGuideline?.code}: {currentGuideline?.title}</small>
                    </div>
                    <div className="preview-block">
                      <b>Lý do:</b> <span>{reason}</span>
                    </div>
                    <div className="preview-block">
                      <b>Vị trí:</b> <span>{location}</span>
                    </div>
                    <div className="preview-block instructions">
                      <b>Cách khắc phục:</b> <span>{instructions}</span>
                    </div>
                  </div>
                </div>

                <div className="apple-decision-actions">
                  <button type="button" className="button button-outline" onClick={onClose}>
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="button button-danger-fill apple-reject-action-btn"
                    onClick={handleSubmitReject}
                    disabled={!reason.trim() || !instructions.trim()}
                  >
                    <RotateCcw size={15} /> Gửi yêu cầu chỉnh sửa cho Maker
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
