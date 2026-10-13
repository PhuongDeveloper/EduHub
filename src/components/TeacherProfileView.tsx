import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Award, BriefcaseBusiness, CalendarDays, Camera, Check, ChevronRight, Clock3, GraduationCap, Globe2, Link2, Mail, MapPin, MessageCircle, Pencil, School, ShieldCheck, Star, UserRound, UsersRound, X } from 'lucide-react';
import { TeacherAddressFields, type TeacherAddress } from './TeacherAddressFields';
import { supabase } from '../lib/supabase';
import { uploadPublicImage } from '../lib/mediaUpload';

type Profile = {
  id: string; full_name: string; school_name: string | null; province: string | null; province_code: string | null;
  ward: string | null; ward_code: string | null; subject_specialty: string | null; teaching_levels: string[];
  years_experience: number; expertise_tags: string[]; bio: string; avatar_url: string | null; cover_url: string | null;
  edu_points: number; teacher_verified: boolean; created_at: string; contact_website: string | null; contact_facebook: string | null; contact_email: string | null;
};
type Resource = { id: string; title: string; tagline: string; description: string; subjects: string[]; grade_levels: string[]; cover_url: string | null; rating_avg: number; rating_count: number; upvotes_count: number; downloads_count: number; created_at: string };
type Activity = { id: string; activity_type: string; created_at: string; actor?: { full_name?: string } | null; resource?: { title?: string } | null };
type Rating = { stars: number; weight: number };
type Draft = Profile & { school_name: string; subject_specialty: string; province: string; province_code: string; ward: string; ward_code: string; bio: string; teaching_levels: string[]; expertise_tags: string[] };

const emptyDraft = (profile: Profile): Draft => ({ ...profile, school_name: profile.school_name || '', subject_specialty: profile.subject_specialty || '', province: profile.province || '', province_code: profile.province_code || '', ward: profile.ward || '', ward_code: profile.ward_code || '', bio: profile.bio || '', teaching_levels: profile.teaching_levels || [], expertise_tags: profile.expertise_tags || [] });
const safeWebUrl = (value: string | null) => { if (!value) return null; try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null; } catch { return null; } };

export function TeacherProfileView({ profileId, currentUser, onRequireAuth, onNotice, onProfileUpdated, onSignOut, onOpenProject }: { profileId: string; currentUser: User | null; onRequireAuth: () => void; onNotice: (message: string) => void; onProfileUpdated: (data: Partial<Pick<Profile, 'full_name' | 'school_name' | 'avatar_url'>>) => void; onSignOut: () => void; onOpenProject: (id: string) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isOwner = currentUser?.id === profileId;

  const refresh = async () => {
    if (!supabase) { setError('Cần kết nối Supabase để xem hồ sơ giáo viên.'); setLoading(false); return; }
    setLoading(true); setError('');
    const [profileResult, resourcesResult, activityResult, ratingsResult, followersResult, followingResult, followResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
      supabase.from('resources').select('id,title,tagline,description,subjects,grade_levels,cover_url,rating_avg,rating_count,upvotes_count,downloads_count,created_at').eq('author_id', profileId).eq('moderation_status', 'approved').order('created_at', { ascending: false }).limit(24),
      supabase.from('teacher_activities').select('id,activity_type,created_at,actor:profiles!teacher_activities_actor_id_fkey(full_name),resource:resources!teacher_activities_resource_id_fkey(title)').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
      supabase.from('resource_ratings').select('stars,weight,resource:resources!inner(author_id)').eq('resource.author_id', profileId),
      supabase.from('teacher_follows').select('id', { count: 'exact', head: true }).eq('followed_id', profileId),
      supabase.from('teacher_follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileId),
      currentUser && currentUser.id !== profileId
        ? supabase.from('teacher_follows').select('id').eq('followed_id', profileId).eq('follower_id', currentUser.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    setLoading(false);
    if (profileResult.error || !profileResult.data) { setError(profileResult.error?.message || 'Không tìm thấy hồ sơ này.'); return; }
    const nextProfile = profileResult.data as Profile;
    setProfile(nextProfile); setDraft(emptyDraft(nextProfile));
    if (resourcesResult.error) onNotice(`Không tải được dự án: ${resourcesResult.error.message}`);
    else setResources((resourcesResult.data || []) as Resource[]);
    if (activityResult.error) onNotice(`Không tải được hoạt động: ${activityResult.error.message}`);
    else setActivities((activityResult.data || []) as Activity[]);
    if (ratingsResult.error) onNotice(`Không tải được tổng hợp đánh giá: ${ratingsResult.error.message}`);
    else setRatings((ratingsResult.data || []) as unknown as Rating[]);
    setFollowerCount(followersResult.count || 0);
    setFollowingCount(followingResult.count || 0);
    setIsFollowing(Boolean(followResult.data));
  };

  useEffect(() => { void refresh(); }, [profileId]);

  const address = useMemo<TeacherAddress>(() => ({
    provinceCode: draft?.province_code || '', province: draft?.province || '', wardCode: draft?.ward_code || '', ward: draft?.ward || '', schoolName: draft?.school_name || '',
  }), [draft?.province_code, draft?.province, draft?.ward_code, draft?.ward, draft?.school_name]);

  const saveProfile = async () => {
    if (!supabase || !draft || !isOwner) return;
    if (!draft.full_name.trim()) { setError('Vui lòng nhập họ và tên.'); return; }
    setSaving(true); setError('');
    const { error: saveError } = await supabase.from('profiles').update({
      full_name: draft.full_name.trim(), school_name: draft.school_name.trim() || null,
      province: draft.province.trim() || null, province_code: draft.province_code || null,
      ward: draft.ward.trim() || null, ward_code: draft.ward_code || null,
      subject_specialty: draft.subject_specialty.trim() || null, teaching_levels: draft.teaching_levels,
      years_experience: draft.years_experience, expertise_tags: draft.expertise_tags,
      bio: draft.bio.trim(), contact_website: draft.contact_website?.trim() || null,
      contact_facebook: draft.contact_facebook?.trim() || null, contact_email: draft.contact_email?.trim() || null,
    }).eq('id', profileId);
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    onProfileUpdated({ full_name: draft.full_name.trim(), school_name: draft.school_name.trim() || null });
    setEditing(false); onNotice('Đã lưu hồ sơ giáo viên.'); await refresh();
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !supabase || !isOwner) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) { onNotice('Ảnh đại diện/bìa cần là JPG, PNG, WebP hoặc AVIF.'); return; }
    if (file.size > 8 * 1024 * 1024) { onNotice('Ảnh tối đa 8 MB.'); return; }
    const path = `${profileId}/profile/${kind}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    let uploaded: { url: string; storagePath?: string };
    try { uploaded = await uploadPublicImage(file, path); }
    catch (uploadError) { onNotice(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh lên.'); return; }
    const photoUrl = uploaded.url;
    const { error: updateError } = await supabase.from('profiles').update({ [kind === 'avatar' ? 'avatar_url' : 'cover_url']: photoUrl }).eq('id', profileId);
    if (updateError) { if (uploaded.storagePath) await supabase.storage.from('eduhub-assets').remove([uploaded.storagePath]); onNotice(updateError.message); return; }
    if (kind === 'avatar') onProfileUpdated({ avatar_url: photoUrl });
    onNotice(kind === 'avatar' ? 'Đã cập nhật ảnh đại diện.' : 'Đã cập nhật ảnh bìa.'); await refresh();
  };

  const toggleFollow = async () => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || currentUser.id === profileId || followBusy) return;
    setFollowBusy(true);
    const result = isFollowing
      ? await supabase.from('teacher_follows').delete().eq('followed_id', profileId).eq('follower_id', currentUser.id)
      : await supabase.from('teacher_follows').insert({ followed_id: profileId, follower_id: currentUser.id });
    setFollowBusy(false);
    if (result.error) { onNotice(result.error.message); return; }
    setIsFollowing(!isFollowing);
    setFollowerCount((count) => Math.max(0, count + (isFollowing ? -1 : 1)));
    onNotice(isFollowing ? 'Đã bỏ theo dõi giáo viên.' : 'Đã theo dõi giáo viên.');
  };

  const overallRating = useMemo(() => {
    const weightedCount = ratings.reduce((sum, item) => sum + Number(item.weight || 1), 0);
    if (!weightedCount) return { average: 0, count: 0 };
    const weightedSum = ratings.reduce((sum, item) => sum + Number(item.stars || 0) * Number(item.weight || 1), 0);
    return { average: weightedSum / weightedCount, count: ratings.length };
  }, [ratings]);

  if (loading) return <section className="teacher-profile-page profile-state profile-loading" aria-busy="true" aria-label="Đang tải hồ sơ giáo viên"><div className="skeleton skeleton-profile-cover" /><div className="skeleton-profile-head"><span className="skeleton skeleton-profile-avatar" /><span className="skeleton skeleton-line skeleton-title" /><span className="skeleton skeleton-line skeleton-medium" /></div><div className="skeleton-profile-cards">{[0, 1, 2].map((item) => <span className="skeleton skeleton-profile-card" key={item} />)}</div></section>;
  if (!profile || !draft) return <section className="teacher-profile-page profile-state"><div className="empty-icon"><UserRound size={22} /></div><h2>Chưa thể mở hồ sơ</h2><p>{error}</p><button className="button button-outline" onClick={() => void refresh()}>Thử tải lại</button></section>;

  const setAddress = (next: TeacherAddress) => setDraft((old) => old ? ({ ...old, province: next.province, province_code: next.provinceCode, ward: next.ward, ward_code: next.wardCode, school_name: next.schoolName }) : old);
  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((old) => old ? { ...old, [key]: value } : old);
  const activityText: Record<string, string> = { project_approved: 'đã chia sẻ một dự án được duyệt', project_liked: 'nhận được lượt hữu ích', project_commented: 'có trao đổi mới về dự án', project_rated: 'nhận được đánh giá dự án' };
  const publishedAt = new Date(profile.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const websiteUrl = safeWebUrl(profile.contact_website);
  const facebookUrl = safeWebUrl(profile.contact_facebook);
  return <section className="teacher-profile-page">
    <div className="profile-cover" style={profile.cover_url ? { backgroundImage: `linear-gradient(90deg,rgba(21,62,50,.62),rgba(21,62,50,.08)),url("${profile.cover_url}")` } : undefined}>
      <span className="profile-cover-label"><GraduationCap size={14} /> CỘNG ĐỒNG GIÁO VIÊN EDUHUB</span>
      {isOwner && <label className="profile-cover-upload"><Camera size={14} /> Đổi ảnh bìa<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadPhoto(event, 'cover')} /></label>}
    </div>
    <div className="profile-topline">
      <div className="profile-identity">
        <div className="profile-avatar-wrap">{profile.avatar_url ? <img className="profile-avatar" src={profile.avatar_url} alt={profile.full_name} /> : <span className="profile-avatar profile-avatar-placeholder">{profile.full_name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</span>}{isOwner && <label className="profile-avatar-upload" title="Đổi ảnh đại diện"><Camera size={14} /><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadPhoto(event, 'avatar')} /></label>}</div>
        <div className="profile-headings"><div className="profile-name-row"><h2>{profile.full_name}</h2>{profile.teacher_verified && <span className="verified-badge"><ShieldCheck size={13} /> Đã xác minh</span>}</div><p>{profile.subject_specialty || 'Giáo viên EduHub'}{profile.school_name ? ` · ${profile.school_name}` : ''}</p></div>
      </div>
      <div className="profile-top-actions">{!isOwner && <button className={`button ${isFollowing ? 'button-outline' : 'button-primary'}`} onClick={() => void toggleFollow()} disabled={followBusy}><UsersRound size={14} /> {followBusy ? 'Đang cập nhật…' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</button>}{isOwner && !editing && <button className="button button-outline" onClick={() => setEditing(true)}><Pencil size={15} /> Chỉnh sửa hồ sơ</button>}{isOwner && <button className="button button-quiet profile-signout" onClick={onSignOut}><X size={14} /> Đăng xuất</button>}</div>
    </div>
    {editing ? <div className="profile-edit-panel"><div className="profile-edit-heading"><div><div className="section-kicker">HỒ SƠ CHUYÊN MÔN</div><h3>Cập nhật thông tin giáo viên</h3></div><button className="icon-button" aria-label="Đóng chỉnh sửa" onClick={() => { setDraft(emptyDraft(profile)); setEditing(false); }}><X size={17} /></button></div>
      <label className="form-label">Họ và tên<input value={draft.full_name} onChange={(event) => updateDraft('full_name', event.target.value)} required /></label>
      <TeacherAddressFields value={address} onChange={setAddress} />
      <div className="form-two-col"><label className="form-label">Môn chuyên môn<input value={draft.subject_specialty} onChange={(event) => updateDraft('subject_specialty', event.target.value)} placeholder="Toán học, Ngữ văn..." /></label><label className="form-label">Số năm kinh nghiệm<input type="number" min="0" max="70" value={draft.years_experience} onChange={(event) => updateDraft('years_experience', Math.max(0, Math.min(70, Number(event.target.value || 0))))} /></label></div>
      <div className="form-label"><span>Cấp học đang giảng dạy</span><div className="profile-level-choices">{['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Giáo dục nghề nghiệp'].map((level) => <label key={level}><input type="checkbox" checked={draft.teaching_levels.includes(level)} onChange={() => updateDraft('teaching_levels', draft.teaching_levels.includes(level) ? draft.teaching_levels.filter((item) => item !== level) : [...draft.teaching_levels, level])} /> {level}</label>)}</div></div>
      <label className="form-label">Thế mạnh chuyên môn<textarea rows={2} value={draft.expertise_tags.join(', ')} onChange={(event) => updateDraft('expertise_tags', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="STEM, kiểm tra đánh giá, dạy học dự án..." /></label>
      <label className="form-label">Giới thiệu<textarea rows={4} maxLength={800} value={draft.bio} onChange={(event) => updateDraft('bio', event.target.value)} placeholder="Chia sẻ ngắn về kinh nghiệm, phương pháp và điều thầy cô quan tâm..." /><small>{draft.bio.length}/800 ký tự</small></label>
      <div className="profile-contact-edit"><div className="profile-contact-edit-heading"><Link2 size={15} /><b>Liên kết liên hệ trên tường</b></div><div className="form-two-col"><label className="form-label">Website / trang cá nhân<input type="url" value={draft.contact_website || ''} onChange={(event) => updateDraft('contact_website', event.target.value)} placeholder="https://..." /></label><label className="form-label">Facebook<input type="url" value={draft.contact_facebook || ''} onChange={(event) => updateDraft('contact_facebook', event.target.value)} placeholder="https://facebook.com/..." /></label></div><label className="form-label">Email công khai<input type="email" value={draft.contact_email || ''} onChange={(event) => updateDraft('contact_email', event.target.value)} placeholder="Email để đồng nghiệp liên hệ (không bắt buộc)" /></label><small className="contact-privacy-note">Chỉ điền email nếu thầy cô muốn hiển thị công khai.</small></div>
      {error && <div className="submit-error">{error}</div>}<div className="profile-edit-actions"><button className="button button-quiet" onClick={() => { setDraft(emptyDraft(profile)); setEditing(false); }}>Hủy</button><button className="button button-primary" disabled={saving} onClick={() => void saveProfile()}><Check size={15} /> {saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></div>
    </div> : <>
      <div className="profile-stats"><div><Star size={17} /><strong>{overallRating.count ? overallRating.average.toFixed(1) : '—'}</strong><small>{overallRating.count ? `${overallRating.count} đánh giá` : 'Chưa có đánh giá'}</small></div><div><BriefcaseBusiness size={17} /><strong>{profile.years_experience || 0} năm</strong><small>Kinh nghiệm giảng dạy</small></div><div><Award size={17} /><strong>{Number(profile.edu_points || 0).toLocaleString('vi-VN')}</strong><small>Điểm đóng góp</small></div><div><School size={17} /><strong>{resources.length}</strong><small>Dự án được duyệt</small></div><div><UsersRound size={17} /><strong>{followerCount}</strong><small>Người theo dõi · đang theo dõi {followingCount}</small></div></div>
      <div className="profile-columns"><div className="profile-main-column"><article className="profile-card"><div className="profile-card-title"><h3>Giới thiệu</h3>{isOwner && <button onClick={() => setEditing(true)}><Pencil size={13} /> Sửa</button>}</div><p className="profile-bio">{profile.bio || (isOwner ? 'Thêm vài dòng giới thiệu để đồng nghiệp hiểu hơn về kinh nghiệm và điều thầy cô đang quan tâm.' : 'Giáo viên chưa thêm phần giới thiệu.')}</p><div className="profile-facts">{profile.school_name && <span><School size={15} />{profile.school_name}</span>}{(profile.ward || profile.province) && <span><MapPin size={15} />{[profile.ward, profile.province].filter(Boolean).join(', ')}</span>}{profile.teaching_levels?.length > 0 && <span><BriefcaseBusiness size={15} />{profile.teaching_levels.join(' · ')}</span>}<span><CalendarDays size={15} />Tham gia từ {publishedAt}</span></div>{profile.expertise_tags?.length > 0 && <div className="profile-expertise">{profile.expertise_tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}</article>{(profile.contact_website || profile.contact_facebook || profile.contact_email) && <article className="profile-card profile-contact-card"><div className="profile-card-title"><h3>Kết nối với giáo viên</h3><Link2 size={15} /></div><div className="profile-contact-links">{websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer"><Globe2 size={15} /> Website cá nhân</a>}{facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer"><Link2 size={15} /> Facebook</a>}{profile.contact_email && <a href={`mailto:${profile.contact_email}`}><Mail size={15} /> Gửi email</a>}</div></article>}
        <article className="profile-card profile-projects"><div className="profile-card-title"><div><h3>Dự án đã chia sẻ</h3><p>{resources.length} dự án công khai</p></div></div>{resources.length ? resources.map((item) => <button className="profile-project-row" key={item.id} onClick={() => onOpenProject(item.id)}>{item.cover_url ? <img src={item.cover_url} alt="" /> : <span className="profile-project-placeholder"><GraduationCap size={19} /></span>}<span className="profile-project-copy"><b>{item.title}</b><small>{item.subjects?.[0] || 'Đa môn học'} · {item.grade_levels?.join(', ') || 'Mọi khối lớp'}</small><span className="profile-project-rating"><Star size={12} fill="currentColor" /> {Number(item.rating_avg || 0).toFixed(1)} <span>({item.rating_count || 0})</span><span>·</span><MessageCircle size={12} /> {item.upvotes_count || 0} hữu ích</span></span><ChevronRight size={16} /></button>) : <p className="profile-empty">Chưa có dự án được duyệt.</p>}</article>
      </div><aside className="profile-side-column"><article className="profile-card"><div className="profile-card-title"><h3>Hoạt động gần đây</h3><Clock3 size={15} /></div>{activities.length ? <div className="profile-activity-list">{activities.map((item) => <div className="profile-activity" key={item.id}><span className="activity-dot"><Check size={11} /></span><p><b>{item.actor?.full_name || 'EduHub'}</b> {activityText[item.activity_type] || 'đã có hoạt động mới'}{item.resource?.title && <> · <strong>{item.resource.title}</strong></>}<small>{new Date(item.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</small></p></div>)}</div> : <p className="profile-empty">Hoạt động như dự án được duyệt, lượt thích, bình luận và đánh giá sẽ xuất hiện tại đây.</p>}</article><article className="profile-card profile-rating-card"><div className="profile-card-title"><h3>Đánh giá từ cộng đồng</h3><Star size={15} /></div><div className="profile-rating-score"><strong>{overallRating.count ? overallRating.average.toFixed(1) : '—'}</strong><span>{[1,2,3,4,5].map((n) => <Star key={n} size={15} fill={overallRating.average >= n ? 'currentColor' : 'none'} />)}</span></div><p>{overallRating.count ? `Tổng hợp từ ${overallRating.count} lượt đánh giá có trọng số theo đóng góp.` : 'Đánh giá sẽ được tổng hợp từ các dự án đã chia sẻ.'}</p></article></aside></div>
    </>}
  </section>;
}
