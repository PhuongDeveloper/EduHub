import React from 'react';
import {
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Edit3,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { parseModerationNote, ModerationFeedback } from '../lib/moderation';

interface ResolutionNoticeCardProps {
  moderationNote?: string | null;
  projectTitle: string;
  onEdit?: () => void;
  onAppeal?: () => void;
  compact?: boolean;
}

export const ResolutionNoticeCard: React.FC<ResolutionNoticeCardProps> = ({
  moderationNote,
  projectTitle,
  onEdit,
  onAppeal,
  compact = false,
}) => {
  const feedback: ModerationFeedback | null = parseModerationNote(moderationNote);

  if (!feedback) return null;

  return (
    <div className={`resolution-notice-card ${compact ? 'compact' : ''}`}>
      <div className="resolution-card-header">
        <div className="resolution-header-badge">
          <ShieldAlert size={16} />
          <span>PHẢN HỒI BAN THẨM ĐỊNH (RESOLUTION CENTER)</span>
        </div>
        <span className="resolution-status-tag">Cần chỉnh sửa</span>
      </div>

      <div className="resolution-card-content">
        <div className="resolution-guideline-row">
          <span className="resolution-guideline-code">{feedback.guidelineCode}</span>
          <b className="resolution-guideline-title">{feedback.guidelineTitle}</b>
        </div>

        <div className="resolution-grid">
          <div className="resolution-field field-reason">
            <span className="field-tag">LÝ DO VÌ SAO (WHY)</span>
            <p>{feedback.reason}</p>
          </div>

          <div className="resolution-field field-location">
            <span className="field-tag">VỊ TRÍ CẦN KIỂM TRA (WHERE)</span>
            <p>{feedback.location}</p>
          </div>

          <div className="resolution-field field-instructions">
            <span className="field-tag">HƯỚNG DẪN KHẮC PHỤC (WHAT TO FIX)</span>
            <p>{feedback.instructions}</p>
          </div>
        </div>

        {feedback.reviewerName && (
          <div className="resolution-reviewer-foot">
            <small>
              Thẩm định bởi <b>{feedback.reviewerName}</b> lúc{' '}
              {new Date(feedback.reviewedAt).toLocaleString('vi-VN')}
            </small>
          </div>
        )}
      </div>

      {(onEdit || onAppeal) && (
        <div className="resolution-card-actions">
          {onEdit && (
            <button type="button" className="button button-primary button-sm" onClick={onEdit}>
              <Edit3 size={13} /> Sửa học liệu &amp; nộp lại
            </button>
          )}
          {onAppeal && (
            <button type="button" className="button button-outline button-sm" onClick={onAppeal}>
              <MessageCircle size={13} /> Trao đổi với Thẩm định viên
            </button>
          )}
        </div>
      )}
    </div>
  );
};
