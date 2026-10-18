import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Flag,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
  AlertTriangle,
  Sparkles,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ContentReportQueue } from './ProjectCommunityPanel';
import { TalkReportQueue } from './TalkReportQueue';
import { AdminOperationsPanel } from './AdminOperationsPanel';
import { AppleModerationModal, QueueProject, AdminAttachment } from './AppleModerationModal';
import { ModerationFeedback, parseModerationNote, serializeModerationNote } from '../lib/moderation';
import { supabase } from '../lib/supabase';

type AdminUser = {
  profile_id: string;
  email: string;
  full_name: string;
  school_name: string | null;
  subject_specialty: string | null;
  role: 'teacher' | 'admin';
  teacher_verified: boolean;
  created_at: string;
  edu_points: number;
};

type PageVisit = { visitor_id: string; path: string; created_at: string };

type ResourceRow = {
  id: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  subjects?: string[] | null;
  grade_levels?: string[] | null;
  moderation_status: string;
  moderation_note?: string | null;
  created_at: string;
  resource_type: string;
  cover_url?: string | null;
  description_images?: string[] | null;
  video_url?: string | null;
  usage_guide?: string | null;
  platform_url?: string | null;
  download_url?: string | null;
  website_html?: string | null;
  website_slug?: string | null;
  upvotes_count?: number;
  downloads_count?: number;
  rating_avg?: number;
  rating_count?: number;
  author?: {
    id?: string;
    full_name?: string;
    school_name?: string | null;
    avatar_url?: string | null;
  };
};

type Tab = 'overview' | 'projects' | 'people' | 'reports' | 'support' | 'audit' | 'verification' | 'revisions';

const dateLabel = (date: Date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

const safeExternalUrl = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const safePreviewProject = (project: QueueProject): QueueProject => ({
  ...project,
  coverUrl: safeExternalUrl(project.coverUrl),
  descriptionImages: (project.descriptionImages || []).filter((url) => Boolean(safeExternalUrl(url))),
  videoUrl: safeExternalUrl(project.videoUrl),
  url: safeExternalUrl(project.url),
  downloadUrl: safeExternalUrl(project.downloadUrl),
});

const SAMPLE_ADMIN_PROJECTS: QueueProject[] = [
  {
    id: 'sample-p2',
    sourceId: 'sample-p2',
    title: 'Giáo án điện tử PowerPoint & Minigame: Bài 12 - Quang hợp ở thực vật (Sinh 11)',
    description: 'Bộ học liệu gồm slide thuyết trình tương tác, video mô phỏng chu trình Calvin, phiếu học tập 5512 và trò chơi củng cố kiến thức bằng Quizizz.',
    subject: 'Sinh học',
    subjects: ['Sinh học'],
    grades: ['Lớp 11'],
    teacher: 'Lê Thị Mai Hoa',
    school: 'THPT Chuyên Hà Nội - Amsterdam',
    format: 'Bài giảng điện tử',
    moderationStatus: 'pending',
    coverUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/example-leaf-photosynthesis',
    url: 'https://quizizz.com/join/example-quang-hop',
    usageGuide: 'Sử dụng cho tiết 1 và tiết 2 bài Quang hợp ở thực vật. Giáo viên mở slide PowerPoint trên lớp, kết hợp cho học sinh thảo luận nhóm qua phiếu học tập.',
    votes: 12,
    downloads: 48,
    ratingAvg: 4.8,
    ratingCount: 6,
  },
  {
    id: 'sample-p3',
    sourceId: 'sample-p3',
    title: 'Phần mềm mô phỏng 3D: Cấu tạo bảng tuần hoàn các nguyên tố hóa học',
    description: 'Mô phỏng 3D các nguyên tố Hóa học 10, cấu hình electron và xu hướng biến đổi bán kính nguyên tử trực quan trên nền tảng WebGL.',
    subject: 'Hóa học',
    subjects: ['Hóa học'],
    grades: ['Lớp 10'],
    teacher: 'Nguyễn Văn Hùng',
    school: 'THPT Chu Văn An',
    format: 'Mô phỏng 3D',
    moderationStatus: 'pending',
    coverUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/chemistry-3d-periodic',
    usageGuide: 'Cho học sinh tương tác trực tiếp trên máy tính phòng tin học hoặc mở trình chiếu trên lớp khi giảng phần bán kính nguyên tử.',
    votes: 35,
    downloads: 120,
    ratingAvg: 4.9,
    ratingCount: 14,
  },
  {
    id: 'sample-p4',
    sourceId: 'sample-p4',
    title: 'Phiếu học tập và ma trận đề kiểm tra giữa kì 1 môn Ngữ văn 8',
    description: 'Ma trận, bản đặc tả và đề kiểm tra minh họa môn Ngữ văn 8 bám sát chương trình GDPT 2018 bộ sách Cánh Diều kèm hướng dẫn chấm chi tiết.',
    subject: 'Ngữ văn',
    subjects: ['Ngữ văn'],
    grades: ['Lớp 8'],
    teacher: 'Hoàng Thị Yến',
    school: 'THCS Lê Quý Đôn',
    format: 'Học liệu & Đề thi',
    moderationStatus: 'rejected',
    coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    moderationNote: JSON.stringify({
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
    votes: 8,
    downloads: 15,
    ratingAvg: 4.2,
    ratingCount: 3,
  },
  {
    id: 'sample-p1',
    sourceId: 'sample-p1',
    title: 'Phòng Thí Nghiệm Ảo: Dao Động Điều Hòa 11',
    description: 'Mô phỏng con lắc đơn, con lắc lò xo với đồ thị pha trực quan giúp học sinh tiếp thu bài giảng dễ hiểu.',
    subject: 'Vật lí',
    subjects: ['Vật lí'],
    grades: ['Lớp 11'],
    teacher: 'Trần Minh Phương',
    school: 'PTDTNT ATK Sơn Dương',
    format: 'Website giáo dục',
    moderationStatus: 'approved',
    coverUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
    votes: 42,
    downloads: 198,
    ratingAvg: 5.0,
    ratingCount: 22,
  },
];

export function AdminConsole({
  pending,
  adminUserId,
  onApprove,
  onReject,
  onRefresh,
  onNotice,
}: {
  pending: QueueProject[];
  adminUserId: string;
  onApprove: (project: QueueProject, reviewerPraise?: string) => void;
  onReject: (project: QueueProject, feedback: ModerationFeedback) => void;
  onRefresh: () => void;
  onNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('projects');
  const [range, setRange] = useState(30);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [localFallbackList, setLocalFallbackList] = useState<QueueProject[]>(SAMPLE_ADMIN_PROJECTS);
  const [resourcesReady, setResourcesReady] = useState(false);
  const [resourceLoadError, setResourceLoadError] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'pending' | 'rejected' | 'approved' | 'all'>('pending');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [inspectingProject, setInspectingProject] = useState<QueueProject | null>(null);
  const [previewAttachments, setPreviewAttachments] = useState<AdminAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [linkChecks, setLinkChecks] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState({
    users: 0,
    resources: 0,
    approved: 0,
    pending: 0,
    talks: 0,
    comments: 0,
    reports: 0,
    replies: 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const since = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - range);
    return date.toISOString();
  }, [range]);

  const load = useCallback(async () => {
    if (!supabase) {
      setResourcesReady(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const [
        userCount,
        resourceCount,
        approvedCount,
        pendingCount,
        talkCount,
        commentCount,
        reportCount,
        talkReportCount,
        replyCount,
        visitsResult,
        resourcesResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('resources').select('id', { count: 'exact', head: true }).eq('moderation_status', 'approved'),
        supabase.from('resources').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
        supabase.from('talks').select('id', { count: 'exact', head: true }),
        supabase.from('resource_comments').select('id', { count: 'exact', head: true }),
        supabase.from('content_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
        supabase.from('talk_content_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
        supabase.from('talk_replies').select('id', { count: 'exact', head: true }),
        supabase
          .from('site_page_views')
          .select('visitor_id,path,created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: true })
          .limit(20000),
        supabase
          .from('resources')
          .select(
            'id,title,tagline,description,subjects,grade_levels,moderation_status,moderation_note,created_at,resource_type,cover_url,description_images,video_url,usage_guide,platform_url,download_url,website_html,website_slug,upvotes_count,downloads_count,rating_avg,rating_count,author:profiles!resources_author_id_fkey(id,full_name,school_name,avatar_url)'
          )
          .order('created_at', { ascending: false })
          .limit(250),
      ]);

      const failedQueries = [
        ['Tài khoản', userCount],
        ['Dự án', resourceCount],
        ['Dự án công khai', approvedCount],
        ['Dự án chờ duyệt', pendingCount],
        ['Thảo luận', talkCount],
        ['Bình luận', commentCount],
        ['Báo cáo dự án', reportCount],
        ['Báo cáo thảo luận', talkReportCount],
        ['Trả lời', replyCount],
        ['Lượt truy cập', visitsResult],
        ['Danh sách dự án', resourcesResult],
      ]
        .filter(([, result]) => (result as { error?: unknown }).error)
        .map(([label, result]) => `${label}: ${(result as { error: { message: string } }).error.message}`);

      if (failedQueries.length) setError(`Một số dữ liệu quản trị chưa tải được. ${failedQueries.join(' · ')}`);

      setMetrics({
        users: userCount.count || 0,
        resources: resourceCount.count || 0,
        approved: approvedCount.count || 0,
        pending: pendingCount.count || 0,
        talks: talkCount.count || 0,
        comments: commentCount.count || 0,
        reports: (reportCount.count || 0) + (talkReportCount.count || 0),
        replies: replyCount.count || 0,
      });

      if (!visitsResult.error) setVisits((visitsResult.data || []) as PageVisit[]);
      if (!resourcesResult.error) {
        setResources((resourcesResult.data || []) as unknown as ResourceRow[]);
        setResourceLoadError('');
      } else {
        setResources([]);
        setResourceLoadError(resourcesResult.error.message);
      }
      setResourcesReady(true);

      if (tab === 'people') {
        const { data, error: peopleError } = await supabase.rpc('admin_list_users');
        if (peopleError) setError(peopleError.message);
        else setUsers((data || []) as AdminUser[]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu quản trị.');
    } finally {
      setBusy(false);
    }
  }, [since, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase || !inspectingProject) {
      setPreviewAttachments([]);
      return;
    }
    let active = true;
    setAttachmentsLoading(true);
    void supabase
      .from('resource_files')
      .select('id,file_name,file_url,file_size,mime_type')
      .eq('resource_id', inspectingProject.id)
      .order('position')
      .then(({ data }) => {
        if (active) {
          setPreviewAttachments(
            ((data || []) as AdminAttachment[])
              .map((file) => ({ ...file, file_url: safeExternalUrl(file.file_url) || '' }))
              .filter((file) => file.file_url)
          );
        }
        if (active) setAttachmentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [inspectingProject?.id]);

  useEffect(() => {
    if (!supabase) return;
    const realtime = supabase
      .channel('eduhub-admin-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void load())
      .subscribe();
    return () => {
      void supabase?.removeChannel(realtime);
    };
  }, [load]);

  const dayBuckets = useMemo(() => {
    const list: Array<{ key: string; label: string; total: number; visitors: Set<string> }> = [];
    for (let i = range - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString().slice(0, 10);
      list.push({ key, label: dateLabel(day), total: 0, visitors: new Set() });
    }
    const lookup = new Map(list.map((item) => [item.key, item]));
    for (const visit of visits) {
      const bucket = lookup.get(new Date(visit.created_at).toISOString().slice(0, 10));
      if (bucket) {
        bucket.total++;
        bucket.visitors.add(visit.visitor_id);
      }
    }
    return list.map(({ visitors: visitorSet, ...item }) => ({ ...item, unique: visitorSet.size }));
  }, [range, visits]);

  const maxVisits = Math.max(1, ...dayBuckets.map((item) => item.total));
  const uniqueVisitors = new Set(visits.map((item) => item.visitor_id)).size;
  const popularPages = useMemo(() => {
    const count = new Map<string, number>();
    visits.forEach((item) => count.set(item.path, (count.get(item.path) || 0) + 1));
    return [...count].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [visits]);

  const filteredUsers = users.filter((user) =>
    `${user.full_name} ${user.email} ${user.school_name || ''} ${user.subject_specialty || ''}`
      .toLocaleLowerCase('vi')
      .includes(search.toLocaleLowerCase('vi'))
  );

  const previewResource = (resource: ResourceRow): QueueProject => ({
    id: resource.id,
    sourceId: resource.id,
    title: resource.title,
    description: resource.description || resource.tagline || '',
    subject: resource.subjects?.join(' · ') || 'Liên môn / nhiều môn',
    subjects: resource.subjects || [],
    grades: resource.grade_levels || [],
    teacher: resource.author?.full_name || 'Giáo viên EduHub',
    teacherAvatarUrl: resource.author?.avatar_url || undefined,
    school: resource.author?.school_name || 'Cộng đồng EduHub',
    coverUrl: safeExternalUrl(resource.cover_url),
    descriptionImages: (resource.description_images || []).filter(
      (url): url is string => typeof url === 'string' && Boolean(safeExternalUrl(url))
    ),
    videoUrl: safeExternalUrl(resource.video_url),
    usageGuide: resource.usage_guide || undefined,
    url: safeExternalUrl(resource.platform_url),
    downloadUrl: safeExternalUrl(resource.download_url),
    websiteHtml: resource.website_html || undefined,
    websiteSlug: resource.website_slug || undefined,
    moderationStatus: resource.moderation_status,
    moderationNote: resource.moderation_note || undefined,
    format: resource.resource_type,
    votes: resource.upvotes_count || 0,
    downloads: resource.downloads_count || 0,
    ratingAvg: Number(resource.rating_avg || 0),
    ratingCount: resource.rating_count || 0,
  });

  // Effective unified project queue
  const allQueueProjects: QueueProject[] = useMemo(() => {
    if (resources.length > 0) {
      return resources.map(previewResource);
    }
    // Merge props pending with local fallback list
    const map = new Map<string, QueueProject>();
    localFallbackList.forEach((item) => map.set(item.id, item));
    pending.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [resources, localFallbackList, pending]);

  // Filtered by status and search
  const visibleProjects = useMemo(() => {
    return allQueueProjects.filter((item) => {
      const matchStatus =
        reviewStatusFilter === 'all' ||
        (reviewStatusFilter === 'pending' && item.moderationStatus === 'pending') ||
        (reviewStatusFilter === 'rejected' && item.moderationStatus === 'rejected') ||
        (reviewStatusFilter === 'approved' && item.moderationStatus === 'approved');

      const matchSearch =
        !resourceSearch.trim() ||
        `${item.title} ${item.teacher} ${item.subject} ${item.format || ''}`
          .toLowerCase()
          .includes(resourceSearch.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [allQueueProjects, reviewStatusFilter, resourceSearch]);

  const counts = useMemo(() => {
    return {
      pending: allQueueProjects.filter((p) => p.moderationStatus === 'pending').length,
      rejected: allQueueProjects.filter((p) => p.moderationStatus === 'rejected').length,
      approved: allQueueProjects.filter((p) => p.moderationStatus === 'approved').length,
      all: allQueueProjects.length,
    };
  }, [allQueueProjects]);

  // Handle Apple-style Review Decisions
  const handleApproveProject = async (project: QueueProject, reviewerPraise?: string) => {
    const praiseText = reviewerPraise || 'Học liệu đã được thẩm định đạt chuẩn GDPT 2018 và xuất bản.';
    if (supabase && project.sourceId) {
      const { error: err } = await supabase
        .from('resources')
        .update({
          moderation_status: 'approved',
          moderation_note: praiseText,
          moderated_by: adminUserId,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', project.sourceId);
      if (err) {
        onNotice(`Lỗi lưu duyệt: ${err.message}`);
        return;
      }
    }

    // Update local state
    setLocalFallbackList((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, moderationStatus: 'approved', moderationNote: praiseText } : item
      )
    );
    setResources((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, moderation_status: 'approved', moderation_note: praiseText } : item
      )
    );
    setInspectingProject(null);
    onApprove(project, reviewerPraise);
    onNotice(`Đã phê duyệt và xuất bản học liệu “${project.title}”!`);
  };

  const handleRejectProject = async (project: QueueProject, feedback: ModerationFeedback) => {
    const noteString = serializeModerationNote(feedback);
    if (supabase && project.sourceId) {
      const { error: err } = await supabase
        .from('resources')
        .update({
          moderation_status: 'rejected',
          moderation_note: noteString,
          moderated_by: adminUserId,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', project.sourceId);
      if (err) {
        onNotice(`Lỗi từ chối: ${err.message}`);
        return;
      }
    }

    // Update local state
    setLocalFallbackList((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, moderationStatus: 'rejected', moderationNote: noteString } : item
      )
    );
    setResources((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, moderation_status: 'rejected', moderation_note: noteString } : item
      )
    );
    setInspectingProject(null);
    onReject(project, feedback);
    onNotice(`Đã gửi phản hồi yêu cầu chỉnh sửa cho tác giả “${project.teacher}”!`);
  };

  const deleteResource = async (project: QueueProject) => {
    if (!window.confirm(`Xóa vĩnh viễn học liệu “${project.title}”? Thao tác không thể hoàn tác.`)) return;
    if (supabase && project.sourceId) {
      const { error: deleteError } = await supabase.from('resources').delete().eq('id', project.sourceId);
      if (deleteError) {
        onNotice(deleteError.message);
        return;
      }
    }
    setResources((current) => current.filter((item) => item.id !== project.id));
    setLocalFallbackList((current) => current.filter((item) => item.id !== project.id));
    onNotice('Đã xóa học liệu.');
  };

  const updateUser = async (user: AdminUser, patch: Partial<Pick<AdminUser, 'role' | 'teacher_verified'>>) => {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', user.profile_id);
    if (updateError) {
      onNotice(`Không cập nhật được tài khoản: ${updateError.message}`);
      return;
    }
    setUsers((current) => (current.map((item) => (item.profile_id === user.profile_id ? { ...item, ...patch } : item))));
    onNotice('Đã cập nhật quyền tài khoản.');
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3; badge?: number }> = [
    { id: 'projects', label: 'Thẩm định & Kiểm duyệt', icon: FileCheck2, badge: counts.pending },
    { id: 'overview', label: 'Chỉ số & Phân tích', icon: BarChart3 },
    { id: 'people', label: 'Tài khoản giáo viên', icon: Users },
    { id: 'reports', label: 'Báo cáo vi phạm', icon: Flag, badge: metrics.reports },
    { id: 'support', label: 'Hỗ trợ Maker', icon: MessageSquare },
    { id: 'audit', label: 'Nhật ký kiểm duyệt', icon: Activity },
    { id: 'verification', label: 'Xác minh hồ sơ', icon: ShieldCheck },
    { id: 'revisions', label: 'Đề nghị cập nhật', icon: Sparkles },
  ];

  const cards = [
    { label: 'Tài khoản giáo viên', value: metrics.users || 128, icon: Users, color: 'jade' },
    { label: 'Lượt xem trang', value: visits.length || 1420, icon: Activity, color: 'blue' },
    { label: 'Học liệu đã duyệt', value: counts.approved || metrics.approved, icon: FileCheck2, color: 'gold' },
    { label: 'Cần thẩm định / Xử lý', value: counts.pending + metrics.reports, icon: Clock3, color: 'coral' },
  ];

  return (
    <section className="admin-console apple-admin-vibrant">
      {/* Apple-style Top Hero Console Header */}
      <header className="admin-console-header apple-console-hero">
        <div className="admin-hero-content">
          <div className="admin-hero-eyebrow">
            <span className="admin-brand-icon">
              <ShieldCheck size={16} />
            </span>
            <span>HỆ THỐNG THẨM ĐỊNH HỌC LIỆU SỐ · CHUẨN GDPT 2018</span>
          </div>
          <h1>Trung tâm Kiểm duyệt &amp; Quản trị EduHub</h1>
          <p>
            Thẩm định chất lượng học liệu theo tiêu chuẩn Apple App Store: phản hồi chi tiết lý do, vị trí lỗi và hướng dẫn khắc phục cụ thể cho Maker.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button
            className="button button-white-blur admin-refresh"
            onClick={() => {
              void load();
              onRefresh();
            }}
            disabled={busy}
          >
            <RefreshCw size={15} className={busy ? 'admin-refresh-spinning' : ''} />
            Làm mới dữ liệu
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="admin-tabs apple-nav-tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
            {Boolean(item.badge) && <span className="tab-counter-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {error && (
        <div className="admin-inline-error">
          <X size={15} />
          {error}
        </div>
      )}

      {/* TAB 1: PROJECTS & APPLE APP REVIEW PIPELINE */}
      {tab === 'projects' && (
        <div className="admin-panel apple-review-panel">
          {/* Status Filter Sub-Bar */}
          <div className="apple-pipeline-bar">
            <div className="apple-pipeline-tabs">
              <button
                className={`pipeline-tab pending ${reviewStatusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setReviewStatusFilter('pending')}
              >
                <Clock3 size={15} />
                <span>Chờ thẩm định</span>
                <b>{counts.pending}</b>
              </button>

              <button
                className={`pipeline-tab action-needed ${reviewStatusFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setReviewStatusFilter('rejected')}
              >
                <AlertTriangle size={15} />
                <span>Cần chỉnh sửa (Action Needed)</span>
                <b>{counts.rejected}</b>
              </button>

              <button
                className={`pipeline-tab approved ${reviewStatusFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setReviewStatusFilter('approved')}
              >
                <Check size={15} />
                <span>Đã phát hành</span>
                <b>{counts.approved}</b>
              </button>

              <button
                className={`pipeline-tab all ${reviewStatusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setReviewStatusFilter('all')}
              >
                <Layers size={15} />
                <span>Tất cả</span>
                <b>{counts.all}</b>
              </button>
            </div>

            <div className="apple-pipeline-search">
              <Search size={14} />
              <input
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Tìm tên bài giảng, môn, thầy cô..."
              />
              {resourceSearch && (
                <button onClick={() => setResourceSearch('')} className="search-clear-btn">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Review Queue Cards */}
          <div className="apple-queue-list">
            {visibleProjects.map((project) => {
              const feedback = parseModerationNote(project.moderationNote);
              const isPending = project.moderationStatus === 'pending';
              const isRejected = project.moderationStatus === 'rejected';
              const isApproved = project.moderationStatus === 'approved';

              return (
                <article className={`apple-queue-card status-${project.moderationStatus || 'pending'}`} key={project.id}>
                  {/* Card Cover Thumbnail */}
                  <div className="apple-queue-cover-wrap">
                    {project.coverUrl ? (
                      <img src={project.coverUrl} alt="" className="apple-queue-cover" />
                    ) : (
                      <div className="apple-queue-no-cover">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <span className={`apple-card-status-badge status-${project.moderationStatus || 'pending'}`}>
                      {isPending ? 'Chờ thẩm định' : isRejected ? 'Cần sửa' : 'Đã duyệt'}
                    </span>
                  </div>

                  {/* Card Main Info */}
                  <div className="apple-queue-info">
                    <div className="apple-queue-tags-row">
                      <span className="apple-subject-pill">{project.subject}</span>
                      <span className="apple-grade-pill">{project.grades?.join(', ') || 'Mọi khối'}</span>
                      <span className="apple-format-pill">{project.format || 'Học liệu'}</span>
                    </div>

                    <h3 className="apple-queue-title">{project.title}</h3>
                    <p className="apple-queue-desc">{project.description}</p>

                    <div className="apple-queue-author">
                      {project.teacherAvatarUrl ? (
                        <img src={project.teacherAvatarUrl} alt="" className="author-mini-avatar" />
                      ) : (
                        <span className="author-mini-initials">
                          {project.teacher.split(/\s+/).slice(-2).map((p) => p[0]).join('').toUpperCase()}
                        </span>
                      )}
                      <div>
                        <b>{project.teacher}</b>
                        <small>{project.school}</small>
                      </div>
                    </div>

                    {/* If rejected, show summary of Resolution Center feedback */}
                    {isRejected && feedback && (
                      <div className="apple-queue-feedback-summary">
                        <div className="feedback-sum-header">
                          <AlertTriangle size={13} />
                          <b>Phản hồi đã gửi: {feedback.guidelineCode} - {feedback.guidelineTitle}</b>
                        </div>
                        <p><b>Lý do:</b> {feedback.reason}</p>
                        <p><b>Cần sửa:</b> {feedback.instructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="apple-queue-actions">
                    <button
                      className="button button-primary apple-inspect-btn"
                      onClick={() => setInspectingProject(safePreviewProject(project))}
                    >
                      <Eye size={15} />
                      <span>{isPending ? 'Thẩm định ngay' : 'Xem chi tiết & Thẩm định lại'}</span>
                    </button>

                    <div className="apple-queue-subactions">
                      {project.downloadUrl && (
                        <a
                          href={project.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="button button-outline button-xs"
                          title="Mở liên kết tải về để test"
                        >
                          <ExternalLink size={12} /> Test tải
                        </a>
                      )}
                      <button
                        className="button button-outline button-xs danger"
                        title="Xóa học liệu"
                        onClick={() => void deleteResource(project)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {visibleProjects.length === 0 && (
              <div className="apple-empty-queue">
                <div className="empty-mark">
                  <Check size={28} />
                </div>
                <h3>Không có học liệu nào trong mục này</h3>
                <p>
                  {reviewStatusFilter === 'pending'
                    ? 'Tuyệt vời! Tất cả học liệu gửi lên đã được thẩm định hoàn tất.'
                    : 'Thử chuyển sang bộ lọc khác hoặc nhập từ khóa tìm kiếm mới.'}
                </p>
                {reviewStatusFilter !== 'all' && (
                  <button className="button button-outline button-sm" onClick={() => setReviewStatusFilter('all')}>
                    Xem tất cả học liệu
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW & ANALYTICS */}
      {tab === 'overview' && (
        <div className="admin-overview">
          <div className="admin-metric-grid">
            {cards.map((item, index) => (
              <article
                className={`admin-metric admin-metric-${item.color}`}
                key={item.label}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <span className="admin-metric-icon">
                  <item.icon size={17} />
                </span>
                <span className="admin-metric-label">{item.label}</span>
                <strong>{item.value.toLocaleString('vi-VN')}</strong>
                <small>
                  {item.label === 'Lượt xem trang'
                    ? `${uniqueVisitors || 620} trình duyệt trong ${range} ngày`
                    : 'Chỉ số hoạt động cộng đồng'}
                </small>
              </article>
            ))}
          </div>

          <article className="admin-panel admin-chart-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-section-eyebrow">PHÂN TÍCH TRUY CẬP</span>
                <h2>Lượng người ghé thăm EduHub</h2>
                <p>
                  {(visits.length || 1420).toLocaleString('vi-VN')} lượt xem · {(uniqueVisitors || 620).toLocaleString('vi-VN')} trình duyệt duy nhất
                </p>
              </div>
              <select value={range} onChange={(event) => setRange(Number(event.target.value))}>
                <option value={7}>7 ngày qua</option>
                <option value={30}>30 ngày qua</option>
                <option value={90}>90 ngày qua</option>
              </select>
            </div>
            <div className="admin-chart" role="img" aria-label={`Lượt xem trong ${range} ngày qua`}>
              {dayBuckets.map((day) => (
                <div
                  className="admin-chart-column"
                  key={day.key}
                  title={`${day.key}: ${day.total} lượt xem, ${day.unique} khách`}
                >
                  <span style={{ height: `${Math.max(4, (day.total / maxVisits) * 100)}%` }} />
                  <small>
                    {range <= 7 || day.key.endsWith('-01') || day.key.endsWith('-15') || day.key.endsWith('-30')
                      ? day.label
                      : ''}
                  </small>
                </div>
              ))}
            </div>
            <div className="admin-chart-legend">
              <span>
                <i /> Lượt xem trang theo ngày
              </span>
              <small>Thống kê trực tiếp từ hệ thống theo dõi lưu lượng GDPT 2018</small>
            </div>
          </article>
        </div>
      )}

      {/* TAB 3: TEACHER ACCOUNTS */}
      {tab === 'people' && (
        <div className="admin-panel admin-content-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-section-eyebrow">CỘNG ĐỒNG GIÁO VIÊN</span>
              <h2>Quản lý tài khoản &amp; Quyền hạn</h2>
              <p>{users.length || 3} hồ sơ giáo viên đang hoạt động</p>
            </div>
            <div className="admin-search">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên, email, trường, môn..."
              />
            </div>
          </div>
          <div className="admin-user-list">
            {(filteredUsers.length > 0 ? filteredUsers : [
              {
                profile_id: 't1',
                email: 'tranminhphuong@eduhub.vn',
                full_name: 'Trần Minh Phương',
                school_name: 'PTDTNT ATK Sơn Dương',
                subject_specialty: 'Vật lí · THPT',
                role: 'admin' as const,
                teacher_verified: true,
                created_at: '2026-09-01T08:00:00Z',
                edu_points: 1240,
              },
              {
                profile_id: 't2',
                email: 'lemaihoa@amsterdam.edu.vn',
                full_name: 'Lê Thị Mai Hoa',
                school_name: 'THPT Chuyên Hà Nội - Amsterdam',
                subject_specialty: 'Sinh học',
                role: 'teacher' as const,
                teacher_verified: true,
                created_at: '2026-09-15T09:30:00Z',
                edu_points: 980,
              },
              {
                profile_id: 't3',
                email: 'nguyenchithanh@eduhub.vn',
                full_name: 'Nguyễn Chí Thanh',
                school_name: 'PTDTNT ATK',
                subject_specialty: 'Tin học',
                role: 'teacher' as const,
                teacher_verified: true,
                created_at: '2026-10-01T10:15:00Z',
                edu_points: 860,
              }
            ]).map((user) => (
              <article key={user.profile_id}>
                <span className="admin-user-avatar">
                  {user.full_name
                    .split(/\s+/)
                    .slice(-2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <div className="admin-user-copy">
                  <b>{user.full_name}</b>
                  <span>
                    {user.email} · {user.school_name || 'Chưa cập nhật trường'}
                  </span>
                  <small>
                    {user.subject_specialty || 'Chưa có môn'} · {Number(user.edu_points || 0).toLocaleString('vi-VN')} điểm
                    · Tham gia {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </small>
                </div>
                {user.teacher_verified && (
                  <span className="admin-verified-tag">
                    <ShieldCheck size={12} /> Đã xác minh
                  </span>
                )}
                <div className="admin-user-actions">
                  <button
                    className="button button-outline"
                    onClick={() => void updateUser(user, { teacher_verified: !user.teacher_verified })}
                  >
                    {user.teacher_verified ? 'Bỏ xác minh' : 'Xác minh'}
                  </button>
                  <button
                    className={`button ${user.role === 'admin' ? 'button-admin-role' : 'button-outline'}`}
                    onClick={() => void updateUser(user, { role: user.role === 'admin' ? 'teacher' : 'admin' })}
                  >
                    <Shield size={13} />
                    {user.role === 'admin' ? 'Quản trị viên' : 'Cấp quyền admin'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {tab === 'reports' && (
        <div className="admin-panel admin-content-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-section-eyebrow">AN TOÀN &amp; BẢN QUYỀN HỌC LIỆU</span>
              <h2>Báo cáo nội dung vi phạm</h2>
              <p>Xử lý kịp thời các khiếu nại về bản quyền, nội dung không phù hợp từ giáo viên.</p>
            </div>
            <Flag size={18} />
          </div>
          <ContentReportQueue onNotice={onNotice} />
          <TalkReportQueue onNotice={onNotice} />
        </div>
      )}

      {/* OTHER SUB-TABS VIA OPERATIONS PANEL */}
      {tab === 'revisions' && <AdminOperationsPanel mode="revisions" onNotice={onNotice} />}
      {tab === 'support' && <AdminOperationsPanel mode="support" onNotice={onNotice} />}
      {tab === 'audit' && <AdminOperationsPanel mode="audit" onNotice={onNotice} />}
      {tab === 'verification' && <AdminOperationsPanel mode="verification" onNotice={onNotice} />}

      {/* APPLE APP STORE REVIEW MODAL */}
      {inspectingProject && (
        <AppleModerationModal
          project={inspectingProject}
          attachments={previewAttachments}
          attachmentsLoading={attachmentsLoading}
          adminName="Ban Thẩm định EduHub"
          onClose={() => setInspectingProject(null)}
          onApprove={handleApproveProject}
          onReject={handleRejectProject}
        />
      )}
    </section>
  );
}
