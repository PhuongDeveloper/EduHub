import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { uploadPublicImage } from './lib/mediaUpload';
import { TeacherProfileView } from './components/TeacherProfileView';
import { SubjectTalksPage } from './components/SubjectTalksPage';
import { AdminConsole } from './components/AdminConsole';
import { TeacherOnboardingModal } from './components/TeacherOnboardingModal';
import { ProjectCommunityPanel } from './components/ProjectCommunityPanel';
import { CollectionsView } from './components/CollectionsView';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, Bookmark, BookOpen, Check,
  ChevronDown, ChevronRight, CircleHelp, Clock3, Compass, Copy, FileText, Filter,
  GraduationCap, Heart, Image, Lightbulb, Menu, MessageCircle, MoreHorizontal,
  Moon, Play, Plus, Search, Send, ShieldCheck, Sparkles, Star, Sun, ThumbsUp, Trophy, Upload, Users,
  X, type LucideIcon,
} from 'lucide-react';

type Project = {
  id: string; title: string; description: string; type: string; subject: string;
  grade: string; teacher: string; school: string; initials: string; color: string;
  votes: number; replies: number; downloads: number; time: string; format: string;
  featured?: boolean; demo?: boolean; url?: string; downloadUrl?: string; tags: string[];
  sourceId?: string; teacherId?: string; teacherAvatarUrl?: string; coverUrl?: string; videoUrl?: string; usageGuide?: string; moderationStatus?: string;
  ratingAvg?: number; ratingCount?: number;
};

type TeacherProfile = { id: string; full_name: string; school_name: string | null; role: 'teacher' | 'admin'; edu_points: number; avatar_url?: string | null; profile_completed_at?: string | null };
type NotificationItem = { id: string; activity_type: string; created_at: string; actor?: { full_name?: string } | null; resource?: { id?: string; title?: string } | null };
type SubmitDraft = { title: string; description: string; type: string; subject: string; grade: string; url: string; videoUrl: string; file: File | null; cover: File | null; guide: string };
type View = 'feed' | 'projects' | 'talks' | 'talk-detail' | 'ranking' | 'saved' | 'following' | 'collections' | 'admin' | 'profile' | 'project';
const savedStorageKey = 'eduhub-saved-projects-v1';
function readLocalSaved(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(savedStorageKey) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

const subjects = [
  { name: 'Tất cả bộ môn', icon: Compass },
  { name: 'Toán học', icon: Sparkles },
  { name: 'Ngữ văn', icon: BookOpen },
  { name: 'Khoa học tự nhiên', icon: Lightbulb },
  { name: 'Tiếng Anh', icon: MessageCircle },
  { name: 'Lịch sử & Địa lí', icon: Compass },
  { name: 'Tin học & Công nghệ', icon: FileText },
];

function projectFromRow(row: any): Project {
  const author = row.author || {};
  const firstSubject = Array.isArray(row.subjects) ? row.subjects[0] : '';
  const colors = ['mint', 'peach', 'lavender', 'blue', 'yellow', 'coral'];
  const color = colors[(String(row.id).charCodeAt(0) || 0) % colors.length];
  const name = author.full_name || 'Giáo viên EduHub';
  const typeNames: Record<string, string> = { powerpoint: 'Bài giảng', khbd_5512: 'Giáo án', exam_matrix: 'Học liệu', tool_software: 'Công cụ', game_interactive: 'Trò chơi', utility_web: 'Website' };
  const when = row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : 'Mới đăng';
  const format = [row.file_format?.toUpperCase(), row.file_size].filter(Boolean).join(' · ') || (row.platform_url ? 'Dùng trực tuyến' : 'Học liệu');
  return {
    id: row.id, sourceId: row.id, title: row.title, description: row.description || row.tagline || '',
    type: typeNames[row.resource_type] || row.resource_type || 'Dự án', subject: firstSubject || 'Đa môn học',
    grade: Array.isArray(row.grade_levels) && row.grade_levels.length ? row.grade_levels.join(', ') : 'Mọi khối lớp',
    teacher: name, teacherId: author.id || undefined, teacherAvatarUrl: author.avatar_url || undefined, school: [author.school_name, [author.ward, author.province].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Cộng đồng EduHub', initials: name.split(/\s+/).slice(-2).map((part: string) => part[0]).join('').toUpperCase(),
    color, votes: row.upvotes_count || 0, replies: row.comments?.[0]?.count || 0, downloads: row.downloads_count || 0,
    time: when, format, url: row.platform_url || undefined, downloadUrl: row.download_url || undefined, coverUrl: row.cover_url || undefined, videoUrl: row.video_url || undefined,
    usageGuide: row.usage_guide || undefined, moderationStatus: row.moderation_status, ratingAvg: Number(row.rating_avg || 0), ratingCount: Number(row.rating_count || 0),
    tags: row.tags || [],
  };
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('eduhub-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const [view, setView] = useState<View>(() => window.location.pathname.startsWith('/projects/') ? 'project' : window.location.pathname.startsWith('/teachers/') ? 'profile' : window.location.pathname.startsWith('/talks/') ? 'talk-detail' : window.location.pathname === '/talks' ? 'talks' : window.location.pathname === '/admin' ? 'admin' : 'feed');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('Tất cả bộ môn');
  const [sort, setSort] = useState('Dành cho bạn');
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>(readLocalSaved);
  const [followingTeachers, setFollowingTeachers] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(Boolean(supabase));
  const [projectRouteId, setProjectRouteId] = useState(() => decodeURIComponent(window.location.pathname.split('/')[2] || ''));
  const [showSubmit, setShowSubmit] = useState(false);
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('eduhub-theme', theme); } catch { /* Keep the selection for this page view. */ }
  }, [theme]);

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
    if (!supabase || window.location.pathname.startsWith('/admin')) return;
    const path = (view === 'project' ? `/projects/${projectRouteId}` : view === 'profile' ? `/teachers/${profileId || ''}` : view === 'talk-detail' ? `/talks/${talkDetailId || ''}` : view === 'feed' ? '/' : `/${view}`).slice(0, 300);
    const visitKey = `eduhub-page-view:${path}`;
    try { if (sessionStorage.getItem(visitKey)) return; } catch { /* Continue if session storage is unavailable. */ }
    let visitorId = '';
    try {
      visitorId = localStorage.getItem('eduhub-visitor-id') || crypto.randomUUID();
      localStorage.setItem('eduhub-visitor-id', visitorId);
      sessionStorage.setItem(visitKey, '1');
    } catch { visitorId = crypto.randomUUID(); }
    void supabase.from('site_page_views').insert({ visitor_id: visitorId, path, user_id: currentUser?.id || null });
  }, [currentUser?.id, projectRouteId, profileId, talkDetailId, view]);

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
      .select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url), comments:resource_comments(count)')
      .eq('moderation_status', 'approved').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (active && !error) setProjects((data || []).map(projectFromRow));
        if (active) setProjectsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const projectMatch = window.location.pathname.match(/^\/projects\/([^/]+)/);
      const teacherMatch = window.location.pathname.match(/^\/teachers\/([^/]+)/);
      const talkMatch = window.location.pathname.match(/^\/talks\/([^/]+)/);
      if (projectMatch) { setProjectRouteId(decodeURIComponent(projectMatch[1])); setView('project'); }
      else if (teacherMatch) { setProfileId(decodeURIComponent(teacherMatch[1])); setView('profile'); setSelectedProject(null); }
      else if (talkMatch) { setTalkDetailId(decodeURIComponent(talkMatch[1])); setView('talk-detail'); }
      else if (window.location.pathname === '/talks') { setTalkDetailId(null); setView('talks'); }
      else if (window.location.pathname === '/admin') setView('admin');
      else { setSelectedProject(null); setView('feed'); }
    };
    window.addEventListener('popstate', syncRoute);
    if (window.location.pathname.startsWith('/teachers/')) setProfileId(decodeURIComponent(window.location.pathname.split('/')[2] || ''));
    if (window.location.pathname.startsWith('/talks/')) setTalkDetailId(decodeURIComponent(window.location.pathname.split('/')[2] || ''));
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (view !== 'project' || selectedProject) return;
    if (!supabase) setSelectedProject(null);
  }, [projectRouteId, selectedProject, view]);

  useEffect(() => {
    if (!supabase || !projectRouteId || view !== 'project' || projects.some((item) => item.id === projectRouteId || item.sourceId === projectRouteId)) return;
    let active = true;
    void supabase.from('resources').select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url), comments:resource_comments(count)')
      .eq('id', projectRouteId).eq('moderation_status', 'approved').maybeSingle()
      .then(({ data }) => { if (active && data) setSelectedProject(projectFromRow(data)); });
    return () => { active = false; };
  }, [projectRouteId, projects, view]);

  useEffect(() => {
    if (!supabase || teacherProfile?.role !== 'admin') return;
    let active = true;
    void supabase.from('resources')
      .select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url), comments:resource_comments(count)')
      .eq('moderation_status', 'pending').order('created_at', { ascending: true })
      .then(({ data, error }) => { if (active && !error) setAdminQueue((data || []).map(projectFromRow)); });
    return () => { active = false; };
  }, [teacherProfile?.role]);

  const visibleProjects = useMemo(() => {
    let result = projects.filter((project) => {
      const matchesSubject = subject === 'Tất cả bộ môn' || project.subject === subject;
      const haystack = `${project.title} ${project.description} ${project.subject} ${project.type} ${project.tags.join(' ')}`.toLocaleLowerCase('vi');
      const matchesQuery = !query || haystack.includes(query.toLocaleLowerCase('vi'));
      const matchesSaved = view !== 'saved' || saved.includes(project.id);
      const matchesFollowing = view !== 'following' || Boolean(project.teacherId && followingTeachers.includes(project.teacherId));
      return matchesSubject && matchesQuery && matchesSaved && matchesFollowing;
    });
    if (sort === 'Được yêu thích') result = [...result].sort((a, b) => b.votes - a.votes);
    if (sort === 'Đánh giá cao') result = [...result].sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || b.votes - a.votes);
    return result;
  }, [followingTeachers, projects, query, saved, sort, subject, view]);

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

  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };

  const nav = (next: View) => { setView(next); setMobileNavOpen(false); if (next === 'talks') { setTalkDetailId(null); window.history.pushState({}, '', '/talks'); } else if (next === 'admin') window.history.pushState({}, '', '/admin'); else if (next !== 'project' && next !== 'profile' && next !== 'talk-detail' && window.location.pathname !== '/') window.history.pushState({}, '', '/'); };
  const openTalkDetail = (id: string) => { setTalkDetailId(id); setView('talk-detail'); window.history.pushState({}, '', `/talks/${encodeURIComponent(id)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const closeTalkDetail = () => { setTalkDetailId(null); setView('talks'); window.history.pushState({}, '', '/talks'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProfile = (id: string) => { setProfileId(id); setSelectedProject(null); setView('profile'); setMobileNavOpen(false); window.history.pushState({}, '', `/teachers/${encodeURIComponent(id)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProject = (project: Project) => { setSelectedProject(project); const routeId = project.sourceId || project.id; setProjectRouteId(routeId); setView('project'); setMobileNavOpen(false); window.history.pushState({}, '', `/projects/${encodeURIComponent(routeId)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const unreadNotifications = notifications.filter((item) => new Date(item.created_at).getTime() > new Date(notificationsReadAt).getTime()).length;
  const notificationText = (item: NotificationItem) => {
    const actor = item.actor?.full_name || 'Một giáo viên';
    if (item.activity_type === 'project_approved') return 'Dự án của thầy cô đã được duyệt';
    if (item.activity_type === 'project_liked') return `${actor} đánh dấu dự án của thầy cô hữu ích`;
    if (item.activity_type === 'project_commented') return `${actor} đã bình luận về dự án`;
    if (item.activity_type === 'project_rated') return `${actor} đã đánh giá dự án`;
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
    const resourceId = item.resource?.id;
    if (!resourceId) return;
    const project = projects.find((candidate) => candidate.sourceId === resourceId || candidate.id === resourceId);
    if (project) openProject(project);
    else { setSelectedProject(null); setProjectRouteId(resourceId); setView('project'); window.history.pushState({}, '', `/projects/${encodeURIComponent(resourceId)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const closeProject = () => { setSelectedProject(null); setView('projects'); window.history.pushState({}, '', '/'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cycleProjectSort = () => setSort((current) => current === 'Dành cho bạn' ? 'Được yêu thích' : current === 'Được yêu thích' ? 'Đánh giá cao' : 'Dành cho bạn');
  const openSubmit = () => currentUser ? setShowSubmit(true) : setShowLogin(true);

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
      attachmentUrl = await upload(draft.file, 'resource');
      if (draft.cover) {
        if (!draft.cover.type.startsWith('image/')) throw new Error('Ảnh bìa không đúng định dạng.');
        if (draft.cover.size > 8 * 1024 * 1024) throw new Error('Ảnh bìa tối đa 8 MB.');
        const image = await uploadPublicImage(draft.cover, `${currentUser.id}/${crypto.randomUUID()}-cover-${draft.cover.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`);
        coverUrl = image.url;
        if (image.storagePath) uploadedPaths.push(image.storagePath);
      }
      const resourceTypes: Record<string, string> = { 'Bài giảng': 'powerpoint', 'Giáo án': 'khbd_5512', 'Học liệu': 'exam_matrix', 'Công cụ': 'tool_software', 'Website': 'utility_web', 'Trò chơi': 'game_interactive', 'Dự án lớp học': 'utility_web' };
      const format = draft.file?.name.split('.').pop()?.toLowerCase() || null;
      const schoolLevel = draft.grade.includes('THPT') ? 'thpt' : draft.grade.includes('THCS') ? 'thcs' : 'tieuhoc';
      const { error } = await supabase.from('resources').insert({
        title: draft.title, tagline: draft.description.slice(0, 180), description: draft.description,
        resource_type: resourceTypes[draft.type] || 'tool_software', file_format: format,
        download_url: attachmentUrl, platform_url: draft.url || null, cover_url: coverUrl,
        video_url: draft.videoUrl || null, usage_guide: draft.guide || null,
        subjects: [draft.subject], grade_levels: [draft.grade], school_levels: [schoolLevel],
        author_id: currentUser.id, moderation_status: 'pending',
      });
      if (error) throw error;
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
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => nav('feed')} aria-label="EduHub, về trang chủ">
            <img className="brand-mark brand-logo-image" src="/eduhub-logo.png" alt="" />
            <span className="brand-word">Edu<span>Hub</span><small>.vn</small></span>
          </button>
          <nav className="primary-nav" aria-label="Điều hướng chính">
            <button className={view === 'feed' ? 'active' : ''} onClick={() => nav('feed')}>Bảng tin</button>
            <button className={view === 'projects' ? 'active' : ''} onClick={() => nav('projects')}>Dự án</button>
            <button className={view === 'talks' || view === 'talk-detail' ? 'active' : ''} onClick={() => nav('talks')}>Thảo luận</button>
            <button className={view === 'ranking' ? 'active' : ''} onClick={() => nav('ranking')}>Bảng xếp hạng</button>
          </nav>
          <div className="top-actions">
            <label className="searchbox"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm học liệu, dự án..." /><kbd>⌘ K</kbd></label>
            <button className="button button-primary top-share" onClick={openSubmit}><Plus size={16} /> Chia sẻ dự án</button>
            <div className="notification-wrap">
              <button className="icon-button notification-button" aria-label={unreadNotifications ? `Thông báo, ${unreadNotifications} chưa đọc` : 'Thông báo'} aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell size={18} />{unreadNotifications > 0 && <span className="notification-count">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}</button>
              {notificationsOpen && <section className="notification-panel" aria-label="Thông báo gần đây"><header><div><b>Thông báo</b><small>Hoạt động mới liên quan đến dự án của thầy cô</small></div><button className="icon-button" aria-label="Đóng thông báo" onClick={() => setNotificationsOpen(false)}><X size={16} /></button></header>{!currentUser ? <div className="notification-empty"><p>Đăng nhập để theo dõi hoạt động trên dự án của thầy cô.</p><button className="button button-primary" onClick={() => { setNotificationsOpen(false); setShowLogin(true); }}>Đăng nhập</button></div> : notifications.length ? <div className="notification-list">{notifications.map((item) => <button className="notification-item" key={item.id} onClick={() => openNotification(item)}><span className={`notification-icon notification-${item.activity_type}`}><Bell size={14} /></span><span><b>{notificationText(item)}</b>{item.resource?.title && <strong>{item.resource.title}</strong>}<small>{new Date(item.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</small></span>{new Date(item.created_at).getTime() > new Date(notificationsReadAt).getTime() && <i aria-label="Chưa đọc" />}</button>)}</div> : <div className="notification-empty"><span><Bell size={20} /></span><b>Chưa có hoạt động mới</b><p>Khi có giáo viên tương tác với dự án, thông báo sẽ xuất hiện ở đây.</p></div>}</section>}
            </div>
            <button className="icon-button theme-toggle" type="button" aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="button button-quiet login-button" onClick={() => currentUser ? openProfile(currentUser.id) : setShowLogin(true)}><span className="login-avatar">{currentUser ? teacherProfile?.avatar_url ? <img src={teacherProfile.avatar_url} alt="" /> : (teacherProfile?.full_name || currentUser.email || 'GV').slice(0, 1).toUpperCase() : '?'}</span> {currentUser ? teacherProfile?.full_name || 'Hồ sơ' : 'Đăng nhập'}</button>
            <button className="mobile-menu icon-button" aria-label="Mở menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><Menu size={20} /></button>
          </div>
        </div>
        {mobileNavOpen && <nav className="mobile-nav" aria-label="Điều hướng di động"><button onClick={() => { toggleNotifications(); setMobileNavOpen(false); }}>Thông báo{unreadNotifications > 0 && <span className="mobile-notification-badge">{unreadNotifications} mới</span>}<ChevronRight size={15} /></button>{([['feed', 'Bảng tin'], ['projects', 'Khám phá dự án'], ['talks', 'Diễn đàn bộ môn'], ['ranking', 'Bảng xếp hạng'], ['collections', 'Bộ sưu tập'], ['following', 'Đang theo dõi'], ['saved', 'Dự án đã lưu']] as const).map(([key, label]) => <button className={view === key ? 'active' : ''} key={key} onClick={() => nav(key)}>{label}<ChevronRight size={15} /></button>)}{currentUser && <button className={view === 'profile' ? 'active' : ''} onClick={() => openProfile(currentUser.id)}>Hồ sơ giáo viên<ChevronRight size={15} /></button>}{teacherProfile?.role === 'admin' && <button className={view === 'admin' ? 'active' : ''} onClick={() => nav('admin')}>Duyệt dự án<ChevronRight size={15} /></button>}</nav>}
      </header>

      <main className="page-shell">
        <section className={`welcome-band${['project','talks','talk-detail','profile','ranking','collections','admin'].includes(view) ? ' welcome-band-hidden' : ''}`}>
          <div className="welcome-copy">
            <div className="eyebrow"><img className="vietnam-flag-badge" src="/vietnam-flag.svg" alt="Quốc kỳ Việt Nam" /> CỘNG ĐỒNG GIÁO VIÊN VIỆT NAM <span className="eyebrow-dot" /></div>
            <h1>Cùng thầy cô làm nên<br /><em>những giờ học tốt hơn.</em></h1>
            <p>Chia sẻ điều mình làm được. Tìm thấy điều đồng nghiệp đã thử.<br className="desktop-break" /> Mỗi ý tưởng nhỏ đều có thể mở ra một cách dạy hay.</p>
            <div className="welcome-actions">
              <button className="button button-light" onClick={() => { nav('projects'); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }}>Khám phá dự án <ArrowRight size={16} /></button>
              <button className="welcome-text-button" onClick={openSubmit}><Plus size={16} /> Chia sẻ dự án của bạn</button>
            </div>
            <div className="community-proof">
              <div className="avatar-stack" aria-hidden="true">{communityProof?.teachers.map((teacher, index) => <span className={`avatar community-avatar avatar-${['mint', 'peach', 'lavender', 'blue', 'yellow'][index]}`} key={teacher.id}>{teacher.avatar ? <img src={teacher.avatar} alt="" /> : teacher.name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</span>)}</div>
              <span className="community-proof-copy">{communityProof ? <><b>{communityProof.members === 1 ? '1 giáo viên đang cùng xây cộng đồng' : `${communityProof.members.toLocaleString('vi-VN')} giáo viên trong cộng đồng`}</b><small>{communityProof.projects === 0 ? 'Cùng chia sẻ học liệu đầu tiên' : `${communityProof.projects.toLocaleString('vi-VN')} dự án và học liệu đã duyệt`}</small></> : <><b>Tiểu học · THCS · THPT</b><small>Tài liệu · công cụ · trao đổi chuyên môn</small></>}</span>
            </div>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="sun-disc" />
            <div className="paper-card card-back"><span className="mini-lines" /><span className="mini-stamp">KHTN · 7</span></div>
            <div className="paper-card card-front"><div className="lesson-label">PHIẾU HỌC TẬP <span>01</span></div><div className="lesson-drawing"><div className="drawing-sun" /><div className="drawing-hill hill-one" /><div className="drawing-hill hill-two" /><div className="drawing-plant">✳</div></div><div className="lesson-caption">ÁNH SÁNG & SỰ SỐNG</div><div className="lesson-rule" /></div>
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <span className="art-note note-one">Dạy học<br />bằng khám phá</span>
            <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✣</div>
          </div>
          <div className="hero-bottom-note">TỪ LỚP HỌC, CHO LỚP HỌC</div>
        </section>

        <div className={`content-layout${view === 'project' ? ' content-layout-project-detail' : ''}`} id="explore">
          <aside className="left-rail">
            <div className="rail-section">
              <div className="rail-heading">CỘNG ĐỒNG</div>
              <RailButton icon={Compass} label="Bảng tin" active={view === 'feed'} onClick={() => nav('feed')} />
              <RailButton icon={BookOpen} label="Khám phá dự án" active={view === 'projects'} onClick={() => nav('projects')} />
              <RailButton icon={MessageCircle} label="Thảo luận bộ môn" active={view === 'talks' || view === 'talk-detail'} count="Mới" onClick={() => nav('talks')} />
              <RailButton icon={Trophy} label="Bảng xếp hạng" active={view === 'ranking'} onClick={() => nav('ranking')} />
              <RailButton icon={BookOpen} label="Bộ sưu tập" active={view === 'collections'} onClick={() => nav('collections')} />
              <RailButton icon={Users} label="Đang theo dõi" active={view === 'following'} count={followingTeachers.length ? String(followingTeachers.length) : undefined} onClick={() => nav('following')} />
              <RailButton icon={Bookmark} label="Đã lưu" active={view === 'saved'} count={saved.length ? String(saved.length) : undefined} onClick={() => nav('saved')} />
              {currentUser && <RailButton icon={Users} label="Hồ sơ giáo viên" active={view === 'profile'} onClick={() => openProfile(currentUser.id)} />}
              {teacherProfile?.role === 'admin' && <RailButton icon={Check} label="Duyệt dự án" active={view === 'admin'} count={String(adminQueue.length)} onClick={() => nav('admin')} />}
            </div>
            <div className="rail-section subjects-section">
              <div className="rail-heading rail-heading-row">BỘ MÔN <button aria-label="Xem tất cả bộ môn" onClick={() => setSubject('Tất cả bộ môn')}><MoreHorizontal size={18} /></button></div>
              {subjects.map((item) => <RailButton key={item.name} icon={item.icon} label={item.name} active={subject === item.name} onClick={() => { setSubject(item.name); if (view === 'talks') return; setView('projects'); }} />)}
              <button className="see-all-link" onClick={() => setSubject('Tất cả bộ môn')}>Xem tất cả môn học <ChevronRight size={14} /></button>
            </div>
            <div className="teacher-callout"><div className="callout-icon"><GraduationCap size={19} /></div><strong>Góc của thầy cô</strong><p>Một tài khoản để lưu học liệu và chia sẻ kinh nghiệm cùng đồng nghiệp.</p><button onClick={() => setShowLogin(true)}>Tham gia miễn phí <ArrowRight size={14} /></button></div>
            <div className="rail-foot">© 2026 EduHub <span>·</span> Cộng đồng giáo viên Việt Nam</div>
          </aside>

          <section className={`main-feed${view === 'project' ? ' main-feed-project-detail' : ''}`}>
            {view === 'project' ? selectedProject ? <ProjectModal project={selectedProject} liked={liked.includes(selectedProject.id)} saved={saved.includes(selectedProject.id)} currentUser={currentUser} isAdmin={teacherProfile?.role === 'admin'} onClose={closeProject} onLike={() => toggleLike(selectedProject.id)} onSave={() => void toggleSave(selectedProject.id)} onNotice={toast} onRequireAuth={() => setShowLogin(true)} onOpenTeacher={() => { if (selectedProject.teacherId) openProfile(selectedProject.teacherId); }} /> : supabase ? <ProjectDetailSkeleton /> : <div className="empty-state"><h3>Chưa kết nối cơ sở dữ liệu</h3><p>Dự án cần Supabase để tải thông tin thật.</p></div> : view === 'collections' ? <CollectionsView currentUser={currentUser} projects={projects} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onOpenProject={openProject} /> : view === 'profile' ? profileId ? <TeacherProfileView profileId={profileId} currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} onProfileUpdated={(data) => setTeacherProfile((profile) => profile ? { ...profile, ...data } : profile)} onSignOut={async () => { await supabase?.auth.signOut(); nav('feed'); toast('Đã đăng xuất.'); }} onOpenProject={(id) => { const project = projects.find((item) => item.id === id); if (project) openProject(project); else toast('Dự án này hiện chưa có trong danh sách công khai.'); }} /> : <div className="empty-state"><h3>Chọn hồ sơ giáo viên</h3></div> : view === 'talks' || view === 'talk-detail' ? <SubjectTalksPage currentUser={currentUser} onRequireAuth={() => setShowLogin(true)} onNotice={toast} detailId={view === 'talk-detail' ? talkDetailId : null} onOpenDetail={openTalkDetail} onBack={closeTalkDetail} onOpenTeacher={openProfile} /> : view === 'ranking' ? <RankingView onOpenProfile={openProfile} /> : view === 'admin' ? adminProfileLoading ? <div className="admin-access-denied"><ShieldCheck size={24} /><h2>Đang kiểm tra quyền truy cập…</h2></div> : teacherProfile?.role === 'admin' ? <AdminConsole pending={adminQueue} adminUserId={currentUser?.id || ''} onApprove={(project) => { const full = adminQueue.find((item) => item.id === project.id); if (full) void moderateProject(full, 'approved'); }} onReject={(project) => { const full = adminQueue.find((item) => item.id === project.id); if (full) void moderateProject(full, 'rejected'); }} onRefresh={() => { if (supabase) void supabase.from('resources').select('*, author:profiles!resources_author_id_fkey(id,full_name,school_name,province,ward,avatar_url), comments:resource_comments(count)').eq('moderation_status', 'pending').order('created_at', { ascending: true }).then(({ data }) => setAdminQueue((data || []).map(projectFromRow))); }} onNotice={toast} /> : <div className="admin-access-denied"><ShieldCheck size={24} /><h2>Khu vực quản trị</h2><p>Đăng nhập bằng tài khoản có quyền quản trị để tiếp tục.</p><button className="button button-primary" onClick={() => setShowLogin(true)}>Đăng nhập quản trị</button></div> : (
              <>
                <section className="projects-section-main">
                  <div className="feed-title-row"><div><div className="section-kicker">KHO Ý TƯỞNG DÙNG ĐƯỢC</div><h2>{view === 'saved' ? 'Dự án đã lưu' : view === 'following' ? 'Từ giáo viên đang theo dõi' : view === 'projects' ? 'Khám phá dự án' : 'Mới từ cộng đồng'}</h2><p>{view === 'following' ? 'Cập nhật học liệu mới từ những đồng nghiệp thầy cô quan tâm.' : 'Học liệu, công cụ và cách làm được chia sẻ từ lớp học thật.'}</p></div><button className="button button-outline desktop-filter" onClick={cycleProjectSort}><Filter size={15} /> {sort} <ChevronDown size={14} /></button></div>
                  <div className="filter-row"><div className="filter-chips"><button className={subject === 'Tất cả bộ môn' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setSubject('Tất cả bộ môn')}>Tất cả</button>{['Toán học', 'Ngữ văn', 'Khoa học tự nhiên', 'Tiếng Anh', 'Lịch sử & Địa lí'].map((name) => <button className={subject === name ? 'filter-chip selected' : 'filter-chip'} key={name} onClick={() => setSubject(name)}>{name}</button>)}</div><button className="sort-mobile" onClick={cycleProjectSort}><Filter size={14} /> Lọc</button></div>
                  <div className="project-list">{projectsLoading ? <ProjectListSkeleton /> : visibleProjects.length ? visibleProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} liked={liked.includes(project.id)} saved={saved.includes(project.id)} onLike={() => toggleLike(project.id)} onSave={() => void toggleSave(project.id)} onOpen={() => openProject(project)} onOpenTeacher={() => project.teacherId && openProfile(project.teacherId)} />) : <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h3>{view === 'saved' ? 'Bộ sưu tập đang trống' : view === 'following' && !currentUser ? 'Đăng nhập để theo dõi giáo viên' : view === 'following' ? 'Chưa có dự án mới từ người thầy cô theo dõi' : 'Chưa tìm thấy dự án phù hợp'}</h3><p>{view === 'saved' ? 'Lưu học liệu hay để quay lại dùng trong những tiết dạy sau.' : view === 'following' ? 'Mở hồ sơ giáo viên và chọn Theo dõi để tạo dòng cập nhật riêng.' : 'Thử một từ khóa khác hoặc xem tất cả học liệu trong cộng đồng.'}</p><button className="button button-primary" onClick={() => { setQuery(''); setSubject('Tất cả bộ môn'); nav('projects'); }}>Xem tất cả dự án</button></div>}</div>
                  {visibleProjects.length > 0 && <button className="load-more" onClick={() => toast('Bạn đang xem các dự án mới nhất')}>Bạn đã xem hết nội dung mới <Check size={15} /></button>}
                </section>
              </>
            )}
          </section>

          <aside className="right-rail">
            <div className="right-widget weekly-widget"><div className="widget-title"><div><span className="section-kicker">GHI NHẬN ĐÓNG GÓP</span><h3>Thầy cô nổi bật</h3></div><button aria-label="Mở bảng xếp hạng" onClick={() => nav('ranking')}><ArrowUpRight size={16} /></button></div><div className="weekly-caption">Tổng đóng góp <ChevronDown size={13} /></div><div className="teacher-list">{activeTeachers.length ? activeTeachers.map((teacher, index) => <button className="teacher-row" key={teacher.id} onClick={() => openProfile(teacher.id)}><span className={`rank-number rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className={`avatar avatar-${teacher.color}`}>{teacher.initials}</span><span className="teacher-info"><strong>{teacher.name}</strong><small>{teacher.subject}</small></span><b className="teacher-points">{teacher.points}<small>điểm</small></b></button>) : <p className="admin-empty-note">Chưa có hồ sơ đóng góp.</p>}</div><button className="widget-link" onClick={() => nav('ranking')}>Xem bảng xếp hạng <ArrowRight size={14} /></button></div>

            <div className="right-widget category-widget"><div className="widget-title"><div><span className="section-kicker">TÌM NHANH</span><h3>Thầy cô đang cần gì?</h3></div></div><div className="category-grid"><button onClick={() => { setSubject('Tất cả bộ môn'); nav('projects'); }}><span className="category-icon category-coral"><FileText size={17} /></span><span><b>Giáo án & bài giảng</b><small>Slide, KHBD, phiếu học tập</small></span><ChevronRight size={15} /></button><button onClick={() => { setSubject('Tin học & Công nghệ'); nav('projects'); }}><span className="category-icon category-blue"><Sparkles size={17} /></span><span><b>Công cụ dạy học</b><small>Website, ứng dụng, tiện ích</small></span><ChevronRight size={15} /></button><button onClick={() => { setSubject('Khoa học tự nhiên'); nav('projects'); }}><span className="category-icon category-green"><Lightbulb size={17} /></span><span><b>Hoạt động trên lớp</b><small>Trò chơi, dự án, thí nghiệm</small></span><ChevronRight size={15} /></button></div></div>

            <div className="right-widget join-widget"><div className="join-illustration"><span className="join-star">✳</span><span className="join-book"><BookOpen size={22} /></span><span className="join-pencil">✦</span></div><div className="section-kicker">MỖI LỚP HỌC CÓ MỘT Ý TƯỞNG HAY</div><h3>Điều thầy cô làm được, có thể giúp thêm nhiều lớp học.</h3><p>Đăng dự án, kể cách mình đã dùng và cùng đồng nghiệp hoàn thiện.</p><button className="button button-primary" onClick={openSubmit}><Plus size={15} /> Chia sẻ dự án</button></div>

            <div className="right-widget community-rules"><div className="rules-icon"><CircleHelp size={17} /></div><div><b>Chia sẻ tử tế, cùng tiến bộ</b><p>Tôn trọng tác giả, ghi rõ nguồn và chỉ đăng nội dung có quyền chia sẻ.</p><button onClick={() => toast('Quy tắc cộng đồng sẽ sớm được cập nhật')}>Quy tắc cộng đồng <ArrowRight size={13} /></button></div></div>
          </aside>
        </div>
      </main>

      <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><img className="brand-mark brand-logo-image" src="/eduhub-logo.png" alt="" /><span className="brand-word">Edu<span>Hub</span><small>.vn</small></span><p>Nơi thầy cô cùng chia sẻ điều hay<br />từ chính lớp học của mình.</p></div><div className="footer-links"><div><b>Cộng đồng</b><button onClick={() => nav('projects')}>Khám phá dự án</button><button onClick={() => nav('talks')}>Diễn đàn bộ môn</button><button onClick={() => nav('ranking')}>Thầy cô nổi bật</button></div><div><b>Đóng góp</b><button onClick={openSubmit}>Chia sẻ dự án</button><button onClick={() => toast('Hướng dẫn sẽ sớm được cập nhật')}>Hướng dẫn đăng bài</button><button onClick={() => toast('Đội ngũ EduHub đang hoàn thiện trang liên hệ')}>Liên hệ EduHub</button></div><div><b>EduHub</b><button onClick={() => toast('EduHub đang trong giai đoạn hoàn thiện')}>Về cộng đồng</button><button onClick={() => toast('Quy tắc cộng đồng sẽ sớm được cập nhật')}>Quy tắc chia sẻ</button><button onClick={() => toast('Chính sách sẽ sớm được cập nhật')}>Quyền riêng tư</button></div></div><div className="footer-bottom"><span>© 2026 EduHub · Cộng đồng giáo viên chuyển đổi số Việt Nam</span><span>Được làm nên từ những lớp học Việt.</span></div></div></footer>

      {notice && <div className="toast-message"><Check size={16} /> {notice}</div>}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} onSubmit={async (draft) => { const error = await submitProject(draft); if (!error) setShowSubmit(false); return error; }} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onNotice={toast} />}
      {showTeacherOnboarding && currentUser && teacherProfile && <TeacherOnboardingModal userId={currentUser.id} initialName={teacherProfile.full_name} onComplete={() => { setShowTeacherOnboarding(false); setTeacherProfile((profile) => profile ? { ...profile, profile_completed_at: new Date().toISOString() } : profile); }} onNotice={toast} />}
    </div>
  );
}

function RailButton({ icon: Icon, label, active, count, onClick }: { icon: LucideIcon; label: string; active?: boolean; count?: string; onClick: () => void }) {
  return <button className={`rail-button${active ? ' active' : ''}`} onClick={onClick}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>{count && <small>{count}</small>}</button>;
}

function ProjectCard({ project, index, liked, saved, onLike, onSave, onOpen, onOpenTeacher }: { project: Project; index: number; liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; onOpen: () => void; onOpenTeacher: () => void }) {
  return <article className={`project-card${project.featured ? ' project-featured' : ''}`}>
    <button className={`project-cover cover-${project.color}`} onClick={onOpen} aria-label={`Xem ${project.title}`}>{project.coverUrl && <img className="project-cover-image" src={project.coverUrl} alt="" />}<div className="cover-top"><span className="cover-type">{project.type}</span><span className="cover-subject">{project.subject}</span></div><div className={`cover-art cover-art-${index % 4}`}><span className="cover-sun" /><span className="cover-arc" /><span className="cover-paper"><span /><span /><span /></span><span className="cover-plant">✳</span></div><div className="cover-bottom"><span>{project.grade}</span><span>EduHub · Học liệu chia sẻ</span></div>{project.demo && <span className="cover-play"><Play size={13} fill="currentColor" /> Có bản dùng thử</span>}</button>
    <div className="project-content"><div className="project-main"><div className="project-label-row"><span className="project-kind"><span className={`kind-dot ${project.color}`} />{project.type}</span><span className="project-time"><Clock3 size={12} /> {project.time}</span></div><button className="project-title" onClick={onOpen}>{project.title}</button><p className="project-description">{project.description}</p><div className="project-tags">{project.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><button className="project-author project-author-button" onClick={onOpenTeacher} disabled={!project.teacherId}><span className={`avatar avatar-${project.color}`}>{project.teacherAvatarUrl ? <img src={project.teacherAvatarUrl} alt="" /> : project.initials}</span><span><b>{project.teacher}</b><small>{project.school}</small></span></button></div>
      <div className="project-aside"><button className={`save-button${saved ? ' saved' : ''}`} onClick={onSave} aria-label={saved ? 'Bỏ lưu dự án' : 'Lưu dự án'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button><button className={`vote-button${liked ? ' voted' : ''}`} onClick={onLike}><ThumbsUp size={15} /> <b>{project.votes}</b></button><button className="comments-button" onClick={onOpen}><MessageCircle size={15} /> {project.replies}</button><span className="download-count"><ArrowDownToLine size={14} /> {project.downloads}</span></div>
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
  return <section className="ranking-page"><div className="section-kicker">GHI NHẬN ĐÓNG GÓP CHO CỘNG ĐỒNG</div><h2>Những người truyền cảm hứng</h2><p className="ranking-intro">{period === 'all' ? 'Tổng điểm từ dự án được duyệt, lượt hữu ích và đánh giá có trọng số.' : `Điểm phát sinh trong ${period === 'week' ? '7 ngày gần nhất' : 'tháng hiện tại'} · lịch sử được ghi từ ngày bật tính năng.`}</p><div className="ranking-period"><button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>Tổng đóng góp</button><button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Tháng này</button><button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>7 ngày</button></div>{loading ? <ProjectListSkeleton /> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon"><Trophy size={20} /></div><h3>Chưa có điểm trong kỳ này</h3><p>Điểm theo tuần và tháng sẽ bắt đầu tích lũy từ khi bật lịch sử điểm.</p></div> : <><div className="ranking-podium">{podiumOrder.map((index) => { const teacher = rows[index]; return <button className={`podium-card podium-${index + 1}`} key={`${teacher.full_name}-${index}`} onClick={() => teacher.id && onOpenProfile(teacher.id)} disabled={!teacher.id}><span className="podium-medal">{index === 0 ? '✦' : index === 1 ? '✧' : '✤'} <small>#{index + 1}</small></span>{teacherAvatar(teacher, index)}<b>{teacher.full_name}</b><small>{teacher.subject_specialty || 'Giáo viên EduHub'}</small><strong>{Number(teacher.edu_points || 0).toLocaleString('vi-VN')} <small>điểm</small></strong></button>; })}</div><div className="ranking-list-heading"><b>Đóng góp nổi bật</b><span>{rows.length} giáo viên</span></div>{rows.slice(3).map((teacher, offset) => { const index = offset + 3; const points = Number(teacher.edu_points || 0); return <div className="ranking-row" key={`${teacher.full_name}-${index}`}><span className={`rank-number rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>{teacherAvatar(teacher, index)}<span className="teacher-info"><button className="ranking-profile-link" disabled={!teacher.id} onClick={() => teacher.id && onOpenProfile(teacher.id)}>{teacher.full_name}</button><small>{teacher.subject_specialty || 'Giáo viên EduHub'} · {teacher.school_name || 'Cộng đồng EduHub'}</small><span className="rank-progress"><i style={{ width: `${Math.max(4, Math.round(points / maxPoints * 100))}%` }} /></span></span><span className="teacher-points">{points.toLocaleString('vi-VN')}<small>điểm</small></span></div>; })}</>}</section>;
}
function ProjectModal({ project, liked, saved, currentUser, isAdmin, onClose, onLike, onSave, onNotice, onRequireAuth, onOpenTeacher }: { project: Project; liked: boolean; saved: boolean; currentUser: User | null; isAdmin: boolean; onClose: () => void; onLike: () => void; onSave: () => void; onNotice: (message: string) => void; onRequireAuth: () => void; onOpenTeacher: () => void }) {
  const [comments, setComments] = useState<Array<{ id: string; content: string; created_at: string; author?: { full_name?: string } }>>([]);
  const [ratings, setRatings] = useState<Array<{ id: string; stars: number; review_text: string; created_at: string; author?: { full_name?: string } }>>([]);
  const [ratingStats, setRatingStats] = useState({ average: project.ratingAvg || 0, count: project.ratingCount || 0 });
  const [myRating, setMyRating] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const loadComments = async () => {
    if (!supabase || !project.sourceId) return;
    const { data, error } = await supabase.from('resource_comments')
      .select('id,content,created_at,author:profiles!resource_comments_author_id_fkey(full_name)')
      .eq('resource_id', project.sourceId).order('created_at', { ascending: true });
    if (error) { onNotice(error.message); return; }
    setComments((data || []) as typeof comments);
  };
  useEffect(() => { void loadComments(); }, [project.sourceId]);
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
    const { error } = await supabase.from('resource_comments').insert({ resource_id: project.sourceId, author_id: currentUser.id, content: comment.trim() });
    setSending(false);
    if (error) { onNotice(error.message); return; }
    setComment(''); await loadComments();
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
  return <section className="project-detail-page">
      <div className="project-detail-toolbar"><button className="button button-quiet" onClick={onClose}><ArrowRight className="back-arrow" size={15} /> Quay lại kho dự án</button><span>EduHub / Dự án / {project.subject}</span><button className="button button-outline" onClick={() => { if (!navigator.clipboard) { onNotice('Trình duyệt không cho phép sao chép liên kết.'); return; } void navigator.clipboard.writeText(window.location.href).then(() => onNotice('Đã sao chép liên kết dự án.')).catch(() => onNotice('Không thể sao chép liên kết.')); }}><Copy size={14} /> Chia sẻ liên kết</button></div>
      <article className="project-modal project-detail-card">
      <div className={`modal-project-cover cover-${project.color}`}>
        {project.coverUrl && <img className="detail-cover-image" src={project.coverUrl} alt={`Ảnh bìa ${project.title}`} />}
        <div className="cover-top"><span className="cover-type">{project.type}</span><span className="cover-subject">{project.subject}</span></div>
        <div className="cover-art cover-art-1"><span className="cover-sun" /><span className="cover-arc" /><span className="cover-paper"><span /><span /><span /></span><span className="cover-plant">✳</span></div>
        <div className="cover-bottom"><span>{project.grade}</span><span>EduHub · Học liệu chia sẻ</span></div>
      </div>
      <div className="modal-body">
        <div className="section-kicker">{project.subject.toUpperCase()} · {project.grade.toUpperCase()}</div><h2>{project.title}</h2>
        <button className="project-author project-author-button modal-author" onClick={onOpenTeacher} disabled={!project.teacherId}><span className={`avatar avatar-${project.color}`}>{project.teacherAvatarUrl ? <img src={project.teacherAvatarUrl} alt="" /> : project.initials}</span><span><b>{project.teacher}</b><small>{project.school}</small></span><span className="author-date">Chia sẻ {project.time}</span></button>
        <p className="modal-description">{project.description}</p>
        <div className="modal-info-grid"><div><small>LOẠI DỰ ÁN</small><b>{project.type}</b></div><div><small>ĐỊNH DẠNG</small><b>{project.format}</b></div><div><small>PHÙ HỢP</small><b>{project.grade}</b></div></div>
        <section className="project-rating">
          <div className="rating-summary"><div><span className="section-kicker">ĐÁNH GIÁ TỪ GIÁO VIÊN</span><strong><Star size={18} fill="currentColor" /> {ratingStats.average.toFixed(1)}</strong><small>{ratingStats.count} lượt đánh giá · có trọng số theo đóng góp</small></div>
            <div className="rating-star-picker" aria-label="Chọn số sao">{[1, 2, 3, 4, 5].map((stars) => <button type="button" key={stars} aria-label={`${stars} sao`} className={myRating >= stars ? 'selected' : ''} disabled={Boolean(currentUser && project.teacherId && project.teacherId === currentUser.id)} onClick={() => setMyRating(stars)}><Star size={19} fill={myRating >= stars ? 'currentColor' : 'none'} /></button>)}</div>
          </div>
          <form className="rating-form" onSubmit={saveRating}><textarea value={ratingText} onChange={(event) => setRatingText(event.target.value)} placeholder={currentUser ? 'Chia sẻ ngắn về trải nghiệm sử dụng (không bắt buộc)...' : 'Đăng nhập để đánh giá dự án'} rows={2} onFocus={() => { if (!currentUser) onRequireAuth(); }} /><button className="button button-outline" disabled={!currentUser || myRating < 1 || savingRating || Boolean(project.teacherId && project.teacherId === currentUser?.id)}><Star size={14} /> {savingRating ? 'Đang lưu…' : 'Gửi đánh giá'}</button></form>
          {Boolean(currentUser && project.teacherId && project.teacherId === currentUser.id) && <p className="rating-hint">Tác giả không thể tự đánh giá dự án của mình.</p>}
          {ratings.filter((item) => item.review_text).slice(0, 3).map((item) => <div className="rating-review" key={item.id}><span>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={11} fill={n <= item.stars ? 'currentColor' : 'none'} />)}</span><b>{item.author?.full_name || 'Giáo viên'}</b><p>{item.review_text}</p></div>)}
        </section>
        <h3>Hướng dẫn sử dụng</h3>
        {project.usageGuide ? <div className="guide-copy">{project.usageGuide.split('\n').filter(Boolean).map((line, index) => <p key={`${index}-${line}`}><span>{String(index + 1).padStart(2, '0')}</span>{line}</p>)}</div> : <p className="modal-description">Thầy cô có thể mở tài liệu để xem hướng dẫn, tải về và điều chỉnh cho phù hợp với lớp học của mình.</p>}
        {project.videoUrl && <a className="video-demo-link" href={project.videoUrl} target="_blank" rel="noopener noreferrer"><span><Play size={17} fill="currentColor" /></span><span><b>Xem video demo</b><small>Mở video hướng dẫn trong thẻ mới</small></span><ArrowUpRight size={16} /></a>}
        <div className="modal-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="modal-actions"><button className={`button ${liked ? 'button-liked' : 'button-outline'}`} onClick={onLike}><ThumbsUp size={16} /> {liked ? 'Đã hữu ích' : 'Thấy hữu ích'} · {project.votes}</button><button className={`button button-outline${saved ? ' button-saved' : ''}`} onClick={onSave}><Bookmark size={16} /> {saved ? 'Đã lưu' : 'Lưu dự án'}</button>{project.url && <a className="button button-outline" href={project.url} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={15} /> Mở dùng thử</a>}{project.downloadUrl && <a className="button button-primary" href={project.downloadUrl} target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={15} /> Tải tài liệu</a>}{!project.url && !project.downloadUrl && <button className="button button-primary" onClick={() => onNotice('Tác giả chưa thêm liên kết tải hoặc dùng thử.')}><ArrowDownToLine size={15} /> Tải tài liệu</button>}</div>
        <ProjectCommunityPanel resourceId={project.sourceId} authorId={project.teacherId} currentUser={currentUser} isAdmin={isAdmin} onRequireAuth={onRequireAuth} onNotice={onNotice} />
        <section className="comments-section"><div className="comments-heading"><div><h3>Trao đổi cùng tác giả</h3><small>{comments.length} bình luận đã tải{project.sourceId ? '' : ' · dữ liệu minh họa'}</small></div><MessageCircle size={18} /></div>
          {comments.length ? <div className="comment-list">{comments.map((item) => <article className="comment-item" key={item.id}><span className="avatar avatar-mint">{(item.author?.full_name || 'GV').slice(0, 1)}</span><div><b>{item.author?.full_name || 'Giáo viên'}</b><p>{item.content}</p></div></article>)}</div> : <p className="comments-empty">Chưa có trao đổi. Thầy cô có thể đặt câu hỏi hoặc chia sẻ kinh nghiệm khi dùng dự án.</p>}
          <form className="comment-form" onSubmit={addComment}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={currentUser ? 'Viết bình luận hoặc câu hỏi...' : 'Đăng nhập để tham gia trao đổi'} rows={2} onFocus={() => { if (!currentUser) onRequireAuth(); }} /><button className="button button-primary" type="submit" disabled={sending || !comment.trim()}><Send size={14} /> {sending ? 'Đang gửi' : 'Gửi bình luận'}</button></form>
        </section>
      </div>
      </article>
  </section>;
}

function ProjectListSkeleton() {
  return <div className="project-list" aria-label="Đang tải danh sách dự án" aria-busy="true">{[0, 1, 2].map((item) => <article className="project-card skeleton-project-card" key={item}><div className="skeleton skeleton-project-cover" /><div className="skeleton-project-copy"><span className="skeleton skeleton-line skeleton-short" /><span className="skeleton skeleton-line skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line skeleton-medium" /></div></article>)}</div>;
}

function ProjectDetailSkeleton() {
  return <section className="project-detail-page" aria-label="Đang tải chi tiết dự án" aria-busy="true"><div className="project-detail-toolbar"><span className="skeleton skeleton-line skeleton-medium" /></div><div className="project-detail-skeleton"><div className="skeleton skeleton-detail-cover" /><div className="skeleton-detail-copy"><span className="skeleton skeleton-line skeleton-short" /><span className="skeleton skeleton-line skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line skeleton-medium" /><span className="skeleton skeleton-detail-panel" /></div></div></section>;
}


function SubmitModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (draft: SubmitDraft) => Promise<string | null> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Bài giảng');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('THCS');
  const [url, setUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [guide, setGuide] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true); setError('');
    const result = await onSubmit({ title: title.trim(), description: description.trim(), type, subject, grade, url: url.trim(), videoUrl: videoUrl.trim(), file, cover, guide: guide.trim() });
    setSaving(false);
    if (result) setError(result);
    else onClose();
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="modal-panel submit-modal"><button className="modal-close" onClick={onClose} aria-label="Đóng"><X size={19} /></button><div className="section-kicker">GỬI ĐIỀU HAY TỚI CỘNG ĐỒNG</div><h2>Chia sẻ dự án</h2><p className="modal-intro">Giới thiệu học liệu, công cụ hoặc cách làm thầy cô đã thử trong lớp. Dự án sẽ được duyệt trước khi công khai.</p><form onSubmit={submit}><label className="form-label">Tên dự án *<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Bộ slide tương tác bài Quang hợp" required /></label><div className="form-two-col"><label className="form-label">Loại dự án<select value={type} onChange={(event) => setType(event.target.value)}><option>Bài giảng</option><option>Giáo án</option><option>Học liệu</option><option>Công cụ</option><option>Website</option><option>Trò chơi</option><option>Dự án lớp học</option></select></label><label className="form-label">Bộ môn<select value={subject} onChange={(event) => setSubject(event.target.value)}>{subjects.slice(1).map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div><div className="form-two-col"><label className="form-label">Cấp học<select value={grade} onChange={(event) => setGrade(event.target.value)}><option>Tiểu học</option><option>THCS</option><option>THPT</option></select></label><label className="form-label">Đường dẫn dùng thử / tải về<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." type="url" /></label></div><label className="form-label">Mô tả dự án *<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Dự án giải quyết nhu cầu gì? Thầy cô đã sử dụng như thế nào?" rows={3} required /></label><label className="form-label">Hướng dẫn sử dụng<textarea value={guide} onChange={(event) => setGuide(event.target.value)} placeholder="Các bước chuẩn bị và gợi ý tổ chức trong lớp" rows={3} /></label><div className="form-two-col"><label className="form-label">Video demo<input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Liên kết YouTube (nếu có)" type="url" /></label><label className="file-drop"><input type="file" accept=".ppt,.pptx,.doc,.docx,.pdf,.xls,.xlsx,.zip" onChange={(event) => setFile(event.target.files?.[0] || null)} /><span className="file-drop-icon"><Upload size={18} /></span><span><b>{file?.name || 'Tài liệu đính kèm'}</b><small>Tối đa 50 MB</small></span></label></div><label className="file-drop"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setCover(event.target.files?.[0] || null)} /><span className="file-drop-icon"><Image size={18} /></span><span><b>{cover?.name || 'Ảnh bìa dự án'}</b><small>JPG, PNG, WebP · tối đa 8 MB</small></span></label>{error && <div className="submit-error">{error}</div>}<div className="review-note"><Check size={16} /><span><b>Dự án được lưu ở trạng thái chờ duyệt.</b><small>Ảnh, tài liệu và hướng dẫn sẽ gắn vào trang chi tiết dự án.</small></span></div><div className="modal-footer-actions"><button className="button button-quiet" type="button" onClick={onClose}>Để sau</button><button className="button button-primary" type="submit" disabled={saving}><Send size={15} /> {saving ? 'Đang gửi…' : 'Gửi để duyệt'}</button></div></form></section></div>;
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
