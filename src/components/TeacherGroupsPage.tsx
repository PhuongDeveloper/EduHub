import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  BookOpen, MessageCircle, Plus, School, Send, Trash2, UserPlus, UsersRound,
  Users, UserCheck, Search, Sparkles, X, ChevronRight, Share2, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SUBJECT_NAMES } from '../lib/curriculum';

type Teacher = {
  id: string;
  full_name: string;
  school_name: string | null;
  show_school?: boolean;
  subject_specialty: string | null;
  avatar_url?: string | null;
  teacher_verified?: boolean;
};

type GroupMember = {
  user_id: string;
  role: string;
  profile?: Teacher | null;
};

type GroupResource = {
  id: string;
  resource_id: string;
  note: string;
  resource?: { title?: string; subjects?: string[]; grade_levels?: string[] } | null;
};

type Group = {
  id: string;
  owner_id: string;
  name: string;
  school_name: string;
  subject: string;
  members: GroupMember[];
  resources: GroupResource[];
};

type ResourceOption = {
  id: string;
  sourceId?: string;
  title: string;
  subject: string;
  grade: string;
};

type GroupPost = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { full_name?: string; avatar_url?: string | null } | null;
  replies: Array<{
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    author?: { full_name?: string; avatar_url?: string | null } | null;
  }>;
};

export function TeacherGroupsPage({
  currentUser,
  projects,
  onRequireAuth,
  onNotice,
  onOpenProject,
  onOpenTeacherProfile,
  onOpenChatWithTeacher,
}: {
  currentUser: User | null;
  projects: ResourceOption[];
  onRequireAuth: () => void;
  onNotice: (text: string) => void;
  onOpenProject: (project: ResourceOption) => void;
  onOpenTeacherProfile?: (teacherId: string) => void;
  onOpenChatWithTeacher?: (teacherId: string) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeId, setActiveId] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [friends, setFriends] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  // Group creation modal/state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState(SUBJECT_NAMES[0] || 'Toán');
  const [creating, setCreating] = useState(false);

  // Group view tab
  const [groupTab, setGroupTab] = useState<'discussion' | 'resources' | 'members'>('discussion');

  // Member invitation & resource sharing
  const [inviteId, setInviteId] = useState('');
  const [inviteSearch, setInviteSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [shareId, setShareId] = useState('');
  const [note, setNote] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Posts & replies
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // 1. Load groups
  const load = async () => {
    if (!supabase || !currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_group_members')
        .select('group_id,group:teacher_groups!teacher_group_members_group_id_fkey(id,owner_id,name,school_name,subject)')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const groupRows = (data || [])
        .map((item) => item.group)
        .filter(Boolean) as unknown as Array<Omit<Group, 'members' | 'resources'>>;

      const ids = groupRows.map((item) => item.id);

      const [members, shared] = await Promise.all([
        ids.length
          ? supabase
              .from('teacher_group_members')
              .select('group_id,user_id,role,profile:profiles!teacher_group_members_user_id_fkey(id,full_name,school_name,subject_specialty,avatar_url,teacher_verified)')
              .in('group_id', ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase
              .from('teacher_group_resources')
              .select('id,group_id,resource_id,note,resource:resources!teacher_group_resources_resource_id_fkey(title,subjects,grade_levels)')
              .in('group_id', ids)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const parsedGroups: Group[] = groupRows.map((group) => ({
        ...group,
        members: ((members.data || []) as unknown as Array<GroupMember & { group_id: string }>).filter(
          (item) => item.group_id === group.id
        ),
        resources: ((shared.data || []) as unknown as Array<GroupResource & { group_id: string }>).filter(
          (item) => item.group_id === group.id
        ),
      }));

      setGroups(parsedGroups);
      if (!activeId && parsedGroups[0]) {
        setActiveId(parsedGroups[0].id);
      }
    } catch (err: any) {
      onNotice(err?.message || 'Không thể tải danh sách nhóm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [currentUser?.id]);

  // 2. Load teachers and mutual friends
  useEffect(() => {
    if (!supabase || !currentUser) return;
    let active = true;

    // Load all teachers
    void supabase
      .from('profiles')
      .select('id,full_name,school_name,show_school,subject_specialty,avatar_url,teacher_verified')
      .neq('id', currentUser.id)
      .order('full_name')
      .limit(250)
      .then(({ data }) => {
        if (active) {
          setTeachers(
            ((data || []) as Teacher[]).map((teacher) => ({
              ...teacher,
              school_name: teacher.show_school === false ? null : teacher.school_name,
            }))
          );
        }
      });

    // Load mutual friends
    void Promise.all([
      supabase.from('teacher_follows').select('followed_id').eq('follower_id', currentUser.id),
      supabase.from('teacher_follows').select('follower_id').eq('followed_id', currentUser.id),
    ]).then(([followingRes, followersRes]) => {
      if (!active) return;
      const followingSet = new Set((followingRes.data || []).map((r) => r.followed_id));
      const mutualIds = (followersRes.data || [])
        .map((r) => r.follower_id)
        .filter((id) => followingSet.has(id));

      if (mutualIds.length) {
        supabase
          .from('profiles')
          .select('id,full_name,school_name,subject_specialty,avatar_url,teacher_verified')
          .in('id', mutualIds)
          .then(({ data }) => {
            if (active && data) setFriends(data as Teacher[]);
          });
      }
    });

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const active = groups.find((item) => item.id === activeId) || groups[0] || null;

  // 3. Load posts for active group
  const loadPosts = async () => {
    if (!supabase || !active) {
      setPosts([]);
      return;
    }
    const { data, error } = await supabase
      .from('teacher_group_posts')
      .select(
        'id,author_id,body,created_at,author:profiles!teacher_group_posts_author_id_fkey(full_name,avatar_url),replies:teacher_group_replies(id,author_id,body,created_at,author:profiles!teacher_group_replies_author_id_fkey(full_name,avatar_url))'
      )
      .eq('group_id', active.id)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) {
      onNotice(`Không tải được trao đổi nhóm: ${error.message}`);
    } else {
      setPosts((data || []) as unknown as GroupPost[]);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, [active?.id]);

  // 4. Create post in group
  const createPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !active || !currentUser || !postBody.trim() || posting) return;

    setPosting(true);
    const { error } = await supabase
      .from('teacher_group_posts')
      .insert({ group_id: active.id, author_id: currentUser.id, body: postBody.trim() });

    setPosting(false);
    if (error) {
      onNotice(`Không đăng được bài trao đổi: ${error.message}`);
    } else {
      setPostBody('');
      await loadPosts();
      onNotice('Đã đăng trao đổi vào nhóm.');
    }
  };

  // 5. Reply to post
  const replyPost = async (event: FormEvent, postId: string) => {
    event.preventDefault();
    const body = replyDrafts[postId]?.trim();
    if (!supabase || !currentUser || !body) return;

    const { error } = await supabase
      .from('teacher_group_replies')
      .insert({ post_id: postId, author_id: currentUser.id, body });

    if (error) {
      onNotice(`Không gửi được trả lời: ${error.message}`);
    } else {
      setReplyDrafts((current) => ({ ...current, [postId]: '' }));
      await loadPosts();
    }
  };

  // 6. Create group
  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!supabase || !name.trim() || creating) return;

    setCreating(true);
    const { data: newGroup, error } = await supabase
      .from('teacher_groups')
      .insert({
        owner_id: currentUser.id,
        name: name.trim(),
        school_name: school.trim(),
        subject,
      })
      .select('id')
      .single();

    setCreating(false);
    if (error) {
      onNotice(error.message);
    } else {
      setName('');
      setSchool('');
      setShowCreateModal(false);
      onNotice('Đã tạo nhóm chuyên môn kín thành công.');
      await load();
      if (newGroup) setActiveId(newGroup.id);
    }
  };

  // 7. Invite teacher to group
  const handleInviteTeacher = async (teacherId: string, teacherName?: string) => {
    if (!supabase || !active || active.owner_id !== currentUser?.id || !teacherId) return;

    setInviting(true);
    const { error } = await supabase
      .from('teacher_group_members')
      .insert({ group_id: active.id, user_id: teacherId, role: 'member', added_by: currentUser.id });

    setInviting(false);
    if (error) {
      onNotice(error.code === '23505' ? 'Giáo viên đã ở trong nhóm này rồi.' : error.message);
    } else {
      setInviteId('');
      setShowInviteModal(false);
      onNotice(`Đã mời thầy cô ${teacherName || ''} vào nhóm.`);
      await load();
    }
  };

  // 8. Share resource to group
  const handleShareResource = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !active || !shareId || !currentUser || sharing) return;

    setSharing(true);
    const { error } = await supabase
      .from('teacher_group_resources')
      .insert({ group_id: active.id, resource_id: shareId, added_by: currentUser.id, note: note.trim() });

    setSharing(false);
    if (error) {
      onNotice(error.code === '23505' ? 'Học liệu này đã được chia sẻ trong nhóm.' : error.message);
    } else {
      setShareId('');
      setNote('');
      setShowShareModal(false);
      onNotice('Đã chia sẻ học liệu với nhóm.');
      await load();
    }
  };

  // 9. Remove member
  const removeMember = async (userId: string, memberName: string) => {
    if (
      !supabase ||
      active?.owner_id !== currentUser?.id ||
      userId === active.owner_id ||
      !window.confirm(`Gỡ thầy cô ${memberName} khỏi nhóm này?`)
    )
      return;

    const { error } = await supabase
      .from('teacher_group_members')
      .delete()
      .eq('group_id', active.id)
      .eq('user_id', userId);

    if (error) onNotice(error.message);
    else {
      onNotice(`Đã gỡ ${memberName} khỏi nhóm.`);
      await load();
    }
  };

  // 10. Delete group
  const removeGroup = async (group: Group) => {
    if (
      !supabase ||
      group.owner_id !== currentUser?.id ||
      !window.confirm(`Xóa toàn bộ nhóm “${group.name}” và các bài trao đổi? Thao tác này không thể hoàn tác.`)
    )
      return;

    const { error } = await supabase.from('teacher_groups').delete().eq('id', group.id);
    if (error) onNotice(error.message);
    else {
      onNotice(`Đã xóa nhóm “${group.name}”.`);
      setActiveId('');
      await load();
    }
  };

  if (!currentUser) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <UsersRound size={28} />
        </div>
        <h3>Nhóm chuyên môn dành cho giáo viên</h3>
        <p>Đăng nhập để tạo và tham gia các nhóm kín cùng đồng nghiệp trong trường hoặc tổ bộ môn.</p>
        <button className="button button-primary" onClick={onRequireAuth}>
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  // Friends not yet in current active group
  const friendsNotInGroup = active
    ? friends.filter((f) => !active.members.some((m) => m.user_id === f.id))
    : [];

  const candidateTeachers = teachers.filter(
    (t) =>
      !active?.members.some((m) => m.user_id === t.id) &&
      `${t.full_name} ${t.school_name || ''} ${t.subject_specialty || ''}`
        .toLowerCase()
        .includes(inviteSearch.toLowerCase())
  );

  return (
    <section className="teacher-groups-page">
      {/* Page Header */}
      <header className="groups-page-header">
        <div className="groups-header-brand">
          <span className="groups-brand-icon">
            <School size={22} />
          </span>
          <div>
            <span className="section-kicker">KHÔNG GIAN CỘNG TÁC CHUYÊN MÔN</span>
            <h2>Nhóm chuyên môn giáo viên</h2>
            <p>
              Không gian sinh hoạt tổ, chia sẻ kế hoạch bài dạy 5512 và học liệu kín dành riêng cho các thành viên được mời.
            </p>
          </div>
        </div>
        <button className="button button-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} /> Tạo nhóm mới
        </button>
      </header>

      {/* Main Groups Layout */}
      <div className="groups-layout">
        {/* Left Sidebar: Groups List */}
        <aside className="groups-sidebar">
          <div className="groups-sidebar-header">
            <b>Nhóm của tôi ({groups.length})</b>
            <button
              className="button-link-accent text-xs"
              onClick={() => setShowCreateModal(true)}
            >
              + Tạo nhóm
            </button>
          </div>

          <div className="groups-list-container">
            {groups.map((group) => {
              const isActive = active?.id === group.id;
              const isOwner = group.owner_id === currentUser.id;
              return (
                <button
                  key={group.id}
                  className={`group-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveId(group.id)}
                >
                  <div className="group-nav-icon">
                    <UsersRound size={16} />
                  </div>
                  <div className="group-nav-info">
                    <b>{group.name}</b>
                    <small>
                      {group.subject} · {group.members.length} thành viên
                      {isOwner && ' · Trưởng nhóm'}
                    </small>
                  </div>
                  {isActive && <ChevronRight size={15} className="group-nav-arrow" />}
                </button>
              );
            })}

            {loading && <div className="groups-loading-note">Đang tải danh sách nhóm…</div>}

            {!groups.length && !loading && (
              <div className="groups-empty-sidebar">
                <School size={30} className="empty-icon-subtle" />
                <p>Thầy cô chưa tham gia nhóm chuyên môn nào.</p>
                <button
                  className="button button-outline button-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  Tạo nhóm đầu tiên
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content: Active Group Workspace */}
        {active ? (
          <article className="group-workspace">
            {/* Group Workspace Header */}
            <header className="group-workspace-header">
              <div className="group-header-info">
                <span className="group-subject-badge">{active.subject}</span>
                <h3>{active.name}</h3>
                <p>
                  {active.school_name || 'Nhóm chuyên môn'} · {active.members.length} thành viên
                  {active.owner_id === currentUser.id && ' · Bạn là trưởng nhóm'}
                </p>
              </div>

              <div className="group-workspace-actions">
                {active.owner_id === currentUser.id && (
                  <button
                    className="button button-outline button-sm"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus size={14} /> Mời thành viên
                  </button>
                )}
                <button
                  className="button button-primary button-sm"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 size={14} /> Chia sẻ học liệu
                </button>
                {active.owner_id === currentUser.id && (
                  <button
                    className="button button-quiet button-sm text-red-600 hover:bg-red-50"
                    onClick={() => void removeGroup(active)}
                    title="Xóa nhóm"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </header>

            {/* Suggested Friends Quick Bar (if owner and has friends not yet in group) */}
            {active.owner_id === currentUser.id && friendsNotInGroup.length > 0 && (
              <div className="group-friends-suggest-bar">
                <div className="suggest-bar-title">
                  <Sparkles size={14} className="text-teal-600" />
                  <span>
                    Gợi ý bạn bè tham gia nhóm ({friendsNotInGroup.length}):
                  </span>
                </div>
                <div className="suggest-friends-list">
                  {friendsNotInGroup.slice(0, 5).map((f) => (
                    <button
                      key={f.id}
                      className="suggest-friend-chip"
                      onClick={() => handleInviteTeacher(f.id, f.full_name)}
                      disabled={inviting}
                      title={`Thêm ${f.full_name} vào nhóm`}
                    >
                      <UserPlus size={12} />
                      <span>{f.full_name}</span>
                    </button>
                  ))}
                  {friendsNotInGroup.length > 5 && (
                    <button
                      className="suggest-friend-more"
                      onClick={() => setShowInviteModal(true)}
                    >
                      +{friendsNotInGroup.length - 5} người khác
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Workspace Tabs */}
            <div className="group-workspace-tabs">
              <button
                className={`workspace-tab-btn ${groupTab === 'discussion' ? 'active' : ''}`}
                onClick={() => setGroupTab('discussion')}
              >
                <MessageCircle size={15} />
                <span>Trao đổi tổ ({posts.length})</span>
              </button>
              <button
                className={`workspace-tab-btn ${groupTab === 'resources' ? 'active' : ''}`}
                onClick={() => setGroupTab('resources')}
              >
                <BookOpen size={15} />
                <span>Học liệu nội bộ ({active.resources.length})</span>
              </button>
              <button
                className={`workspace-tab-btn ${groupTab === 'members' ? 'active' : ''}`}
                onClick={() => setGroupTab('members')}
              >
                <Users size={15} />
                <span>Thành viên ({active.members.length})</span>
              </button>
            </div>

            {/* TAB 1: DISCUSSION */}
            {groupTab === 'discussion' && (
              <section className="group-tab-panel group-discussion-panel">
                {/* Post Composer */}
                <form className="group-post-composer" onSubmit={createPost}>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder="Đặt câu hỏi nghiệp vụ, ghi chú nội dung buổi họp tổ hoặc chia sẻ kinh nghiệm giảng dạy…"
                  />
                  <div className="post-composer-actions">
                    <small>{postBody.length}/3000 ký tự</small>
                    <button
                      type="submit"
                      className="button button-primary button-sm"
                      disabled={posting || !postBody.trim()}
                    >
                      <Send size={14} /> {posting ? 'Đang đăng…' : 'Đăng trao đổi'}
                    </button>
                  </div>
                </form>

                {/* Posts List */}
                <div className="group-posts-list">
                  {posts.map((post) => (
                    <article className="group-post-card" key={post.id}>
                      <header className="group-post-header">
                        <div className="group-post-author">
                          <div className="post-author-avatar">
                            {post.author?.avatar_url ? (
                              <img src={post.author.avatar_url} alt="" />
                            ) : (
                              <span>{post.author?.full_name?.slice(-2).toUpperCase() || 'GV'}</span>
                            )}
                          </div>
                          <div>
                            <b>{post.author?.full_name || 'Giáo viên'}</b>
                            <time>
                              {new Date(post.created_at).toLocaleString('vi-VN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </time>
                          </div>
                        </div>
                      </header>

                      <div className="group-post-body">
                        <p>{post.body}</p>
                      </div>

                      {/* Replies */}
                      <div className="group-post-replies">
                        {post.replies.map((reply) => (
                          <div className="group-reply-row" key={reply.id}>
                            <div className="reply-avatar">
                              {reply.author?.avatar_url ? (
                                <img src={reply.author.avatar_url} alt="" />
                              ) : (
                                <span>{reply.author?.full_name?.slice(-2).toUpperCase() || 'GV'}</span>
                              )}
                            </div>
                            <div className="reply-content">
                              <b>{reply.author?.full_name || 'Đồng nghiệp'}</b>
                              <p>{reply.body}</p>
                            </div>
                          </div>
                        ))}

                        {/* Reply Input Form */}
                        <form
                          className="group-reply-form"
                          onSubmit={(e) => void replyPost(e, post.id)}
                        >
                          <input
                            value={replyDrafts[post.id] || ''}
                            onChange={(e) =>
                              setReplyDrafts((curr) => ({ ...curr, [post.id]: e.target.value }))
                            }
                            placeholder="Gửi phản hồi cho đồng nghiệp…"
                            maxLength={2000}
                          />
                          <button
                            type="submit"
                            className="button button-primary button-sm"
                            disabled={!replyDrafts[post.id]?.trim()}
                          >
                            <Send size={13} />
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}

                  {!posts.length && (
                    <div className="group-empty-tab-state">
                      <MessageCircle size={36} className="empty-icon-subtle" />
                      <b>Chưa có bài trao đổi nào trong nhóm</b>
                      <p>Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ thông tin cho các thành viên trong tổ.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB 2: RESOURCES */}
            {groupTab === 'resources' && (
              <section className="group-tab-panel group-resources-panel">
                <div className="group-tab-toolbar">
                  <p>Học liệu, slide, đề thi được các thành viên chia sẻ dùng chung trong tổ.</p>
                  <button
                    className="button button-primary button-sm"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Plus size={14} /> Chia sẻ học liệu mới
                  </button>
                </div>

                <div className="group-resources-grid">
                  {active.resources.map((item) => {
                    const project = projects.find((c) => c.sourceId === item.resource_id);
                    return (
                      <div className="group-resource-card" key={item.id}>
                        <div className="resource-card-icon">
                          <BookOpen size={20} />
                        </div>
                        <div className="resource-card-meta">
                          <b>{project?.title || item.resource?.title || 'Học liệu đã chia sẻ'}</b>
                          <small>
                            {(item.resource?.subjects || []).join(' · ')} · {(item.resource?.grade_levels || []).join(' · ')}
                          </small>
                          {item.note && <p className="resource-card-note">“{item.note}”</p>}
                        </div>
                        <button
                          className="button button-outline button-sm"
                          onClick={() => project && onOpenProject(project)}
                          disabled={!project}
                        >
                          Mở học liệu
                        </button>
                      </div>
                    );
                  })}

                  {!active.resources.length && (
                    <div className="group-empty-tab-state">
                      <BookOpen size={36} className="empty-icon-subtle" />
                      <b>Chưa có học liệu nào được chia sẻ trong nhóm</b>
                      <p>Chọn các học liệu đã được duyệt của thầy cô để cùng chia sẻ với đồng nghiệp.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB 3: MEMBERS */}
            {groupTab === 'members' && (
              <section className="group-tab-panel group-members-panel">
                <div className="group-tab-toolbar">
                  <p>Danh sách các giáo viên tham gia sinh hoạt chuyên môn trong nhóm này.</p>
                  {active.owner_id === currentUser.id && (
                    <button
                      className="button button-outline button-sm"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <UserPlus size={14} /> Thêm thành viên
                    </button>
                  )}
                </div>

                <div className="group-members-list">
                  {active.members.map((member) => {
                    const isOwner = member.role === 'owner';
                    const isMe = member.user_id === currentUser.id;
                    const isFriend = friends.some((f) => f.id === member.user_id);
                    const profile = member.profile;

                    return (
                      <div className="group-member-card" key={member.user_id}>
                        <div
                          className="member-card-avatar"
                          onClick={() => onOpenTeacherProfile?.(member.user_id)}
                          role="button"
                        >
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" />
                          ) : (
                            <span>{profile?.full_name?.slice(-2).toUpperCase() || 'GV'}</span>
                          )}
                        </div>
                        <div className="member-card-info">
                          <div className="member-name-row">
                            <b
                              onClick={() => onOpenTeacherProfile?.(member.user_id)}
                              role="button"
                            >
                              {profile?.full_name || 'Giáo viên'} {isMe && '(Bạn)'}
                            </b>
                            {profile?.teacher_verified && (
                              <ShieldCheck size={14} className="text-teal-600 fill-teal-100" />
                            )}
                            {isOwner ? (
                              <span className="group-role-badge owner">Trưởng nhóm</span>
                            ) : (
                              <span className="group-role-badge member">Thành viên</span>
                            )}
                            {isFriend && (
                              <span className="tiktok-friend-tag-mini">
                                <UserCheck size={11} /> Bạn bè
                              </span>
                            )}
                          </div>
                          <small>
                            {profile?.subject_specialty || 'Giáo viên'} · {profile?.school_name || 'EduHub'}
                          </small>
                        </div>

                        <div className="member-card-actions">
                          {!isMe && onOpenChatWithTeacher && (
                            <button
                              className="button button-outline button-sm"
                              onClick={() => onOpenChatWithTeacher(member.user_id)}
                              title="Nhắn tin riêng"
                            >
                              <MessageCircle size={14} />
                              <span className="hidden sm:inline">Nhắn tin</span>
                            </button>
                          )}
                          {active.owner_id === currentUser.id && !isOwner && (
                            <button
                              className="button button-quiet button-sm text-red-600"
                              onClick={() => void removeMember(member.user_id, profile?.full_name || 'giáo viên')}
                              title="Gỡ khỏi nhóm"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </article>
        ) : (
          <div className="groups-unselected-state">
            <School size={44} className="text-slate-300" />
            <h3>Chọn hoặc tạo một nhóm chuyên môn</h3>
            <p>Không gian kín để thầy cô sinh hoạt tổ bộ môn và chia sẻ học liệu 5512.</p>
            <button className="button button-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={15} /> Tạo nhóm mới
            </button>
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="group-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="group-modal-header">
              <div className="flex items-center gap-2.5">
                <span className="modal-header-icon">
                  <School size={20} />
                </span>
                <div>
                  <h3>Tạo nhóm chuyên môn kín</h3>
                  <p>Không gian riêng cho tổ bộ môn hoặc nhóm nghiên cứu của trường.</p>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={create} className="group-modal-form">
              <div className="form-group">
                <label>Tên nhóm chuyên môn</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Tổ Toán - Trường THPT Chu Văn An"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label>Môn chuyên môn</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {SUBJECT_NAMES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Trường / Đơn vị</label>
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="VD: THPT Chu Văn An"
                    maxLength={160}
                  />
                </div>
              </div>

              <div className="group-modal-actions">
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={creating || !name.trim()}
                >
                  <Plus size={15} /> {creating ? 'Đang tạo…' : 'Tạo nhóm kín'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && active && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="group-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="group-modal-header">
              <div className="flex items-center gap-2.5">
                <span className="modal-header-icon">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h3>Mời giáo viên vào nhóm “{active.name}”</h3>
                  <p>Thành viên được mời có thể tham gia thảo luận và xem học liệu kín.</p>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowInviteModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </header>

            <div className="group-invite-modal-body">
              {/* Friends Section first */}
              {friendsNotInGroup.length > 0 && (
                <div className="invite-friends-section">
                  <span className="invite-section-label">
                    <Sparkles size={13} className="text-teal-600" /> Bạn bè trên EduHub (kết nối hai chiều)
                  </span>
                  <div className="invite-friends-grid">
                    {friendsNotInGroup.map((f) => (
                      <div className="invite-friend-row" key={f.id}>
                        <div className="invite-friend-meta">
                          <b>{f.full_name}</b>
                          <small>
                            {f.subject_specialty || 'Giáo viên'} · {f.school_name || 'EduHub'}
                          </small>
                        </div>
                        <button
                          className="button button-primary button-sm"
                          disabled={inviting}
                          onClick={() => handleInviteTeacher(f.id, f.full_name)}
                        >
                          <UserPlus size={13} /> Thêm vào nhóm
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Search Section */}
              <div className="invite-search-section">
                <span className="invite-section-label">Tìm kiếm giáo viên khác</span>
                <div className="invite-search-input">
                  <Search size={15} />
                  <input
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    placeholder="Nhập tên giáo viên, môn hoặc trường…"
                  />
                </div>

                <div className="invite-candidates-list">
                  {candidateTeachers.slice(0, 8).map((t) => (
                    <div className="invite-candidate-row" key={t.id}>
                      <div>
                        <b>{t.full_name}</b>
                        <small>
                          {t.subject_specialty || 'Giáo viên'} · {t.school_name || 'EduHub'}
                        </small>
                      </div>
                      <button
                        className="button button-outline button-sm"
                        disabled={inviting}
                        onClick={() => handleInviteTeacher(t.id, t.full_name)}
                      >
                        <UserPlus size={13} /> Mời
                      </button>
                    </div>
                  ))}
                  {!candidateTeachers.length && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Không tìm thấy giáo viên phù hợp.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="group-modal-footer">
              <button
                type="button"
                className="button button-outline button-sm"
                onClick={() => setShowInviteModal(false)}
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* SHARE RESOURCE MODAL */}
      {showShareModal && active && (
        <div className="modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="group-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="group-modal-header">
              <div className="flex items-center gap-2.5">
                <span className="modal-header-icon">
                  <Share2 size={20} />
                </span>
                <div>
                  <h3>Chia sẻ học liệu vào nhóm “{active.name}”</h3>
                  <p>Chọn học liệu đã duyệt của thầy cô để chia sẻ với đồng nghiệp trong tổ.</p>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowShareModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleShareResource} className="group-modal-form">
              <div className="form-group">
                <label>Chọn học liệu</label>
                <select
                  value={shareId}
                  onChange={(e) => setShareId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn bài học / học liệu đã duyệt --</option>
                  {projects
                    .filter(
                      (p) =>
                        p.sourceId &&
                        !active.resources.some((r) => r.resource_id === p.sourceId)
                    )
                    .map((p) => (
                      <option key={p.id} value={p.sourceId}>
                        {p.title} ({p.subject} · {p.grade})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ghi chú cho đồng nghiệp (tùy chọn)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Gợi ý sử dụng hoặc lưu ý khi dạy trên lớp…"
                  maxLength={500}
                />
              </div>

              <div className="group-modal-actions">
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => setShowShareModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={sharing || !shareId}
                >
                  <Share2 size={15} /> {sharing ? 'Đang chia sẻ…' : 'Chia sẻ ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
