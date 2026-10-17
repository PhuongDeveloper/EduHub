import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { supabase } from './lib/supabase';
import { uploadPublicImage } from './lib/mediaUpload';
import { TeacherOnboardingModal } from './components/TeacherOnboardingModal';
import { ProjectCommunityPanel } from './components/ProjectCommunityPanel';
import { ResourceRevisionPanel } from './components/ResourceRevisionPanel';
import { ResourceFilesList } from './components/ResourceFilesList';
import { CurriculumPicker } from './components/CurriculumPicker';
import { WebsiteBuilderModal, type TeacherWebsiteDraft } from './components/WebsiteBuilderModal';
import { PublishedTeacherWebsite } from './components/PublishedTeacherWebsite';
import { sandboxWebsiteHtml } from './lib/sandboxWebsite';
import { GRADE_LABELS, SUBJECT_NAMES, normalizeSubjectNames, schoolLevelsForGrades } from './lib/curriculum';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, Bookmark, BookOpen, Check, Download, FileQuestion, QrCode as QrCodeIcon,
  ChevronDown, ChevronRight, CircleHelp, Clock3, Copy, FileText, Filter,
  GraduationCap, Heart, Image, Lightbulb, Menu, MessageCircle, GitCompareArrows, Globe2,
  Moon, Play, Plus, Printer, Search, Send, Share2, ShieldCheck, Star, Sun, ThumbsUp, Trophy, Upload, Users,
  Trash2, X, BadgeCheck, type LucideIcon,
} from 'lucide-react';

const TeacherProfileView = lazy(() => import('./components/TeacherProfileView').then((module) => ({ default: module.TeacherProfileView })));
const SubjectTalksPage = lazy(() => import('./components/SubjectTalksPage').then((module) => ({ default: module.SubjectTalksPage })));
const AdminConsole = lazy(() => import('./components/AdminConsole').then((module) => ({ default: module.AdminConsole })));
const CollectionsView = lazy(() => import('./components/CollectionsView').then((module) => ({ default: module.CollectionsView })));
const ResourceRequestsPage = lazy(() => import('./components/ResourceRequestsPage').then((module) => ({ default: module.ResourceRequestsPage })));
const LessonPlannerPage = lazy(() => import('./components/LessonPlannerPage').then((module) => ({ default: module.LessonPlannerPage })));
const TeachingChallengesPage = lazy(() => import('./components/TeachingChallengesPage').then((module) => ({ default: module.TeachingChallengesPage })));
const CreatorAnalyticsPage = lazy(() => import('./components/CreatorAnalyticsPage').then((module) => ({ default: module.CreatorAnalyticsPage })));
const TeacherDirectoryPage = lazy(() => import('./components/TeacherDirectoryPage').then((module) => ({ default: module.TeacherDirectoryPage })));
const ModerationAppealsPage = lazy(() => import('./components/ModerationAppealsPage').then((module) => ({ default: module.ModerationAppealsPage })));
const ResourceAlertsPage = lazy(() => import('./components/ResourceAlertsPage').then((module) => ({ default: module.ResourceAlertsPage })));
const LessonSchedulePage = lazy(() => import('./components/LessonSchedulePage').then((module) => ({ default: module.LessonSchedulePage })));
const LearningPathsPage = lazy(() => import('./components/LearningPathsPage').then((module) => ({ default: module.LearningPathsPage })));
const TeacherGroupsPage = lazy(() => import('./components/TeacherGroupsPage').then((module) => ({ default: module.TeacherGroupsPage })));
const TeacherMessagesPage = lazy(() => import('./components/TeacherMessagesPage').then((module) => ({ default: module.TeacherMessagesPage })));
const TeacherEventsPage = lazy(() => import('./components/TeacherEventsPage').then((module) => ({ default: module.TeacherEventsPage })));
const HelpCenterPage = lazy(() => import('./components/HelpCenterPage').then((module) => ({ default: module.HelpCenterPage })));
const ResourceDownloadHistoryPage = lazy(() => import('./components/ResourceDownloadHistoryPage').then((module) => ({ default: module.ResourceDownloadHistoryPage })));

type Project = {
  id: string; title: string; description: string; type: string; subject: string;
  subjects: string[];
  grade: string; teacher: string; school: string; initials: string; color: string;
  votes: number; replies: number; downloads: number; time: string; format: string;
  featured?: boolean; demo?: boolean; url?: string; downloadUrl?: string; tags: string[];
  sourceId?: string; parentResourceId?: string; teacherId?: string; teacherAvatarUrl?: string; coverUrl?: string; descriptionImages?: string[]; websiteHtml?: string; websiteSlug?: string; videoUrl?: string; captionUrl?: string; videoTranscript?: string; usageGuide?: string; moderationStatus?: string; createdAt?: string;
  ratingAvg?: number; ratingCount?: number; learningOutcomes?: string[]; accessRequirements?: string; worksOffline?: boolean; mobileCompatible?: boolean; requiresLogin?: boolean; freeVerified?: boolean; resourceStatus?: string; replacementResourceId?: string | null; moderationLinkCheck?: string;
};

type TeacherProfile = { id: string; full_name: string; school_name: string | null; role: 'teacher' | 'admin'; edu_points: number; avatar_url?: string | null; profile_completed_at?: string | null };
type NotificationItem = { id: string; activity_type: string; created_at: string; actor?: { full_name?: string } | null; resource?: { id?: string; title?: string } | null };
type SubmitDraft = { title: string; description: string; type: string; subjects: string[]; grades: string[]; url: string; videoUrl: string; captionUrl: string; videoTranscript: string; file: File | null; files: File[]; cover: File | null; descriptionImages: File[]; websiteHtml?: string; guide: string; parentResourceId?: string; learningOutcomes: string[]; accessRequirements: string; worksOffline: boolean; mobileCompatible: boolean; requiresLogin: boolean };
type SavedSubmitDraft = Omit<SubmitDraft, 'file' | 'files' | 'cover' | 'descriptionImages'>;
const submitDraftKey = (userId: string, parentId?: string) => `eduhub-submit-draft:${userId}:${parentId || 'new'}`;
function readSubmitDraft(userId: string, parentId?: string): Partial<SavedSubmitDraft> {
  try { return JSON.parse(localStorage.getItem(submitDraftKey(userId, parentId)) || '{}') as Partial<SavedSubmitDraft>; } catch { return {}; }
}
type View = 'feed' | 'projects' | 'talks' | 'talk-detail' | 'ranking' | 'saved' | 'following' | 'collections' | 'learning-paths' | 'groups' | 'messages' | 'offline' | 'downloads' | 'requests' | 'lesson-plans' | 'schedule' | 'events' | 'help' | 'challenges' | 'creator-analytics' | 'teachers' | 'appeals' | 'alerts' | 'admin' | 'profile' | 'project' | 'website';
const savedStorageKey = 'eduhub-saved-projects-v1';
const recentStorageKey = 'eduhub-recent-projects-v1';
const offlineProjectsKey = 'eduhub-offline-reading-v1';
const PROJECT_PAGE_SIZE = 24;
const projectFilterStorageKey = 'eduhub-project-filters-v2';
const projectSearchStorageKey = 'eduhub-project-searches-v1';
const normalizeSearchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
type ProjectFilters = { query: string; subject: string; typeFilter: string; gradeFilter: string; ratingFilter: string; withDemoOnly: boolean; withGuideOnly: boolean; offlineOnly: boolean; mobileOnly: boolean; noLoginOnly: boolean; freeOnly: boolean; sort: string };
type SavedProjectSearch = { id: string; name: string; filters: ProjectFilters };
function readInitialProjectFilters(): ProjectFilters {
  const defaults: ProjectFilters = { query: '', subject: 'Tất cả bộ môn', typeFilter: 'Tất cả loại', gradeFilter: 'Tất cả khối', ratingFilter: 'Mọi đánh giá', withDemoOnly: false, withGuideOnly: false, offlineOnly: false, mobileOnly: false, noLoginOnly: false, freeOnly: false, sort: 'Mới nhất' };
  try {
    const params = new URLSearchParams(window.location.search);
    const shared = [...params.keys()].some((key) => ['q','subject','type','grade','rating','demo','guide','offline','mobile','nologin','free','sort'].includes(key));
    const saved = JSON.parse(localStorage.getItem(projectFilterStorageKey) || '{}') as Partial<ProjectFilters>;
    const source: Record<string, string | boolean | undefined> = shared ? {
      query: params.get('q') || '', subject: params.get('subject') || undefined, typeFilter: params.get('type') || undefined,
      gradeFilter: params.get('grade') || undefined, ratingFilter: params.get('rating') || undefined,
      withDemoOnly: params.get('demo') === '1', withGuideOnly: params.get('guide') === '1', offlineOnly: params.get('offline') === '1',
      mobileOnly: params.get('mobile') === '1', noLoginOnly: params.get('nologin') === '1', freeOnly: params.get('free') === '1', sort: params.get('sort') || undefined,
    } : saved;
    return { ...defaults, ...source } as ProjectFilters;
  } catch { return defaults; }
}
function readSavedProjectSearches(): SavedProjectSearch[] {
  try { const data = JSON.parse(localStorage.getItem(projectSearchStorageKey) || '[]'); return Array.isArray(data) ? data.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.filters).slice(0, 6) : []; }
  catch { return []; }
}
function readLocalSaved(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(savedStorageKey) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}
function readLocalRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(recentStorageKey) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 8) : [];
  } catch { return []; }
}
function readOfflineProjects(): Project[] { try { const value = JSON.parse(localStorage.getItem(offlineProjectsKey) || '[]'); return Array.isArray(value) ? value as Project[] : []; } catch { return []; } }

function projectFromRow(row: any): Project {
  const author = row.author || {};
  const projectSubjects = normalizeSubjectNames(row.subjects);
  const firstSubject = projectSubjects[0] || '';
  const colors = ['mint', 'peach', 'lavender', 'blue', 'yellow', 'coral'];
  const color = colors[(String(row.id).charCodeAt(0) || 0) % colors.length];
  const name = author.full_name || 'Giáo viên EduHub';
  const typeNames: Record<string, string> = { powerpoint: 'Bài giảng', khbd_5512: 'Giáo án', exam_matrix: 'Học liệu', tool_software: 'Công cụ', game_interactive: 'Trò chơi', utility_web: 'Website', teacher_website: 'Website giáo dục' };
  const when = row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : 'Mới đăng';
  const format = [row.file_format?.toUpperCase(), row.file_size].filter(Boolean).join(' · ') || (row.platform_url ? 'Dùng trực tuyến' : 'Học liệu');
  return {
    id: row.id, sourceId: row.id, parentResourceId: row.parent_resource_id || undefined, title: row.title, description: row.description || row.tagline || '', subjects: projectSubjects,
    type: typeNames[row.resource_type] || row.resource_type || 'Dự án', subject: projectSubjects.includes('Mọi môn') ? 'Dùng cho mọi môn' : firstSubject || 'Liên môn / nhiều môn',
    grade: Array.isArray(row.grade_levels) && row.grade_levels.length ? row.grade_levels.join(', ') : 'Mọi khối lớp',
    teacher: name, teacherId: author.id || undefined, teacherAvatarUrl: author.avatar_url || undefined, school: [author.show_school !== false ? author.school_name : null, author.show_location === false ? null : [author.ward, author.province].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Cộng đồng EduHub', initials: name.split(/\s+/).slice(-2).map((part: string) => part[0]).join('').toUpperCase(),
    color, votes: row.upvotes_count || 0, replies: row.comments?.[0]?.count || 0, downloads: row.downloads_count || 0,
    time: when, createdAt: row.created_at || undefined, format, url: row.platform_url || undefined, downloadUrl: row.download_url || undefined, coverUrl: row.cover_url || undefined, websiteHtml: row.website_html || undefined, websiteSlug: row.website_slug || undefined, videoUrl: row.video_url || undefined,
    usageGuide: row.usage_guide || undefined, descriptionImages: Array.isArray(row.description_images) ? row.description_images.filter((url: unknown) => typeof url === 'string') : [], captionUrl: row.caption_url || undefined, videoTranscript: row.video_transcript || undefined, moderationStatus: row.moderation_status, ratingAvg: Number(row.rating_avg || 0), ratingCount: Number(row.rating_count || 0), moderationLinkCheck: row.moderation_link_check || 'not_checked',
    tags: row.tags || [], learningOutcomes: row.learning_outcomes || [], accessRequirements: row.access_requirements || '', worksOffline: Boolean(row.works_offline), mobileCompatible: row.mobile_compatible !== false, requiresLogin: Boolean(row.requires_login), resourceStatus: row.resource_status || 'current', replacementResourceId: row.replacement_resource_id || null,
    freeVerified: Boolean(row.is_free_verified),
  };
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('eduhub-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const [offlineProjects, setOfflineProjects] = useState<Project[]>(readOfflineProjects);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [readingSettingsOpen, setReadingSettingsOpen] = useState(false);
  const [readingSettings, setReadingSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eduhub-reading-settings') || '{"size":"normal","spacing":"normal","contrast":false,"reducedMotion":false}') as { size: 'normal' | 'large' | 'xlarge'; spacing: 'normal' | 'wide'; contrast: boolean; reducedMotion: boolean }; }
    catch { return { size: 'normal' as const, spacing: 'normal' as const, contrast: false, reducedMotion: false }; }
  });
  const [view, setView] = useState<View>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/web/')) return 'website';
    if (path.startsWith('/projects/')) return 'project';
    if (path === '/projects') return 'projects';
    if (path.startsWith('/teachers/')) return 'profile';
    if (path.startsWith('/talks/')) return 'talk-detail';
    if (path === '/talks') return 'talks';
    if (path === '/ranking') return 'ranking';
    if (path === '/saved') return 'saved';
    if (path === '/following') return 'following';
    if (path === '/collections') return 'collections';
    if (path === '/learning-paths') return 'learning-paths';
    if (path === '/groups') return 'groups';
    if (path === '/messages') return 'messages';
    if (path === '/offline') return 'offline';
    if (path === '/downloads') return 'downloads';
    if (path === '/requests') return 'requests';
    if (path === '/lesson-plans') return 'lesson-plans';
    if (path === '/challenges') return 'challenges';
    if (path === '/creator-analytics') return 'creator-analytics';
    if (path === '/teachers') return 'teachers';
    if (path === '/appeals') return 'appeals';
    if (path === '/alerts') return 'alerts';
    if (path === '/schedule') return 'schedule';
    if (path === '/events') return 'events';
    if (path === '/help') return 'help';
    if (path === '/admin') return 'admin';
    return 'feed';
  });
  const [initialProjectFilters] = useState(readInitialProjectFilters);
  const [query, setQuery] = useState(initialProjectFilters.query);
  const [subject, setSubject] = useState(initialProjectFilters.subject);
  const [typeFilter, setTypeFilter] = useState(initialProjectFilters.typeFilter);
  const [gradeFilter, setGradeFilter] = useState(initialProjectFilters.gradeFilter);
  const [ratingFilter, setRatingFilter] = useState(initialProjectFilters.ratingFilter);
  const [withDemoOnly, setWithDemoOnly] = useState(initialProjectFilters.withDemoOnly);
  const [withGuideOnly, setWithGuideOnly] = useState(initialProjectFilters.withGuideOnly);
  const [offlineOnly, setOfflineOnly] = useState(initialProjectFilters.offlineOnly);
  const [mobileOnly, setMobileOnly] = useState(initialProjectFilters.mobileOnly);
  const [noLoginOnly, setNoLoginOnly] = useState(initialProjectFilters.noLoginOnly);
  const [freeOnly, setFreeOnly] = useState(initialProjectFilters.freeOnly);
  const [sort, setSort] = useState(initialProjectFilters.sort);
  const [savedProjectSearches, setSavedProjectSearches] = useState<SavedProjectSearch[]>(readSavedProjectSearches);
  const [searchPresetName, setSearchPresetName] = useState('');
  const [selectedSavedSearchId, setSelectedSavedSearchId] = useState('');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>(readLocalSaved);
  const [recentProjectIds, setRecentProjectIds] = useState<string[]>(readLocalRecent);
  const [compareProjectIds, setCompareProjectIds] = useState<string[]>([]);
  const [followingTeachers, setFollowingTeachers] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(Boolean(supabase));
  const [projectsLoadingMore, setProjectsLoadingMore] = useState(false);
  const [projectPage, setProjectPage] = useState(0);
  const [hasMoreProjects, setHasMoreProjects] = useState(false);
  const [projectRouteId, setProjectRouteId] = useState(() => decodeURIComponent(window.location.pathname.split('/')[2] || ''));
  const [websiteSlug, setWebsiteSlug] = useState(() => decodeURIComponent(window.location.pathname.match(/^\/web\/([^/]+)/)?.[1] || ''));
  const [showSubmit, setShowSubmit] = useState(false);
  const [showWebsiteBuilder, setShowWebsiteBuilder] = useState(false);
  const [submitParentProject, setSubmitParentProject] = useState<Project | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [talkDetailId, setTalkDetailId] = useState<string | null>(() => decodeURIComponent(window.location.pathname.match(/^\/talks\/([^/]+)/)?.[1] || '') || null);
  const [notice, setNotice] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [adminProfileLoading, setAdminProfileLoading] = useState(true);
  const [adminQueue, setAdminQueue] = useState<Project[]>([]);
  const [activeTeachers, setActiveTeachers] = useState<Array<{ id: string; name: string; subject: string; points: string; initials: string; color: string }>>([]);
  const [communityProof, setCommunityProof] = useState<{ members: number; projects: number; teachers: Array<{ id: string; name: string; avatar: string | null }> } | null>(null);
  const [showTeacherOnboarding, setShowTeacherOnboarding] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsReadAt, setNotificationsReadAt] = useState(() => new Date().toISOString());
  const lastProjectListLocation = useRef({ path: '/projects', scrollY: 0 });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('eduhub-theme', theme); } catch { /* Keep the selection for this page view. */ }
  }, [theme]);

  useEffect(() => {
    const filters: ProjectFilters = { query, subject, typeFilter, gradeFilter, ratingFilter, withDemoOnly, withGuideOnly, offlineOnly, mobileOnly, noLoginOnly, freeOnly, sort };
    try { localStorage.setItem(projectFilterStorageKey, JSON.stringify(filters)); } catch { /* Keep active filters in memory. */ }
  }, [query, subject, typeFilter, gradeFilter, ratingFilter, withDemoOnly, withGuideOnly, offlineOnly, mobileOnly, noLoginOnly, freeOnly, sort]);

  useEffect(() => {
    try { localStorage.setItem(projectSearchStorageKey, JSON.stringify(savedProjectSearches)); } catch { /* Keep saved searches in memory. */ }
  }, [savedProjectSearches]);

  useEffect(() => {
    document.documentElement.dataset.readingSize = readingSettings.size;
    document.documentElement.dataset.readingSpacing = readingSettings.spacing;
    document.documentElement.dataset.highContrast = String(readingSettings.contrast);
    document.documentElement.dataset.reducedMotion = String(readingSettings.reducedMotion);
    try { localStorage.setItem('eduhub-reading-settings', JSON.stringify(readingSettings)); } catch { /* Keep settings for this page view. */ }
  }, [readingSettings]);

  useEffect(() => {
    if (!supabase) { setAdminProfileLoading(false); return; }
    let active = true;
    const loadProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('id,full_name,school_name,role,edu_points,avatar_url,profile_completed_at').eq('id', userId).maybeSingle();
      if (active) { const profile = data as TeacherProfile | null; setTeacherProfile(profile); setAdminProfileLoading(false); if (profile && !profile.profile_completed_at) setShowTeacherOnboarding(true); }
    };
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setCurrentUser(data.user);
      if (data.user) void loadProfile(data.user.id);
      else setAdminProfileLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) { setAdminProfileLoading(true); queueMicrotask(() => void loadProfile(session.user.id)); }
      else { setTeacherProfile(null); setShowTeacherOnboarding(false); setAdminProfileLoading(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (teacherProfile?.profile_completed_at) setShowTeacherOnboarding(false); }, [teacherProfile?.profile_completed_at]);

  const loadNotifications = useCallback(async () => {
    if (!supabase || !currentUser) { setNotifications([]); return; }
    const { data, error } = await supabase.from('teacher_activities')
      .select('id,activity_type,created_at,actor:profiles!teacher_activities_actor_id_fkey(full_name),resource:resources!teacher_activities_resource_id_fkey(id,title)')
      .eq('profile_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
    if (!error && data) setNotifications(data as unknown as NotificationItem[]);
    const key = `eduhub-notifications-read:${currentUser.id}`;
    try {
      const savedReadAt = localStorage.getItem(key);
      if (!savedReadAt) { const now = new Date().toISOString(); localStorage.setItem(key, now); setNotificationsReadAt(now); }
      else setNotificationsReadAt(savedReadAt);
    } catch { /* Keep notification state in memory. */ }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!supabase || !currentUser) { setNotifications([]); setNotificationsOpen(false); return; }
    void loadNotifications();
    const channel = supabase.channel(`teacher-notifications-${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teacher_activities', filter: `profile_id=eq.${currentUser.id}` }, () => void loadNotifications())
      .subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [currentUser?.id, loadNotifications]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('resources').select('id', { count: 'exact', head: true }).eq('moderation_status', 'approved'),
      supabase.from('profiles').select('id,full_name,avatar_url').order('created_at', { ascending: false }).limit(5),
    ]).then(([members, projects, teachers]) => {
      if (!active || members.error || projects.error || teachers.error) return;
      setCommunityProof({ members: members.count || 0, projects: projects.count || 0, teachers: (teachers.data || []).map((teacher) => ({ id: teacher.id, name: teacher.full_name, avatar: teacher.avatar_url })) });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.from('profiles').select('id,full_name,subject_specialty,edu_points').order('edu_points', { ascending: false }).limit(3)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        setActiveTeachers(data.map((teacher, index) => ({ id: teacher.id, name: teacher.full_name, subject: teacher.subject_specialty || 'Giáo viên EduHub', points: Number(teacher.edu_points || 0).toLocaleString('vi-VN'), initials: teacher.full_name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase(), color: ['mint', 'peach', 'lavender'][index % 3] })));
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase || !currentUser) { setLiked([]); return; }
    let active = true;
    void supabase.from('upvotes').select('resource_id').eq('user_id', currentUser.id)
      .then(({ data, error }) => { if (active && !error && data) setLiked(data.map((item) => item.resource_id)); });
    return () => { active = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    try { localStorage.setItem(savedStorageKey, JSON.stringify(saved)); } catch { /* Continue without browser storage. */ }
  }, [saved]);
  useEffect(() => {
    try { localStorage.setItem(recentStorageKey, JSON.stringify(recentProjectIds.slice(0, 8))); } catch { /* Keep recent history in memory. */ }
  }, [recentProjectIds]);
  useEffect(() => {
    if (view !== 'project' || !selectedProject) return;
    setRecentProjectIds((items) => [selectedProject.id, ...items.filter((id) => id !== selectedProject.id)].slice(0, 8));
  }, [selectedProject?.id, view]);

  useEffect(() => {
    if (!supabase || window.location.pathname.startsWith('/admin')) return;
    const path = (view === 'project' ? `/projects/${projectRouteId}` : view === 'website' ? `/web/${websiteSlug}` : view === 'profile' ? `/teachers/${profileId || ''}` : view === 'talk-detail' ? `/talks/${talkDetailId || ''}` : view === 'feed' ? '/' : `/${view}`).slice(0, 300);
    const visitKey = `eduhub-page-view:${path}`;
    try { if (sessionStorage.getItem(visitKey)) return; } catch { /* Continue if session storage is unavailable. */ }
    let visitorId = '';
    try {
      visitorId = localStorage.getItem('eduhub-visitor-id') || crypto.randomUUID();
      localStorage.setItem('eduhub-visitor-id', visitorId);
      sessionStorage.setItem(visitKey, '1');
    } catch { visitorId = crypto.randomUUID(); }
    void supabase.from('site_page_views').insert({ visitor_id: visitorId, path, user_id: currentUser?.id || null });
    if (view === 'project' && projectRouteId) void supabase.from('resource_view_events').insert({ resource_id: projectRouteId, visitor_id: visitorId });
  }, [currentUser?.id, projectRouteId, websiteSlug, profileId, talkDetailId, view]);

  useEffect(() => {
    if (!supabase || !currentUser) return;
    let active = true;
    void supabase.from('resource_bookmarks').select('resource_id').eq('user_id', currentUser.id)
      .then(({ data, error }) => { if (active && !error && data) setSaved(data.map((item) => item.resource_id)); });
    return () => { active = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!supabase || !currentUser) { setFollowingTeachers([]); return; }
    let active = true;
    void supabase.from('teacher_follows').select('followed_id').eq('follower_id', currentUser.id)
      .then(({ data, error }) => { if (active && !error && data) setFollowingTeachers(data.map((item) => item.followed_id)); });
    return () => { active = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.from('resources')
      .select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url,show_school,show_location), comments:resource_comments(count)')
      .eq('moderation_status', 'approved').order('created_at', { ascending: false })
      .range(0, PROJECT_PAGE_SIZE - 1)
      .then(({ data, error }) => {
        if (active && !error) { setProjects((data || []).map(projectFromRow)); setProjectPage(0); setHasMoreProjects((data || []).length === PROJECT_PAGE_SIZE); }
        if (active) setProjectsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const websiteMatch = window.location.pathname.match(/^\/web\/([^/]+)/);
      const projectMatch = window.location.pathname.match(/^\/projects\/([^/]+)/);
      const teacherMatch = window.location.pathname.match(/^\/teachers\/([^/]+)/);
      const talkMatch = window.location.pathname.match(/^\/talks\/([^/]+)/);
      if (websiteMatch) { setWebsiteSlug(decodeURIComponent(websiteMatch[1])); setView('website'); setSelectedProject(null); }
      else if (projectMatch) { const id = decodeURIComponent(projectMatch[1]); setProjectRouteId(id); setSelectedProject((current) => current?.id === id || current?.sourceId === id ? current : null); setView('project'); }
      else if (teacherMatch) { setProfileId(decodeURIComponent(teacherMatch[1])); setView('profile'); setSelectedProject(null); }
      else if (talkMatch) { setTalkDetailId(decodeURIComponent(talkMatch[1])); setView('talk-detail'); }
      else if (window.location.pathname === '/talks') { setTalkDetailId(null); setView('talks'); }
      else if (window.location.pathname === '/projects') setView('projects');
      else if (window.location.pathname === '/ranking') setView('ranking');
      else if (window.location.pathname === '/saved') setView('saved');
      else if (window.location.pathname === '/following') setView('following');
      else if (window.location.pathname === '/collections') setView('collections');
      else if (window.location.pathname === '/learning-paths') setView('learning-paths');
      else if (window.location.pathname === '/groups') setView('groups');
      else if (window.location.pathname === '/messages') setView('messages');
      else if (window.location.pathname === '/offline') setView('offline');
      else if (window.location.pathname === '/requests') setView('requests');
      else if (window.location.pathname === '/lesson-plans') setView('lesson-plans');
      else if (window.location.pathname === '/challenges') setView('challenges');
      else if (window.location.pathname === '/creator-analytics') setView('creator-analytics');
      else if (window.location.pathname === '/teachers') setView('teachers');
      else if (window.location.pathname === '/appeals') setView('appeals');
      else if (window.location.pathname === '/alerts') setView('alerts');
      else if (window.location.pathname === '/schedule') setView('schedule');
      else if (window.location.pathname === '/events') setView('events');
      else if (window.location.pathname === '/help') setView('help');
      else if (window.location.pathname === '/admin') setView('admin');
      else { setSelectedProject(null); setView('feed'); }
    };
    window.addEventListener('popstate', syncRoute);
    if (window.location.pathname.startsWith('/teachers/')) setProfileId(decodeURIComponent(window.location.pathname.split('/')[2] || ''));
    if (window.location.pathname.startsWith('/talks/')) setTalkDetailId(decodeURIComponent(window.location.pathname.split('/')[2] || ''));
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    if (view !== 'project' || selectedProject) return;
    if (!supabase) setSelectedProject(null);
  }, [projectRouteId, selectedProject, view]);

  useEffect(() => {
    if (!supabase || !projectRouteId || view !== 'project' || projects.some((item) => item.id === projectRouteId || item.sourceId === projectRouteId)) return;
    let active = true;
    void supabase.from('resources').select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url,show_school,show_location), comments:resource_comments(count)')
      .eq('id', projectRouteId).eq('moderation_status', 'approved').maybeSingle()
      .then(({ data }) => { if (active && data) setSelectedProject(projectFromRow(data)); });
    return () => { active = false; };
  }, [projectRouteId, projects, view]);

  useEffect(() => {
    if (!supabase || teacherProfile?.role !== 'admin') return;
    let active = true;
    void supabase.from('resources')
      .select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url,show_school,show_location), comments:resource_comments(count)')
      .eq('moderation_status', 'pending').order('created_at', { ascending: true })
      .then(({ data, error }) => { if (active && !error) setAdminQueue((data || []).map(projectFromRow)); });
    return () => { active = false; };
  }, [teacherProfile?.role]);

  const visibleProjects = useMemo(() => {
    const queryTerms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
    let result = projects.filter((project) => {
      const matchesSubject = subject === 'Tất cả bộ môn' || project.subjects.includes(subject) || project.subjects.includes('Mọi môn');
      const haystack = `${project.title} ${project.description} ${project.subjects.join(' ')} ${project.subject} ${project.type} ${project.grade} ${project.teacher} ${project.school} ${project.tags.join(' ')}`.toLocaleLowerCase('vi');
      const normalizedHaystack = normalizeSearchText(haystack);
      const matchesQuery = !queryTerms.length || queryTerms.every((term) => normalizedHaystack.includes(term));
      const matchesType = typeFilter === 'Tất cả loại' || project.type === typeFilter;
      const projectGrades = project.grade.split(',').map((grade) => grade.trim());
      const matchesGrade = gradeFilter === 'Tất cả khối' || projectGrades.includes(gradeFilter) || project.grade === 'Mọi khối lớp';
      const matchesRating = ratingFilter === 'Mọi đánh giá' || (ratingFilter === 'Có đánh giá' ? Boolean(project.ratingCount) : Number(project.ratingAvg || 0) >= 4);
      const matchesDemo = !withDemoOnly || Boolean(project.videoUrl || project.url);
      const matchesGuide = !withGuideOnly || Boolean(project.usageGuide?.trim());
      const matchesOffline = !offlineOnly || project.worksOffline === true;
      const matchesMobile = !mobileOnly || project.mobileCompatible !== false;
      const matchesNoLogin = !noLoginOnly || project.requiresLogin === false;
      const matchesFree = !freeOnly || project.freeVerified === true;
      const matchesSaved = view !== 'saved' || saved.includes(project.id);
      const matchesFollowing = view !== 'following' || Boolean(project.teacherId && followingTeachers.includes(project.teacherId));
      return matchesSubject && matchesQuery && matchesType && matchesGrade && matchesRating && matchesDemo && matchesGuide && matchesOffline && matchesMobile && matchesNoLogin && matchesFree && matchesSaved && matchesFollowing;
    });
    if (sort === 'Mới nhất') result = [...result].sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
    if (sort === 'Được yêu thích') result = [...result].sort((a, b) => b.votes - a.votes);
    if (sort === 'Đánh giá cao') result = [...result].sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || b.votes - a.votes);
    if (sort === 'Tải nhiều') result = [...result].sort((a, b) => b.downloads - a.downloads);
    return result;
  }, [followingTeachers, gradeFilter, projects, query, ratingFilter, saved, sort, subject, typeFilter, view, withDemoOnly, withGuideOnly, offlineOnly, mobileOnly, noLoginOnly, freeOnly]);
  const projectTypes = useMemo(() => [...new Set(projects.map((project) => project.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [projects]);
  const activeProjectFilters = Number(Boolean(query.trim())) + Number(subject !== 'Tất cả bộ môn') + Number(typeFilter !== 'Tất cả loại') + Number(gradeFilter !== 'Tất cả khối') + Number(ratingFilter !== 'Mọi đánh giá') + Number(withDemoOnly) + Number(withGuideOnly) + Number(offlineOnly) + Number(mobileOnly) + Number(noLoginOnly) + Number(freeOnly);

  const loadMoreProjects = async () => {
    if (!supabase || projectsLoadingMore || !hasMoreProjects) return;
    setProjectsLoadingMore(true);
    const nextPage = projectPage + 1;
    const from = nextPage * PROJECT_PAGE_SIZE;
    const { data, error } = await supabase.from('resources')
      .select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url,show_school,show_location), comments:resource_comments(count)')
      .eq('moderation_status', 'approved').order('created_at', { ascending: false })
      .range(from, from + PROJECT_PAGE_SIZE - 1);
    if (error) toast(`Không tải thêm được dự án: ${error.message}`);
    else {
      const pageItems = (data || []).map(projectFromRow);
      setProjects((current) => [...current, ...pageItems.filter((item) => !current.some((existing) => existing.sourceId === item.sourceId))]);
      setProjectPage(nextPage);
      setHasMoreProjects(pageItems.length === PROJECT_PAGE_SIZE);
    }
    setProjectsLoadingMore(false);
  };

  const toggleLike = async (id: string) => {
    if (supabase && !currentUser) { setShowLogin(true); return; }
    const project = projects.find((item) => item.id === id);
    if (currentUser && project?.teacherId === currentUser.id) { toast('Thầy cô không thể tự đánh dấu hữu ích cho dự án của mình.'); return; }
    if (supabase && currentUser && project?.sourceId) {
      const hasLiked = liked.includes(id);
      const result = hasLiked
        ? await supabase.from('upvotes').delete().eq('resource_id', project.sourceId).eq('user_id', currentUser.id)
        : await supabase.from('upvotes').insert({ resource_id: project.sourceId, user_id: currentUser.id });
      if (result.error) { toast(result.error.message); return; }
    }
    const hasLiked = liked.includes(id);
    setLiked((current) => hasLiked ? current.filter((item) => item !== id) : [...current, id]);
    setProjects((current) => current.map((project) => project.id === id ? { ...project, votes: project.votes + (hasLiked ? -1 : 1) } : project));
  };

  const toggleSave = async (id: string) => {
    if (supabase && !currentUser) { setShowLogin(true); return; }
    const project = projects.find((item) => item.id === id);
    const alreadySaved = saved.includes(id);
    if (supabase && currentUser && project?.sourceId) {
      const result = alreadySaved
        ? await supabase.from('resource_bookmarks').delete().eq('resource_id', project.sourceId).eq('user_id', currentUser.id)
        : await supabase.from('resource_bookmarks').insert({ resource_id: project.sourceId, user_id: currentUser.id });
      if (result.error) { toast(result.error.message); return; }
    }
    setSaved((current) => alreadySaved ? current.filter((item) => item !== id) : [...current, id]);
    toast(alreadySaved ? 'Đã bỏ lưu dự án.' : 'Đã lưu vào bộ sưu tập của thầy cô.');
  };

  const toggleCompare = (id: string) => {
    setCompareProjectIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) { toast('Mỗi lần so sánh tối đa 3 học liệu để bảng vẫn dễ đọc.'); return current; }
      return [...current, id];
    });
  };

  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };

  const nav = (next: View) => {
    setView(next); setMobileNavOpen(false);
    const paths: Partial<Record<View, string>> = { feed: '/', projects: '/projects', talks: '/talks', ranking: '/ranking', saved: '/saved', following: '/following', collections: '/collections', 'learning-paths': '/learning-paths', groups: '/groups', messages: '/messages', offline: '/offline', downloads: '/downloads', requests: '/requests', 'lesson-plans': '/lesson-plans', schedule: '/schedule', events: '/events', help: '/help', challenges: '/challenges', 'creator-analytics': '/creator-analytics', teachers: '/teachers', appeals: '/appeals', alerts: '/alerts', admin: '/admin' };
    const path = paths[next];
    if (!path) return;
    if (next === 'talks') setTalkDetailId(null);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openTalkDetail = (id: string) => { setTalkDetailId(id); setView('talk-detail'); window.history.pushState({}, '', `/talks/${encodeURIComponent(id)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const closeTalkDetail = () => { setTalkDetailId(null); setView('talks'); window.history.pushState({}, '', '/talks'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProfile = (id: string) => { setProfileId(id); setSelectedProject(null); setView('profile'); setMobileNavOpen(false); window.history.pushState({}, '', `/teachers/${encodeURIComponent(id)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProject = (project: Project) => { if (view !== 'project') lastProjectListLocation.current = { path: window.location.pathname, scrollY: window.scrollY }; setRecentProjectIds((items) => [project.id, ...items.filter((id) => id !== project.id)].slice(0, 8)); setSelectedProject(project); const routeId = project.sourceId || project.id; setProjectRouteId(routeId); setView('project'); setMobileNavOpen(false); window.history.pushState({}, '', `/projects/${encodeURIComponent(routeId)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProjectById = (id: string) => {
    const found = projects.find((item) => item.id === id || item.sourceId === id);
    if (found) { openProject(found); return; }
    if (!supabase) { toast('Cần kết nối để mở học liệu này.'); return; }
    lastProjectListLocation.current = { path: window.location.pathname, scrollY: window.scrollY };
    setProjectRouteId(id); setSelectedProject(null); setView('project'); setMobileNavOpen(false);
    window.history.pushState({}, '', `/projects/${encodeURIComponent(id)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleOfflineProject = (project: Project) => { setOfflineProjects((old) => { const has = old.some((item) => item.id === project.id || item.sourceId === project.sourceId); const next = has ? old.filter((item) => item.id !== project.id && item.sourceId !== project.sourceId) : [project, ...old].slice(0, 40); try { localStorage.setItem(offlineProjectsKey, JSON.stringify(next)); } catch { toast('Thiết bị đã hết dung lượng lưu trữ ngoại tuyến.'); return old; } toast(has ? 'Đã gỡ khỏi danh sách đọc ngoại tuyến.' : 'Đã lưu nội dung để đọc khi mạng yếu.'); return next; }); };
  const unreadNotifications = notifications.filter((item) => new Date(item.created_at).getTime() > new Date(notificationsReadAt).getTime()).length;
  const notificationText = (item: NotificationItem) => {
    const actor = item.actor?.full_name || 'Một giáo viên';
    if (item.activity_type === 'project_approved') return 'Dự án của thầy cô đã được duyệt';
    if (item.activity_type === 'project_liked') return `${actor} đánh dấu dự án của thầy cô hữu ích`;
    if (item.activity_type === 'project_commented') return `${actor} đã bình luận về dự án`;
    if (item.activity_type === 'project_rated') return `${actor} đã đánh giá dự án`;
    if (item.activity_type === 'resource_updated') return `${actor} vừa phát hành phiên bản mới của dự án bạn đang quan tâm`;
    if (item.activity_type === 'resource_match') return 'Có học liệu mới khớp bộ lọc thầy cô đang theo dõi';
    if (item.activity_type === 'talk_match') return `${actor} vừa mở một chủ đề mới trong bộ môn thầy cô theo dõi`;
    if (item.activity_type === 'talk_mention') return `${actor} đã nhắc tên thầy cô trong một cuộc thảo luận`;
    return `${actor} vừa có hoạt động với dự án của thầy cô`;
  };
  const toggleNotifications = () => {
    if (notificationsOpen) { setNotificationsOpen(false); return; }
    setNotificationsOpen(true);
    const now = new Date().toISOString();
    setNotificationsReadAt(now);
    if (currentUser) try { localStorage.setItem(`eduhub-notifications-read:${currentUser.id}`, now); } catch { /* Keep the read state in memory. */ }
    void loadNotifications();
  };
  const openNotification = (item: NotificationItem) => {
    setNotificationsOpen(false);
    if (item.activity_type === 'talk_mention') { nav('talks'); return; }
    const resourceId = item.resource?.id;
    if (!resourceId) return;
    const project = projects.find((candidate) => candidate.sourceId === resourceId || candidate.id === resourceId);
    if (project) openProject(project);
    else { setSelectedProject(null); setProjectRouteId(resourceId); setView('project'); window.history.pushState({}, '', `/projects/${encodeURIComponent(resourceId)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const closeProject = () => { const previous = lastProjectListLocation.current; const pathView: View = previous.path === '/' ? 'feed' : previous.path === '/saved' ? 'saved' : previous.path === '/following' ? 'following' : previous.path.startsWith('/teachers/') ? 'profile' : 'projects'; setSelectedProject(null); setView(pathView); window.history.pushState({}, '', previous.path || '/projects'); window.requestAnimationFrame(() => window.scrollTo({ top: previous.scrollY, behavior: 'auto' })); };
  const currentProjectFilters = (): ProjectFilters => ({ query, subject, typeFilter, gradeFilter, ratingFilter, withDemoOnly, withGuideOnly, offlineOnly, mobileOnly, noLoginOnly, freeOnly, sort });
  const applyProjectFilters = (filters: ProjectFilters) => { setQuery(filters.query); setSubject(filters.subject); setTypeFilter(filters.typeFilter); setGradeFilter(filters.gradeFilter); setRatingFilter(filters.ratingFilter); setWithDemoOnly(filters.withDemoOnly); setWithGuideOnly(filters.withGuideOnly); setOfflineOnly(filters.offlineOnly); setMobileOnly(filters.mobileOnly); setNoLoginOnly(filters.noLoginOnly); setFreeOnly(filters.freeOnly); setSort(filters.sort); };
  const clearProjectFilters = () => applyProjectFilters({ query: '', subject: 'Tất cả bộ môn', typeFilter: 'Tất cả loại', gradeFilter: 'Tất cả khối', ratingFilter: 'Mọi đánh giá', withDemoOnly: false, withGuideOnly: false, offlineOnly: false, mobileOnly: false, noLoginOnly: false, freeOnly: false, sort: 'Mới nhất' });
  const saveProjectSearch = () => {
    const name = searchPresetName.trim();
    if (!name) { toast('Hãy đặt tên cho bộ lọc trước khi lưu.'); return; }
    if (savedProjectSearches.length >= 6) { toast('Đã đạt giới hạn 6 bộ lọc đã lưu. Xóa một bộ cũ để lưu bộ mới.'); return; }
    setSavedProjectSearches((items) => [...items, { id: crypto.randomUUID(), name: name.slice(0, 48), filters: currentProjectFilters() }]);
    setSearchPresetName(''); toast('Đã lưu bộ lọc tìm học liệu.');
  };
  const shareProjectSearch = async () => {
    const filters = currentProjectFilters();
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set('q', filters.query.trim());
    if (filters.subject !== 'Tất cả bộ môn') params.set('subject', filters.subject);
    if (filters.typeFilter !== 'Tất cả loại') params.set('type', filters.typeFilter);
    if (filters.gradeFilter !== 'Tất cả khối') params.set('grade', filters.gradeFilter);
    if (filters.ratingFilter !== 'Mọi đánh giá') params.set('rating', filters.ratingFilter);
    if (filters.withDemoOnly) params.set('demo', '1'); if (filters.withGuideOnly) params.set('guide', '1');
    if (filters.offlineOnly) params.set('offline', '1'); if (filters.mobileOnly) params.set('mobile', '1');
    if (filters.noLoginOnly) params.set('nologin', '1'); if (filters.freeOnly) params.set('free', '1');
    if (filters.sort !== 'Mới nhất') params.set('sort', filters.sort);
    const url = `${window.location.origin}/projects${params.size ? `?${params.toString()}` : ''}`;
    try { await navigator.clipboard.writeText(url); toast('Đã sao chép đường dẫn tìm kiếm.'); }
    catch { window.prompt('Sao chép đường dẫn tìm kiếm này:', url); }
  };
  const openSubmit = (sourceProject?: Project) => currentUser ? (setSubmitParentProject(sourceProject || null), setShowSubmit(true)) : setShowLogin(true);
  const openWebsiteBuilder = () => { setShowWebsiteBuilder(true); setMobileNavOpen(false); };

  const submitTeacherWebsite = async (draft: TeacherWebsiteDraft): Promise<string | null> => {
    if (!currentUser) { setShowLogin(true); return 'Đăng nhập hoặc tạo tài khoản giáo viên để gửi website duyệt. Ý tưởng và mã hiện tại vẫn được giữ trong cửa sổ này.'; }
    const error = await submitProject({ title: draft.title, description: draft.description, type: 'Website', subjects: draft.subjects, grades: draft.grades, url: '', videoUrl: draft.videoUrl, captionUrl: '', videoTranscript: '', file: null, files: [], cover: draft.cover, descriptionImages: draft.descriptionImages, websiteHtml: draft.websiteHtml, guide: draft.guide, learningOutcomes: [], accessRequirements: '', worksOffline: false, mobileCompatible: true, requiresLogin: false });
    if (!error) toast('Website đã gửi admin duyệt. Sau khi được duyệt, thầy cô sẽ nhận đường dẫn trên EduHub.');
    return error;
  };

  const submitProject = async (draft: SubmitDraft): Promise<string | null> => {
    if (!supabase || !currentUser) return 'Cần kết nối tài khoản giáo viên để gửi dự án.';
    let attachmentUrl: string | null = null;
    let coverUrl: string | null = null;
    const uploadedPaths: string[] = [];
    const upload = async (file: File | null, prefix: string) => {
      if (!file) return null;
      if (file.size > 50 * 1024 * 1024) throw new Error('Tệp vượt quá giới hạn 50 MB.');
      const path = `${currentUser.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const { error } = await supabase.storage.from('eduhub-assets').upload(path, file, { upsert: false });
      if (error) throw error;
      uploadedPaths.push(path);
      return supabase.storage.from('eduhub-assets').getPublicUrl(path).data.publicUrl;
    };
    try {
      if (draft.websiteHtml && (draft.websiteHtml.length > 500_000 || !/<html\b/i.test(draft.websiteHtml) || !/<\/html\s*>/i.test(draft.websiteHtml))) throw new Error('Mã website cần là một file HTML hoàn chỉnh, tối đa 500 KB.');
      attachmentUrl = await upload(draft.file, 'resource');
      if (draft.cover) {
        if (!draft.cover.type.startsWith('image/')) throw new Error('Ảnh bìa không đúng định dạng.');
        if (draft.cover.size > 8 * 1024 * 1024) throw new Error('Ảnh bìa tối đa 8 MB.');
        const image = await uploadPublicImage(draft.cover, `${currentUser.id}/${crypto.randomUUID()}-cover-${draft.cover.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`);
        coverUrl = image.url;
        if (image.storagePath) uploadedPaths.push(image.storagePath);
      }
      const descriptionImages: string[] = [];
      for (const [index, imageFile] of draft.descriptionImages.entries()) {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(imageFile.type)) throw new Error(`Ảnh mô tả ${imageFile.name} cần là JPG, PNG, WebP hoặc AVIF.`);
        if (imageFile.size > 8 * 1024 * 1024) throw new Error(`Ảnh mô tả ${imageFile.name} vượt quá 8 MB.`);
        const uploaded = await uploadPublicImage(imageFile, `${currentUser.id}/${crypto.randomUUID()}-description-${index}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`);
        descriptionImages.push(uploaded.url);
        if (uploaded.storagePath) uploadedPaths.push(uploaded.storagePath);
      }
      const extraRows = [] as Array<{author_id:string;file_name:string;file_url:string;storage_path:string|null;mime_type:string;file_size:number;position:number}>;
      for (const [index, extra] of draft.files.entries()) {
        if (extra.size > 50 * 1024 * 1024) throw new Error(`Tệp ${extra.name} vượt quá giới hạn 50 MB.`);
        if (!/\.(pptx?|docx?|pdf|xlsx?|zip)$/i.test(extra.name)) throw new Error(`Định dạng ${extra.name} chưa được hỗ trợ.`);
        const extraUrl = await upload(extra, 'resource-extra');
        const path = uploadedPaths.at(-1) || '';
        if (extraUrl) extraRows.push({ author_id: currentUser.id, file_name: extra.name.slice(0,240), file_url: extraUrl, storage_path: path || null, mime_type: extra.type.slice(0,120), file_size: extra.size, position: index + 1 });
      }
      const resourceTypes: Record<string, string> = { 'Bài giảng': 'powerpoint', 'Giáo án': 'khbd_5512', 'Học liệu': 'exam_matrix', 'Công cụ': 'tool_software', 'Website': 'utility_web', 'Trò chơi': 'game_interactive', 'Dự án lớp học': 'utility_web' };
      const websiteSlug = draft.websiteHtml ? `${draft.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'website-giao-duc'}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}` : null;
      const format = draft.websiteHtml ? 'html' : draft.file?.name.split('.').pop()?.toLowerCase() || null;
      const { data: createdResource, error } = await supabase.from('resources').insert({
        title: draft.title, tagline: draft.description.slice(0, 180), description: draft.description,
        resource_type: draft.websiteHtml ? 'teacher_website' : resourceTypes[draft.type] || 'tool_software', file_format: format,
        download_url: attachmentUrl, platform_url: draft.websiteHtml && websiteSlug ? `${window.location.origin}/web/${websiteSlug}` : draft.url || null, cover_url: coverUrl, description_images: descriptionImages,
        website_html: draft.websiteHtml || null, website_slug: websiteSlug,
        video_url: draft.videoUrl || null, usage_guide: draft.guide || null,
        subjects: draft.subjects, grade_levels: draft.grades, school_levels: schoolLevelsForGrades(draft.grades),
        access_requirements: draft.accessRequirements, works_offline: draft.worksOffline, mobile_compatible: draft.mobileCompatible, requires_login: draft.requiresLogin,
        learning_outcomes: draft.learningOutcomes, caption_url: draft.captionUrl || null, video_transcript: draft.videoTranscript, author_id: currentUser.id, moderation_status: 'pending', parent_resource_id: draft.parentResourceId || null,
      }).select('id').single();
      if (error) throw error;
      if (extraRows.length && createdResource) {
        const { error: fileRowsError } = await supabase.from('resource_files').insert(extraRows.map((row) => ({ ...row, resource_id: createdResource.id })));
        if (fileRowsError) { toast(`Dự án đã tạo nhưng chưa lưu được danh sách tệp bổ sung: ${fileRowsError.message}`); return null; }
      }
      toast('Đã gửi dự án. Dự án sẽ xuất hiện sau khi quản trị viên duyệt.');
      return null;
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from('eduhub-assets').remove(uploadedPaths);
      return error instanceof Error ? error.message : 'Không thể gửi dự án.';
    }
  };

  const moderateProject = async (project: Project, status: 'approved' | 'rejected') => {
    if (!supabase || !currentUser || !project.sourceId) return;
    const { error } = await supabase.from('resources').update({ moderation_status: status, moderated_by: currentUser.id, moderated_at: new Date().toISOString() }).eq('id', project.sourceId);
    if (error) { toast(error.message); return; }
    setAdminQueue((queue) => queue.filter((item) => item.id !== project.id));
    if (status === 'approved') setProjects((items) => [project, ...items]);
    toast(status === 'approved' ? 'Đã duyệt dự án.' : 'Đã từ chối dự án.');
  };

  return (
    <div className="edu-app" data-theme={theme}>
      {view === 'website' ? <PublishedTeacherWebsite slug={websiteSlug} /> : <>
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => nav('feed')} aria-label="EduHub, về trang chủ">
            <img className="brand-mark brand-logo-image" src="/eduhub-logo.png" alt="" />
            <span className="brand-word">Edu<span>Hub</span><small>.vn</small></span>
          </button>
          <nav className="primary-nav" aria-label="Điều hướng chính">
            <button className={view === 'feed' ? 'active' : ''} onClick={() => nav('feed')}>Bảng tin</button>
            <button className={['projects', 'project', 'saved', 'following'].includes(view) ? 'active' : ''} onClick={() => nav('projects')}>Học liệu</button>
            <button className={view === 'talks' || view === 'talk-detail' ? 'active' : ''} onClick={() => nav('talks')}>Thảo luận</button>
            <button className={view === 'ranking' ? 'active' : ''} onClick={() => nav('ranking')}>Xếp hạng</button>
          </nav>
          <div className="top-actions">
            <div className="searchbox"><Search size={17} /><input ref={searchInputRef} value={query} onChange={(event) => { const nextQuery = event.target.value; setQuery(nextQuery); if (nextQuery.trim() && !['feed', 'projects'].includes(view)) nav('projects'); }} placeholder="Tìm học liệu, dự án..." aria-label="Tìm học liệu và dự án" />{query && <button type="button" className="search-clear" aria-label="Xóa từ khóa tìm kiếm" onClick={() => setQuery('')}><X size={14} /></button>}<kbd>Ctrl K</kbd></div>
            <button className="button button-primary top-share" onClick={() => openSubmit()}><Plus size={16} /> Chia sẻ dự án</button>
            <div className="notification-wrap">
              <button className="icon-button notification-button" aria-label={unreadNotifications ? `Thông báo, ${unreadNotifications} chưa đọc` : 'Thông báo'} aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell size={18} />{unreadNotifications > 0 && <span className="notification-count">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}</button>
              {notificationsOpen && <section className="notification-panel" aria-label="Thông báo gần đây"><header><div><b>Thông báo</b><small>Hoạt động mới liên quan đến dự án của thầy cô</small></div><button className="icon-button" aria-label="Đóng thông báo" onClick={() => setNotificationsOpen(false)}><X size={16} /></button></header>{!currentUser ? <div className="notification-empty"><p>Đăng nhập để theo dõi hoạt động trên dự án của thầy cô.</p><button className="button button-primary" onClick={() => { setNotificationsOpen(false); setShowLogin(true); }}>Đăng nhập</button></div> : notifications.length ? <div className="notification-list">{notifications.map((item) => <button className="notification-item" key={item.id} onClick={() => openNotification(item)}><span className={`notification-icon notification-${item.activity_type}`}><Bell size={14} /></span><span><b>{notificationText(item)}</b>{item.resource?.title && <strong>{item.resource.title}</strong>}<small>{new Date(item.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</small></span>{new Date(item.created_at).getTime() > new Date(notificationsReadAt).getTime() && <i aria-label="Chưa đọc" />}</button>)}</div> : <div className="notification-empty"><span><Bell size={20} /></span><b>Chưa có hoạt động mới</b><p>Khi có giáo viên tương tác với dự án, thông báo sẽ xuất hiện ở đây.</p></div>}</section>}
            </div>
            <button className="icon-button theme-toggle" type="button" aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="reading-settings-wrap"><button className="icon-button reading-settings-button" type="button" aria-expanded={readingSettingsOpen} aria-label="Tùy chỉnh khả năng đọc" title="Tùy chỉnh khả năng đọc" onClick={() => setReadingSettingsOpen((open) => !open)}><span>Aa</span></button>{readingSettingsOpen && <section className="reading-settings-popover" aria-label="Tùy chỉnh khả năng đọc"><header><b>Khả năng đọc</b><button onClick={() => setReadingSettingsOpen(false)} aria-label="Đóng">×</button></header><label>Cỡ chữ<select value={readingSettings.size} onChange={(event) => setReadingSettings((current) => ({ ...current, size: event.target.value as typeof current.size }))}><option value="normal">Vừa</option><option value="large">Lớn</option><option value="xlarge">Rất lớn</option></select></label><label>Giãn dòng<select value={readingSettings.spacing} onChange={(event) => setReadingSettings((current) => ({ ...current, spacing: event.target.value as typeof current.spacing }))}><option value="normal">Tiêu chuẩn</option><option value="wide">Thoáng</option></select></label><label><input type="checkbox" checked={readingSettings.contrast} onChange={(event) => setReadingSettings((current) => ({ ...current, contrast: event.target.checked }))} /> Tăng tương phản</label><label><input type="checkbox" checked={readingSettings.reducedMotion} onChange={(event) => setReadingSettings((current) => ({ ...current, reducedMotion: event.target.checked }))} /> Giảm chuyển động</label><button className="button button-quiet" onClick={() => setReadingSettings({ size: 'normal', spacing: 'normal', contrast: false, reducedMotion: false })}>Đặt lại</button></section>}</div>
            <button className="button button-quiet login-button" title={currentUser ? teacherProfile?.full_name || currentUser.email || 'Mở hồ sơ giáo viên' : 'Đăng nhập'} onClick={() => currentUser ? openProfile(currentUser.id) : setShowLogin(true)}><span className="login-avatar">{currentUser ? teacherProfile?.avatar_url ? <img src={teacherProfile.avatar_url} alt="" /> : (teacherProfile?.full_name || currentUser.email || 'GV').slice(0, 1).toUpperCase() : '?'}</span><span className="login-name">{currentUser ? teacherProfile?.full_name || 'Hồ sơ' : 'Đăng nhập'}</span></button>
            <button className="mobile-menu icon-button" aria-label="Mở danh mục phụ" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><Menu size={20} /></button>
          </div>
        </div>
        {mobileNavOpen && <nav className="mobile-nav" aria-label="Điều hướng">
          <div className="mobile-nav-primary">{([['feed', 'Bảng tin'], ['projects', 'Học liệu'], ['talks', 'Thảo luận'], ['ranking', 'Xếp hạng']] as const).map(([key, label]) => <button className={view === key || (key === 'talks' && view === 'talk-detail') ? 'active' : ''} key={key} onClick={() => nav(key)}>{label}<ChevronRight size={15} /></button>)}</div>
          <div className="mobile-nav-secondary"><span className="mobile-nav-heading">Dành cho giáo viên</span><button onClick={openWebsiteBuilder}><Globe2 size={15} /> Tạo website bằng AI <ChevronRight size={15} /></button>{([['requests', 'Nhu cầu học liệu'], ['collections', 'Bộ sưu tập'], ['teachers', 'Danh bạ giáo viên'], ['saved', 'Học liệu đã lưu'], ['following', 'Đang theo dõi']] as const).map(([key, label]) => <button className={view === key ? 'active' : ''} key={key} onClick={() => nav(key)}>{label}<ChevronRight size={15} /></button>)}<span className="mobile-nav-heading">Kết nối & tiện ích</span>{([['groups', 'Nhóm chuyên môn'], ['messages', 'Tin nhắn riêng'], ['downloads', 'Lịch sử tải'], ['offline', 'Đọc khi mạng yếu']] as const).map(([key, label]) => <button className={view === key ? 'active' : ''} key={key} onClick={() => nav(key)}>{label}<ChevronRight size={15} /></button>)}
            {teacherProfile?.role === 'admin' && <button className={view === 'admin' ? 'active' : ''} onClick={() => nav('admin')}>Duyệt nội dung<ChevronRight size={15} /></button>}
          </div>
        </nav>}
      </header>

      <main className="page-shell">
        <section className={`welcome-band${['project','talks','talk-detail','profile','ranking','collections','learning-paths','groups','messages','offline','downloads','challenges','schedule','creator-analytics','teachers','appeals','alerts','admin'].includes(view) ? ' welcome-band-hidden' : ''}`}>
          <div className="welcome-copy">
            <div className="eyebrow"><img className="vietnam-flag-badge" src="/vietnam-flag.svg" alt="Quốc kỳ Việt Nam" /> CỘNG ĐỒNG GIÁO VIÊN VIỆT NAM</div>
            <h1>Cùng thầy cô làm nên<br /><em>những giờ học tốt hơn.</em></h1>
            <p>Chia sẻ điều mình làm được. Tìm thấy điều đồng nghiệp đã thử.<br className="desktop-break" /> Mỗi ý tưởng nhỏ đều có thể mở ra một cách dạy hay.</p>
            <div className="welcome-actions">
              <button className="button button-light" onClick={() => { nav('projects'); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }}>Khám phá dự án <ArrowRight size={16} /></button>
              <button className="welcome-text-button" onClick={() => openSubmit()}><Plus size={16} /> Chia sẻ dự án của bạn</button>
              <button className="welcome-text-button website-hero-action" onClick={openWebsiteBuilder}><Globe2 size={16} /> Tạo website bằng AI</button>
            </div>
            <button className="community-proof" type="button" aria-label="Khám phá danh bạ giáo viên trong cộng đồng" onClick={() => nav('teachers')}>
              <div className="avatar-stack" aria-hidden="true">{communityProof?.teachers.map((teacher, index) => <span className={`avatar community-avatar avatar-${['mint', 'peach', 'lavender', 'blue', 'yellow'][index]}`} key={teacher.id}>{teacher.avatar ? <img src={teacher.avatar} alt="" /> : teacher.name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</span>)}</div>
              <span className="community-proof-copy">{communityProof ? <><b>{communityProof.members === 1 ? '1 giáo viên đang cùng xây cộng đồng' : `${communityProof.members.toLocaleString('vi-VN')} giáo viên trong cộng đồng`}</b><small>{communityProof.projects === 0 ? 'Cùng chia sẻ học liệu đầu tiên' : `${communityProof.projects.toLocaleString('vi-VN')} dự án và học liệu đã duyệt`}</small></> : <><b>Tiểu học · THCS · THPT</b><small>Tài liệu · công cụ · trao đổi chuyên môn</small></>}</span>
            </button>
          </div>
          <div className="hero-bottom-note">TỪ LỚP HỌC, CHO LỚP HỌC</div>
        </section>

        <div className={`content-layout${view === 'project' ? ' content-layout-project-detail' : ''}`} id="explore">
          <aside className="left-rail">
            <div className="rail-section">
              <div className="rail-heading">DÀNH CHO GIÁO VIÊN</div>
              <RailButton icon={FileQuestion} label="Nhu cầu học liệu" active={view === 'requests'} onClick={() => nav('requests')} />
              <RailButton icon={BookOpen} label="Bộ sưu tập" active={view === 'collections'} onClick={() => nav('collections')} />
              <RailButton icon={Users} label="Danh bạ giáo viên" active={view === 'teachers'} onClick={() => nav('teachers')} />
              <RailButton icon={Bookmark} label="Học liệu đã lưu" active={view === 'saved'} count={saved.length ? String(saved.length) : undefined} onClick={() => nav('saved')} />
              {currentUser && <RailButton icon={Users} label="Đang theo dõi" active={view === 'following'} count={followingTeachers.length ? String(followingTeachers.length) : undefined} onClick={() => nav('following')} />}
              {teacherProfile?.role === 'admin' && <RailButton icon={Check} label="Duyệt nội dung" active={view === 'admin'} count={String(adminQueue.length)} onClick={() => nav('admin')} />}
            </div>
            <div className="rail-foot">© 2026 EduHub <span>·</span> Cộng đồng giáo viên Việt Nam</div>
          </aside>

          <section className={`main-feed${view === 'project' ? ' main-feed-project-detail' : ''}`}>
            <Suspense fallback={<div className="route-loading"><span className="button-spinner" /> Đang mở không gian…</div>}>
            {view === 'downloads' ? <ResourceDownloadHistoryPage user={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onOpenProject={openProjectById} /> : view === 'events' ? <TeacherEventsPage user={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'help' ? <HelpCenterPage user={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'project' ? selectedProject ? <ProjectModal project={selectedProject} allProjects={projects} liked={liked.includes(selectedProject.id)} saved={saved.includes(selectedProject.id)} offlineSaved={offlineProjects.some((item) => item.id === selectedProject.id || item.sourceId === selectedProject.sourceId)} onToggleOffline={() => toggleOfflineProject(selectedProject)} currentUser={currentUser} isAdmin={teacherProfile?.role === 'admin'} onClose={closeProject} onLike={() => toggleLike(selectedProject.id)} onSave={() => void toggleSave(selectedProject.id)} onNotice={toast} onRequireAuth={() => setShowLogin(true)} onOpenRelated={openProject} onCreateDerivative={openSubmit} onOpenTeacher={() => { if (selectedProject.teacherId) openProfile(selectedProject.teacherId); }} /> : supabase ? <ProjectDetailSkeleton /> : <div className="empty-state"><h3>Chưa kết nối cơ sở dữ liệu</h3><p>Dự án cần Supabase để tải thông tin thật.</p></div> : view === 'offline' ? <section className="offline-library-page"><header><span className="section-kicker">BẢN ĐỌC LƯU TRÊN THIẾT BỊ</span><h2>Học liệu đã lưu để đọc ngoại tuyến</h2><p>Nội dung mô tả, hướng dẫn và thông tin môn/khối được lưu trên thiết bị này. Tệp tải và liên kết ngoài vẫn cần mạng để mở.</p></header>{offlineProjects.length ? <div className="offline-library-list">{offlineProjects.map((project) => <article key={project.id}><button onClick={() => openProject(project)}><b>{project.title}</b><small>{project.subject} · {project.grade}</small><p>{project.description}</p></button><button aria-label="Gỡ bản lưu ngoại tuyến" onClick={() => toggleOfflineProject(project)}><Trash2 size={14} /></button></article>)}</div> : <div className="empty-state"><h3>Chưa lưu học liệu nào</h3><p>Mở trang dự án và chọn “Lưu để đọc ngoại tuyến” trước khi rời mạng.</p></div>}</section> : view === 'collections' ? <CollectionsView currentUser={currentUser} projects={projects} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onOpenProject={openProject} /> : view === 'learning-paths' ? <LearningPathsPage currentUser={currentUser} projects={projects} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onOpenProject={openProject} /> : view === 'groups' ? <TeacherGroupsPage currentUser={currentUser} projects={projects} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onOpenProject={openProject} /> : view === 'messages' ? <TeacherMessagesPage currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'requests' ? <ResourceRequestsPage currentUser={currentUser} isAdmin={teacherProfile?.role === 'admin'} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'lesson-plans' ? <LessonPlannerPage currentUser={currentUser} projects={projects} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'challenges' ? <TeachingChallengesPage currentUser={currentUser} isAdmin={teacherProfile?.role === 'admin'} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'creator-analytics' ? <CreatorAnalyticsPage currentUser={currentUser} onNotice={toast} /> : view === 'teachers' ? <TeacherDirectoryPage onOpenProfile={openProfile} onNotice={toast} /> : view === 'appeals' ? <ModerationAppealsPage currentUser={currentUser} isAdmin={teacherProfile?.role === 'admin'} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'alerts' ? <ResourceAlertsPage currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'schedule' ? <LessonSchedulePage currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} /> : view === 'profile' ? profileId ? <TeacherProfileView profileId={profileId} currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onProfileUpdated={(data) => setTeacherProfile((profile) => profile ? { ...profile, ...data } : profile)} onSignOut={async () => { await supabase?.auth.signOut(); nav('feed'); toast('Đã đăng xuất.'); }} onOpenProject={openProjectById} /> : <div className="empty-state"><h3>Chọn hồ sơ giáo viên</h3></div> : view === 'talks' || view === 'talk-detail' ? <SubjectTalksPage currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} detailId={view === 'talk-detail' ? talkDetailId : null} onOpenDetail={openTalkDetail} onBack={closeTalkDetail} onOpenTeacher={openProfile} /> : view === 'ranking' ? <RankingView onOpenProfile={openProfile} /> : view === 'admin' ? adminProfileLoading ? <div className="admin-access-denied"><ShieldCheck size={24} /><h2>Đang kiểm tra quyền truy cập…</h2></div> : teacherProfile?.role === 'admin' ? <AdminConsole pending={adminQueue} adminUserId={currentUser?.id || ''} onApprove={(project) => { const full = adminQueue.find((item) => item.id === project.id); if (full) void moderateProject(full, 'approved'); }} onReject={(project) => { const full = adminQueue.find((item) => item.id === project.id); if (full) void moderateProject(full, 'rejected'); }} onRefresh={() => { if (supabase) void supabase.from('resources').select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url,show_school,show_location), comments:resource_comments(count)').eq('moderation_status', 'pending').order('created_at', { ascending: true }).then(({ data }) => setAdminQueue((data || []).map(projectFromRow))); }} onNotice={toast} /> : <div className="admin-access-denied"><ShieldCheck size={24} /><h2>Khu vực quản trị</h2><p>Đăng nhập bằng tài khoản có quyền quản trị để tiếp tục.</p><button className="button button-primary" onClick={() => setShowLogin(true)}>Đăng nhập quản trị</button></div> : (
              <>
                <section className="projects-section-main">
                  {view === 'feed' && recentProjectIds.some((id) => projects.some((project) => project.id === id)) && <section className="recent-projects"><div className="recent-projects-heading"><div><span className="section-kicker">QUAY LẠI HỌC LIỆU VỪA XEM</span><h3>Thầy cô đã xem gần đây</h3></div><button onClick={() => setRecentProjectIds([])}>Xóa lịch sử</button></div><div className="recent-projects-row">{recentProjectIds.map((id) => projects.find((project) => project.id === id)).filter((project): project is Project => Boolean(project)).slice(0, 6).map((project) => <button className="recent-project-chip" key={project.id} onClick={() => openProject(project)}><span className={`recent-project-mark ${project.color}`}><BookOpen size={14} /></span><span><b>{project.title}</b><small>{project.subject} · {project.teacher}</small></span><ArrowUpRight size={13} /></button>)}</div></section>}
                  <div className="feed-title-row"><div><div className="section-kicker">KHO Ý TƯỞNG DÙNG ĐƯỢC</div><h2>{view === 'saved' ? 'Dự án đã lưu' : view === 'following' ? 'Từ giáo viên đang theo dõi' : view === 'projects' ? 'Khám phá dự án' : 'Mới từ cộng đồng'}</h2><p>{view === 'following' ? 'Cập nhật học liệu mới từ những đồng nghiệp thầy cô quan tâm.' : 'Học liệu, công cụ và cách làm được chia sẻ từ lớp học thật.'}</p></div><div className="project-result-count"><b>{projectsLoading ? '…' : visibleProjects.length}</b><span>{projectsLoading ? 'đang tải học liệu' : hasMoreProjects ? 'dự án đã tải' : 'dự án phù hợp'}</span></div></div>
                  <div className="filter-row"><div className="filter-chips"><button className={subject === 'Tất cả bộ môn' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setSubject('Tất cả bộ môn')}>Tất cả môn</button>{SUBJECT_NAMES.map((name) => <button className={subject === name ? 'filter-chip selected' : 'filter-chip'} key={name} onClick={() => setSubject(name)}>{name}</button>)}</div></div>
                  <button className="filter-disclosure-trigger" aria-expanded={advancedFiltersOpen} onClick={() => setAdvancedFiltersOpen((open) => !open)}><Filter size={15} /> Bộ lọc nâng cao <span>{activeProjectFilters ? `${activeProjectFilters} đang bật` : 'Loại, điều kiện và tìm kiếm đã lưu'}</span><ChevronDown className={advancedFiltersOpen ? 'expanded' : ''} size={15} /></button>
                  {advancedFiltersOpen && <>
                  <div className="project-filter-toolbar" aria-label="Bộ lọc dự án">
                    <label>Loại học liệu<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Tất cả loại</option>{projectTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                    <label>Khối lớp<select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)}><option>Tất cả khối</option>{GRADE_LABELS.map((grade) => <option key={grade}>{grade}</option>)}</select></label>
                    <label>Đánh giá<select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}><option>Mọi đánh giá</option><option>Có đánh giá</option><option>4 sao trở lên</option></select></label>
                    <label>Sắp xếp<select value={sort} onChange={(event) => setSort(event.target.value)}><option>Mới nhất</option><option>Được yêu thích</option><option>Đánh giá cao</option><option>Tải nhiều</option></select></label>
                    <label className={`project-check-filter${withDemoOnly ? ' active' : ''}`}><input type="checkbox" checked={withDemoOnly} onChange={(event) => setWithDemoOnly(event.target.checked)} /> Có bản demo</label>
                    <label className={`project-check-filter${withGuideOnly ? ' active' : ''}`}><input type="checkbox" checked={withGuideOnly} onChange={(event) => setWithGuideOnly(event.target.checked)} /> Có hướng dẫn</label>
                     <label className={`project-check-filter${freeOnly ? ' active' : ''}`}><input type="checkbox" checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} /> Miễn phí đã xác minh</label>
                     <label className={`project-check-filter${offlineOnly ? ' active' : ''}`}><input type="checkbox" checked={offlineOnly} onChange={(event) => setOfflineOnly(event.target.checked)} /> Dùng ngoại tuyến</label>
                     <label className={`project-check-filter${mobileOnly ? ' active' : ''}`}><input type="checkbox" checked={mobileOnly} onChange={(event) => setMobileOnly(event.target.checked)} /> Dùng tốt trên điện thoại</label>
                     <label className={`project-check-filter${noLoginOnly ? ' active' : ''}`}><input type="checkbox" checked={noLoginOnly} onChange={(event) => setNoLoginOnly(event.target.checked)} /> Không cần tài khoản ngoài</label>
                  </div>
                  <div className="saved-search-toolbar"><div className="saved-search-create"><input aria-label="Tên bộ lọc đã lưu" value={searchPresetName} onChange={(event) => setSearchPresetName(event.target.value)} maxLength={48} placeholder="Đặt tên bộ lọc để dùng lại" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveProjectSearch(); } }} /><button onClick={saveProjectSearch} disabled={!searchPresetName.trim() || savedProjectSearches.length >= 6}><Bookmark size={13} /> Lưu bộ lọc</button></div><div className="saved-search-actions"><select aria-label="Mở bộ lọc đã lưu" value={selectedSavedSearchId} onChange={(event) => { const id = event.target.value; setSelectedSavedSearchId(id); const preset = savedProjectSearches.find((item) => item.id === id); if (preset) applyProjectFilters(preset.filters); }}><option value="">Bộ lọc đã lưu{savedProjectSearches.length ? ` (${savedProjectSearches.length})` : ''}</option>{savedProjectSearches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{selectedSavedSearchId && <button aria-label="Xóa bộ lọc đã chọn" title="Xóa bộ lọc đã chọn" onClick={() => { setSavedProjectSearches((items) => items.filter((item) => item.id !== selectedSavedSearchId)); setSelectedSavedSearchId(''); }}><Trash2 size={13} /></button>}<button onClick={() => void shareProjectSearch()}><Share2 size={13} /> Chia sẻ tìm kiếm</button></div></div>
                  </>}
                  {activeProjectFilters > 0 && <div className="active-project-filters"><span>{activeProjectFilters} bộ lọc đang bật</span>{query.trim() && <button onClick={() => setQuery('')}>Từ khóa: {query} <X size={12} /></button>}{subject !== 'Tất cả bộ môn' && <button onClick={() => setSubject('Tất cả bộ môn')}>{subject} <X size={12} /></button>}{typeFilter !== 'Tất cả loại' && <button onClick={() => setTypeFilter('Tất cả loại')}>{typeFilter} <X size={12} /></button>}{gradeFilter !== 'Tất cả khối' && <button onClick={() => setGradeFilter('Tất cả khối')}>{gradeFilter} <X size={12} /></button>}{ratingFilter !== 'Mọi đánh giá' && <button onClick={() => setRatingFilter('Mọi đánh giá')}>{ratingFilter} <X size={12} /></button>}{withDemoOnly && <button onClick={() => setWithDemoOnly(false)}>Có bản demo <X size={12} /></button>}{withGuideOnly && <button onClick={() => setWithGuideOnly(false)}>Có hướng dẫn <X size={12} /></button>}{freeOnly && <button onClick={() => setFreeOnly(false)}>Miễn phí đã xác minh <X size={12} /></button>}{offlineOnly && <button onClick={() => setOfflineOnly(false)}>Dùng ngoại tuyến <X size={12} /></button>}{mobileOnly && <button onClick={() => setMobileOnly(false)}>Dùng tốt trên điện thoại <X size={12} /></button>}{noLoginOnly && <button onClick={() => setNoLoginOnly(false)}>Không cần tài khoản ngoài <X size={12} /></button>}<button className="clear-project-filters" onClick={clearProjectFilters}>Xóa tất cả</button></div>}
                  <div className="project-list">{projectsLoading ? <ProjectListSkeleton /> : visibleProjects.length ? visibleProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} liked={liked.includes(project.id)} saved={saved.includes(project.id)} compared={compareProjectIds.includes(project.id)} onCompare={() => toggleCompare(project.id)} onLike={() => toggleLike(project.id)} onSave={() => void toggleSave(project.id)} onOpen={() => openProject(project)} onOpenTeacher={() => project.teacherId && openProfile(project.teacherId)} />) : <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h3>{view === 'saved' ? saved.length === 0 ? 'Chưa lưu dự án nào' : hasMoreProjects ? 'Đang tìm các dự án đã lưu' : 'Không còn dự án đã lưu công khai' : view === 'following' && !currentUser ? 'Đăng nhập để theo dõi giáo viên' : view === 'following' && followingTeachers.length === 0 ? 'Theo dõi giáo viên để xem dự án' : view === 'following' && hasMoreProjects ? 'Đang tìm dự án từ người thầy cô theo dõi' : view === 'following' ? 'Chưa có dự án mới từ người thầy cô theo dõi' : 'Chưa tìm thấy dự án phù hợp'}</h3><p>{view === 'saved' ? saved.length === 0 ? 'Lưu học liệu hay để quay lại dùng trong những tiết dạy sau.' : 'Danh sách đang kiểm tra các dự án đã lưu trong những trang tiếp theo.' : view === 'following' ? 'Mở hồ sơ giáo viên và chọn Theo dõi để tạo dòng cập nhật riêng.' : 'Thử bỏ bớt bộ lọc hoặc tìm bằng từ khóa không dấu.'}</p><button className="button button-primary" onClick={() => { if (hasMoreProjects && (view === 'saved' || view === 'following' || query)) { void loadMoreProjects(); return; } clearProjectFilters(); nav('projects'); }}>{hasMoreProjects && (view === 'saved' || view === 'following' || query) ? 'Tải thêm để tìm tiếp' : activeProjectFilters ? 'Xóa bộ lọc' : 'Xem tất cả dự án'}</button></div>}</div>
                  {compareProjectIds.length > 0 && <section className="resource-compare-panel"><header><div><span className="section-kicker">ĐỐI CHIẾU HỌC LIỆU</span><h3>So sánh trước khi chọn</h3></div><button onClick={() => setCompareProjectIds([])}>Xóa lựa chọn</button></header>{compareProjectIds.length < 2 ? <p>Chọn thêm {2 - compareProjectIds.length} học liệu nữa để đối chiếu thông tin.</p> : <div className="resource-compare-table" style={{ '--compare-count': compareProjectIds.length } as CSSProperties}><div className="compare-row compare-head"><b>Thông tin</b>{compareProjectIds.map((id) => projects.find((item) => item.id === id)).filter((item): item is Project => Boolean(item)).map((project) => <span key={project.id}><button onClick={() => openProject(project)}>{project.title}</button><button aria-label={`Bỏ ${project.title} khỏi so sánh`} onClick={() => toggleCompare(project.id)}><X size={13} /></button></span>)}</div>{([['Bộ môn', (p: Project) => p.subjects.join(' · ') || p.subject], ['Khối lớp', (p: Project) => p.grade], ['Định dạng', (p: Project) => p.format], ['Đánh giá', (p: Project) => `${p.ratingAvg?.toFixed(1) || '0.0'} sao · ${p.ratingCount || 0} lượt`], ['Tương tác', (p: Project) => `${p.votes} hữu ích · ${p.downloads} lượt tải`], ['Hướng dẫn', (p: Project) => p.usageGuide ? 'Có hướng dẫn' : 'Chưa có hướng dẫn'], ['Tác giả', (p: Project) => p.teacher]] as Array<[string, (project: Project) => string]>).map(([label, getValue]) => <div className="compare-row" key={label}><b>{label}</b>{compareProjectIds.map((id) => projects.find((item) => item.id === id)).filter((item): item is Project => Boolean(item)).map((project) => <span key={project.id}>{getValue(project)}</span>)}</div>)}</div>}</section>}
                  {hasMoreProjects ? <button className="load-more" onClick={() => void loadMoreProjects()} disabled={projectsLoadingMore}>{projectsLoadingMore ? 'Đang tải dự án…' : activeProjectFilters ? 'Tải thêm để tìm dự án phù hợp' : 'Tải thêm dự án'} {projectsLoadingMore ? <span className="button-spinner" /> : <ChevronDown size={15} />}</button> : visibleProjects.length > 0 && <div className="load-more load-more-finished">Thầy cô đã xem hết dự án hiện có <Check size={15} /></div>}
                </section>
              </>
            )}
            </Suspense>
          </section>

          <aside className="right-rail">
            <div className="right-widget weekly-widget"><div className="widget-title"><div><span className="section-kicker">GHI NHẬN ĐÓNG GÓP</span><h3>Thầy cô nổi bật</h3></div><button aria-label="Mở bảng xếp hạng" onClick={() => nav('ranking')}><ArrowUpRight size={16} /></button></div><div className="weekly-caption">Theo tổng điểm</div><div className="teacher-list">{activeTeachers.length ? activeTeachers.map((teacher, index) => <button className="teacher-row" key={teacher.id} onClick={() => openProfile(teacher.id)}><span className={`rank-number rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className={`avatar avatar-${teacher.color}`}>{teacher.initials}</span><span className="teacher-info"><strong>{teacher.name}</strong><small>{teacher.subject}</small></span><b className="teacher-points">{teacher.points}<small>điểm</small></b></button>) : <p className="admin-empty-note">Chưa có hồ sơ đóng góp.</p>}</div><button className="widget-link" onClick={() => nav('ranking')}>Xem bảng xếp hạng <ArrowRight size={14} /></button></div>

            <div className="right-widget community-rules"><div className="rules-icon"><CircleHelp size={17} /></div><div><b>Chia sẻ có trách nhiệm</b><p>Ghi nguồn tài liệu và chỉ đăng nội dung thầy cô có quyền chia sẻ.</p></div></div>
          </aside>
        </div>
      </main>

      <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><img className="brand-mark brand-logo-image" src="/eduhub-logo.png" alt="" /><span className="brand-word">Edu<span>Hub</span><small>.vn</small></span><p>Học liệu do thầy cô chia sẻ,<br />dành cho lớp học Việt.</p></div><div className="footer-links"><div><b>Khám phá</b><button onClick={() => nav('projects')}>Học liệu</button><button onClick={() => nav('talks')}>Thảo luận bộ môn</button><button onClick={() => nav('ranking')}>Bảng xếp hạng</button></div><div><b>Cộng đồng</b><button onClick={() => nav('teachers')}>Danh bạ giáo viên</button><button onClick={() => nav('requests')}>Nhu cầu học liệu</button><button onClick={() => nav('collections')}>Bộ sưu tập</button></div><div><b>Đóng góp</b><button onClick={() => openSubmit()}>Chia sẻ học liệu</button><button onClick={() => setShowLogin(true)}>Tạo tài khoản giáo viên</button></div></div><div className="footer-bottom"><span>© 2026 EduHub · Cộng đồng giáo viên Việt Nam</span><a href="https://openmoji.org/" target="_blank" rel="noreferrer">Minh họa OpenMoji · CC BY-SA 4.0</a><span>Từ lớp học, cho lớp học.</span></div></div></footer>

      {notice && <div className="toast-message"><Check size={16} /> {notice}</div>}
      {showWebsiteBuilder && <WebsiteBuilderModal onClose={() => setShowWebsiteBuilder(false)} onSubmit={async (draft) => { const error = await submitTeacherWebsite(draft); if (!error) setShowWebsiteBuilder(false); return error; }} />}
      {showSubmit && <SubmitModal currentUserId={currentUser?.id || ''} sourceProject={submitParentProject} onClose={() => { setShowSubmit(false); setSubmitParentProject(null); }} onSubmit={async (draft) => { const error = await submitProject(draft); if (!error) { setShowSubmit(false); setSubmitParentProject(null); } return error; }} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onNotice={toast} />}
      {showTeacherOnboarding && currentUser && teacherProfile && <TeacherOnboardingModal userId={currentUser.id} initialName={teacherProfile.full_name} onComplete={() => { setShowTeacherOnboarding(false); setTeacherProfile((profile) => profile ? { ...profile, profile_completed_at: new Date().toISOString() } : profile); }} onNotice={toast} />}
      </>}
    </div>
  );
}

function RailButton({ icon: Icon, label, active, count, onClick }: { icon: LucideIcon; label: string; active?: boolean; count?: string; onClick: () => void }) {
  return <button className={`rail-button${active ? ' active' : ''}`} onClick={onClick}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>{count && <small>{count}</small>}</button>;
}

function ProjectCard({ project, index, liked, saved, compared, onCompare, onLike, onSave, onOpen, onOpenTeacher }: { project: Project; index: number; liked: boolean; saved: boolean; compared: boolean; onCompare: () => void; onLike: () => void; onSave: () => void; onOpen: () => void; onOpenTeacher: () => void }) {
  const projectArt = /web|app|công cụ|phần mềm|tiện ích/i.test(project.type) ? '/assets/openmoji-laptop.svg' : /giáo án|kế hoạch|bài dạy/i.test(project.type) ? '/assets/openmoji-notebook.svg' : /tài liệu|bài giảng|slide|sách/i.test(project.type) ? '/assets/openmoji-open-book.svg' : /game|trò chơi|tương tác/i.test(project.type) ? '/assets/openmoji-teacher-student.svg' : '/assets/openmoji-memo.svg';
  return <article className={`project-card${project.featured ? ' project-featured' : ''}`}>
    <button className={`project-cover cover-${project.color}`} onClick={onOpen} aria-label={`Xem ${project.title}`}>{project.coverUrl && <img className="project-cover-image" src={project.coverUrl} alt="" />}<div className="cover-top"><span className="cover-type">{project.type}</span><span className="cover-subject">{project.subjects.length > 1 ? `${project.subjects.slice(0, 2).join(' · ')}${project.subjects.length > 2 ? ` +${project.subjects.length - 2}` : ''}` : project.subject}</span></div>{!project.coverUrl && <img className="cover-openmoji" src={projectArt} alt="" />}<div className="cover-bottom"><span>{project.grade}</span><span>EduHub · Học liệu chia sẻ</span></div>{project.demo && <span className="cover-play"><Play size={13} fill="currentColor" /> Có bản dùng thử</span>}</button>
    <div className="project-content"><div className="project-main"><div className="project-label-row"><span className="project-kind"><span className={`kind-dot ${project.color}`} />{project.type}</span><span className="project-time"><Clock3 size={12} /> {project.time}</span></div><button className="project-title" onClick={onOpen}>{project.title}</button><p className="project-description">{project.description}</p><div className="project-tags">{project.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><button className="project-author project-author-button" onClick={onOpenTeacher} disabled={!project.teacherId}><span className={`avatar avatar-${project.color}`}>{project.teacherAvatarUrl ? <img src={project.teacherAvatarUrl} alt="" /> : project.initials}</span><span><b>{project.teacher}</b><small>{project.school}</small></span></button></div>
      <div className="project-aside"><button className={`compare-project-button${compared ? ' active' : ''}`} onClick={onCompare} aria-label={compared ? 'Bỏ khỏi danh sách so sánh' : 'Thêm vào danh sách so sánh'} title={compared ? 'Bỏ khỏi so sánh' : 'So sánh học liệu'}><GitCompareArrows size={15} /></button><button className={`save-button${saved ? ' saved' : ''}`} onClick={onSave} aria-label={saved ? 'Bỏ lưu dự án' : 'Lưu dự án'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button><button className={`vote-button${liked ? ' voted' : ''}`} onClick={onLike}><ThumbsUp size={15} /> <b>{project.votes}</b></button><button className="comments-button" onClick={onOpen}><MessageCircle size={15} /> {project.replies}</button><span className="download-count"><ArrowDownToLine size={14} /> {project.downloads}</span></div>
    </div>
  </article>;
}

function RankingView({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const [rows, setRows] = useState<Array<{ id: string; full_name: string; subject_specialty: string | null; edu_points: number; school_name: string | null }>>([]);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    setLoading(true);
    const load = async () => {
      if (period === 'all') {
        const { data, error } = await supabase.from('profiles').select('id,full_name,subject_specialty,edu_points,school_name').order('edu_points', { ascending: false }).limit(20);
        if (active && !error && data) setRows(data);
      } else {
        const start = new Date();
        if (period === 'week') start.setDate(start.getDate() - 7); else { start.setDate(1); start.setHours(0, 0, 0, 0); }
        const { data, error } = await supabase.from('edu_point_events').select('profile_id,points,created_at,profile:profiles!edu_point_events_profile_id_fkey(id,full_name,subject_specialty,school_name)').gte('created_at', start.toISOString()).limit(5000);
        if (active && error) setRows([]);
        if (active && !error && data) {
          const totals = new Map<string, { id: string; full_name: string; subject_specialty: string | null; school_name: string | null; edu_points: number }>();
          for (const event of data as unknown as Array<{ profile_id: string; points: number; profile?: { id: string; full_name: string; subject_specialty: string | null; school_name: string | null } }>) {
            if (!event.profile) continue;
            const teacher = totals.get(event.profile_id) || { ...event.profile, edu_points: 0 };
            teacher.edu_points += Number(event.points || 0); totals.set(event.profile_id, teacher);
          }
          setRows([...totals.values()].filter((teacher) => teacher.edu_points > 0).sort((a, b) => b.edu_points - a.edu_points).slice(0, 20));
        }
      }
      if (active) setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [period]);
  const podiumOrder = rows.length > 1 ? [1, 0, 2].filter((index) => rows[index]) : rows.map((_, index) => index);
  const maxPoints = Math.max(1, ...rows.map((teacher) => Number(teacher.edu_points || 0)));
  const teacherAvatar = (teacher: typeof rows[number], index: number) => <span className={`avatar avatar-${['mint','peach','lavender','blue','yellow','coral'][index % 6]}`}>{teacher.full_name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</span>;
  return <section className="ranking-page rank-arena">
    <header className="rank-hero">
      <div className="rank-hero-copy">
        <span className="rank-season"><span /> ĐẤU TRƯỜNG EDUHUB <span className="rank-season-spark">✦</span></span>
        <h2>Đường đua <em>tri thức</em></h2>
        <p>Mỗi học liệu hay, mỗi lần sẻ chia — thêm một bước tiến trên bảng vàng.</p>
        <div className="rank-hero-meta"><span><Trophy size={14} /> Vinh danh người truyền cảm hứng</span><i /> <span>{rows.length} chiến binh tri thức</span></div>
      </div>
      <div className="rank-hero-art" aria-hidden="true"><span className="rank-art-ring" /><span className="rank-art-star">✦</span><span className="rank-art-trophy">🏆</span><span className="rank-art-orbit">✧</span><span className="rank-art-caption">SHARE<br />& LEVEL UP</span></div>
    </header>
    <div className="rank-season-bar"><div><span className="rank-live-dot" /> BẢNG ĐIỂM CỘNG ĐỒNG <small>· Cập nhật theo đóng góp</small></div><div className="ranking-period" role="group" aria-label="Chọn kỳ xếp hạng"><button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>🏆 Tất cả</button><button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>🌙 Tháng này</button><button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>⚡ 7 ngày</button></div></div>
    <p className="rank-context">{period === 'all' ? 'Tổng điểm từ dự án được duyệt, lượt hữu ích và đánh giá có trọng số.' : `Điểm ghi nhận trong ${period === 'week' ? '7 ngày gần nhất' : 'tháng hiện tại'} · cùng nhau leo hạng nhé!`}</p>
    {loading ? <ProjectListSkeleton /> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon"><img src="/assets/openmoji-trophy.svg" alt="" /></div><h3>Ván đua sắp bắt đầu!</h3><p>Chia sẻ học liệu hữu ích để trở thành người đầu tiên ghi tên lên bảng vàng.</p></div> : <><div className="ranking-podium">{podiumOrder.map((index) => { const teacher = rows[index]; const podiumAsset = index === 0 ? '/assets/openmoji-gold-medal.svg' : index === 1 ? '/assets/openmoji-medal.svg' : '/assets/openmoji-trophy.svg'; return <button className={`podium-card podium-${index + 1}`} key={`${teacher.full_name}-${index}`} onClick={() => teacher.id && onOpenProfile(teacher.id)} disabled={!teacher.id}><span className="podium-medal"><img src={podiumAsset} alt="" /> <small>#{index + 1}</small></span>{teacherAvatar(teacher, index)}<b>{teacher.full_name}<BadgeCheck className="ranking-verified" size={15} fill="currentColor" aria-label="Có tên trong bảng xếp hạng EduHub" /></b><small>{teacher.subject_specialty || 'Giáo viên EduHub'}</small><strong>{Number(teacher.edu_points || 0).toLocaleString('vi-VN')} <small>điểm XP</small></strong></button>; })}</div><div className="ranking-list-heading"><b><span>⚡</span> BẢNG XẾP HẠNG</b><span>{rows.length} giáo viên</span></div>{rows.slice(3).map((teacher, offset) => { const index = offset + 3; const points = Number(teacher.edu_points || 0); return <div className="ranking-row" key={`${teacher.full_name}-${index}`}><span className={`rank-number rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>{teacherAvatar(teacher, index)}<span className="teacher-info"><button className="ranking-profile-link" disabled={!teacher.id} onClick={() => teacher.id && onOpenProfile(teacher.id)}>{teacher.full_name}<BadgeCheck className="ranking-verified" size={14} fill="currentColor" aria-label="Có tên trong bảng xếp hạng EduHub" /></button><small>{teacher.subject_specialty || 'Giáo viên EduHub'} · {teacher.school_name || 'Cộng đồng EduHub'}</small><span className="rank-progress"><i style={{ width: `${Math.max(4, Math.round(points / maxPoints * 100))}%` }} /></span></span><span className="teacher-points">{points.toLocaleString('vi-VN')}<small>XP</small></span></div>; })}</>}
  </section>;
}
function ProjectModal({ project, allProjects, liked, saved, offlineSaved, onToggleOffline, currentUser, isAdmin, onClose, onLike, onSave, onNotice, onRequireAuth, onOpenTeacher, onOpenRelated, onCreateDerivative }: { project: Project; allProjects: Project[]; liked: boolean; saved: boolean; offlineSaved: boolean; onToggleOffline: () => void; currentUser: User | null; isAdmin: boolean; onClose: () => void; onLike: () => void; onSave: () => void; onNotice: (message: string) => void; onRequireAuth: () => void; onOpenTeacher: () => void; onOpenRelated: (project: Project) => void; onCreateDerivative: (project?: Project) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; parent_comment_id: string | null; content: string; created_at: string; author?: { full_name?: string } }>>([]);
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest');
  const [commentSearch, setCommentSearch] = useState('');
  const [collapsedCommentReplies, setCollapsedCommentReplies] = useState<string[]>([]);
  const [commentRealtimeReady, setCommentRealtimeReady] = useState(false);
  const [commentTyping, setCommentTyping] = useState(false);
  const [typingTeachers, setTypingTeachers] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Array<{ id: string; stars: number; review_text: string; created_at: string; author?: { full_name?: string } }>>([]);
  const [ratingStats, setRatingStats] = useState({ average: project.ratingAvg || 0, count: project.ratingCount || 0 });
  const [myRating, setMyRating] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [replacementCandidate, setReplacementCandidate] = useState('');
  const commentDraftKey = `eduhub-project-comment-draft:${currentUser?.id || 'guest'}:${project.sourceId || project.id}`;
  const [comment, setComment] = useState(() => { try { return localStorage.getItem(`eduhub-project-comment-draft:${currentUser?.id || 'guest'}:${project.sourceId || project.id}`) || ''; } catch { return ''; } });
  const [hydratedCommentDraftKey, setHydratedCommentDraftKey] = useState(commentDraftKey);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [parentAttribution, setParentAttribution] = useState<{ id: string; title: string; teacher: string } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  useEffect(() => {
    if (!project.parentResourceId) { setParentAttribution(null); return; }
    const localParent = allProjects.find((item) => item.sourceId === project.parentResourceId);
    if (localParent) { setParentAttribution({ id: localParent.sourceId || localParent.id, title: localParent.title, teacher: localParent.teacher }); return; }
    if (!supabase) return;
    void supabase.from('resources').select('id,title,author:profiles!resources_author_id_fkey(full_name)').eq('id', project.parentResourceId).maybeSingle()
      .then(({ data }) => { if (data) setParentAttribution({ id: data.id, title: data.title, teacher: (data.author as unknown as { full_name?: string } | null)?.full_name || 'Giáo viên' }); });
  }, [project.parentResourceId, allProjects]);
  const relatedProjects = useMemo(() => allProjects.map((candidate) => {
    if (candidate.id === project.id) return { project: candidate, score: 0 };
    const gradeSet = new Set(project.grade.split(',').map((grade) => grade.trim()));
    const subjectOverlap = candidate.subjects.filter((item) => project.subjects.includes(item)).length;
    const gradeOverlap = candidate.grade.split(',').map((grade) => grade.trim()).some((grade) => gradeSet.has(grade));
    const tagOverlap = candidate.tags.filter((tag) => project.tags.some((current) => current.toLocaleLowerCase('vi') === tag.toLocaleLowerCase('vi'))).length;
    return { project: candidate, score: subjectOverlap * 4 + Number(gradeOverlap) * 2 + Number(candidate.type === project.type) + tagOverlap };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || b.project.votes - a.project.votes).slice(0, 4).map((entry) => entry.project), [allProjects, project]);
  const safePreview = (() => {
    if (!project.downloadUrl) return null;
    try {
      const url = new URL(project.downloadUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      if (/\.(pdf)$/i.test(url.pathname)) return { kind: 'pdf', url: url.href };
      if (/\.(png|jpe?g|webp|gif|avif)$/i.test(url.pathname)) return { kind: 'image', url: url.href };
    } catch { return null; }
    return null;
  })();
  const copyText = async (value: string, successMessage: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea'); field.value = value; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select();
        const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error('Clipboard unavailable');
      }
      onNotice(successMessage);
    } catch { onNotice('Không thể sao chép. Thầy cô có thể chọn và sao chép liên kết thủ công.'); }
  };
  const shareProject = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: project.title, text: `Học liệu ${project.subject} trên EduHub`, url }); }
      catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) await copyText(url, 'Đã sao chép liên kết dự án.'); }
    } else await copyText(url, 'Đã sao chép liên kết dự án.');
  };
  const createProjectQr = async () => {
    try { const url = `${window.location.origin}/projects/${encodeURIComponent(project.sourceId || project.id)}`; setQrDataUrl(await QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#173b34', light: '#ffffff' } })); setQrOpen(true); }
    catch { onNotice('Chưa tạo được mã QR cho dự án.'); }
  };
  const downloadProjectQr = () => { const link = document.createElement('a'); link.href = qrDataUrl; link.download = `eduhub-qr-${(project.title.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'du-an')}.png`; link.click(); };
  const printProjectQr = () => { document.body.classList.add('print-qr-sheet'); window.addEventListener('afterprint', () => document.body.classList.remove('print-qr-sheet'), { once: true }); window.print(); window.setTimeout(() => document.body.classList.remove('print-qr-sheet'), 5000); };
  const copyCitation = () => void copyText(`“${project.title}” — ${project.teacher}${project.school ? `, ${project.school}` : ''}. EduHub, truy cập ngày ${new Date().toLocaleDateString('vi-VN')}. ${window.location.href}`, 'Đã sao chép trích dẫn học liệu.');
  const recordProjectAction = (action: 'open' | 'download') => { if (!supabase || !project.sourceId) return; void supabase.rpc('record_resource_action', { p_resource_id: project.sourceId, p_action: action }).then(({ error }) => { if (error) onNotice('Chưa ghi nhận được lịch sử. Hãy chạy bản SQL mới nhất để bật tính năng này.'); }); };
  const printGuide = () => {
    document.body.classList.add('print-guide');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-guide'), { once: true });
    window.setTimeout(() => window.print(), 60);
    window.setTimeout(() => document.body.classList.remove('print-guide'), 6000);
  };
  const printResourceSheet = () => {
    document.body.classList.add('print-resource-sheet-mode');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-resource-sheet-mode'), { once: true });
    window.setTimeout(() => window.print(), 60);
    window.setTimeout(() => document.body.classList.remove('print-resource-sheet-mode'), 6000);
  };
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const loadComments = async () => {
    if (!supabase || !project.sourceId) return;
    const { data, error } = await supabase.from('resource_comments')
      .select('id,parent_comment_id,content,created_at,author:profiles!resource_comments_author_id_fkey(full_name)')
      .eq('resource_id', project.sourceId).order('created_at', { ascending: false }).limit(200);
    if (error) { onNotice(error.message); return; }
    setComments(((data || []) as typeof comments).reverse());
  };
  useEffect(() => { void loadComments(); }, [project.sourceId]);
  useEffect(() => {
    if (!supabase || !project.sourceId) return;
    const channel = supabase.channel(`resource-comments-${project.sourceId}`, { config: { presence: { key: currentUser?.id || crypto.randomUUID() } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_comments', filter: `resource_id=eq.${project.sourceId}` }, () => void loadComments())
      .on('presence', { event: 'sync' }, () => {
        const states = Object.values(channel.presenceState()).flat() as Array<{ user_id?: string; full_name?: string; typing?: boolean }>;
        setTypingTeachers(states.filter((item) => item.typing && item.user_id !== currentUser?.id).map((item) => item.full_name || 'Giáo viên').slice(0, 3));
      })
      .subscribe((status) => { setCommentRealtimeReady(status === 'SUBSCRIBED'); if (status === 'SUBSCRIBED' && currentUser) void channel.track({ user_id: currentUser.id, full_name: currentUser.user_metadata?.full_name || 'Giáo viên', typing: false }); });
    return () => { setCommentRealtimeReady(false); void supabase?.removeChannel(channel); };
  }, [project.sourceId, currentUser?.id]);
  useEffect(() => {
    if (!supabase || !project.sourceId) return;
    const channel = supabase.getChannels().find((item) => item.topic === `realtime:resource-comments-${project.sourceId}`);
    if (channel && currentUser) void channel.track({ user_id: currentUser.id, full_name: currentUser.user_metadata?.full_name || 'Giáo viên', typing: commentTyping });
  }, [commentTyping, project.sourceId, currentUser?.id]);
  useEffect(() => {
    if (hydratedCommentDraftKey !== commentDraftKey) return;
    try { if (comment.trim()) localStorage.setItem(commentDraftKey, comment); else localStorage.removeItem(commentDraftKey); } catch { /* Draft remains in this page view. */ }
  }, [comment, commentDraftKey, hydratedCommentDraftKey]);
  useEffect(() => { if (!commentTyping) return; const timer = window.setTimeout(() => setCommentTyping(false), 1800); return () => window.clearTimeout(timer); }, [commentTyping]);
  useEffect(() => {
    try { const draft = localStorage.getItem(commentDraftKey); setComment(draft || ''); setHydratedCommentDraftKey(commentDraftKey); setReplyingTo(null); } catch { setHydratedCommentDraftKey(commentDraftKey); }
  }, [commentDraftKey]);
  const loadRatings = async () => {
    if (!supabase || !project.sourceId) return;
    const [{ data, error }, { data: summary, error: summaryError }] = await Promise.all([
      supabase.from('resource_ratings').select('id,stars,review_text,created_at,user_id,author:profiles!resource_ratings_user_id_fkey(full_name)').eq('resource_id', project.sourceId).order('created_at', { ascending: false }).limit(30),
      supabase.from('resources').select('rating_avg,rating_count').eq('id', project.sourceId).maybeSingle(),
    ]);
    if (error) { onNotice(error.message); return; }
    if (!summaryError && summary) setRatingStats({ average: Number(summary.rating_avg || 0), count: Number(summary.rating_count || 0) });
    const entries = (data || []) as Array<{ id: string; stars: number; review_text: string; created_at: string; user_id: string; author?: { full_name?: string } }>;
    setRatings(entries);
    if (currentUser) {
      const mine = entries.find((item) => item.user_id === currentUser.id);
      setMyRating(mine?.stars || 0); setRatingText(mine?.review_text || '');
    }
  };
  useEffect(() => { void loadRatings(); }, [project.sourceId, currentUser?.id]);
  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !project.sourceId || !comment.trim()) return;
    setSending(true);
    const { error } = await supabase.from('resource_comments').insert({ resource_id: project.sourceId, author_id: currentUser.id, content: comment.trim(), parent_comment_id: replyingTo?.id || null });
    setSending(false);
    if (error) { onNotice(error.message); return; }
    setComment(''); setCommentTyping(false); setReplyingTo(null); try { localStorage.removeItem(commentDraftKey); } catch { /* Ignore unavailable local storage. */ } await loadComments();
  };
  const setResourceStatus = async (status: 'current' | 'outdated') => {
    if (!supabase || !project.sourceId || (!isAdmin && project.teacherId !== currentUser?.id)) return;
    setStatusBusy(true);
    const { error } = await supabase.rpc('set_resource_status', { p_resource_id: project.sourceId, p_status: status, p_replacement_resource_id: replacementCandidate || null });
    setStatusBusy(false);
    if (error) { onNotice(`Không cập nhật được tình trạng học liệu: ${error.message}`); return; }
    onNotice(status === 'outdated' ? 'Đã đánh dấu học liệu cần cập nhật.' : 'Đã xác nhận học liệu còn sử dụng tốt.');
  };
  const saveRating = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !project.sourceId) { onNotice('Kết nối Supabase để gửi đánh giá.'); return; }
    if (project.teacherId === currentUser.id) { onNotice('Thầy cô không thể tự đánh giá dự án của mình.'); return; }
    if (myRating < 1 || myRating > 5) { onNotice('Chọn số sao từ 1 đến 5.'); return; }
    setSavingRating(true);
    const { error } = await supabase.from('resource_ratings').upsert({ resource_id: project.sourceId, user_id: currentUser.id, stars: myRating, review_text: ratingText.trim() }, { onConflict: 'resource_id,user_id' });
    setSavingRating(false);
    if (error) { onNotice(error.message); return; }
    onNotice('Đã lưu đánh giá. Trọng số được tính theo đóng góp của tài khoản.'); await loadRatings();
  };
  const commentQuery = normalizeSearchText(commentSearch);
  const visibleCommentRoots = comments.filter((item) => !item.parent_comment_id).filter((item) => !commentQuery || normalizeSearchText(`${item.content} ${item.author?.full_name || ''} ${comments.filter((reply) => reply.parent_comment_id === item.id).map((reply) => reply.content).join(' ')}`).includes(commentQuery)).sort((a, b) => commentSort === 'newest' ? Date.parse(b.created_at) - Date.parse(a.created_at) : Date.parse(a.created_at) - Date.parse(b.created_at));
  return <section className="project-detail-page">
      <div className="project-detail-toolbar"><button className="button button-quiet" onClick={onClose}><ArrowRight className="back-arrow" size={15} /> Quay lại nơi vừa xem</button><span>EduHub / Dự án / {project.subject}</span><div className="project-detail-utilities"><button className="button button-outline" onClick={() => void shareProject()}><Share2 size={14} /> Chia sẻ</button><button className="button button-outline" onClick={() => void createProjectQr()}><QrCodeIcon size={14} /> Mã QR</button><button className="button button-outline" onClick={copyCitation}><Copy size={14} /> Sao chép trích dẫn</button><button className="button button-outline" onClick={printResourceSheet}><FileText size={14} /> Phiếu học liệu</button><button className="button button-outline" onClick={printGuide}><Printer size={14} /> In hướng dẫn</button></div></div>
      {qrOpen && <div className="project-qr-backdrop" role="dialog" aria-modal="true" aria-label="Mã QR dự án" onClick={() => setQrOpen(false)}><section className="project-qr-dialog" onClick={(event) => event.stopPropagation()}><button className="project-qr-close" onClick={() => setQrOpen(false)} aria-label="Đóng"><X size={17}/></button><span className="section-kicker">CHIA SẺ NHANH TRONG LỚP HỌC</span><h3>Mã QR dự án</h3><p>Quét mã để mở trang dự án này trên điện thoại. Mã QR dẫn đến trang công khai EduHub.</p>{qrDataUrl && <img src={qrDataUrl} alt={`Mã QR mở dự án ${project.title}`} />}<b>{project.title}</b><small>{project.teacher} · {project.subject}</small><div><button className="button button-outline" onClick={() => void copyText(`${window.location.origin}/projects/${encodeURIComponent(project.sourceId || project.id)}`, 'Đã sao chép liên kết dự án.')}>Sao chép liên kết</button><button className="button button-outline" onClick={printProjectQr}><Printer size={14}/> In phiếu QR</button><button className="button button-primary" onClick={downloadProjectQr}><Download size={14}/> Tải mã PNG</button></div></section></div>}
      <nav className="project-detail-toc" aria-label="Đi tới nội dung dự án"><span>Đi nhanh đến</span><button onClick={() => jumpTo('project-ratings')}>Đánh giá</button><button onClick={() => jumpTo('project-guide')}>Hướng dẫn</button><button onClick={() => jumpTo('project-community')}>Góp ý & áp dụng</button><button onClick={() => jumpTo('project-comments')}>Bình luận</button></nav>
      <article className="project-modal project-detail-card">
      <div className={`modal-project-cover cover-${project.color}`}>
        {project.coverUrl && <img className="detail-cover-image" src={project.coverUrl} alt={`Ảnh bìa ${project.title}`} />}
        <div className="cover-top"><span className="cover-type">{project.type}</span><span className="cover-subject">{project.subjects.length > 1 ? project.subjects.join(' · ') : project.subject}</span></div>
        <div className="cover-bottom"><span>{project.grade}</span><span>EduHub · Học liệu chia sẻ</span></div>
      </div>
      <div className="modal-body">
        <div className="section-kicker">{(project.subjects.length ? project.subjects.join(' · ') : project.subject).toUpperCase()} · {project.grade.toUpperCase()}</div><h2>{project.title}</h2>
        {project.parentResourceId && <div className="derivative-attribution"><Copy size={14} /><span><b>Bản điều chỉnh từ học liệu cộng đồng</b><small>{parentAttribution ? <>Dựa trên <button onClick={() => { const source = allProjects.find((item) => item.sourceId === parentAttribution.id); if (source) onOpenRelated(source); }}>{parentAttribution.title}</button> · bản gốc của {parentAttribution.teacher}</> : 'Đang tải thông tin và ghi công tác giả gốc…'}</small></span></div>}
        <button className="project-author project-author-button modal-author" onClick={onOpenTeacher} disabled={!project.teacherId}><span className={`avatar avatar-${project.color}`}>{project.teacherAvatarUrl ? <img src={project.teacherAvatarUrl} alt="" /> : project.initials}</span><span><b>{project.teacher}</b><small>{project.school}</small></span><span className="author-date">Chia sẻ {project.time}</span></button>
        <p className="modal-description">{project.description}</p>
        {project.descriptionImages && project.descriptionImages.length > 0 && <section className="project-description-gallery" aria-label="Ảnh minh họa dự án"><h3>Ảnh minh họa</h3><div>{project.descriptionImages.map((imageUrl, index) => <a href={imageUrl} target="_blank" rel="noopener noreferrer" key={`${imageUrl}-${index}`}><img src={imageUrl} alt={`${project.title} – ảnh minh họa ${index + 1}`} loading="lazy" /></a>)}</div></section>}
        {project.websiteHtml && <section className="teacher-website-preview"><header><div><span className="section-kicker">WEBSITE GIÁO DỤC</span><b>Xem thử website</b></div>{project.websiteSlug && <a className="button button-outline" href={`/web/${encodeURIComponent(project.websiteSlug)}`} target="_blank" rel="noopener noreferrer"><Globe2 size={14} /> Mở trang riêng</a>}</header><iframe title={`Xem thử ${project.title}`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={sandboxWebsiteHtml(project.websiteHtml)} /></section>}
        {project.learningOutcomes && project.learningOutcomes.length > 0 && <section className="learning-outcomes"><div><span className="section-kicker">MỤC TIÊU DO TÁC GIẢ TỰ KHAI</span><b>Yêu cầu cần đạt</b></div><ul>{project.learningOutcomes.map((outcome, index) => <li key={`${index}-${outcome}`}>{outcome}</li>)}</ul><small>Thông tin do người chia sẻ cung cấp, chưa phải kết quả kiểm định của EduHub.</small></section>}
        <div className="modal-info-grid"><div><small>LOẠI DỰ ÁN</small><b>{project.type}</b></div><div><small>ĐỊNH DẠNG</small><b>{project.format}</b></div><div><small>PHÙ HỢP</small><b>{project.grade}</b></div></div>
        {safePreview && <section className="resource-preview"><div><span><FileText size={15} /></span><b>Xem trước tài liệu</b><button onClick={() => setPreviewOpen((open) => !open)}>{previewOpen ? 'Thu gọn' : 'Mở bản xem trước'}</button></div>{previewOpen && (safePreview.kind === 'image' ? <img src={safePreview.url} alt={`Xem trước học liệu ${project.title}`} loading="lazy" /> : <div className="resource-pdf-preview"><iframe src={safePreview.url} title={`Bản xem trước PDF: ${project.title}`} sandbox="" referrerPolicy="no-referrer" loading="lazy" /><a href={safePreview.url} target="_blank" rel="noopener noreferrer">Nếu trình duyệt không hiển thị PDF, mở tài liệu ở tab mới.</a></div>)}</section>}
        <ResourceFilesList resourceId={project.sourceId} onNotice={onNotice} />
        <section className="project-rating" id="project-ratings">
          <div className="rating-summary"><div><span className="section-kicker">ĐÁNH GIÁ TỪ GIÁO VIÊN</span><strong><Star size={18} fill="currentColor" /> {ratingStats.average.toFixed(1)}</strong><small>{ratingStats.count} lượt đánh giá · có trọng số theo đóng góp</small></div>
            <div className="rating-star-picker" aria-label="Chọn số sao">{[1, 2, 3, 4, 5].map((stars) => <button type="button" key={stars} aria-label={`${stars} sao`} className={myRating >= stars ? 'selected' : ''} disabled={Boolean(currentUser && project.teacherId && project.teacherId === currentUser.id)} onClick={() => setMyRating(stars)}><Star size={19} fill={myRating >= stars ? 'currentColor' : 'none'} /></button>)}</div>
          </div>
          <form className="rating-form" onSubmit={saveRating}><textarea value={ratingText} onChange={(event) => setRatingText(event.target.value)} placeholder={currentUser ? 'Chia sẻ ngắn về trải nghiệm sử dụng (không bắt buộc)...' : 'Đăng nhập để đánh giá dự án'} rows={2} onFocus={() => { if (!currentUser) onRequireAuth(); }} /><button className="button button-outline" disabled={!currentUser || myRating < 1 || savingRating || Boolean(project.teacherId && project.teacherId === currentUser?.id)}><Star size={14} /> {savingRating ? 'Đang lưu…' : 'Gửi đánh giá'}</button></form>
          {Boolean(currentUser && project.teacherId && project.teacherId === currentUser.id) && <p className="rating-hint">Tác giả không thể tự đánh giá dự án của mình.</p>}
          {ratings.filter((item) => item.review_text).slice(0, 3).map((item) => <div className="rating-review" key={item.id}><span>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={11} fill={n <= item.stars ? 'currentColor' : 'none'} />)}</span><b>{item.author?.full_name || 'Giáo viên'}</b><p>{item.review_text}</p></div>)}
        </section>
        {project.resourceStatus === 'outdated' && <div className="resource-outdated-note"><b>Học liệu cần được kiểm tra/cập nhật.</b>{project.replacementResourceId && allProjects.find((item) => item.sourceId === project.replacementResourceId) && <button onClick={() => onOpenRelated(allProjects.find((item) => item.sourceId === project.replacementResourceId)!)}>Mở học liệu thay thế</button>}</div>}
        {(isAdmin || project.teacherId === currentUser?.id) && project.sourceId && <div className="resource-status-tools"><select value={replacementCandidate || project.replacementResourceId || ''} onChange={(event) => setReplacementCandidate(event.target.value)} aria-label="Chọn học liệu thay thế"><option value="">Không chọn bản thay thế</option>{allProjects.filter((item) => item.sourceId && item.sourceId !== project.sourceId).map((item) => <option key={item.sourceId} value={item.sourceId}>{item.title}</option>)}</select><button className="resource-status-control" disabled={statusBusy} onClick={() => void setResourceStatus(project.resourceStatus === 'outdated' ? 'current' : 'outdated')}>{statusBusy ? 'Đang lưu trạng thái…' : project.resourceStatus === 'outdated' ? 'Xác nhận còn sử dụng tốt' : 'Báo học liệu cần cập nhật'}</button></div>}
        <ResourceRevisionPanel resourceId={project.sourceId} authorId={project.teacherId} currentUserId={currentUser?.id} canEdit={project.teacherId === currentUser?.id} current={{ title: project.title, description: project.description, usage_guide: project.usageGuide || '', platform_url: project.url || '', download_url: project.downloadUrl || '', video_url: project.videoUrl || '' }} onNotice={onNotice} />
        {(project.accessRequirements || project.worksOffline || project.mobileCompatible === false || project.requiresLogin) && <section className="resource-requirements-summary"><h3>Điều kiện sử dụng</h3>{project.accessRequirements && <p>{project.accessRequirements}</p>}<div><span>{project.worksOffline ? 'Có thể dùng ngoại tuyến' : 'Cần kết nối mạng'}</span><span>{project.mobileCompatible === false ? 'Ưu tiên máy tính' : 'Hỗ trợ điện thoại'}</span><span>{project.requiresLogin ? 'Cần đăng nhập dịch vụ' : 'Không cần đăng nhập'}</span></div></section>}<section id="project-guide" className="project-guide-section"><h3>Hướng dẫn sử dụng</h3>
          {project.usageGuide ? <div className="guide-copy">{project.usageGuide.split('\n').filter(Boolean).map((line, index) => <p key={`${index}-${line}`}><span>{String(index + 1).padStart(2, '0')}</span>{line}</p>)}</div> : <p className="modal-description">Thầy cô có thể mở tài liệu để xem hướng dẫn, tải về và điều chỉnh cho phù hợp với lớp học của mình.</p>}
        {project.videoUrl && <a className="video-demo-link" href={project.videoUrl} target="_blank" rel="noopener noreferrer"><span><Play size={17} fill="currentColor" /></span><span><b>Xem video demo</b><small>Mở video hướng dẫn trong thẻ mới{project.captionUrl ? ' · có phụ đề' : ''}</small></span><ArrowUpRight size={16} /></a>}
        {(project.videoTranscript || project.captionUrl) && <section className="video-accessibility"><span className="section-kicker">HỖ TRỢ XEM VIDEO</span>{project.captionUrl && <a href={project.captionUrl} target="_blank" rel="noopener noreferrer">Tải phụ đề WebVTT</a>}{project.videoTranscript && <details><summary>Bản chép lời / nội dung video</summary><p>{project.videoTranscript}</p></details>}</section>}
          {project.usageGuide && <small className="guide-print-note">Bản hướng dẫn có thể in để sử dụng khi chuẩn bị tiết dạy.</small>}
        </section>
        <div className="modal-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="modal-actions"><button className={`button ${liked ? 'button-liked' : 'button-outline'}`} onClick={onLike}><ThumbsUp size={16} /> {liked ? 'Đã hữu ích' : 'Thấy hữu ích'} · {project.votes}</button><button className={`button button-outline${saved ? ' button-saved' : ''}`} onClick={onSave}><Bookmark size={16} /> {saved ? 'Đã lưu' : 'Lưu dự án'}</button><button className="button button-outline" onClick={onToggleOffline}><Download size={15} /> {offlineSaved ? 'Đã lưu ngoại tuyến' : 'Lưu để đọc ngoại tuyến'}</button><button className="button button-outline" onClick={() => onCreateDerivative(project)}><Copy size={15} /> Tạo bản điều chỉnh</button>{project.url && <a className="button button-outline" href={project.url} onClick={() => recordProjectAction('open')} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={15} /> Mở dùng thử</a>}{project.downloadUrl && <a className="button button-primary" href={project.downloadUrl} onClick={() => recordProjectAction('download')} target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={15} /> Tải tài liệu</a>}{!project.url && !project.downloadUrl && <button className="button button-primary" onClick={() => onNotice('Tác giả chưa thêm liên kết tải hoặc dùng thử.')}><ArrowDownToLine size={15} /> Tải tài liệu</button>}</div>
        {relatedProjects.length > 0 && <section className="related-projects"><div className="related-projects-heading"><div><span className="section-kicker">CÙNG MÔN · CÙNG KHỐI</span><h3>Học liệu có thể hữu ích tiếp theo</h3></div><span>{relatedProjects.length} gợi ý</span></div><div className="related-projects-grid">{relatedProjects.map((related) => <button key={related.id} className="related-project-card" onClick={() => onOpenRelated(related)}><span className={`related-project-icon ${related.color}`}><BookOpen size={15} /></span><span className="related-project-copy"><b>{related.title}</b><small>{related.subject} · {related.grade}</small><small>Chia sẻ bởi {related.teacher}</small></span><ArrowUpRight size={14} /></button>)}</div></section>}
        <div id="project-community"><ProjectCommunityPanel resourceId={project.sourceId} authorId={project.teacherId} currentUser={currentUser} isAdmin={isAdmin} onRequireAuth={onRequireAuth} onNotice={onNotice} /></div>
        <section className="comments-section" id="project-comments"><div className="comments-heading"><div><h3>Trao đổi cùng tác giả</h3><small>{comments.length} bình luận gần nhất{project.sourceId ? '' : ' · dữ liệu minh họa'}</small></div><span className={`comments-live-status${commentRealtimeReady ? ' connected' : ''}`}><i />{commentRealtimeReady ? 'Cập nhật trực tiếp' : 'Đang kết nối'}</span></div>
          <div className="comment-tools"><label><Search size={14} /><input value={commentSearch} onChange={(event) => setCommentSearch(event.target.value)} placeholder="Tìm trong bình luận" aria-label="Tìm trong bình luận" /></label><select value={commentSort} onChange={(event) => setCommentSort(event.target.value as typeof commentSort)} aria-label="Sắp xếp bình luận"><option value="newest">Mới nhất trước</option><option value="oldest">Cũ nhất trước</option></select></div>
          {comments.length ? visibleCommentRoots.length ? <div className="comment-list">{visibleCommentRoots.map((item) => { const replies = comments.filter((reply) => reply.parent_comment_id === item.id); const collapsed = collapsedCommentReplies.includes(item.id); return <article className="comment-thread" key={item.id}><div className="comment-item"><span className="avatar avatar-mint">{(item.author?.full_name || 'GV').slice(0, 1)}</span><div><b>{item.author?.full_name || 'Giáo viên'}</b><p>{item.content}</p><small>{new Date(item.created_at).toLocaleString('vi-VN')}</small><button className="comment-reply-action" onClick={() => { if (!currentUser) { onRequireAuth(); return; } setReplyingTo({ id: item.id, name: item.author?.full_name || 'Giáo viên' }); document.getElementById('project-comment-input')?.focus(); }}>Trả lời</button></div></div>{replies.length > 0 && <button className="comment-replies-toggle" onClick={() => setCollapsedCommentReplies((items) => collapsed ? items.filter((id) => id !== item.id) : [...items, item.id])}>{collapsed ? `Hiện ${replies.length} câu trả lời` : `Ẩn ${replies.length} câu trả lời`} <ChevronDown size={12} /></button>}{!collapsed && replies.map((reply) => <div className="comment-item comment-nested" key={reply.id}><span className="avatar avatar-mint">{(reply.author?.full_name || 'GV').slice(0, 1)}</span><div><b>{reply.author?.full_name || 'Giáo viên'}</b><p>{reply.content}</p><small>{new Date(reply.created_at).toLocaleString('vi-VN')}</small></div></div>)}</article>; })}</div> : <p className="comments-empty">Không có bình luận khớp với từ khóa này.</p> : <p className="comments-empty">Chưa có trao đổi. Thầy cô có thể đặt câu hỏi hoặc chia sẻ kinh nghiệm khi dùng dự án.</p>}
          <form className="comment-form" onSubmit={addComment}>{replyingTo && <div className="comment-reply-banner">Đang trả lời {replyingTo.name}<button type="button" onClick={() => setReplyingTo(null)}>Hủy</button></div>}<textarea id="project-comment-input" value={comment} maxLength={4000} onChange={(event) => { setComment(event.target.value); setCommentTyping(true); }} onKeyDown={(event) => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); if (!sending && comment.trim()) void addComment(event as unknown as FormEvent); } }} placeholder={currentUser ? replyingTo ? `Trả lời ${replyingTo.name}...` : 'Viết bình luận hoặc câu hỏi...' : 'Đăng nhập để tham gia trao đổi'} rows={2} onFocus={() => { if (!currentUser) onRequireAuth(); }} /><div className="comment-form-meta"><small>{comment.trim() ? 'Bản nháp tự lưu trên thiết bị này' : 'Ctrl + Enter để gửi'} · {comment.length}/4000{typingTeachers.length > 0 ? ` · ${typingTeachers.join(', ')} đang nhập` : ''}</small><button className="button button-primary" type="submit" disabled={sending || !comment.trim()}><Send size={14} /> {sending ? 'Đang gửi' : replyingTo ? 'Gửi trả lời' : 'Gửi bình luận'}</button></div></form>
        </section>
      </div>
      </article>
      <section id="resource-print-sheet" className="resource-print-sheet"><header><img src="/eduhub-logo.png" alt="EduHub" /><span>HỌC LIỆU CHIA SẺ · CỘNG ĐỒNG GIÁO VIÊN VIỆT NAM</span></header><h1>{project.title}</h1><div className="resource-sheet-meta"><span>{project.subjects.join(' · ') || project.subject}</span><span>{project.grade}</span><span>{project.type}</span></div><p className="resource-sheet-summary">{project.description}</p>{project.learningOutcomes?.length ? <section><h2>Mục tiêu / yêu cầu cần đạt</h2><ul>{project.learningOutcomes.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}<section><h2>Hướng dẫn sử dụng</h2>{project.usageGuide ? project.usageGuide.split('\n').filter(Boolean).map((line, index) => <p key={`${index}-${line}`}>{index + 1}. {line}</p>) : <p>Thầy cô mở liên kết học liệu để xem hướng dẫn đầy đủ.</p>}</section><footer><b>Chia sẻ bởi {project.teacher}{project.school ? ` · ${project.school}` : ''}</b><span>EduHub · {window.location.origin}/projects/{project.sourceId || project.id}</span><span>Vui lòng giữ thông tin tác giả khi chia sẻ lại.</span></footer></section>
  </section>;
}

function ProjectListSkeleton() {
  return <><div className="project-list" aria-label="Đang tải danh sách dự án" aria-busy="true">{[0, 1, 2].map((item) => <article className="project-card skeleton-project-card" key={item}><div className="skeleton skeleton-project-cover" /><div className="skeleton-project-copy"><span className="skeleton skeleton-line skeleton-short" /><span className="skeleton skeleton-line skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line skeleton-medium" /></div></article>)}</div><p className="project-loading-label"><span className="button-spinner" /> Đang tải học liệu từ cộng đồng giáo viên…</p></>;
}

function ProjectDetailSkeleton() {
  return <section className="project-detail-page" aria-label="Đang tải chi tiết dự án" aria-busy="true"><div className="project-detail-toolbar"><span className="skeleton skeleton-line skeleton-medium" /></div><div className="project-detail-skeleton"><div className="skeleton skeleton-detail-cover" /><div className="skeleton-detail-copy"><span className="skeleton skeleton-line skeleton-short" /><span className="skeleton skeleton-line skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line skeleton-medium" /><span className="skeleton skeleton-detail-panel" /></div></div></section>;
}


function SubmitModal({ currentUserId, sourceProject, onClose, onSubmit }: { currentUserId: string; sourceProject: Project | null; onClose: () => void; onSubmit: (draft: SubmitDraft) => Promise<string | null> }) {
  const sourceId = sourceProject?.sourceId || '';
  const [initialDraft] = useState(() => readSubmitDraft(currentUserId, sourceId));
  const [title, setTitle] = useState(initialDraft.title || (sourceProject ? `Bản điều chỉnh: ${sourceProject.title}` : ''));
  const [description, setDescription] = useState(initialDraft.description || (sourceProject ? `Bản điều chỉnh từ “${sourceProject.title}” của ${sourceProject.teacher}. Hãy mô tả điểm đã thay đổi và bối cảnh lớp học phù hợp.` : ''));
  const [type, setType] = useState(initialDraft.type || 'Bài giảng');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialDraft.subjects || sourceProject?.subjects || []);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(initialDraft.grades || sourceProject?.grade.split(',').map((item) => item.trim()).filter((item) => (GRADE_LABELS as readonly string[]).includes(item)) || []);
  const [url, setUrl] = useState(initialDraft.url || '');
  const [possibleDuplicates, setPossibleDuplicates] = useState<Array<{ id: string; title: string; subjects: string[]; grade_levels: string[] }>>([]);
  const [videoUrl, setVideoUrl] = useState(initialDraft.videoUrl || '');
  const [captionUrl, setCaptionUrl] = useState(initialDraft.captionUrl || '');
  const [videoTranscript, setVideoTranscript] = useState(initialDraft.videoTranscript || '');
  const [guide, setGuide] = useState(initialDraft.guide || '');
  const [accessRequirements, setAccessRequirements] = useState(initialDraft.accessRequirements || '');
  const [worksOffline, setWorksOffline] = useState(initialDraft.worksOffline || false);
  const [mobileCompatible, setMobileCompatible] = useState(initialDraft.mobileCompatible ?? true);
  const [requiresLogin, setRequiresLogin] = useState(initialDraft.requiresLogin || false);
  const [learningOutcomesText, setLearningOutcomesText] = useState(initialDraft.learningOutcomes?.join('\n') || '');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [descriptionImages, setDescriptionImages] = useState<File[]>([]);
  const [descriptionImagePreviews, setDescriptionImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState('');
  useEffect(() => {
    const urls = descriptionImages.map((image) => URL.createObjectURL(image));
    setDescriptionImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [descriptionImages]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!currentUserId) return;
      const learningOutcomes = learningOutcomesText.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12);
      const draft: SavedSubmitDraft = { title, description, type, subjects: selectedSubjects, grades: selectedGrades, url, videoUrl, captionUrl, videoTranscript, guide, parentResourceId: sourceId || undefined, learningOutcomes, accessRequirements, worksOffline, mobileCompatible, requiresLogin };
      try {
        if (!title && !description && !url && !guide && !videoUrl && !videoTranscript && !captionUrl) localStorage.removeItem(submitDraftKey(currentUserId, sourceId));
        else localStorage.setItem(submitDraftKey(currentUserId, sourceId), JSON.stringify(draft));
        setDraftSavedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      } catch { setDraftSavedAt('Nháp chưa lưu được trên thiết bị này'); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [currentUserId, sourceId, description, guide, learningOutcomesText, selectedGrades, selectedSubjects, title, type, url, videoUrl, captionUrl, videoTranscript, accessRequirements, worksOffline, mobileCompatible, requiresLogin]);
  useEffect(() => {
    if (!supabase || (!url.trim() && title.trim().length < 5)) { setPossibleDuplicates([]); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      const selects = 'id,title,subjects,grade_levels';
      const requests = [
        url.trim() ? supabase.from('resources').select(selects).eq('platform_url', url.trim()).eq('moderation_status', 'approved').limit(5) : Promise.resolve({ data: [], error: null }),
        title.trim().length >= 5 ? supabase.from('resources').select(selects).ilike('title', `%${title.trim().replace(/[,%()]/g, ' ')}%`).eq('moderation_status', 'approved').limit(5) : Promise.resolve({ data: [], error: null }),
      ];
      const results = await Promise.all(requests);
      if (!active) return;
      const rows = results.flatMap((result) => result.data || []) as Array<{ id: string; title: string; subjects: string[]; grade_levels: string[] }>;
      setPossibleDuplicates(rows.filter((item, index) => item.id !== sourceId && rows.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 4));
    }, 450);
    return () => { active = false; window.clearTimeout(timer); };
  }, [sourceId, title, url]);
  const learningOutcomes = learningOutcomesText.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12);
  const readiness = [
    { label: 'Tên dự án rõ ràng', ready: title.trim().length >= 8 },
    { label: 'Mô tả có mục đích sử dụng', ready: description.trim().length >= 30 },
    { label: 'Đã chọn môn học và khối lớp', ready: selectedSubjects.length > 0 && selectedGrades.length > 0 },
    { label: 'Có tệp hoặc đường dẫn dùng thử', ready: Boolean(file || files.length || url.trim()) },
    { label: 'Có hướng dẫn cho đồng nghiệp', ready: guide.trim().length >= 40 },
    { label: 'Nêu yêu cầu cần đạt (tự khai)', ready: learningOutcomes.length > 0 },
    { label: 'Đã kiểm tra quyền chia sẻ và thông tin học sinh', ready: rightsConfirmed },
    { label: 'Có ảnh bìa và video minh họa', ready: Boolean(cover) && Boolean(videoUrl.trim()) },
  ];
  const clearDraft = () => {
    setTitle(''); setDescription(''); setType('Bài giảng'); setSelectedSubjects([]); setSelectedGrades([]); setUrl(''); setVideoUrl(''); setCaptionUrl(''); setVideoTranscript(''); setGuide(''); setLearningOutcomesText(''); setFile(null); setFiles([]); setCover(null); setDescriptionImages([]); setError('');
    try { if (currentUserId) localStorage.removeItem(submitDraftKey(currentUserId, sourceId)); } catch { /* Continue with the current form state. */ }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || selectedSubjects.length === 0 || selectedGrades.length === 0) return;
    if (!file && !files.length && !url.trim()) { setError('Thêm một tệp hoặc đường dẫn dùng thử để đồng nghiệp có thể mở học liệu.'); return; }
    if (files.length > 9) { setError('Mỗi dự án đính kèm tối đa 9 tệp bổ sung.'); return; }
    if ([...(file ? [file] : []), ...files].reduce((sum,item) => sum + item.size, 0) > 200 * 1024 * 1024) { setError('Tổng dung lượng tệp đính kèm tối đa 200 MB.'); return; }
    if (descriptionImages.length > 6) { setError('Mỗi dự án tải tối đa 6 ảnh mô tả.'); return; }
    if (descriptionImages.some((image) => !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(image.type))) { setError('Ảnh mô tả cần là JPG, PNG, WebP hoặc AVIF.'); return; }
    if (descriptionImages.some((image) => image.size > 8 * 1024 * 1024) || descriptionImages.reduce((sum, image) => sum + image.size, 0) > 32 * 1024 * 1024) { setError('Ảnh mô tả tối đa 8 MB mỗi ảnh và 32 MB tổng cộng.'); return; }
    if (!rightsConfirmed) { setError('Xác nhận quyền chia sẻ và loại bỏ thông tin nhận dạng học sinh trước khi gửi.'); return; }
    setSaving(true); setError('');
    const result = await onSubmit({ title: title.trim(), description: description.trim(), type, subjects: selectedSubjects, grades: selectedGrades, url: url.trim(), videoUrl: videoUrl.trim(), captionUrl: captionUrl.trim(), videoTranscript: videoTranscript.trim(), file, files, cover, descriptionImages, guide: guide.trim(), parentResourceId: sourceId || undefined, learningOutcomes, accessRequirements: accessRequirements.trim(), worksOffline, mobileCompatible, requiresLogin });
    setSaving(false);
    if (result) setError(result);
    else { try { if (currentUserId) localStorage.removeItem(submitDraftKey(currentUserId, sourceId)); } catch { /* The project is already submitted. */ } onClose(); }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="modal-panel submit-modal"><button className="modal-close" onClick={onClose} aria-label="Đóng"><X size={19} /></button><div className="section-kicker">GỬI ĐIỀU HAY TỚI CỘNG ĐỒNG</div><h2>{sourceProject ? 'Tạo bản điều chỉnh' : 'Chia sẻ dự án'}</h2><p className="modal-intro">{sourceProject ? 'Giữ liên kết ghi công học liệu gốc, đồng thời mô tả rõ phần thầy cô đã điều chỉnh cho lớp mình.' : 'Giới thiệu học liệu, công cụ hoặc cách làm thầy cô đã thử trong lớp. Dự án sẽ được duyệt trước khi công khai.'}</p><form onSubmit={submit}><label className="form-label">Tên dự án *<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Bộ slide tương tác bài Quang hợp" required /></label><label className="form-label">Loại dự án<select value={type} onChange={(event) => setType(event.target.value)}><option>Bài giảng</option><option>Giáo án</option><option>Học liệu</option><option>Công cụ</option><option>Website</option><option>Trò chơi</option><option>Dự án lớp học</option></select></label><CurriculumPicker grades={selectedGrades} subjects={selectedSubjects} onGradesChange={setSelectedGrades} onSubjectsChange={setSelectedSubjects} /><label className="form-label">Mục tiêu / yêu cầu cần đạt <small className="form-field-help">Mỗi dòng một ý, do tác giả tự khai; đây không phải xác nhận kiểm định.</small><textarea value={learningOutcomesText} onChange={(event) => setLearningOutcomesText(event.target.value)} placeholder="Học sinh giải thích được…\nHọc sinh vận dụng để…" rows={3} maxLength={1800} /></label><section className="submit-readiness"><div className="submit-readiness-heading"><div><b>Kiểm tra trước khi gửi</b><small>{readiness.filter((item) => item.ready).length}/{readiness.length} mục đã sẵn sàng · {draftSavedAt ? `Nháp tự lưu lúc ${draftSavedAt}` : 'Đang lưu nháp…'}</small></div><button type="button" onClick={clearDraft}><Trash2 size={13} /> Xóa nháp</button></div><div className="submit-readiness-list">{readiness.map((item) => <span className={item.ready ? 'ready' : ''} key={item.label}><Check size={12} /> {item.label}</span>)}</div></section><label className="form-label">Đường dẫn dùng thử / tải về<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." type="url" /></label>{possibleDuplicates.length > 0 && <aside className="duplicate-warning"><b>Đã thấy học liệu có thể trùng</b><p>Thầy cô kiểm tra trước khi gửi để tránh đăng lặp tài nguyên.</p>{possibleDuplicates.map((item) => <span key={item.id}>{item.title} · {(item.subjects || []).join(" · ")} · {(item.grade_levels || []).join(" · ")}</span>)}</aside>}<label className="form-label">Mô tả dự án *<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Dự án giải quyết nhu cầu gì? Thầy cô đã sử dụng như thế nào?" rows={3} required /></label><label className="form-label">Hướng dẫn sử dụng<textarea value={guide} onChange={(event) => setGuide(event.target.value)} placeholder="Các bước chuẩn bị và gợi ý tổ chức trong lớp" rows={3} /></label><div className="form-two-col"><label className="form-label">Video demo<input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Liên kết YouTube (nếu có)" type="url" /></label><label className="file-drop"><input type="file" multiple accept=".ppt,.pptx,.doc,.docx,.pdf,.xls,.xlsx,.zip" onChange={(event) => { const selected = Array.from(event.target.files || []); setFile(selected[0] || null); setFiles(selected.slice(1)); }} /><span className="file-drop-icon"><img src="/assets/openmoji-paperclip.svg" alt="" /></span><span><b>{file ? `${file.name}${files.length ? ` + ${files.length} tệp` : ''}` : 'Tài liệu đính kèm'}</b><small>Tệp đầu tiên là tải chính; các tệp còn lại nằm ở mục Tệp đi kèm. Tối đa 10 tệp · mỗi tệp 50 MB · tổng 200 MB</small></span></label></div><label className="file-drop"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setCover(event.target.files?.[0] || null)} /><span className="file-drop-icon"><Image size={18} /></span><span><b>{cover?.name || 'Ảnh bìa dự án'}</b><small>JPG, PNG, WebP · tối đa 8 MB</small></span></label><label className="file-drop description-image-drop"><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const incoming = Array.from(event.target.files || []); const additions = incoming.filter((item) => !descriptionImages.some((existing) => existing.name === item.name && existing.size === item.size && existing.lastModified === item.lastModified)); if (descriptionImages.length + additions.length > 6) { setError('Mỗi dự án tải tối đa 6 ảnh mô tả.'); event.target.value = ''; return; } if (additions.some((image) => !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(image.type))) { setError('Ảnh mô tả cần là JPG, PNG, WebP hoặc AVIF.'); event.target.value = ''; return; } if (additions.some((image) => image.size > 8 * 1024 * 1024) || [...descriptionImages, ...additions].reduce((sum, image) => sum + image.size, 0) > 32 * 1024 * 1024) { setError('Ảnh mô tả tối đa 8 MB mỗi ảnh và 32 MB tổng cộng.'); event.target.value = ''; return; } setError(''); setDescriptionImages((current) => [...current, ...additions]); event.target.value = ''; }} /><span className="file-drop-icon"><Image size={18} /></span><span><b>Ảnh trong phần mô tả · {descriptionImages.length}/6</b><small>Thêm ảnh chụp màn hình, sản phẩm học sinh hoặc các bước sử dụng. JPG, PNG, WebP, AVIF · tối đa 8 MB/ảnh, 32 MB tổng.</small></span></label>{descriptionImages.length > 0 && <div className="description-image-previews">{descriptionImagePreviews.map((url, index) => <figure key={`${url}-${index}`}><img src={url} alt={`Xem trước ảnh mô tả ${index + 1}`} /><figcaption>{descriptionImages[index]?.name}</figcaption><button type="button" onClick={() => setDescriptionImages((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Xóa ảnh ${index + 1}`}><X size={14} /></button></figure>)}</div>}<div className="form-two-col"><label className="form-label">Liên kết phụ đề WebVTT<input value={captionUrl} onChange={(event) => setCaptionUrl(event.target.value)} placeholder="https://.../phu-de.vtt" type="url" /></label><label className="form-label">Bản chép lời video<textarea value={videoTranscript} onChange={(event) => setVideoTranscript(event.target.value)} maxLength={12000} rows={2} placeholder="Tóm tắt hoặc chép lời để đồng nghiệp tìm nội dung nhanh hơn" /></label></div><label className="submit-safety-confirm"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span><b>Tôi có quyền chia sẻ tệp hoặc liên kết này.</b><small>Đã ghi nguồn cần thiết và đã loại bỏ tên, ảnh, tài khoản hoặc dữ liệu nhận dạng học sinh khỏi nội dung chia sẻ.</small></span></label>{error && <div className="submit-error">{error}</div>}<div className="review-note"><Check size={16} /><span><b>Dự án được lưu ở trạng thái chờ duyệt.</b><small>Admin sẽ kiểm tra quyền chia sẻ, an toàn và thông tin trước khi công khai.</small></span></div><div className="modal-footer-actions"><button className="button button-quiet" type="button" onClick={onClose}>Để sau</button><button className="button button-primary" type="submit" disabled={saving || selectedGrades.length === 0 || selectedSubjects.length === 0 || !rightsConfirmed}><Send size={15} /> {saving ? 'Đang gửi…' : sourceProject ? 'Gửi bản điều chỉnh' : 'Gửi để duyệt'}</button></div></form></section></div>;
}

function LoginModal({ onClose, onNotice }: { onClose: () => void; onNotice: (message: string) => void }) {
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const signInWithGoogle = async () => {
    setError('');
    if (!supabase) { setError('Cần cấu hình Supabase và Google OAuth trước khi đăng nhập.'); return; }
    setWorking(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (oauthError) { setWorking(false); setError(oauthError.message); }
    } catch (oauthError) { setWorking(false); setError(oauthError instanceof Error ? oauthError.message : 'Không thể bắt đầu đăng nhập Google.'); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!supabase) { setError('Cần cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY để bật tài khoản.'); return; }
    setWorking(true);
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })
        : await supabase.auth.signInWithPassword({ email, password });
      setWorking(false);
      if (result.error) { setError(result.error.message); return; }
      if (mode === 'signup' && !result.data.session) { onNotice('Tài khoản đã được tạo. Hãy xác nhận email để hoàn tất đăng ký.'); onClose(); return; }
      onNotice(mode === 'signup' ? 'Tài khoản giáo viên đã sẵn sàng.' : 'Đăng nhập thành công.');
      onClose();
    } catch (err) {
      setWorking(false);
      setError(err instanceof Error ? err.message : 'Không thể kết nối. Vui lòng thử lại.');
    }
  };
  return <div className="modal-backdrop auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !working) onClose(); }}><section className="modal-panel login-modal signup-modal"><button className="modal-close" onClick={onClose} aria-label="Đóng"><X size={19} /></button><div className="login-mark"><GraduationCap size={23} /></div><div className="section-kicker">CÙNG THAM GIA CỘNG ĐỒNG</div><h2>{mode === 'signup' ? 'Tạo tài khoản giáo viên' : 'Chào mừng thầy cô trở lại'}</h2><p className="modal-intro">{mode === 'signup' ? 'Chỉ cần tên, email và mật khẩu. Thông tin chuyên môn sẽ được bổ sung sau khi đăng ký.' : 'Đăng nhập để tiếp tục chia sẻ và trao đổi chuyên môn.'}</p><form onSubmit={submit}>{mode === 'signup' && <label className="form-label">Họ và tên<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nguyễn Thị An" autoComplete="name" required /></label>}<label className="form-label">Email<input autoFocus={mode === 'login'} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="thayco@truong.edu.vn" type="email" autoComplete="email" required /></label><label className="form-label">Mật khẩu<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="Ít nhất 8 ký tự" required /></label>{error && <div className="submit-error">{error}</div>}<button className="button button-primary login-submit" type="submit" disabled={working}><Users size={16} /> {working ? 'Đang xử lý…' : mode === 'signup' ? 'Tạo tài khoản giáo viên' : 'Đăng nhập'}</button>{mode === 'signup' && <p className="form-terms">Sau khi tạo tài khoản, thầy cô sẽ bổ sung thông tin trường và chuyên môn trong một bước riêng.</p>}</form><div className="oauth-divider"><span>hoặc</span></div><button className="google-auth-button" onClick={() => void signInWithGoogle()} disabled={working}><span>G</span> Tiếp tục với Google</button><div className="login-foot"><span>{mode === 'signup' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span> <button onClick={() => { setError(''); setMode(mode === 'signup' ? 'login' : 'signup'); }}>{mode === 'signup' ? 'Đăng nhập' : 'Đăng ký miễn phí'}</button></div></section></div>;
}
