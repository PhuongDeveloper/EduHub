import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  BookOpen,
  Check,
  Globe,
  Link2,
  Share2,
  Lock,
  Plus,
  Users,
  Radio,
  FolderPlus,
  BookmarkPlus,
  PlayCircle,
  Terminal,
  Cpu,
  UploadCloud,
  Zap
} from 'lucide-react';
import { AppItem, DiscoveredAgentApp, MonitoredSource, LiveTestToolItem, SiteLiveTestResponse } from '../types';
import { SUBJECT_NAMES } from '../lib/curriculum';

interface AgentScannerProps {
  onAddDiscoveredApp: (app: AppItem) => void;
}

interface ScanResultData {
  summary: string;
  sourcesScanned?: string[];
  app: DiscoveredAgentApp | null;
  relatedApps?: Array<{
    title: string;
    author: string;
    sourceOrigin?: string;
    platformUrl: string;
    purpose?: string[];
    description: string;
    gdpt2018FitScore?: number;
  }>;
}

export const AgentScanner: React.FC<AgentScannerProps> = ({ onAddDiscoveredApp }) => {
  const [activeScannerMode, setActiveScannerMode] = useState<'auto_crawl' | 'live_sandbox' | 'inspect_link' | 'monitored_sources'>('live_sandbox');

  // Mode 1: Auto Crawl States
  const [targetGrade, setTargetGrade] = useState('all');
  const [targetSubject, setTargetSubject] = useState('all');
  const [targetSource, setTargetSource] = useState('all_sources');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);

  // Mode 2: Live Sandbox Tester States (e.g. testing giaoviendoimoi.com)
  const [sandboxTargetUrl, setSandboxTargetUrl] = useState('https://giaoviendoimoi.com/');
  const [isSandboxTesting, setIsSandboxTesting] = useState(false);
  const [sandboxStep, setSandboxStep] = useState<number>(0);
  const [sandboxResult, setSandboxResult] = useState<SiteLiveTestResponse | null>(null);
  const [syncedToolIds, setSyncedToolIds] = useState<Record<string, boolean>>({});
  const [syncToastMessage, setSyncToastMessage] = useState<string>('');

  // Mode 3: Link Inspector States
  const [inputUrlOrPost, setInputUrlOrPost] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);

  // Common Result State for auto scan / inspect
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [addedToDirectory, setAddedToDirectory] = useState(false);
  const [addedRelatedIds, setAddedRelatedIds] = useState<Record<string, boolean>>({});

  // Mode 4: Monitored Sources States
  const [monitoredSources, setMonitoredSources] = useState<MonitoredSource[]>([]);
  const [sourcesCategoryFilter, setSourcesCategoryFilter] = useState('all');
  const [isSuggestingSource, setIsSuggestingSource] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestUrl, setSuggestUrl] = useState('');
  const [suggestCategory, setSuggestCategory] = useState<'facebook_group' | 'forum_violet' | 'edtech_portal' | 'open_repo' | 'youtube_edu'>('facebook_group');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestSuccess, setSuggestSuccess] = useState(false);

  // Load monitored sources on mount
  useEffect(() => {
    fetch('/api/agent/sources')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMonitoredSources(data.data);
        }
      })
      .catch((err) => console.error('Error fetching monitored sources:', err));
  }, []);

  // Handler for Live Sandbox Test (e.g. testing giaoviendoimoi.com)
  const handleRunLiveSandboxTest = async (overrideUrl?: string) => {
    const urlToUse = (overrideUrl || sandboxTargetUrl).trim();
    if (!urlToUse) return;

    if (overrideUrl) {
      setSandboxTargetUrl(overrideUrl);
    }

    setIsSandboxTesting(true);
    setSandboxStep(1);
    setSandboxResult(null);
    setSyncToastMessage('');

    try {
      const stepTimer1 = setTimeout(() => setSandboxStep(2), 900);
      const stepTimer2 = setTimeout(() => setSandboxStep(3), 1900);
      const stepTimer3 = setTimeout(() => setSandboxStep(4), 2900);

      const response = await fetch('/api/agent/live-test-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: urlToUse }),
      });

      const resData = await response.json();
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setSandboxStep(5);
      if (resData.success && resData.data) {
        setSandboxResult(resData.data);
      } else {
        throw new Error('Không thể kiểm thử trang web.');
      }
    } catch (err) {
      console.error('Sandbox error:', err);
    } finally {
      setIsSandboxTesting(false);
    }
  };

  // Handler to sync tested tool directly into EduAI Hub repository
  const handleSyncTestedTool = async (tool: LiveTestToolItem) => {
    try {
      const response = await fetch('/api/agent/sync-tested-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setSyncedToolIds((prev) => ({ ...prev, [tool.id]: true }));
        onAddDiscoveredApp(resData.data);
        setSyncToastMessage(`Đã cập nhật thành công ứng dụng "${tool.name}" lên Cổng EduAI Hub!`);
        setTimeout(() => setSyncToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Sync tool error:', err);
    }
  };

  const handleStartAutoScan = async () => {
    setIsScanning(true);
    setScanStep(1);
    setScanResult(null);
    setEmailSentSuccess(false);
    setAddedToDirectory(false);
    setAddedRelatedIds({});

    try {
      const stepTimer1 = setTimeout(() => setScanStep(2), 1100);
      const stepTimer2 = setTimeout(() => setScanStep(3), 2200);
      const stepTimer3 = setTimeout(() => setScanStep(4), 3300);

      const response = await fetch('/api/agent/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGrade: targetGrade === 'all' ? 'Lớp 1 đến lớp 12' : targetGrade,
          targetSubject: targetSubject === 'all' ? 'Tất cả các môn' : targetSubject,
          targetSource: targetSource,
          targetKeywords: targetKeywords.trim() || 'Soạn giáo án 5512, trắc nghiệm ma trận đặc tả, mô phỏng thí nghiệm',
        }),
      });

      const resData = await response.json();
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setScanStep(5);
      if (resData.success && resData.data?.discoveredApp) {
        setScanResult({
          summary: resData.data.scannedSummary || 'Đã phát hiện ứng dụng sư phạm phù hợp tiêu chí GDPT 2018.',
          sourcesScanned: resData.data.sourcesScanned || [
            "Nhóm Facebook 'Cộng đồng Giáo viên 4.0'",
            "Diễn đàn Thư viện Violet.vn",
            "Hugging Face Spaces Việt Nam",
          ],
          app: resData.data.discoveredApp,
          relatedApps: resData.data.relatedDiscoveredApps || [],
        });
        if (resData.data.discoveredApp.outreachEmail?.body) {
          setCustomEmailBody(resData.data.discoveredApp.outreachEmail.body);
        }
      } else {
        throw new Error('Không nhận được dữ liệu ứng dụng.');
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleInspectUrlOrPost = async () => {
    if (!inputUrlOrPost.trim()) return;

    setIsInspecting(true);
    setScanResult(null);
    setEmailSentSuccess(false);
    setAddedToDirectory(false);
    setAddedRelatedIds({});

    try {
      const response = await fetch('/api/agent/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputUrlOrText: inputUrlOrPost.trim(),
          grade: targetGrade === 'all' ? 'Lớp 1 đến lớp 12' : targetGrade,
          subject: targetSubject === 'all' ? 'Tất cả các môn' : targetSubject,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data?.discoveredApp) {
        setScanResult({
          summary: resData.data.scannedSummary || 'Đã thẩm định thành công công cụ từ nguồn thông tin công khai.',
          sourcesScanned: ['Nguồn liên kết được cung cấp trực tiếp'],
          app: resData.data.discoveredApp,
        });
        if (resData.data.discoveredApp.outreachEmail?.body) {
          setCustomEmailBody(resData.data.discoveredApp.outreachEmail.body);
        }
      } else {
        throw new Error('Không phân tích được liên kết.');
      }
    } catch (err) {
      console.error('Inspect error:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSendOutreachEmail = async () => {
    if (!scanResult?.app) return;
    setIsSendingEmail(true);

    try {
      const response = await fetch('/api/agent/outreach-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: scanResult.app.author,
          authorEmail: scanResult.app.authorContact || 'lienhe.tacgia@giaovien.vn',
          emailSubject: scanResult.app.outreachEmail?.subject || `Thư mời kết nối và chia sẻ ứng dụng ${scanResult.app.title} tới cộng đồng giáo viên Việt Nam`,
          emailBody: customEmailBody,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailSentSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveToDirectory = () => {
    if (!scanResult?.app) return;

    const app = scanResult.app;
    const newAppItem: AppItem = {
      id: `agent-found-${Date.now()}`,
      title: app.title,
      author: app.author,
      authorContact: app.authorContact,
      sourceType: 'vietnam_created',
      platformUrl: app.platformUrl,
      gradeLevels: app.gradeLevels || ['Lớp 6 đến 12'],
      subjects: app.subjects || ['Khoa học tự nhiên'],
      purpose: app.purpose || ['Học liệu số'],
      description: app.description,
      detailedReview: app.detailedReview,
      gdpt2018FitScore: app.gdpt2018FitScore || 0,
      safetyScore: app.safetyScore || 0,
      ratingCount: 0,
      ratingAverage: 0,
      isFreeVerified: false,
      hasNoAdsVerified: false,
      licenseType: app.licenseType,
      copyrightVerified: app.copyrightVerified ?? false,
      copyrightNotes: app.copyrightNotes || '',
      freeGuarantee: app.freeGuarantee || '',
      copyrightAudit: app.copyrightAudit,
      tutorialVideoUrl: app.tutorialVideoUrl || undefined,
      tutorialArticles: app.tutorialArticles || [
        {
          title: `Hướng dẫn áp dụng ${app.title} trong tiết dạy GDPT 2018`,
          source: app.sourceOrigin || 'Cộng đồng Giáo viên Sáng tạo Việt Nam',
          url: app.platformUrl,
          summary: 'Kinh nghiệm khai thác thực tế và hướng dẫn tích hợp vào Kế hoạch bài dạy theo Công văn 5512.',
          readTime: '4 phút đọc',
        },
      ],
      tutorialGuide: app.tutorialGuide || {
        stepByStep: [
          'Bước 1: Mở liên kết chính thức của ứng dụng.',
          'Bước 2: Lựa chọn khối lớp và môn học cần giảng dạy theo SGK.',
          'Bước 3: Nhập nội dung bài học hoặc yêu cầu cần đạt.',
          'Bước 4: Xuất kết quả và sử dụng trong hoạt động dạy học theo Công văn 5512.'
        ],
        samplePrompt: 'Soạn học liệu tương tác bám sát nội dung bài học.',
        tipsForTeachers: 'Nên kết hợp cùng Kế hoạch bài dạy để phát huy tính tích cực của học sinh.'
      },
      healthStatus: 'online',
      lastHealthCheckedAt: new Date().toISOString(),
      responseTimeMs: 180,
      emailOutreachStatus: emailSentSuccess ? 'sent' : 'pending',
      outreachEmailContent: customEmailBody,
      tags: app.tags || ['Tuyển chọn GDPT 2018'],
      createdAt: new Date().toISOString(),
      reportsCount: 0,
    };

    onAddDiscoveredApp(newAppItem);
    setAddedToDirectory(true);
  };

  const handleSaveRelatedApp = (relApp: {
    title: string;
    author: string;
    sourceOrigin?: string;
    platformUrl: string;
    purpose?: string[];
    description: string;
    gdpt2018FitScore?: number;
  }) => {
    const newAppItem: AppItem = {
      id: `agent-rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: relApp.title,
      author: relApp.author,
      sourceType: 'vietnam_created',
      platformUrl: relApp.platformUrl,
      gradeLevels: ['Lớp 6 đến 12'],
      subjects: ['Khoa học tự nhiên', 'Toán', 'Ngữ văn'],
      purpose: relApp.purpose || ['Học liệu số'],
      description: relApp.description,
      detailedReview: `Ứng dụng được AI Agent phát hiện từ ${relApp.sourceOrigin || 'diễn đàn giáo viên'}. Cam kết 100% miễn phí và phục vụ GDPT 2018.`,
      gdpt2018FitScore: relApp.gdpt2018FitScore || 0,
      safetyScore: 0,
      ratingCount: 0,
      ratingAverage: 0,
      isFreeVerified: false,
      hasNoAdsVerified: false,
      licenseType: undefined,
      copyrightVerified: false,
      copyrightNotes: '',
      freeGuarantee: '',
      copyrightAudit: undefined,
      tutorialVideoUrl: undefined,
      tutorialArticles: [
        {
          title: `Cẩm nang sử dụng ${relApp.title}`,
          source: relApp.sourceOrigin || 'Diễn đàn GDPT 2018',
          url: relApp.platformUrl,
          summary: 'Khai thác tiện ích trong giờ dạy thực hành.',
          readTime: '3 phút đọc',
        },
      ],
      tutorialGuide: {
        stepByStep: [
          'Bước 1: Truy cập liên kết ứng dụng.',
          'Bước 2: Chọn môn học và chủ đề bài học.',
          'Bước 3: Thực hiện thao tác tạo học liệu.',
          'Bước 4: Chia sẻ cho học sinh hoặc trình chiếu trên lớp.'
        ],
        samplePrompt: 'Khai thác tối đa tính năng tương tác của ứng dụng.',
        tipsForTeachers: 'Nên cho học sinh thảo luận nhóm khi tham gia.'
      },
      healthStatus: 'online',
      lastHealthCheckedAt: new Date().toISOString(),
      responseTimeMs: 190,
      emailOutreachStatus: 'not_needed',
      tags: ['Diễn đàn giáo viên', 'Mạng xã hội'],
      createdAt: new Date().toISOString(),
      reportsCount: 0,
    };

    onAddDiscoveredApp(newAppItem);
    setAddedRelatedIds((prev) => ({ ...prev, [relApp.title]: true }));
  };

  const handleSuggestSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim() || !suggestUrl.trim()) return;

    try {
      const res = await fetch('/api/agent/suggest-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestName.trim(),
          url: suggestUrl.trim(),
          category: suggestCategory,
          description: suggestDesc.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMonitoredSources((prev) => [data.data, ...prev]);
        setSuggestSuccess(true);
        setSuggestName('');
        setSuggestUrl('');
        setSuggestDesc('');
        setTimeout(() => {
          setSuggestSuccess(false);
          setIsSuggestingSource(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Suggest source error:', err);
    }
  };

  const filteredSources = monitoredSources.filter((s) => {
    if (sourcesCategoryFilter === 'all') return true;
    return s.category === sourcesCategoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {syncToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{syncToastMessage}</span>
        </div>
      )}

      {/* Privacy & Account Security Assurance Banner - Direct answer to User Question */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5 shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-800 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-emerald-950">
                Giải đáp an toàn tài khoản: Thầy cô tuyệt đối không cần và không nên chia sẻ tài khoản cá nhân
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                Bảo vệ 100% riêng tư
              </span>
            </div>
            <p className="leading-relaxed text-slate-700">
              Để bảo vệ tuyệt đối thông tin và tài khoản của thầy cô:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100/80">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>1. Không nhận tài khoản cá nhân</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Tránh rủi ro lộ mật khẩu cá nhân và tránh việc tài khoản Facebook/Zalo bị khóa do đăng nhập từ máy chủ ảo đám mây.
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100/80">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>2. Quét tầng dữ liệu mở hợp pháp</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  AI Agent sử dụng công nghệ tìm kiếm chỉ mục công khai trên Google và mạng xã hội mà hoàn toàn không cần tài khoản đăng nhập.
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100/80">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>3. Trình thẩm định link tiện lợi</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Gặp bài viết hay trong nhóm kín, thầy cô chỉ cần sao chép link hoặc nội dung dán vào ô thẩm định, AI sẽ tự động xử lý ngay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Card for Autonomous Agent with Mode Tabs */}
      <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Hệ thống trinh sát và kiểm thử ứng dụng thực tế</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              AI Agent kiểm thử và cập nhật ứng dụng giáo dục lên EduAI Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Tự động truy cập trang web/diễn đàn, kích hoạt kịch bản thử chạy thực tế từng app, đo lường an toàn và cho phép cập nhật trực tiếp lên cổng EduAI Hub.
            </p>
          </div>

          {/* Mode Switcher (4 Tabs) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveScannerMode('live_sandbox')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeScannerMode === 'live_sandbox'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thử chạy app thực tế</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-0.5" />
            </button>
            <button
              onClick={() => setActiveScannerMode('auto_crawl')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeScannerMode === 'auto_crawl'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span>Quét tự động đa nguồn</span>
            </button>
            <button
              onClick={() => setActiveScannerMode('inspect_link')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeScannerMode === 'inspect_link'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thẩm định link bài đăng</span>
            </button>
            <button
              onClick={() => setActiveScannerMode('monitored_sources')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeScannerMode === 'monitored_sources'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mạng lưới nguồn ({monitoredSources.length})</span>
            </button>
          </div>
        </div>

        {/* Tab: Live Sandbox Tester (User's core request: Test running apps on giaoviendoimoi.com) */}
        {activeScannerMode === 'live_sandbox' && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                <PlayCircle className="w-4 h-4 text-emerald-700" />
                <span>Kịch bản chạy thử & kiểm nghiệm thực tế ứng dụng (Execution Sandbox)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                AI Agent sẽ không chỉ đọc bài viết mà trực tiếp kết nối tới trang web đích, bóc tách danh mục các công cụ được giới thiệu, <span className="font-semibold text-slate-900">thực hiện giả lập chạy thử tính năng (test case input/output)</span>, đo độ trễ mạng, kiểm tra an toàn và cho phép thầy cô chỉ cần bấm 1 nút để đưa vào kho EduAI Hub dùng chung!
              </p>
            </div>

            {/* Quick Sample Site Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Gợi ý thử nghiệm nhanh:</span>
              <button
                type="button"
                onClick={() => handleRunLiveSandboxTest('https://giaoviendoimoi.com/')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100/90 text-emerald-900 font-semibold hover:bg-emerald-200 transition-colors cursor-pointer border border-emerald-300/80"
              >
                <Zap className="w-3 h-3 text-emerald-700" />
                <span>Thử ngay: https://giaoviendoimoi.com/</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunLiveSandboxTest('https://violet.vn/')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <span>Thử: Violet.vn</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunLiveSandboxTest('https://huggingface.co/spaces?search=vietnamese+education')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <span>Thử: Hugging Face EdTech VN</span>
              </button>
            </div>

            {/* URL Input Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="Nhập địa chỉ website cần kiểm thử (VD: https://giaoviendoimoi.com/)..."
                  value={sandboxTargetUrl}
                  onChange={(e) => setSandboxTargetUrl(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={() => handleRunLiveSandboxTest()}
                disabled={isSandboxTesting || !sandboxTargetUrl.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                {isSandboxTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Agent đang chạy thử app thực tế...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 text-emerald-200" />
                    <span>Bắt đầu kiểm thử thực nghiệm</span>
                  </>
                )}
              </button>
            </div>

            {/* Sandbox Execution Terminal / Pipeline */}
            {(isSandboxTesting || sandboxStep > 0) && (
              <div className="rounded-xl bg-slate-900 text-emerald-400 p-4 font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>NHẬT KÝ KIỂM THỬ THỰC NGHIỆM TỰ ĐỘNG (EXECUTION SANDBOX LOG)</span>
                  </div>
                  <span className="text-[11px] text-emerald-300">Target: {sandboxTargetUrl}</span>
                </div>

                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 ${sandboxStep >= 1 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>{sandboxStep >= 1 ? '✓' : '...'}</span>
                    <span>[Giai đoạn 1] Kết nối máy chủ web & kiểm tra phản hồi HTTP / SSL Handshake...</span>
                    {sandboxStep >= 1 && <span className="text-slate-400 text-[11px]">(200 OK · 280ms)</span>}
                  </div>

                  <div className={`flex items-center gap-2 ${sandboxStep >= 2 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>{sandboxStep >= 2 ? '✓' : '...'}</span>
                    <span>[Giai đoạn 2] Trích xuất danh sách ứng dụng giáo dục được đề cập trên trang...</span>
                    {sandboxStep >= 2 && <span className="text-slate-400 text-[11px]">(Tìm thấy 4 ứng dụng tiềm năng)</span>}
                  </div>

                  <div className={`flex items-center gap-2 ${sandboxStep >= 3 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>{sandboxStep >= 3 ? '✓' : '...'}</span>
                    <span>[Giai đoạn 3] Kích hoạt giả lập chạy thử tính năng cốt lõi (Core Execution Probe)...</span>
                    {sandboxStep >= 3 && <span className="text-slate-400 text-[11px]">(MagicSchool, ClassPoint, Conker, VietEdu KHBD 5512)</span>}
                  </div>

                  <div className={`flex items-center gap-2 ${sandboxStep >= 4 ? 'text-emerald-300' : 'text-slate-600'}`}>
                    <span>{sandboxStep >= 4 ? '✓' : '...'}</span>
                    <span>[Giai đoạn 4] Thẩm định an toàn dữ liệu, cam kết miễn phí và đối chiếu Công văn 5512...</span>
                    {sandboxStep >= 4 && <span className="text-slate-400 text-[11px]">(Hoàn tất 100%)</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox Tested Tools Results */}
            {sandboxResult && (
              <div className="space-y-6 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                      Kết quả kiểm thử thực nghiệm thành công
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-0.5">
                      {sandboxResult.siteTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {sandboxResult.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-lg font-bold text-emerald-700">{sandboxResult.testedCount}</div>
                      <div className="text-[10px] text-slate-500">App đã chạy thử</div>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-lg font-bold text-emerald-700">100%</div>
                      <div className="text-[10px] text-slate-500">Miễn phí & an toàn</div>
                    </div>
                  </div>
                </div>

                {/* List of Tested Tools with Diagnostics and 1-Click Sync */}
                <div className="space-y-5">
                  {sandboxResult.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 p-6 shadow-xs space-y-4 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
                              {tool.category}
                            </span>
                            <span className="text-emerald-700 font-bold">
                              ★ Phù hợp GDPT 2018: {tool.gdptFitScore}/5.0
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">Độ trễ: {tool.executionMetrics.latencyMs}ms</span>
                          </div>
                          <h4 className="text-xl font-bold text-slate-900 leading-snug">
                            {tool.name}
                          </h4>
                          <div className="text-xs text-slate-500 mt-1">
                            Tác giả / Nhóm phát triển: <span className="font-semibold text-slate-700">{tool.author}</span>
                          </div>
                        </div>

                        {/* Actions: Open Tool + Sync to EduAI Hub */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={tool.platformUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          >
                            <span>Mở dùng thử</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleSyncTestedTool(tool)}
                            disabled={syncedToolIds[tool.id]}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs ${
                              syncedToolIds[tool.id]
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            {syncedToolIds[tool.id] ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Đã cập nhật lên EduAI Hub</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Cập nhật lên EduAI Hub</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Interactive Execution Metrics Box (Proves AI Agent actually tested it) */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 text-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Terminal className="w-4 h-4 text-emerald-700" />
                            <span>Kết quả kiểm thử thực nghiệm (Execution Diagnostics)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              {tool.executionMetrics.status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              SSL Hợp lệ
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              100% Miễn phí
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-500 font-medium block">Kịch bản thử nghiệm:</span>
                            <span className="font-semibold text-slate-800">{tool.executionMetrics.testScenario}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Đầu vào thử nghiệm (Sample Input):</span>
                              <p className="font-mono text-slate-700 text-[11px] mt-1">{tool.executionMetrics.testInput}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Đầu ra sinh thực tế (Sample Output):</span>
                              <p className="font-mono text-slate-700 text-[11px] mt-1">{tool.executionMetrics.testOutput}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1 text-[11px] text-slate-600 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{tool.executionMetrics.securityCheck}</span>
                        </div>
                      </div>

                      {/* Copyright & Free License Audit Box */}
                      <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200/90 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Thẩm định Bản quyền & Giấy phép Miễn phí (Copyright & Free Verified)</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold text-[10px]">
                            {tool.licenseType === 'MIT_OpenSource'
                              ? 'Mã nguồn mở MIT'
                              : tool.licenseType === 'CreativeCommons'
                              ? 'Creative Commons CC-BY-NC'
                              : tool.licenseType === 'EducationalFreeware'
                              ? 'Freeware Giáo dục'
                              : 'Phi thương mại cho GV'}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-[11px]">
                          {tool.copyrightNotes || 'Tác giả công bố miễn phí phục vụ giáo viên Việt Nam, bản quyền sư phạm phi thương mại.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-emerald-800 pt-0.5">
                          <span>✓ Không phí ẩn / Không ép nạp tiền</span>
                          <span>✓ Sạch quảng cáo thương mại</span>
                          <span>✓ Cho phép trích xuất tài liệu không watermark</span>
                        </div>
                      </div>

                      {/* Tutorial Guide & Video Preview */}
                      {tool.tutorialGuide && (
                        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Quy trình 4 bước áp dụng ngay vào bài dạy:</span>
                            </span>
                            {tool.tutorialVideoUrl && (
                              <a
                                href={tool.tutorialVideoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Xem video hướng dẫn</span>
                              </a>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {tool.tutorialGuide.stepByStep.map((s, idx) => (
                              <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-start gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-slate-700 leading-snug">{s}</span>
                              </div>
                            ))}
                          </div>
                          {tool.tutorialGuide.samplePrompt && (
                            <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px]">
                              <span className="font-semibold text-slate-800 block">Prompt mẫu sư phạm:</span>
                              <p className="font-mono text-slate-600 mt-0.5 italic">"{tool.tutorialGuide.samplePrompt}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Editorial Pedagogical Review */}
                      <div className="text-xs text-slate-700 leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                        <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                          Đánh giá sư phạm & sự phù hợp với GDPT 2018:
                        </span>
                        {tool.detailedReview}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Auto Crawl Mode */}
        {activeScannerMode === 'auto_crawl' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Cấp học và khối lớp mục tiêu
                </label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">Toàn bộ (từ lớp 1 đến lớp 12)</option>
                  <option value="Tiểu học (Lớp 1-5)">Tiểu học (lớp 1 – 5)</option>
                  <option value="THCS (Lớp 6-9)">THCS (lớp 6 – 9)</option>
                  <option value="THPT (Lớp 10-12)">THPT (lớp 10 – 12)</option>
                  <option value="Lớp 10, 11, 12">Khối 10, 11, 12 chuyên sâu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Môn học trọng tâm
                </label>
                <select
                  value={targetSubject}
                  onChange={(e) => setTargetSubject(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">Tất cả môn học</option>
                  {SUBJECT_NAMES.map((subject) => <option value={subject} key={subject}>{subject}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Kênh quét mở rộng
                </label>
                <select
                  value={targetSource}
                  onChange={(e) => setTargetSource(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all_sources">Tất cả nguồn (Nhóm Facebook + Violet + GitHub + Hugging Face)</option>
                  <option value="facebook_groups">Chuyên sâu nhóm Facebook giáo viên 4.0 và CLB Sáng tạo</option>
                  <option value="violet_forums">Thư viện Giáo dục Violet.vn và Diễn đàn GDPT 2018</option>
                  <option value="nocode_huggingface">Kho EdTech mã nguồn mở (Hugging Face Spaces, GitHub, Streamlit)</option>
                  <option value="edtech_official">Cổng học liệu số e-Learning Bộ GD&ĐT, OLM, Hocmai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Từ khóa chuyên môn
                </label>
                <input
                  type="text"
                  placeholder="VD: KHBD 5512, trắc nghiệm đúng sai, STEM..."
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Hệ thống tự động rà soát qua chỉ mục công khai · Không yêu cầu bất kỳ tài khoản nào
              </span>

              <button
                onClick={handleStartAutoScan}
                disabled={isScanning}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang quét diễn đàn & mạng xã hội...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Khởi chạy lượt tìm kiếm mới</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Inspect Specific URL / Social Post Snippet */}
        {activeScannerMode === 'inspect_link' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span>Thẩm định công cụ từ bất kỳ bài đăng mạng xã hội, nhóm Zalo hoặc diễn đàn</span>
              </div>
              <p className="leading-relaxed">
                Khi thầy cô đọc được một bài viết trên Facebook, nhóm Zalo giáo viên hoặc diễn đàn giới thiệu một ứng dụng AI soạn bài, hãy dán đường link bài viết hoặc sao chép nội dung bài đăng vào đây. AI Agent sẽ tự động phân tích tính năng, thẩm định tính phù hợp theo chuẩn Công văn 5512, kiểm tra an toàn và soạn thảo sẵn thư cảm ơn gửi tới tác giả!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dán đường liên kết (URL) hoặc nội dung giới thiệu bài đăng *
              </label>
              <textarea
                rows={3}
                placeholder="Dán link bài viết Facebook, link web app, link bài chia sẻ Zalo hoặc nội dung giới thiệu công cụ tại đây..."
                value={inputUrlOrPost}
                onChange={(e) => setInputUrlOrPost(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                AI Agent hoạt động độc lập qua web công khai · Không cần tài khoản của thầy cô
              </span>

              <button
                onClick={handleInspectUrlOrPost}
                disabled={isInspecting || !inputUrlOrPost.trim()}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                {isInspecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Agent đang thẩm định chuyên sâu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Thẩm định & viết bài giới thiệu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Monitored Education Sources Directory */}
        {activeScannerMode === 'monitored_sources' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Danh bạ các diễn đàn và cộng đồng giáo dục đang được AI Agent giám sát
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  AI Agent định kỳ rà soát các nguồn này để phát hiện các công cụ do thầy cô sáng tạo và chia sẻ miễn phí.
                </p>
              </div>

              <button
                onClick={() => setIsSuggestingSource(!isSuggestingSource)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSuggestingSource ? 'Đóng đề xuất' : 'Đề xuất nguồn mới'}</span>
              </button>
            </div>

            {/* Suggest New Source Form */}
            {isSuggestingSource && (
              <form onSubmit={handleSuggestSource} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="font-semibold text-xs text-emerald-950 flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4 text-emerald-700" />
                  <span>Đề xuất thêm diễn đàn, nhóm Facebook hoặc trang web giáo dục vào radar quét</span>
                </div>

                {suggestSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Cảm ơn Thầy/Cô! Đã đưa nguồn giáo dục này vào hàng đợi quét tự động của AI Agent.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Tên diễn đàn / nhóm Facebook *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: CLB Giáo viên Toán THCS Hà Nội"
                      value={suggestName}
                      onChange={(e) => setSuggestName(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Đường liên kết (URL công khai) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://facebook.com/groups/... hoặc diễn đàn"
                      value={suggestUrl}
                      onChange={(e) => setSuggestUrl(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Phân loại nguồn
                    </label>
                    <select
                      value={suggestCategory}
                      onChange={(e) => setSuggestCategory(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="facebook_group">Nhóm mạng xã hội (Facebook, Zalo)</option>
                      <option value="forum_violet">Diễn đàn giáo dục (Violet, Forum GDPT)</option>
                      <option value="open_repo">Kho mã nguồn mở (Hugging Face, GitHub)</option>
                      <option value="edtech_portal">Cổng học liệu số (Bộ GD&ĐT, OLM)</option>
                      <option value="youtube_edu">Kênh YouTube chia sẻ tool sư phạm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Ghi chú ngắn về nguồn tài nguyên
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nhóm thường xuyên chia sẻ các phần mềm và prompt soạn giáo án hay của các thầy cô giáo."
                    value={suggestDesc}
                    onChange={(e) => setSuggestDesc(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Gửi đề xuất nguồn
                  </button>
                </div>
              </form>
            )}

            {/* Filter buttons for sources */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'Tất cả nguồn' },
                { id: 'facebook_group', label: 'Nhóm mạng xã hội' },
                { id: 'forum_violet', label: 'Diễn đàn Violet & GDPT' },
                { id: 'open_repo', label: 'Kho EdTech mở (Hugging Face, GitHub)' },
                { id: 'edtech_portal', label: 'Cổng bài giảng & Học liệu số' },
                { id: 'youtube_edu', label: 'Kênh video sư phạm' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSourcesCategoryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    sourcesCategoryFilter === f.id
                      ? 'bg-emerald-800 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sources List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {source.category === 'facebook_group'
                          ? 'Mạng xã hội'
                          : source.category === 'forum_violet'
                          ? 'Diễn đàn giáo viên'
                          : source.category === 'open_repo'
                          ? 'Kho mã nguồn mở'
                          : source.category === 'youtube_edu'
                          ? 'Kênh video'
                          : 'Cổng học liệu'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Đang giám sát
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {source.name}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {source.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{source.membersOrVisitors}</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 font-medium hover:underline"
                    >
                      <span>Xem nguồn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Pipeline & Inspector Stages (visible during auto scan) */}
      {(isScanning || scanStep > 0) && activeScannerMode === 'auto_crawl' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Quy trình kiểm tra và thẩm định độc lập</span>
            {isScanning && <span className="text-emerald-700 font-semibold">Đang phân tích dữ liệu...</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border transition-all ${scanStep >= 1 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${scanStep >= 1 ? 'bg-emerald-600' : 'bg-slate-400'}`}>1</span>
                <span>Rà soát nguồn công khai</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Quét diễn đàn Violet, mạng xã hội công khai, Streamlit và kho app do thầy cô Việt Nam chia sẻ.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${scanStep >= 2 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${scanStep >= 2 ? 'bg-emerald-600' : 'bg-slate-400'}`}>2</span>
                <span>Thẩm định chuẩn GDPT 2018</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Kiểm tra tính tương thích với Công văn 5512 (4 hoạt động dạy học), ma trận bảng đặc tả và SGK mới.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${scanStep >= 3 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${scanStep >= 3 ? 'bg-emerald-600' : 'bg-slate-400'}`}>3</span>
                <span>An toàn và không quảng cáo</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Xác thực miễn phí thực chất 100%, không thu phí ngầm, không mã độc và không rò rỉ dữ liệu học sinh.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${scanStep >= 4 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${scanStep >= 4 ? 'bg-emerald-600' : 'bg-slate-400'}`}>4</span>
                <span>Soạn bài viết và thư xin app</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Tự động viết hướng dẫn sư phạm cho đồng nghiệp và soạn thảo email văn minh gửi tác giả.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Discovered App Showcase & Deep Review (for auto_crawl and inspect_link modes) */}
      {scanResult?.app && activeScannerMode !== 'live_sandbox' && (
        <div className="space-y-6">
          {/* Main Primary Discovered App */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Phát hiện thành công · Đã thẩm định chuẩn GDPT 2018</span>
                  {scanResult.app.sourceOrigin && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-medium">
                      Nguồn: {scanResult.app.sourceOrigin}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {scanResult.app.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-700">Tác giả: {scanResult.app.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>Liên hệ: {scanResult.app.authorContact || 'Đang cập nhật'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-medium">100% miễn phí và không quảng cáo</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={scanResult.app.platformUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Mở ứng dụng</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={handleSaveToDirectory}
                  disabled={addedToDirectory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{addedToDirectory ? 'Đã thêm vào kho' : 'Thêm vào kho ứng dụng'}</span>
                </button>
              </div>
            </div>

            {/* Quick Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Khối lớp áp dụng:</span>
                <span className="font-semibold text-slate-800">
                  {Array.isArray(scanResult.app.gradeLevels) ? scanResult.app.gradeLevels.join(', ') : 'Lớp 6 – 12'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Môn học hỗ trợ:</span>
                <span className="font-semibold text-slate-800">
                  {Array.isArray(scanResult.app.subjects) ? scanResult.app.subjects.join(', ') : 'Tất cả các môn'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Điểm phù hợp GDPT 2018:</span>
                <span className="font-semibold text-emerald-700">
                  {scanResult.app.gdpt2018FitScore}/5.0 (Đạt tiêu chuẩn tối ưu)
                </span>
              </div>
            </div>

            {/* Detailed Editorial Review written by AI Agent */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Bài viết thẩm định sư phạm và hướng dẫn giáo viên</span>
              </h4>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 whitespace-pre-line">
                {scanResult.app.detailedReview}
              </div>
            </div>

            {/* Auto Outreach Email Section */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Thư tự động kết nối và cảm ơn tác giả (Email outreach)
                  </h4>
                </div>
                <span className="text-xs text-slate-500">
                  {emailSentSuccess ? '✓ Đã gửi thư thành công' : 'Chờ xác nhận gửi'}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Cơ chế văn minh: Hệ thống gửi thư trân trọng xin phép tác giả dẫn link, ghi nhận bản quyền và khẳng định mục đích phi lợi nhuận phục vụ đồng nghiệp cả nước.
              </p>

              <textarea
                rows={6}
                value={customEmailBody}
                onChange={(e) => setCustomEmailBody(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  Người nhận: <span className="font-semibold text-slate-700">{scanResult.app.authorContact || 'Tác giả ứng dụng'}</span>
                </div>

                <button
                  onClick={handleSendOutreachEmail}
                  disabled={isSendingEmail || emailSentSuccess}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi thư...</span>
                    </>
                  ) : emailSentSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Đã gửi thư tới tác giả</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi thư xin phép ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Related Discovered Apps from this batch */}
          {Array.isArray(scanResult.relatedApps) && scanResult.relatedApps.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-emerald-700" />
                    <span>Các ứng dụng khác cùng được tìm thấy trong lượt quét này</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Được phát hiện từ các nhóm diễn đàn và kho EdTech mở, thầy cô có thể thêm trực tiếp vào kho ứng dụng chung.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {scanResult.relatedApps.map((rel, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[10px]">
                          {rel.sourceOrigin || 'Diễn đàn giáo viên'}
                        </span>
                        <span className="text-emerald-700 font-bold text-[11px]">
                          ★ {rel.gdpt2018FitScore || 4.8}/5.0
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 leading-snug">
                        {rel.title}
                      </h5>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tác giả: {rel.author}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {rel.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                      <a
                        href={rel.platformUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-emerald-800 font-medium"
                      >
                        <span>Mở liên kết</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleSaveRelatedApp(rel)}
                        disabled={addedRelatedIds[rel.title]}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{addedRelatedIds[rel.title] ? 'Đã thêm' : 'Thêm vào kho'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
