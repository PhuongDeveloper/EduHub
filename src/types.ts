export type ResourceType =
  | 'powerpoint'
  | 'khbd_5512'
  | 'exam_matrix'
  | 'tool_software'
  | 'game_interactive'
  | 'utility_web';

export type SchoolLevel = 'tieuhoc' | 'thcs' | 'thpt' | 'toantruong';

export type CurriculumBook = 'KetNoi' | 'CanhDieu' | 'ChanTroi' | 'DungChung';

export interface TeacherProfile {
  id: string;
  name: string;
  avatar?: string;
  schoolName: string;
  province: string;
  subjectSpecialty: string;
  eduPoints: number;
  voteWeight: number;
  badges: string[]; // e.g. ["Giáo viên Tiên phong GDPT 2018", "Cây bút KHBD Vàng"]
  resourcesCount: number;
  joinedAt: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  resourceType: ResourceType;
  fileFormat?: 'pptx' | 'docx' | 'pdf' | 'xlsx' | 'zip' | 'web';
  fileSize?: string;
  downloadUrl?: string;
  platformUrl?: string; // Link trực tiếp web/app nếu là tool
  previewImages?: string[];
  
  // Giáo dục GDPT 2018
  schoolLevels: SchoolLevel[];
  gradeLevels: string[]; // ["Lớp 6", "Lớp 7",...]
  subjects: string[]; // ["Toán", "Ngữ văn", "KHTN",...]
  curriculumBooks: CurriculumBook[];
  purpose: string[];

  // Tác giả giáo viên
  author: TeacherProfile;

  // Thống kê & Xếp hạng
  upvotesCount: number;
  clappedByUsers?: string[]; // IDs of teachers who upvoted
  viewsCount: number;
  downloadsCount: number;
  ratingAverage: number;
  ratingCount: number;
  
  // Điểm số sư phạm & Kiểm định
  gdpt2018FitScore: number; // 1 - 5
  isFreeVerified: boolean;
  hasNoAdsVerified: boolean;
  isCopyrightVerified: boolean;

  // Hướng dẫn & Nhật ký
  tutorialGuide?: {
    stepByStep: string[];
    tipsForTeachers?: string;
  };
  changelog?: Array<{
    version: string;
    date: string;
    note: string;
  }>;

  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItem {
  id: string;
  resourceId: string;
  teacher: TeacherProfile;
  rating: number; // 1-5
  comment: string;
  teachingExperienceNote?: string; // "Đã dạy thử trên lớp 7A..."
  createdAt: string;
}

export interface SubjectTalkItem {
  id: string;
  subjectChannel: string; // "toan", "van", "khtn", "tieng-anh", "tin-hoc", "chu-nhiem"
  title: string;
  content: string;
  author: TeacherProfile;
  attachedResource?: {
    id: string;
    title: string;
    resourceType: ResourceType;
  };
  repliesCount: number;
  upvotesCount: number;
  tags: string[];
  createdAt: string;
}

export interface SubjectTalkReply {
  id: string;
  talkId: string;
  author: TeacherProfile;
  content: string;
  createdAt: string;
}

export interface LeaderboardTeacher {
  teacher: TeacherProfile;
  rank: number;
  periodPoints: number; // Điểm tích lũy trong tuần / tháng / năm
  topResourceTitle?: string;
}

// Bổ sung các types cho bảo mật và admin hiện có
export interface EncryptedLessonItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  lessonType: 'KHBD_5512' | 'De_Kiem_Tra' | 'Slide_Hoc_Lieu' | 'Prompt_Mau';
  encryptedPayload: string;
  iv: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
}

export interface AdminSession {
  email: string;
  role: 'superadmin' | 'moderator';
  token: string;
  name: string;
  loggedInAt: string;
}

// Legacy EduAI directory types retained for the unused scanner and admin components.
export interface TutorialArticle {
  title: string;
  source: string;
  url: string;
  summary: string;
  readTime?: string;
}

export interface CopyrightAuditDetails {
  isFreeConfirmed: boolean;
  licenseName: string;
  authorDeclaration: string;
  noHiddenPaywall: boolean;
  noCommercialAds: boolean;
  riskAssessment: 'safe_clean' | 'attribution_required' | 'commercial_restricted';
  watermarkFree: boolean;
  offlineUsable?: boolean;
}

export interface AppItem {
  id: string;
  title: string;
  author: string;
  authorContact?: string;
  sourceType: 'vietnam_created' | 'international_localized' | 'community_submission';
  platformUrl: string;
  gradeLevels: string[];
  subjects: string[];
  purpose: string[];
  description: string;
  detailedReview: string;
  gdpt2018FitScore: number;
  safetyScore: number;
  ratingCount: number;
  ratingAverage: number;
  isFreeVerified: boolean;
  hasNoAdsVerified: boolean;
  licenseType?: 'MIT_OpenSource' | 'CreativeCommons' | 'FreeNonCommercial' | 'EducationalFreeware' | 'GPL_OpenSource' | 'PublicDomain';
  copyrightVerified?: boolean;
  copyrightNotes?: string;
  freeGuarantee?: string;
  copyrightAudit?: CopyrightAuditDetails;
  tutorialVideoUrl?: string;
  tutorialArticles?: TutorialArticle[];
  tutorialGuide?: { stepByStep: string[]; samplePrompt?: string; tipsForTeachers?: string };
  healthStatus?: 'online' | 'warning' | 'offline';
  lastHealthCheckedAt?: string;
  responseTimeMs?: number;
  emailOutreachStatus: 'not_needed' | 'sent' | 'pending' | 'accepted';
  outreachEmailContent?: string;
  tags: string[];
  createdAt: string;
  reportsCount: number;
}

export interface PurgedAppRecord {
  id: string;
  title: string;
  platformUrl: string;
  author: string;
  reason: string;
  removedAt: string;
}

export interface MonitoredSource {
  id: string;
  name: string;
  category: 'facebook_group' | 'forum_violet' | 'edtech_portal' | 'open_repo' | 'youtube_edu';
  url: string;
  membersOrVisitors: string;
  description: string;
  scanFrequency: string;
  discoveredAppsCount: number;
  status: 'active' | 'scanning' | 'suggested';
  suggestedBy?: string;
}

export type DiscoveredAgentApp = Partial<AppItem> & Pick<AppItem, 'title' | 'author' | 'platformUrl' | 'description' | 'detailedReview'> & {
  sourceOrigin?: string;
  outreachEmail?: { subject?: string; body?: string };
};

export interface LiveTestToolItem {
  id: string;
  name: string;
  category: string;
  gdptFitScore: number;
  author: string;
  platformUrl: string;
  description: string;
  detailedReview: string;
  licenseType?: AppItem['licenseType'];
  copyrightNotes?: string;
  tutorialVideoUrl?: string;
  tutorialGuide?: AppItem['tutorialGuide'];
  executionMetrics: {
    latencyMs: number;
    status: string;
    testScenario: string;
    testInput: string;
    testOutput: string;
    securityCheck: string;
  };
}

export interface SiteLiveTestResponse {
  siteTitle: string;
  summary: string;
  testedCount: number;
  tools: LiveTestToolItem[];
}

export interface DecryptedLessonItem extends Omit<EncryptedLessonItem, 'encryptedPayload' | 'iv' | 'salt' | 'fileSize'> {
  content: string;
}
