import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  ShieldCheck,
  Video,
  PlayCircle,
  ExternalLink,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Check
} from 'lucide-react';
import { AppItem, CopyrightAuditDetails, TutorialArticle } from '../types';
import { SUBJECT_NAMES } from '../lib/curriculum';

interface EditAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppItem | null;
  onSave: (savedApp: AppItem) => Promise<void>;
  isNew?: boolean;
  initialTab?: 'general' | 'copyright' | 'tutorials' | 'pedagogy';
}

const COMMON_SUBJECTS = [...SUBJECT_NAMES, 'Liên môn / nhiều môn'];

const COMMON_GRADES = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12',
  'Toàn cấp'
];

const COMMON_PURPOSES = [
  'Soạn KHBD 5512',
  'Ra ma trận & Đề',
  'Học liệu số',
  'Chỉnh sửa văn bản',
  'Lộ trình học tập'
];

export const EditAppModal: React.FC<EditAppModalProps> = ({
  isOpen,
  onClose,
  app,
  onSave,
  isNew = false,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'copyright' | 'tutorials' | 'pedagogy'>(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorContact, setAuthorContact] = useState('');
  const [sourceType, setSourceType] = useState<'vietnam_created' | 'international_localized' | 'community_submission'>('vietnam_created');
  const [platformUrl, setPlatformUrl] = useState('');
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [detailedReview, setDetailedReview] = useState('');
  const [gdpt2018FitScore, setGdpt2018FitScore] = useState<number>(4.9);
  const [safetyScore, setSafetyScore] = useState<number>(5.0);

  // Copyright State
  const [licenseType, setLicenseType] = useState<AppItem['licenseType']>('FreeNonCommercial');
  const [copyrightNotes, setCopyrightNotes] = useState('');
  const [freeGuarantee, setFreeGuarantee] = useState('');
  const [noHiddenPaywall, setNoHiddenPaywall] = useState(true);
  const [noCommercialAds, setNoCommercialAds] = useState(true);
  const [watermarkFree, setWatermarkFree] = useState(true);
  const [offlineUsable, setOfflineUsable] = useState(false);

  // Tutorial & Video State
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('');
  const [step1, setStep1] = useState('');
  const [step2, setStep2] = useState('');
  const [step3, setStep3] = useState('');
  const [step4, setStep4] = useState('');
  const [samplePrompt, setSamplePrompt] = useState('');
  const [tipsForTeachers, setTipsForTeachers] = useState('');
  const [articles, setArticles] = useState<TutorialArticle[]>([]);

  // New article inputs
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtSource, setNewArtSource] = useState('');
  const [newArtUrl, setNewArtUrl] = useState('');
  const [newArtSummary, setNewArtSummary] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (app) {
      setTitle(app.title || '');
      setAuthor(app.author || '');
      setAuthorContact(app.authorContact || '');
      setSourceType(app.sourceType || 'vietnam_created');
      setPlatformUrl(app.platformUrl || '');
      setGradeLevels(Array.isArray(app.gradeLevels) ? app.gradeLevels : ['Toàn cấp']);
      setSubjects(Array.isArray(app.subjects) ? app.subjects : ['Liên môn / nhiều môn']);
      setPurpose(Array.isArray(app.purpose) ? app.purpose : ['Học liệu số']);
      setDescription(app.description || '');
      setDetailedReview(app.detailedReview || '');
      setGdpt2018FitScore(app.gdpt2018FitScore ?? 4.9);
      setSafetyScore(app.safetyScore ?? 5.0);

      setLicenseType(app.licenseType || 'FreeNonCommercial');
      setCopyrightNotes(app.copyrightNotes || 'Tác giả chia sẻ miễn phí phục vụ giáo viên Việt Nam, bản quyền sư phạm phi thương mại.');
      setFreeGuarantee(app.freeGuarantee || 'Cam kết 100% miễn phí trọn đời cho giáo viên và học sinh.');
      setNoHiddenPaywall(app.copyrightAudit?.noHiddenPaywall ?? true);
      setNoCommercialAds(app.copyrightAudit?.noCommercialAds ?? true);
      setWatermarkFree(app.copyrightAudit?.watermarkFree ?? true);
      setOfflineUsable(app.copyrightAudit?.offlineUsable ?? false);

      setTutorialVideoUrl(app.tutorialVideoUrl || '');
      const steps = app.tutorialGuide?.stepByStep || [];
      setStep1(steps[0] || 'Bước 1: Truy cập liên kết chính thức của ứng dụng.');
      setStep2(steps[1] || 'Bước 2: Lựa chọn khối lớp và môn học cần giảng dạy.');
      setStep3(steps[2] || 'Bước 3: Nhập nội dung bài học hoặc yêu cầu cần đạt.');
      setStep4(steps[3] || 'Bước 4: Xuất kết quả và ứng dụng ngay trong tiết dạy.');
      setSamplePrompt(app.tutorialGuide?.samplePrompt || '');
      setTipsForTeachers(app.tutorialGuide?.tipsForTeachers || '');
      setArticles(app.tutorialArticles || []);
    } else {
      // Default empty values for new app
      setTitle('');
      setAuthor('Thầy/Cô Giáo Sáng Tạo');
      setAuthorContact('');
      setSourceType('vietnam_created');
      setPlatformUrl('');
      setGradeLevels(['Toàn cấp']);
      setSubjects(['Liên môn / nhiều môn']);
      setPurpose(['Học liệu số']);
      setDescription('');
      setDetailedReview('');
      setGdpt2018FitScore(5.0);
      setSafetyScore(5.0);

      setLicenseType('FreeNonCommercial');
      setCopyrightNotes('Tác giả chia sẻ miễn phí phục vụ giáo viên Việt Nam, bản quyền sư phạm phi thương mại.');
      setFreeGuarantee('Cam kết 100% miễn phí trọn đời cho giáo viên và học sinh.');
      setNoHiddenPaywall(true);
      setNoCommercialAds(true);
      setWatermarkFree(true);
      setOfflineUsable(false);

      setTutorialVideoUrl('');
      setStep1('Bước 1: Truy cập liên kết chính thức của ứng dụng.');
      setStep2('Bước 2: Lựa chọn khối lớp và môn học cần giảng dạy.');
      setStep3('Bước 3: Nhập nội dung bài học hoặc yêu cầu cần đạt.');
      setStep4('Bước 4: Xuất kết quả và ứng dụng ngay trong tiết dạy.');
      setSamplePrompt('');
      setTipsForTeachers('');
      setArticles([]);
    }
    setErrorMsg('');
  }, [app, isOpen]);

  if (!isOpen) return null;

  // Extract YouTube embed URL helper for live preview
  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  };

  const handleToggleGrade = (grade: string) => {
    setGradeLevels((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleToggleSubject = (sub: string) => {
    setSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleTogglePurpose = (pur: string) => {
    setPurpose((prev) =>
      prev.includes(pur) ? prev.filter((p) => p !== pur) : [...prev, pur]
    );
  };

  const handleAddArticle = () => {
    if (!newArtTitle || !newArtUrl) return;
    const newArt: TutorialArticle = {
      title: newArtTitle.trim(),
      source: newArtSource.trim() || 'Cộng đồng Giáo viên',
      url: newArtUrl.trim(),
      summary: newArtSummary.trim() || 'Bài viết hướng dẫn khai thác tính năng ứng dụng.',
      readTime: '4 phút đọc',
    };
    setArticles([...articles, newArt]);
    setNewArtTitle('');
    setNewArtSource('');
    setNewArtUrl('');
    setNewArtSummary('');
  };

  const handleRemoveArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const handleAutoSuggestSteps = () => {
    const isVan = subjects.some((s) => s.toLowerCase().includes('văn')) || title.toLowerCase().includes('văn') || title.toLowerCase().includes('ngữ văn') || platformUrl.includes('vanmaster');
    const isToan = subjects.some((s) => s.toLowerCase().includes('toán')) || title.toLowerCase().includes('toán') || title.toLowerCase().includes('geogebra');
    const isVideo = title.toLowerCase().includes('video') || title.toLowerCase().includes('clip');

    if (isVan) {
      setStep1(`Bước 1 (Chọn chuyên đề & Đề thi): Truy cập VanMaster (hoặc ứng dụng), chọn khối lớp (10, 11, 12) và phần ôn luyện theo cấu trúc đề thi TN THPT môn Ngữ văn (Đọc hiểu 4.0đ, Đoạn văn NLXH 2.0đ hoặc Bài văn NLVH 4.0đ).`);
      setStep2(`Bước 2 (Tiếp cận ngữ liệu & Lập dàn ý): Đọc kỹ ngữ liệu văn học (ngoài SGK), phân tích yêu cầu đề bài, xác định hệ thống luận điểm chính và tiến hành viết bài trực tiếp trên giao diện luyện bút.`);
      setStep3(`Bước 3 (Nhận xét & AI chấm chữa barem): Nhận phản hồi tự động theo barem chuẩn của Bộ GD&ĐT: AI phân tích cấu trúc lập luận, cảnh báo câu từ sáo rỗng rập khuôn, lỗi chính tả và gợi ý câu văn liên kết mượt mà.`);
      setStep4(`Bước 4 (Xuất học liệu & Rút kinh nghiệm): Giáo viên và học sinh xuất kết quả chấm chữa, lưu trữ bài làm mẫu tiêu biểu và rút kinh nghiệm diễn đạt cho các kỳ thi thử tiếp theo.`);
      setSamplePrompt('Gợi ý hệ thống luận cứ, dẫn chứng thực tế thời sự và cách mở bài gián tiếp sâu sắc cho đề bài Nghị luận xã hội: Ý nghĩa của việc giữ gìn bản sắc văn hóa dân tộc trong thời đại số.');
      setTipsForTeachers('Thầy cô có thể dùng ứng dụng để giao đề luyện viết đoạn văn 200 chữ hoặc đề đọc hiểu định kỳ, tận dụng barem chấm chi tiết của hệ thống để giảm tải thời gian chấm bài thủ công.');
    } else if (isVideo) {
      setStep1(`Bước 1 (Xác định tình huống bài dạy): Mở ứng dụng, chọn khối lớp và mục tiêu bài học theo Công văn 5512 (Hoạt động Khởi động, Khám phá kiến thức hoặc Vận dụng).`);
      setStep2(`Bước 2 (Tạo kịch bản video AI): Nhập chủ đề hoặc từ khóa trọng tâm của tiết dạy, lựa chọn phong cách trực quan và độ dài ngắn phù hợp (30 - 60 giây).`);
      setStep3(`Bước 3 (Tùy chỉnh giọng đọc & Hình ảnh): Tinh chỉnh ngữ điệu lời thuyết minh tiếng Việt chuẩn sư phạm, kiểm tra hình ảnh minh họa cho chính xác khoa học.`);
      setStep4(`Bước 4 (Trình chiếu & Gợi mở thảo luận): Chèn video vào slide PowerPoint hoặc bài giảng điện tử để mở đầu tiết học, kích hoạt sự tò mò và hứng thú của học sinh.`);
      setSamplePrompt('Tạo kịch bản video 45 giây tình huống mở đầu bài học kích thích học sinh đặt câu hỏi về hiện tượng thực tế.');
      setTipsForTeachers('Nên dừng lại ở 5-10 giây cuối video để đặt câu hỏi cho học sinh thảo luận cặp đôi trước khi giáo viên dẫn dắt vào bài mới.');
    } else if (isToan) {
      setStep1(`Bước 1 (Lựa chọn chủ đề toán học): Mở ứng dụng, chọn khối lớp và phân môn (Đại số, Hình học, Giải tích hoặc Thống kê - Xác suất).`);
      setStep2(`Bước 2 (Khám phá trực quan & Tương tác đồ thị): Thay đổi tham số, di chuyển thanh trượt (slider) để học sinh tự quan sát sự biến thiên của đồ thị hoặc tính chất hình học không gian.`);
      setStep3(`Bước 3 (Thực hành giải toán & Đối chiếu kết quả): Học sinh thực hiện bài toán tương tự, nhập kết quả để kiểm tra độ chính xác và xem phân tích từng bước giải.`);
      setStep4(`Bước 4 (Tổng kết & Rút ra định lý): Giáo viên tổ chức cho học sinh phát biểu lại quy luật vừa khám phá và ghi chép vào vở học tập.`);
      setSamplePrompt('Tạo bài toán thực tế mô hình hóa hàm số bậc hai với tình huống phóng tên lửa hoặc quỹ đạo cầu cong.');
      setTipsForTeachers('Khuyến khích học sinh dự đoán kết quả trước khi kéo thanh trượt mô phỏng để phát triển tư duy phán đoán logic.');
    } else {
      setStep1(`Bước 1 (Chuẩn bị & Đăng nhập): Truy cập liên kết chính thức của ${title || 'ứng dụng'}, chọn khối lớp (${gradeLevels.slice(0, 2).join(', ') || 'phù hợp'}) và môn học.`);
      setStep2(`Bước 2 (Thiết lập mục tiêu cần đạt): Nhập nội dung bài học, yêu cầu kiến thức kỹ năng bám sát chương trình GDPT 2018.`);
      setStep3(`Bước 3 (Tương tác & Thực hành sư phạm): Giáo viên và học sinh tiến hành thao tác trên ứng dụng, theo dõi phản hồi trực quan theo thời gian thực.`);
      setStep4(`Bước 4 (Đánh giá & Xuất học liệu): Xuất kết quả bài làm, lưu trữ học liệu số và tích hợp vào Kế hoạch bài dạy theo Công văn 5512.`);
      setSamplePrompt(`Thiết kế hoạt động học tập tương tác bám sát nội dung bài học môn ${subjects[0] || 'học'}.`);
      setTipsForTeachers('Nên kết hợp cùng phiếu học tập nhóm hoặc hoạt động thảo luận để tăng cường tính chủ động của học sinh.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !platformUrl.trim()) {
      setErrorMsg('Vui lòng điền tiêu đề ứng dụng và đường liên kết chính thức.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const copyrightAudit: CopyrightAuditDetails = {
        isFreeConfirmed: true,
        licenseName: licenseType === 'MIT_OpenSource'
          ? 'Mã nguồn mở MIT License'
          : licenseType === 'CreativeCommons'
          ? 'Creative Commons (CC-BY-NC 4.0)'
          : licenseType === 'EducationalFreeware'
          ? 'Freeware Giáo dục Miễn phí'
          : 'Giấy phép Phi thương mại dành cho Giáo viên',
        authorDeclaration: copyrightNotes || 'Tác giả công bố miễn phí phục vụ giáo viên',
        noHiddenPaywall,
        noCommercialAds,
        riskAssessment: app?.copyrightAudit?.riskAssessment || 'commercial_restricted',
        watermarkFree,
        offlineUsable,
      };

      const payload: AppItem = {
        id: app?.id || `app-admin-${Date.now()}`,
        title: title.trim(),
        author: author.trim() || 'Tác giả chia sẻ',
        authorContact: authorContact.trim() || undefined,
        sourceType,
        platformUrl: platformUrl.trim(),
        gradeLevels: gradeLevels.length > 0 ? gradeLevels : ['Toàn cấp'],
        subjects: subjects.length > 0 ? subjects : ['Liên môn / nhiều môn'],
        purpose: purpose.length > 0 ? purpose : ['Học liệu số'],
        description: description.trim() || 'Ứng dụng hỗ trợ giảng dạy GDPT 2018.',
        detailedReview: detailedReview.trim() || 'Ứng dụng đã được Quản trị viên EduAI Hub kiểm duyệt chất lượng sư phạm và xác thực an toàn tuyệt đối.',
        gdpt2018FitScore: Number(gdpt2018FitScore) || 0,
        safetyScore: Number(safetyScore) || 0,
        ratingCount: app?.ratingCount || 0,
        ratingAverage: app?.ratingAverage || 0,
        isFreeVerified: app?.isFreeVerified || false,
        hasNoAdsVerified: noCommercialAds,
        licenseType,
        copyrightVerified: app?.copyrightVerified || false,
        copyrightNotes: copyrightNotes.trim(),
        freeGuarantee: freeGuarantee.trim(),
        copyrightAudit,
        tutorialVideoUrl: tutorialVideoUrl.trim() || undefined,
        tutorialArticles: articles.length > 0 ? articles : [
          {
            title: `Hướng dẫn áp dụng ${title.trim()} theo chuẩn Công văn 5512`,
            source: 'Diễn đàn Giáo Viên Đổi Mới',
            url: platformUrl.trim(),
            summary: 'Các bước khai thác sư phạm và tổ chức hoạt động học tập tích cực cho học sinh.',
            readTime: '4 phút đọc',
          }
        ],
        tutorialGuide: {
          stepByStep: [step1, step2, step3, step4].filter((s) => s.trim().length > 0),
          samplePrompt: samplePrompt.trim() || undefined,
          tipsForTeachers: tipsForTeachers.trim() || undefined,
        },
        healthStatus: app?.healthStatus || 'online',
        lastHealthCheckedAt: new Date().toISOString(),
        responseTimeMs: app?.responseTimeMs || 150,
        emailOutreachStatus: app?.emailOutreachStatus || 'accepted',
        outreachEmailContent: app?.outreachEmailContent || '',
        tags: Array.isArray(app?.tags) && app.tags.length > 0 ? app.tags : ['Quản trị viên đã duyệt', 'Chuẩn GDPT 2018'],
        createdAt: app?.createdAt || new Date().toISOString(),
        reportsCount: app?.reportsCount || 0,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin ứng dụng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isNew ? 'Thêm Ứng Dụng Mới (Dành Cho Quản Trị Viên)' : `Chỉnh Sửa Thông Tin: "${title || app?.title}"`}
              </h3>
              <p className="text-xs text-slate-500">
                Toàn quyền kiểm duyệt, cập nhật bản quyền, video hướng dẫn và nội dung sư phạm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Thông tin chung & Liên kết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('copyright')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'copyright'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Thẩm định Bản quyền & Free
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutorials')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'tutorials'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Video & Bài viết Hướng dẫn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pedagogy')}
            className={`py-3 px-3.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'pedagogy'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Điểm số & Đánh giá Sư phạm
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên ứng dụng / Công cụ AI <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: ClassPoint AI (Tương tác trên PowerPoint)"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đường liên kết truy cập chính thức (Platform URL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tác giả / Nhóm phát triển
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="VD: Thầy Nguyễn Chí Thanh"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Liên hệ tác giả (Email / Đơn vị)
                  </label>
                  <input
                    type="text"
                    value={authorContact}
                    onChange={(e) => setAuthorContact(e.target.value)}
                    placeholder="email@edu.vn"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân loại nguồn
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e: any) => setSourceType(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="vietnam_created">Tác giả Việt Nam sáng tạo</option>
                    <option value="international_localized">Quốc tế Việt hóa / Khuyên dùng</option>
                    <option value="community_submission">Cộng đồng giáo viên đóng góp</option>
                  </select>
                </div>
              </div>

              {/* Purpose Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục đích sư phạm chính
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PURPOSES.map((pur) => (
                    <button
                      key={pur}
                      type="button"
                      onClick={() => handleTogglePurpose(pur)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        purpose.includes(pur)
                          ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Môn học áp dụng
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  {COMMON_SUBJECTS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleToggleSubject(sub)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        subjects.includes(sub)
                          ? 'bg-emerald-800 text-white border-emerald-800 font-medium'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Level Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khối lớp áp dụng
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_GRADES.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handleToggleGrade(grade)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        gradeLevels.includes(grade)
                          ? 'bg-teal-700 text-white border-teal-700 font-medium'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả tóm tắt ứng dụng
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả các tính năng cốt lõi giúp giáo viên tiết kiệm thời gian..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Copyright & Free Tier Audit */}
          {activeTab === 'copyright' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Quy chuẩn thẩm định bản quyền EduAI Hub:</span>
                  <p className="text-[11px] text-emerald-900 mt-0.5">
                    Quản trị viên cần đảm bảo ứng dụng không chứa mã độc, không thu phí ngầm, không chèn banner quảng cáo cờ bạc/thương mại phiền nhiễu và học liệu xuất ra không bị dính watermark bắt nạp tiền.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại giấy phép bản quyền (License Type)
                  </label>
                  <select
                    value={licenseType}
                    onChange={(e: any) => setLicenseType(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="FreeNonCommercial">Giấy phép Phi thương mại (Free Non-Commercial)</option>
                    <option value="EducationalFreeware">Gói Giáo dục Miễn phí (Educational Freeware)</option>
                    <option value="CreativeCommons">Creative Commons (CC-BY-NC)</option>
                    <option value="MIT_OpenSource">Mã nguồn mở (MIT Open Source License)</option>
                    <option value="PublicDomain">Phạm vi Công cộng (Public Domain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cam kết miễn phí trọn đời
                  </label>
                  <input
                    type="text"
                    value={freeGuarantee}
                    onChange={(e) => setFreeGuarantee(e.target.value)}
                    placeholder="VD: Cam kết 100% miễn phí trọn đời cho giáo viên và học sinh."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tuyên bố quyền tác giả & Ghi chú bản quyền sư phạm
                </label>
                <textarea
                  rows={2}
                  value={copyrightNotes}
                  onChange={(e) => setCopyrightNotes(e.target.value)}
                  placeholder="Ghi rõ tác giả chia sẻ miễn phí phục vụ cộng đồng giáo viên Việt Nam..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* 4 Checkbox Audit Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={noHiddenPaywall}
                    onChange={(e) => setNoHiddenPaywall(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">Không thu phí ngầm</span>
                    <span className="text-[11px] text-slate-500">Không ép giáo viên nạp tiền mua lượt hoặc thẻ tín dụng</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={noCommercialAds}
                    onChange={(e) => setNoCommercialAds(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">Không quảng cáo rác</span>
                    <span className="text-[11px] text-slate-500">Không chứa banner cờ bạc hoặc quảng cáo độc hại</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={watermarkFree}
                    onChange={(e) => setWatermarkFree(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">Học liệu không dính Watermark</span>
                    <span className="text-[11px] text-slate-500">Giáo viên xuất file Word/PDF sạch sử dụng ngay</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={offlineUsable}
                    onChange={(e) => setOfflineUsable(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">Hỗ trợ dùng ngoại tuyến (Offline)</span>
                    <span className="text-[11px] text-slate-500">Có thể tải về máy tính chạy không cần kết nối mạng</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Tutorials & Video Guide */}
          {activeTab === 'tutorials' && (
            <div className="space-y-5">
              {/* YouTube Video Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-700" />
                    <span>Đường liên kết Video YouTube Hướng Dẫn Chính Thức</span>
                  </label>
                  {title && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent('Hướng dẫn sử dụng ' + title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Tìm video trên YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <input
                  type="url"
                  value={tutorialVideoUrl}
                  onChange={(e) => setTutorialVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                />

                {/* Live Preview Box */}
                {tutorialVideoUrl && getEmbedUrl(tutorialVideoUrl) ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Xem trước video (Đảm bảo video đúng với ứng dụng "{title || 'này'}"):
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-950 aspect-video max-w-md shadow-xs">
                      <iframe
                        src={getEmbedUrl(tutorialVideoUrl)!}
                        title="Xem trước video"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Nếu để trống, ứng dụng sẽ hiển thị nút tìm kiếm video chính xác trên YouTube và không phát nhầm video của ứng dụng khác.
                  </p>
                )}
              </div>

              {/* Step by step practical workflow */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      <span>Quy trình 4 bước thực hành sư phạm bám sát ứng dụng</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Soạn chi tiết từng bước để giáo viên và học sinh hiểu rõ cách thao tác và áp dụng vào tiết dạy GDPT 2018.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoSuggestSteps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-emerald-300 self-start sm:self-auto shrink-0 shadow-2xs"
                    title="Phân tích tên, môn học và tự động điền 4 bước chuẩn sư phạm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>AI gợi ý 4 bước theo môn học</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                        <span>Bước 1: Khởi động / Chuẩn bị & Chọn chuyên đề bài dạy</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Truy cập & thiết lập</span>
                    </label>
                    <textarea
                      rows={2}
                      value={step1}
                      onChange={(e) => setStep1(e.target.value)}
                      placeholder="VD: Bước 1: Mở liên kết chính thức, chọn khối lớp và dạng chuyên đề cần ôn tập..."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                        <span>Bước 2: Khám phá kiến thức / Tiếp cận ngữ liệu & Thực hành</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Thao tác chính của học sinh</span>
                    </label>
                    <textarea
                      rows={2}
                      value={step2}
                      onChange={(e) => setStep2(e.target.value)}
                      placeholder="VD: Bước 2: Đọc ngữ liệu ngoài SGK, phân tích đề bài, lập dàn ý luận điểm và tiến hành viết bài..."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                        <span>Bước 3: Luyện tập / Chấm chữa barem & Tương tác thông minh</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Phản hồi & đánh giá</span>
                    </label>
                    <textarea
                      rows={2}
                      value={step3}
                      onChange={(e) => setStep3(e.target.value)}
                      placeholder="VD: Bước 3: Nhận phản hồi tự động theo barem chuẩn của Bộ GD&ĐT: AI chỉ ra lỗi diễn đạt sáo rỗng, lỗi chính tả..."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">4</span>
                        <span>Bước 4: Vận dụng / Xuất học liệu & Tổng kết kinh nghiệm</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Hoàn thiện bài học</span>
                    </label>
                    <textarea
                      rows={2}
                      value={step4}
                      onChange={(e) => setStep4(e.target.value)}
                      placeholder="VD: Bước 4: Lưu bài làm mẫu tiêu biểu, xuất bảng điểm chi tiết và rút kinh nghiệm cho các kỳ thi thử tiếp theo..."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prompt mẫu gợi ý cho giáo viên
                  </label>
                  <textarea
                    rows={2}
                    value={samplePrompt}
                    onChange={(e) => setSamplePrompt(e.target.value)}
                    placeholder="Câu lệnh mẫu để sinh bài giảng/đề thi nhanh..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lời khuyên sư phạm (Tips for Teachers)
                  </label>
                  <textarea
                    rows={2}
                    value={tipsForTeachers}
                    onChange={(e) => setTipsForTeachers(e.target.value)}
                    placeholder="Lưu ý khi áp dụng vào tiết học thực tế..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  />
                </div>
              </div>

              {/* Articles Management */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    Bài viết cẩm nang & Tài liệu hướng dẫn ({articles.length})
                  </label>
                </div>

                {articles.map((art, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800">{art.title}</span>
                      <div className="text-[11px] text-slate-500">
                        Nguồn: <span className="font-semibold">{art.source}</span> · {art.readTime || '4 phút đọc'}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{art.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveArticle(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add Article Form */}
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70 space-y-2 text-xs">
                  <span className="font-semibold text-emerald-950 block">Thêm bài viết hướng dẫn mới:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tiêu đề bài viết..."
                      value={newArtTitle}
                      onChange={(e) => setNewArtTitle(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Nguồn (VD: Tạp chí Giáo dục, Diễn đàn GDPT)..."
                      value={newArtSource}
                      onChange={(e) => setNewArtSource(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="url"
                      placeholder="Đường link bài viết..."
                      value={newArtUrl}
                      onChange={(e) => setNewArtUrl(e.target.value)}
                      className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddArticle}
                      disabled={!newArtTitle || !newArtUrl}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:bg-slate-300"
                    >
                      + Thêm bài viết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Scores & Detailed Review */}
          {activeTab === 'pedagogy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Độ phù hợp chuẩn GDPT 2018 (Thang điểm 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={gdpt2018FitScore}
                    onChange={(e) => setGdpt2018FitScore(parseFloat(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm số kiểm duyệt an toàn sư phạm (Thang 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(parseFloat(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bài đánh giá thực nghiệm & Báo cáo kiểm định sư phạm chuyên sâu
                </label>
                <textarea
                  rows={5}
                  value={detailedReview}
                  onChange={(e) => setDetailedReview(e.target.value)}
                  placeholder="Ghi rõ kết quả chạy thử thực nghiệm: độ trễ, độ ổn định, khả năng đáp ứng Công văn 5512, ưu điểm và lưu ý thực tế..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:bg-slate-300"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang lưu dữ liệu...' : isNew ? 'Thêm mới ứng dụng' : 'Lưu toàn bộ thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
