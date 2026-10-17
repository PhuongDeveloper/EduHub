import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, BarChart3, Check, Clock3, ExternalLink, Eye, FileCheck2, Flag, Image as ImageIcon, MessageSquare, RefreshCw, Search, Shield, ShieldCheck, Star, Trash2, Users, X } from 'lucide-react';
import { ContentReportQueue } from './ProjectCommunityPanel';
import { TalkReportQueue } from './TalkReportQueue';
import { AdminOperationsPanel } from './AdminOperationsPanel';
import { supabase } from '../lib/supabase';
import { sandboxWebsiteHtml } from '../lib/sandboxWebsite';

type AdminUser = { profile_id: string; email: string; full_name: string; school_name: string | null; subject_specialty: string | null; role: 'teacher' | 'admin'; teacher_verified: boolean; created_at: string; edu_points: number };
type PageVisit = { visitor_id: string; path: string; created_at: string };
type ResourceRow = { id: string; title: string; tagline?: string | null; description?: string | null; subjects?: string[] | null; grade_levels?: string[] | null; moderation_status: string; created_at: string; resource_type: string; cover_url?: string | null; description_images?: string[] | null; video_url?: string | null; usage_guide?: string | null; platform_url?: string | null; download_url?: string | null; website_html?: string | null; website_slug?: string | null; upvotes_count?: number; downloads_count?: number; rating_avg?: number; rating_count?: number; author?: { id?: string; full_name?: string; school_name?: string | null; avatar_url?: string | null } };
type AdminAttachment = { id: string; file_name: string; file_url: string; file_size: number | null; mime_type: string | null };
type QueueProject = { id: string; title: string; description: string; subject: string; teacher: string; school: string; sourceId?: string; url?: string; downloadUrl?: string; coverUrl?: string; descriptionImages?: string[]; videoUrl?: string; usageGuide?: string; subjects?: string[]; grades?: string[]; format?: string; votes?: number; downloads?: number; ratingAvg?: number; ratingCount?: number; teacherAvatarUrl?: string; moderationStatus?: string; websiteHtml?: string; websiteSlug?: string; moderationLinkCheck?: string };
type Tab = 'overview' | 'projects' | 'people' | 'reports' | 'support' | 'audit' | 'verification' | 'revisions';
const dateLabel = (date: Date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const safeExternalUrl = (value?: string | null) => {
  if (!value) return undefined;
  try { const url = new URL(value, window.location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
};
const safePreviewProject = (project: QueueProject): QueueProject => ({
  ...project,
  coverUrl: safeExternalUrl(project.coverUrl),
  descriptionImages: (project.descriptionImages || []).filter((url) => Boolean(safeExternalUrl(url))),
  videoUrl: safeExternalUrl(project.videoUrl),
  url: safeExternalUrl(project.url),
  downloadUrl: safeExternalUrl(project.downloadUrl),
});

export function AdminConsole({ pending, adminUserId, onApprove, onReject, onRefresh, onNotice }: { pending: QueueProject[]; adminUserId: string; onApprove: (project: (typeof pending)[number]) => void; onReject: (project: (typeof pending)[number]) => void; onRefresh: () => void; onNotice: (message: string) => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState(30);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [resourcesReady, setResourcesReady] = useState(false);
  const [resourceLoadError, setResourceLoadError] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [previewProject, setPreviewProject] = useState<QueueProject | null>(null);
  const [previewAttachments, setPreviewAttachments] = useState<AdminAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [linkChecks, setLinkChecks] = useState<Record<string,string>>({});
  const [metrics, setMetrics] = useState({ users: 0, resources: 0, approved: 0, pending: 0, talks: 0, comments: 0, reports: 0, replies: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const since = useMemo(() => { const date = new Date(); date.setDate(date.getDate() - range); return date.toISOString(); }, [range]);

  const load = useCallback(async () => {
    if (!supabase) { setError('Cần cấu hình Supabase để xem dữ liệu quản trị.'); return; }
    setBusy(true); setError('');
    try {
    const [userCount, resourceCount, approvedCount, pendingCount, talkCount, commentCount, reportCount, talkReportCount, replyCount, visitsResult, resourcesResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('resources').select('id', { count: 'exact', head: true }),
      supabase.from('resources').select('id', { count: 'exact', head: true }).eq('moderation_status', 'approved'),
      supabase.from('resources').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
      supabase.from('talks').select('id', { count: 'exact', head: true }),
      supabase.from('resource_comments').select('id', { count: 'exact', head: true }),
      supabase.from('content_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
      supabase.from('talk_content_reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
      supabase.from('talk_replies').select('id', { count: 'exact', head: true }),
      supabase.from('site_page_views').select('visitor_id,path,created_at').gte('created_at', since).order('created_at', { ascending: true }).limit(20000),
      supabase.from('resources').select('id,title,tagline,description,subjects,grade_levels,moderation_status,created_at,resource_type,cover_url,description_images,video_url,usage_guide,platform_url,download_url,website_html,website_slug,upvotes_count,downloads_count,rating_avg,rating_count,author:profiles!resources_author_id_fkey(id,full_name,school_name,avatar_url)').order('created_at', { ascending: false }).limit(250),
    ]);
    const failedQueries = [
      ['Tài khoản', userCount], ['Dự án', resourceCount], ['Dự án công khai', approvedCount], ['Dự án chờ duyệt', pendingCount],
      ['Thảo luận', talkCount], ['Bình luận', commentCount], ['Báo cáo dự án', reportCount], ['Báo cáo thảo luận', talkReportCount],
      ['Trả lời', replyCount], ['Lượt truy cập', visitsResult], ['Danh sách dự án', resourcesResult],
    ].filter(([, result]) => (result as { error?: unknown }).error).map(([label, result]) => `${label}: ${(result as { error: { message: string } }).error.message}`);
    if (failedQueries.length) setError(`Một số dữ liệu quản trị chưa tải được. ${failedQueries.join(' · ')}`);
    setMetrics({ users: userCount.count || 0, resources: resourceCount.count || 0, approved: approvedCount.count || 0, pending: pendingCount.count || 0, talks: talkCount.count || 0, comments: commentCount.count || 0, reports: (reportCount.count || 0) + (talkReportCount.count || 0), replies: replyCount.count || 0 });
    if (!visitsResult.error) setVisits((visitsResult.data || []) as PageVisit[]);
    if (!resourcesResult.error) { setResources((resourcesResult.data || []) as unknown as ResourceRow[]); setResourceLoadError(''); }
    else { setResources([]); setResourceLoadError(resourcesResult.error.message); }
    setResourcesReady(true);
    if (tab === 'people') {
      const { data, error: peopleError } = await supabase.rpc('admin_list_users');
      if (peopleError) setError(peopleError.message); else setUsers((data || []) as AdminUser[]);
    }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu quản trị.');
    } finally {
      setBusy(false);
    }
  }, [since, tab]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!supabase || !previewProject) { setPreviewAttachments([]); return; }
    let active = true;
    setAttachmentsLoading(true);
    void supabase.from('resource_files').select('id,file_name,file_url,file_size,mime_type').eq('resource_id', previewProject.id).order('position').then(({ data }) => {
      if (active) setPreviewAttachments(((data || []) as AdminAttachment[]).map((file) => ({ ...file, file_url: safeExternalUrl(file.file_url) || '' })).filter((file) => file.file_url));
      if (active) setAttachmentsLoading(false);
    });
    return () => { active = false; };
  }, [previewProject?.id]);
  useEffect(() => {
    if (!supabase) return;
    const realtime = supabase.channel('eduhub-admin-refresh').on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => void load()).on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void load()).subscribe();
    return () => { void supabase?.removeChannel(realtime); };
  }, [load]);

  const dayBuckets = useMemo(() => {
    const list: Array<{ key: string; label: string; total: number; visitors: Set<string> }> = [];
    for (let i = range - 1; i >= 0; i--) { const day = new Date(); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0); const key = day.toISOString().slice(0, 10); list.push({ key, label: dateLabel(day), total: 0, visitors: new Set() }); }
    const lookup = new Map(list.map((item) => [item.key, item]));
    for (const visit of visits) { const bucket = lookup.get(new Date(visit.created_at).toISOString().slice(0, 10)); if (bucket) { bucket.total++; bucket.visitors.add(visit.visitor_id); } }
    return list.map(({ visitors: visitorSet, ...item }) => ({ ...item, unique: visitorSet.size }));
  }, [range, visits]);
  const maxVisits = Math.max(1, ...dayBuckets.map((item) => item.total));
  const uniqueVisitors = new Set(visits.map((item) => item.visitor_id)).size;
  const popularPages = useMemo(() => { const count = new Map<string, number>(); visits.forEach((item) => count.set(item.path, (count.get(item.path) || 0) + 1)); return [...count].sort((a, b) => b[1] - a[1]).slice(0, 6); }, [visits]);
  const filteredUsers = users.filter((user) => `${user.full_name} ${user.email} ${user.school_name || ''} ${user.subject_specialty || ''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  const filteredResources = resources.filter((resource) => (resourceFilter === 'all' || resource.moderation_status === resourceFilter) && `${resource.title} ${resource.author?.full_name || ''} ${resource.resource_type}`.toLocaleLowerCase('vi').includes(resourceSearch.toLocaleLowerCase('vi')));
  const previewResource = (resource: ResourceRow): QueueProject => ({
    id: resource.id, sourceId: resource.id, title: resource.title, description: resource.description || resource.tagline || '',
    subject: resource.subjects?.join(' · ') || 'Liên môn / nhiều môn', subjects: resource.subjects || [], grades: resource.grade_levels || [],
    teacher: resource.author?.full_name || 'Giáo viên EduHub', teacherAvatarUrl: resource.author?.avatar_url || undefined,
    school: resource.author?.school_name || 'Cộng đồng EduHub', coverUrl: safeExternalUrl(resource.cover_url),
    descriptionImages: (resource.description_images || []).filter((url): url is string => typeof url === 'string' && Boolean(safeExternalUrl(url))), videoUrl: safeExternalUrl(resource.video_url), usageGuide: resource.usage_guide || undefined,
    url: safeExternalUrl(resource.platform_url), downloadUrl: safeExternalUrl(resource.download_url),
    websiteHtml: resource.website_html || undefined, websiteSlug: resource.website_slug || undefined,
    moderationStatus: resource.moderation_status, format: resource.resource_type,
    votes: resource.upvotes_count || 0, downloads: resource.downloads_count || 0, ratingAvg: Number(resource.rating_avg || 0), ratingCount: resource.rating_count || 0,
  });
  const reviewQueue = resources.filter((resource) => resource.moderation_status === 'pending').map(previewResource);
  const moderateFromPreview = (project: QueueProject, status: 'approved' | 'rejected') => {
    const queuedProject = pending.find((item) => item.id === project.id);
    if (queuedProject) { if (status === 'approved') onApprove(queuedProject); else onReject(queuedProject); return; }
    const resource = resources.find((item) => item.id === project.id);
    if (resource) { void setResourceStatus(resource, status); return; }
    if (status === 'approved') onApprove(project); else onReject(project);
  };
  const setResourceStatus = async (resource: ResourceRow, status: string) => {
    if (!supabase) return;
    const { error: statusError } = await supabase.from('resources').update({ moderation_status: status, moderated_by: adminUserId, moderated_at: new Date().toISOString() }).eq('id', resource.id);
    if (statusError) { onNotice(statusError.message); return; }
    setResources((current) => current.map((item) => item.id === resource.id ? { ...item, moderation_status: status } : item));
    setPreviewProject((current) => current?.id === resource.id ? { ...current, moderationStatus: status } : current);
    onNotice(status === 'approved' ? 'Dự án đã được công khai.' : status === 'rejected' ? 'Dự án đã được ẩn khỏi kho công khai.' : 'Dự án đã được chuyển về hàng chờ.');
  };
  const deleteResource = async (resource: ResourceRow) => {
    if (!supabase || !window.confirm(`Xóa vĩnh viễn dự án “${resource.title}” cùng bình luận và lượt đánh giá?`)) return;
    const { error: deleteError } = await supabase.from('resources').delete().eq('id', resource.id);
    if (deleteError) { onNotice(deleteError.message); return; }
    setResources((current) => current.filter((item) => item.id !== resource.id)); onNotice('Đã xóa dự án.');
  };
  const bulkSetResourceStatus = async (status: 'approved' | 'rejected') => {
    if (!supabase || !selectedResourceIds.length) return;
    const ids = selectedResourceIds.filter((id) => resources.some((item) => item.id === id));
    if (!window.confirm(`${status === 'approved' ? 'Công khai' : 'Ẩn'} ${ids.length} dự án đã chọn? Thao tác sẽ được ghi riêng cho từng dự án.`)) return;
    setBusy(true); const { error: bulkError } = await supabase.from('resources').update({ moderation_status: status, moderated_by: adminUserId, moderated_at: new Date().toISOString() }).in('id', ids); setBusy(false);
    if (bulkError) { onNotice(`Không xử lý được hàng loạt: ${bulkError.message}`); return; }
    setResources((current) => current.map((item) => ids.includes(item.id) ? { ...item, moderation_status: status } : item)); setSelectedResourceIds([]); onNotice(`${ids.length} dự án đã được ${status === 'approved' ? 'công khai' : 'ẩn'}.`);
  };
  const markLinkCheck = async (project: QueueProject, status: 'working' | 'unavailable' | 'no_link') => {
    if (!supabase || !project.sourceId) return;
    const { error: checkError } = await supabase.from('resources').update({ moderation_link_check: status, moderation_link_checked_by: adminUserId, moderation_link_checked_at: new Date().toISOString() }).eq('id', project.sourceId);
    if (checkError) { onNotice(`Không lưu được kết quả kiểm tra liên kết: ${checkError.message}`); return; }
    setLinkChecks((current) => ({ ...current, [project.id]: status }));
    onNotice(status === 'working' ? 'Đã ghi nhận liên kết mở được.' : status === 'unavailable' ? 'Đã ghi nhận liên kết chưa truy cập được.' : 'Đã ghi nhận dự án không cần liên kết ngoài.');
  };
  const updateUser = async (user: AdminUser, patch: Partial<Pick<AdminUser, 'role' | 'teacher_verified'>>) => {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', user.profile_id);
    if (updateError) { onNotice(`Không cập nhật được tài khoản: ${updateError.message}`); return; }
    setUsers((current) => current.map((item) => item.profile_id === user.profile_id ? { ...item, ...patch } : item));
    onNotice('Đã cập nhật quyền tài khoản.');
  };
  const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3; badge?: number }> = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 }, { id: 'projects', label: 'Dự án', icon: FileCheck2, badge: metrics.pending }, { id: 'people', label: 'Tài khoản', icon: Users }, { id: 'reports', label: 'Báo cáo', icon: Flag, badge: metrics.reports }, { id: 'support', label: 'Hỗ trợ', icon: MessageSquare }, { id: 'audit', label: 'Nhật ký', icon: Activity }, { id: 'verification', label: 'Xác minh', icon: ShieldCheck }, { id: 'revisions', label: 'Cập nhật', icon: FileCheck2 },
  ];
  const cards = [
    { label: 'Tài khoản giáo viên', value: metrics.users, icon: Users, color: 'jade' }, { label: 'Lượt xem', value: visits.length, icon: Activity, color: 'blue' }, { label: 'Dự án công khai', value: metrics.approved, icon: FileCheck2, color: 'gold' }, { label: 'Chờ duyệt / báo cáo', value: metrics.pending + metrics.reports, icon: Clock3, color: 'coral' },
  ];
  return <section className="admin-console">
    <header className="admin-console-header"><div><span className="admin-kicker"><ShieldCheck size={14} /> BẢNG ĐIỀU HÀNH EDUHUB</span><h1>Trung tâm quản trị</h1><p>Theo dõi cộng đồng, kiểm duyệt nội dung và quản lý tài khoản từ một nơi.</p></div><button className="button button-outline admin-refresh" onClick={() => { void load(); onRefresh(); }} disabled={busy}><RefreshCw size={15} className={busy ? 'admin-refresh-spinning' : ''} /> Cập nhật dữ liệu</button></header>
    <nav className="admin-tabs">{tabs.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={15} />{item.label}{Boolean(item.badge) && <span>{item.badge}</span>}</button>)}</nav>
    {error && <div className="admin-inline-error"><X size={15} />{error}</div>}
    {tab === 'overview' && <div className="admin-overview"><div className="admin-metric-grid">{cards.map((item, index) => <article className={`admin-metric admin-metric-${item.color}`} key={item.label} style={{ animationDelay: `${index * 45}ms` }}><span className="admin-metric-icon"><item.icon size={17} /></span><span className="admin-metric-label">{item.label}</span><strong>{item.value.toLocaleString('vi-VN')}</strong><small>{item.label === 'Lượt xem' ? `${uniqueVisitors.toLocaleString('vi-VN')} khách trong ${range} ngày` : 'Đang lấy từ cơ sở dữ liệu'}</small></article>)}</div>
      <article className="admin-panel admin-chart-panel"><div className="admin-panel-heading"><div><span className="admin-section-eyebrow">PHÂN TÍCH TRUY CẬP</span><h2>Lượng người ghé thăm</h2><p>{visits.length.toLocaleString('vi-VN')} lượt xem · {uniqueVisitors.toLocaleString('vi-VN')} trình duyệt duy nhất</p></div><select value={range} onChange={(event) => setRange(Number(event.target.value))}><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select></div><div className="admin-chart" role="img" aria-label={`Lượt xem trong ${range} ngày qua`}>{dayBuckets.map((day) => <div className="admin-chart-column" key={day.key} title={`${day.key}: ${day.total} lượt xem, ${day.unique} khách`}><span style={{ height: `${Math.max(2, day.total / maxVisits * 100)}%` }} /><small>{range <= 7 || day.key.endsWith('-01') || day.key.endsWith('-15') || day.key.endsWith('-30') ? day.label : ''}</small></div>)}</div><div className="admin-chart-legend"><span><i /> Lượt xem trang</span><small>Biểu đồ tính từ khi cài đặt SQL theo dõi truy cập</small></div></article>
      <div className="admin-overview-bottom"><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-section-eyebrow">NỘI DUNG CỘNG ĐỒNG</span><h2>Nhịp hoạt động</h2></div><Activity size={17} /></div><div className="admin-activity-stats"><div><MessageSquare size={16} /><b>{metrics.talks.toLocaleString('vi-VN')}</b><small>Chủ đề thảo luận</small></div><div><MessageSquare size={16} /><b>{metrics.replies.toLocaleString('vi-VN')}</b><small>Lượt trả lời</small></div><div><ArrowUp size={16} /><b>{metrics.comments.toLocaleString('vi-VN')}</b><small>Bình luận dự án</small></div></div></article><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-section-eyebrow">TRANG ĐƯỢC QUAN TÂM</span><h2>Đường dẫn phổ biến</h2></div></div>{popularPages.length ? <div className="admin-popular-list">{popularPages.map(([path, count]) => <div key={path}><span>{path}</span><b>{count.toLocaleString('vi-VN')} <small>lượt</small></b></div>)}</div> : <p className="admin-empty-note">Chưa có lượt xem được ghi nhận trong khoảng thời gian này.</p>}</article></div></div>}
    {tab === 'projects' && <div className="admin-panel admin-content-panel"><div className="admin-panel-heading"><div><span className="admin-section-eyebrow">KIỂM DUYỆT NỘI DUNG</span><h2>Dự án chờ duyệt</h2><p>{reviewQueue.length} bài gửi cần quyết định</p></div><span className="admin-status-pill"><i /> Quy trình duyệt</span></div>{!resourcesReady && busy ? <div className="admin-empty-state"><span className="admin-loading-mark"><RefreshCw size={17} /></span><b>Đang tải hàng chờ</b><small>Đang lấy nội dung mới nhất từ Supabase.</small></div> : resourceLoadError ? <div className="admin-empty-state admin-empty-error"><span><X size={17} /></span><b>Chưa tải được dự án</b><small>{resourceLoadError}</small></div> : reviewQueue.length ? <div className="admin-project-queue">{reviewQueue.map((project) => <article key={project.id}><div className="admin-project-summary">{project.coverUrl && <img src={project.coverUrl} alt="" /> }<div><span className="admin-project-subject">{project.subject}</span><h3>{project.title}</h3><p>{project.description}</p><small>{project.teacher} · {project.school}</small><button className="admin-preview-trigger" onClick={() => setPreviewProject(safePreviewProject({ ...project, moderationStatus: 'pending' }))}><Eye size={14} /> Xem chi tiết &amp; bản xem trước</button></div></div><div className="admin-project-actions"><button className="button button-outline" onClick={() => moderateFromPreview(project, 'rejected')}><X size={14} /> Từ chối</button><button className="button button-primary" onClick={() => moderateFromPreview(project, 'approved')}><Check size={14} /> Duyệt</button></div></article>)}</div> : <div className="admin-empty-state"><span><Check size={18} /></span><b>Hàng chờ đang trống</b><small>Các dự án mới gửi sẽ xuất hiện tại đây.</small></div>}<div className="admin-all-resources"><div className="admin-all-resources-heading"><div><h3>Quản lý toàn bộ dự án</h3><small>{filteredResources.length} dự án hiển thị · chọn một dự án để xem nội dung đầy đủ</small></div><div className="admin-resources-filter"><select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}><option value="all">Mọi trạng thái</option><option value="pending">Chờ duyệt</option><option value="approved">Đã công khai</option><option value="rejected">Đã ẩn / từ chối</option></select><label className="admin-search"><Search size={14} /><input value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder="Tìm dự án hoặc tác giả…" /></label></div></div>{selectedResourceIds.length > 0 && <div className="admin-bulk-actions"><b>Đã chọn {selectedResourceIds.length}</b><button className="button button-outline" disabled={busy} onClick={() => void bulkSetResourceStatus('rejected')}><X size={14}/> Ẩn đã chọn</button><button className="button button-primary" disabled={busy} onClick={() => void bulkSetResourceStatus('approved')}><Check size={14}/> Duyệt đã chọn</button></div>}{filteredResources.map((item) => <div className="admin-resource-row" key={item.id}><input type="checkbox" aria-label={`Chọn ${item.title}`} checked={selectedResourceIds.includes(item.id)} onChange={(event) => setSelectedResourceIds((ids) => event.target.checked ? [...ids,item.id] : ids.filter((id) => id !== item.id))}/><span className={`admin-resource-status status-${item.moderation_status}`}>{item.moderation_status === 'approved' ? 'Công khai' : item.moderation_status === 'pending' ? 'Chờ duyệt' : 'Đã ẩn'}</span><button className="admin-resource-info admin-resource-open" onClick={() => setPreviewProject(safePreviewProject(previewResource(item)))}><b>{item.title}</b><small>{item.author?.full_name || 'Giáo viên'} · {item.resource_type} · {new Date(item.created_at).toLocaleDateString('vi-VN')}</small></button><div className="admin-resource-actions"><button title="Xem chi tiết dự án" aria-label={`Xem ${item.title}`} onClick={() => setPreviewProject(safePreviewProject(previewResource(item)))}><Eye size={14} /></button>{item.moderation_status !== 'approved' && <button title="Công khai dự án" onClick={() => void setResourceStatus(item, 'approved')}><Check size={14} /></button>}{item.moderation_status !== 'rejected' && <button title="Ẩn dự án" onClick={() => void setResourceStatus(item, 'rejected')}><X size={14} /></button>}<button className="danger" title="Xóa vĩnh viễn" onClick={() => void deleteResource(item)}><Trash2 size={14} /></button></div></div>)}{filteredResources.length === 0 && <p className="admin-empty-note">Không có dự án phù hợp bộ lọc.</p>}</div></div>}
    {tab === 'people' && <div className="admin-panel admin-content-panel"><div className="admin-panel-heading"><div><span className="admin-section-eyebrow">CỘNG ĐỒNG EDUHUB</span><h2>Quản lý tài khoản</h2><p>{users.length} hồ sơ giáo viên tải được</p></div><div className="admin-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email, trường, môn…" /></div></div><div className="admin-user-list">{filteredUsers.map((user) => <article key={user.profile_id}><span className="admin-user-avatar">{user.full_name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</span><div className="admin-user-copy"><b>{user.full_name}</b><span>{user.email} · {user.school_name || 'Chưa cập nhật trường'}</span><small>{user.subject_specialty || 'Chưa có môn'} · {Number(user.edu_points || 0).toLocaleString('vi-VN')} điểm · tham gia {new Date(user.created_at).toLocaleDateString('vi-VN')}</small></div>{user.teacher_verified && <span className="admin-verified-tag"><ShieldCheck size={12} /> Đã xác minh</span>}<div className="admin-user-actions"><button className="button button-outline" onClick={() => void updateUser(user, { teacher_verified: !user.teacher_verified })}>{user.teacher_verified ? 'Bỏ xác minh' : 'Xác minh'}</button><button className={`button ${user.role === 'admin' ? 'button-admin-role' : 'button-outline'}`} onClick={() => void updateUser(user, { role: user.role === 'admin' ? 'teacher' : 'admin' })}><Shield size={13} />{user.role === 'admin' ? 'Quản trị viên' : 'Cấp quyền admin'}</button></div></article>)}{filteredUsers.length === 0 && <div className="admin-empty-state"><span><Search size={17} /></span><b>Không tìm thấy tài khoản</b></div>}</div></div>}
    {tab === 'reports' && <div className="admin-panel admin-content-panel"><div className="admin-panel-heading"><div><span className="admin-section-eyebrow">AN TOÀN VÀ BẢN QUYỀN</span><h2>Báo cáo nội dung</h2><p>Xử lý nội dung cần xem xét từ thành viên.</p></div><Flag size={18} /></div><ContentReportQueue onNotice={onNotice} /><TalkReportQueue onNotice={onNotice} /></div>}
    {tab === 'revisions' && <AdminOperationsPanel mode="revisions" onNotice={onNotice} />}
    {tab === 'support' && <AdminOperationsPanel mode="support" onNotice={onNotice} />}
    {tab === 'audit' && <AdminOperationsPanel mode="audit" onNotice={onNotice} />}
    {tab === 'verification' && <AdminOperationsPanel mode="verification" onNotice={onNotice} />}
    {previewProject && <div className="admin-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewProject(null); }}><section className="admin-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-preview-title"><header className="admin-preview-header"><div className="admin-preview-heading"><span className="admin-section-eyebrow">XEM TRƯỚC DỰ ÁN</span><h2 id="admin-preview-title">{previewProject.title}</h2><p>{previewProject.teacher} · {previewProject.school}</p></div><button className="admin-preview-close" aria-label="Đóng xem trước" onClick={() => setPreviewProject(null)}><X size={18} /></button></header><div className="admin-preview-scroll"><div className="admin-preview-meta"><span className={`admin-resource-status status-${previewProject.moderationStatus || 'pending'}`}>{previewProject.moderationStatus === 'approved' ? 'Đang công khai' : previewProject.moderationStatus === 'rejected' ? 'Đã ẩn' : 'Chờ duyệt'}</span><span>{previewProject.subject}</span><span>{previewProject.grades?.join(' · ') || 'Mọi khối lớp'}</span><span>{previewProject.format || 'Dự án giáo dục'}</span></div>{previewProject.coverUrl ? <img className="admin-preview-cover" src={previewProject.coverUrl} alt={`Ảnh bìa ${previewProject.title}`} /> : <div className="admin-preview-no-cover"><ImageIcon size={20} /><span>Chưa có ảnh bìa</span></div>}<div className="admin-preview-layout"><main className="admin-preview-main"><section><h3>Giới thiệu</h3><p className="admin-preview-description">{previewProject.description || 'Tác giả chưa thêm mô tả.'}</p></section>{previewProject.websiteHtml && <section className="admin-preview-website"><div><h3>Bản chạy thử website</h3><small>Mở trong khung giới hạn quyền truy cập để kiểm tra giao diện và thao tác.</small></div><iframe title={`Bản chạy thử ${previewProject.title}`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={sandboxWebsiteHtml(previewProject.websiteHtml)} /></section>}{Boolean(previewProject.descriptionImages?.length) && <section><h3>Ảnh minh họa <span>{previewProject.descriptionImages?.length}</span></h3><div className="admin-preview-gallery">{previewProject.descriptionImages?.map((url, index) => <a href={url} target="_blank" rel="noopener noreferrer" key={`${url}-${index}`}><img src={url} alt={`${previewProject.title}, ảnh ${index + 1}`} loading="lazy" /><span>Mở ảnh</span></a>)}</div></section>}{previewProject.usageGuide && <section><h3>Hướng dẫn sử dụng</h3><p className="admin-preview-description">{previewProject.usageGuide}</p></section>}{(attachmentsLoading || previewAttachments.length > 0) && <section><h3>Tệp đính kèm {previewAttachments.length > 0 && <span>{previewAttachments.length}</span>}</h3>{attachmentsLoading ? <p className="admin-preview-muted">Đang tải danh sách tệp…</p> : <div className="admin-preview-files">{previewAttachments.map((file) => <a href={file.file_url} target="_blank" rel="noopener noreferrer" key={file.id}><span><b>{file.file_name}</b><small>{[file.mime_type, file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : ''].filter(Boolean).join(' · ')}</small></span><ExternalLink size={14} /></a>)}</div>}</section>}{previewProject.videoUrl && <section><h3>Video minh họa</h3><a className="admin-preview-link" href={previewProject.videoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Mở video demo</a></section>}</main><aside className="admin-preview-aside"><h3>Thông tin dự án</h3><dl><div><dt>Môn học</dt><dd>{previewProject.subjects?.join(', ') || previewProject.subject}</dd></div><div><dt>Khối lớp</dt><dd>{previewProject.grades?.join(', ') || 'Mọi khối lớp'}</dd></div><div><dt>Đánh giá</dt><dd><Star size={13} fill="currentColor" /> {Number(previewProject.ratingAvg || 0).toFixed(1)} ({previewProject.ratingCount || 0})</dd></div><div><dt>Lượt thích</dt><dd>{previewProject.votes || 0}</dd></div><div><dt>Lượt tải</dt><dd>{previewProject.downloads || 0}</dd></div></dl>{previewProject.url && <a className="admin-preview-link" href={previewProject.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Mở liên kết demo</a>}{previewProject.downloadUrl && <a className="admin-preview-link" href={previewProject.downloadUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Mở tệp tải</a>}<div className="admin-preview-review"><b>Quyết định kiểm duyệt</b><p>Kiểm tra nội dung, ảnh và liên kết trước khi công khai.</p>{previewProject.moderationStatus === 'pending' ? <><button className="button button-outline" onClick={() => moderateFromPreview(previewProject, 'rejected')}><X size={14} /> Từ chối</button><button className="button button-primary" onClick={() => moderateFromPreview(previewProject, 'approved')}><Check size={14} /> Duyệt dự án</button></> : previewProject.moderationStatus === 'approved' ? <button className="button button-outline" onClick={() => { const row = resources.find((item) => item.id === previewProject.id); if (row) void setResourceStatus(row, 'rejected'); }}><X size={14} /> Ẩn dự án</button> : <button className="button button-primary" onClick={() => { const row = resources.find((item) => item.id === previewProject.id); if (row) void setResourceStatus(row, 'approved'); }}><Check size={14} /> Công khai lại</button>}</div></aside></div></div></section></div>}
  </section>;
}
