import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  BookOpen, MessageCircle, Plus, School, Send, Trash2, UserPlus, UsersRound,
  Users, UserCheck, Search, Sparkles, X, ChevronRight, Share2, ShieldCheck, ArrowLeft
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

const SAMPLE_TEACHER_GROUPS: Group[] = [
  {
    id: 'sample-group-stem',
    owner_id: 'sample-teacher-1',
    name: 'Tổ KHTN & Giáo dục STEM THCS (GDPT 2018)',
    school_name: 'THCS Chu Văn An · Hà Nội',
    subject: 'Khoa học tự nhiên',
    members: [
      {
        user_id: 'sample-teacher-1',
        role: 'owner',
        profile: {
          id: 'sample-teacher-1',
          full_name: 'Thầy Nguyễn Văn An',
          school_name: 'THCS Chu Văn An, Hà Nội',
          subject_specialty: 'Khoa học tự nhiên - Vật lí',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
      {
        user_id: 'sample-teacher-2',
        role: 'member',
        profile: {
          id: 'sample-teacher-2',
          full_name: 'Cô Lê Quỳnh Trang',
          school_name: 'THCS & THPT Nguyễn Tất Thành',
          subject_specialty: 'Hóa học & Sinh học',
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
      {
        user_id: 'sample-teacher-3',
        role: 'member',
        profile: {
          id: 'sample-teacher-3',
          full_name: 'Thầy Trần Minh Đức',
          school_name: 'THCS Trưng Vương, Hà Nội',
          subject_specialty: 'STEM & Robotics',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
    ],
    resources: [
      {
        id: 'sr-1',
        resource_id: 'sample-p1',
        note: 'KHBD 5512 bài học STEM: Chế tạo nguồn điện từ hoa quả & mạch điện một chiều KHTN 8',
        resource: {
          title: 'KHBD STEM: Chế tạo nguồn điện từ hoa quả & mạch điện một chiều KHTN 8',
          subjects: ['Khoa học tự nhiên'],
          grade_levels: ['Lớp 8'],
        },
      },
      {
        id: 'sr-2',
        resource_id: 'sample-p2',
        note: 'Bộ tiêu chí rubric đánh giá sản phẩm STEM học sinh theo chuẩn Công văn 5512',
        resource: {
          title: 'Bảng Rubric đánh giá năng lực giải quyết vấn đề trong dự án STEM',
          subjects: ['Khoa học tự nhiên'],
          grade_levels: ['Lớp 6', 'Lớp 7', 'Lớp 8'],
        },
      },
    ],
  },
  {
    id: 'sample-group-van',
    owner_id: 'sample-teacher-4',
    name: 'Cộng đồng Giáo viên Ngữ văn Đổi mới & Đọc hiểu',
    school_name: 'Cụm Chuyên Ngữ văn Miền Bắc',
    subject: 'Ngữ văn',
    members: [
      {
        user_id: 'sample-teacher-4',
        role: 'owner',
        profile: {
          id: 'sample-teacher-4',
          full_name: 'Cô Hoàng Thu Hà',
          school_name: 'THPT Chuyên Hà Nội - Amsterdam',
          subject_specialty: 'Ngữ văn THPT',
          avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
      {
        user_id: 'sample-teacher-5',
        role: 'member',
        profile: {
          id: 'sample-teacher-5',
          full_name: 'Thầy Vũ Đình Trọng',
          school_name: 'THPT Chu Văn An',
          subject_specialty: 'Văn học hiện đại',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
    ],
    resources: [
      {
        id: 'sr-3',
        resource_id: 'sample-p3',
        note: 'Phiếu học tập và trạm đọc hiểu văn bản Thơ hiện đại lớp 11',
        resource: {
          title: 'Hồ sơ dạy học Đọc hiểu Thơ ca cách mạng theo chiến thuật KWLH',
          subjects: ['Ngữ văn'],
          grade_levels: ['Lớp 11'],
        },
      },
    ],
  },
  {
    id: 'sample-group-toan',
    owner_id: 'sample-teacher-6',
    name: 'Tổ Toán THPT & Đổi mới Ma trận Đề thi ĐGNL',
    school_name: 'Cộng đồng Giáo viên Toán Quốc gia',
    subject: 'Toán',
    members: [
      {
        user_id: 'sample-teacher-6',
        role: 'owner',
        profile: {
          id: 'sample-teacher-6',
          full_name: 'Thầy Lê Văn Thành',
          school_name: 'THPT Chuyên Lam Sơn, Thanh Hóa',
          subject_specialty: 'Toán 12 & Giải tích',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
    ],
    resources: [],
  },
  {
    id: 'sample-group-ai',
    owner_id: 'sample-teacher-7',
    name: 'CLB Ứng dụng AI & Công nghệ số trong Dạy học',
    school_name: 'Mạng lưới Giáo viên Sáng tạo Việt Nam',
    subject: 'Liên môn',
    members: [
      {
        user_id: 'sample-teacher-7',
        role: 'owner',
        profile: {
          id: 'sample-teacher-7',
          full_name: 'Thầy Đỗ Minh Hoàng',
          school_name: 'THPT FPT Hà Nội',
          subject_specialty: 'Tin học & Trợ giảng AI',
          avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
          teacher_verified: true,
        },
      },
    ],
    resources: [],
  },
];

const SAMPLE_GROUP_POSTS: Record<string, GroupPost[]> = {
  'sample-group-stem': [
    {
      id: 'sgp-1',
      author_id: 'sample-teacher-1',
      body: 'Chào các thầy cô trong tổ KHTN! Em vừa tải lên bản dự thảo Kế hoạch bài dạy (KHBD) 5512 bài học STEM KHTN 8: "Chế tạo pin từ hoa quả & mạch điện một chiều". Nhờ các thầy cô xem qua phần "Tổ chức hoạt động học" ở Hoạt động 3 xem tiến trình học sinh tự lắp ráp mạch và ghi nhật ký thực nghiệm như vậy đã hợp lý chưa ạ?',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      author: {
        full_name: 'Thầy Nguyễn Văn An',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      replies: [
        {
          id: 'sgpr-1',
          author_id: 'sample-teacher-2',
          body: 'Thầy An thiết kế phần tiêu chí Rubric ở Phụ lục rất rõ ràng! Ở phần Hoạt động 3, nếu chia nhóm 4 bạn thì mỗi bạn nên phân công rõ: 1 bạn ghi chép, 1 bạn quan sát số liệu điện kế, 2 bạn thao tác dây nối để tránh việc các em làm hộ nhau thầy nhé.',
          created_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
          author: {
            full_name: 'Cô Lê Quỳnh Trang',
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          },
        },
        {
          id: 'sgpr-2',
          author_id: 'sample-teacher-3',
          body: 'Đồng ý với cô Trang. Thầy An có thể bổ sung thêm đường link mô phỏng PhET mạch điện DC để nhóm nào chưa kịp hoàn thành ở lớp có thể về nhà tiếp tục kiểm chứng số liệu!',
          created_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
          author: {
            full_name: 'Thầy Trần Minh Đức',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          },
        },
      ],
    },
    {
      id: 'sgp-2',
      author_id: 'sample-teacher-2',
      body: 'Tuần sau trường mình tổ chức chuyên đề cấp Cụm về "Đổi mới phương pháp kiểm tra đánh giá thường xuyên môn KHTN 7". Thầy cô nào có ma trận câu hỏi tình huống thực tế cho em xin tham khảo với ạ!',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      author: {
        full_name: 'Cô Lê Quỳnh Trang',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      },
      replies: [],
    },
  ],
  'sample-group-van': [
    {
      id: 'sgp-3',
      author_id: 'sample-teacher-4',
      body: 'Kính gửi các thầy cô trong cụm Chuyên Ngữ văn, em vừa cập nhật hệ thống phiếu đọc hiểu văn bản Thơ hiện đại lớp 11 bám sát yêu cầu cần đạt của Bộ. Kính mời thầy cô tải ở tab Học liệu chia sẻ và góp ý thêm ạ.',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      author: {
        full_name: 'Cô Hoàng Thu Hà',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      replies: [
        {
          id: 'sgpr-3',
          author_id: 'sample-teacher-5',
          body: 'Tài liệu biên soạn rất chỉn chu cô Hà ơi! Hệ thống câu hỏi phân hóa từ nhận biết đến vận dụng sáng tạo rất phù hợp cho học sinh trường chuyên.',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          author: {
            full_name: 'Thầy Vũ Đình Trọng',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          },
        },
      ],
    },
  ],
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
    if (!supabase || !currentUser) {
      if (!activeId) setActiveId(SAMPLE_TEACHER_GROUPS[0].id);
      return;
    }
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
      if (!activeId) {
        setActiveId(parsedGroups[0]?.id || SAMPLE_TEACHER_GROUPS[0].id);
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

  const allGroups = useMemo(() => {
    if (groups.length === 0) return SAMPLE_TEACHER_GROUPS;
    const userGroupIds = new Set(groups.map((g) => g.id));
    return [...groups, ...SAMPLE_TEACHER_GROUPS.filter((g) => !userGroupIds.has(g.id))];
  }, [groups]);

  const active = allGroups.find((item) => item.id === activeId) || allGroups[0] || null;

  // 3. Load posts for active group
  const loadPosts = async () => {
    if (!active) {
      setPosts([]);
      return;
    }
    if (SAMPLE_GROUP_POSTS[active.id]) {
      setPosts(SAMPLE_GROUP_POSTS[active.id]);
      return;
    }
    if (!supabase) {
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
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!active || !postBody.trim() || posting) return;

    if (active.id.startsWith('sample-group-')) {
      const newPost: GroupPost = {
        id: `local-post-${Date.now()}`,
        author_id: currentUser.id,
        body: postBody.trim(),
        created_at: new Date().toISOString(),
        author: {
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Tôi',
          avatar_url: currentUser.user_metadata?.avatar_url || null,
        },
        replies: [],
      };
      setPosts((prev) => [newPost, ...prev]);
      setPostBody('');
      onNotice('Đã đăng trao đổi vào nhóm.');
      return;
    }

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
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    const body = replyDrafts[postId]?.trim();
    if (!body) return;

    if (active?.id.startsWith('sample-group-')) {
      const newReply = {
        id: `local-reply-${Date.now()}`,
        author_id: currentUser.id,
        body,
        created_at: new Date().toISOString(),
        author: {
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Tôi',
          avatar_url: currentUser.user_metadata?.avatar_url || null,
        },
      };
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p))
      );
      setReplyDrafts((current) => ({ ...current, [postId]: '' }));
      onNotice('Đã gửi phản hồi cho đồng nghiệp.');
      return;
    }

    if (!supabase) return;

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

  // Friends not yet in current active group
  const friendsNotInGroup = active && currentUser
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
        <button
          className="button button-primary"
          onClick={() => (currentUser ? setShowCreateModal(true) : onRequireAuth())}
        >
          <Plus size={15} /> Tạo nhóm mới
        </button>
      </header>

      {/* Guest Mode Vibrant Banner */}
      {!currentUser && (
        <div className="groups-guest-banner">
          <div className="guest-banner-left">
            <span className="guest-sparkle-icon">
              <Sparkles size={20} />
            </span>
            <div>
              <b>Không gian sinh hoạt chuyên môn mở (Chế độ khám phá)</b>
              <p>
                Thầy cô đang xem mẫu các tổ chuyên môn theo Chương trình GDPT 2018 và Công văn 5512. Đăng nhập để cùng thảo luận, chia sẻ KHBD kín và tạo tổ bộ môn riêng.
              </p>
            </div>
          </div>
          <button className="button button-primary button-sm" onClick={onRequireAuth}>
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Main Groups Layout */}
      <div className={`groups-layout ${active ? 'has-active-group' : ''}`}>
        {/* Left Sidebar: Groups List */}
        <aside className="groups-sidebar">
          {currentUser && (
            <div className="groups-sidebar-section">
              <div className="groups-sidebar-header">
                <b>Nhóm của tôi ({groups.length})</b>
                <button
                  className="button-icon-mini"
                  onClick={() => setShowCreateModal(true)}
                  title="Tạo nhóm mới"
                >
                  <Plus size={14} />
                </button>
              </div>

              {groups.length > 0 ? (
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
                </div>
              ) : (
                <div className="groups-sidebar-empty-hint">
                  <small>Thầy cô chưa tạo nhóm riêng.</small>
                  <button className="button-link-mini" onClick={() => setShowCreateModal(true)}>
                    + Tạo nhóm
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="groups-sidebar-section">
            <div className="groups-sidebar-header">
              <b>Nhóm chuyên môn gợi ý ({SAMPLE_TEACHER_GROUPS.length})</b>
            </div>

            <div className="groups-list-container">
              {SAMPLE_TEACHER_GROUPS.map((group) => {
                const isActive = active?.id === group.id;
                return (
                  <button
                    key={group.id}
                    className={`group-nav-item sample-group-nav ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveId(group.id)}
                  >
                    <div className="group-nav-icon community">
                      <School size={16} />
                    </div>
                    <div className="group-nav-info">
                      <b>{group.name}</b>
                      <small>{group.school_name} · {group.subject}</small>
                    </div>
                    {isActive && <ChevronRight size={15} className="group-nav-arrow" />}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Content: Active Group Workspace */}
        {active ? (
          <article className="group-workspace">
            {/* Group Workspace Header */}
            <header className="group-workspace-header">
              <button
                className="button-back-mobile icon-button"
                onClick={() => setActiveId('')}
                aria-label="Quay lại danh sách nhóm"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="group-header-info">
                <span className="group-subject-badge">{active.subject}</span>
                <h3>{active.name}</h3>
                <p>
                  {active.school_name || 'Nhóm chuyên môn'} · {active.members.length} thành viên
                  {currentUser && active.owner_id === currentUser.id && ' · Bạn là trưởng nhóm'}
                </p>
              </div>

              <div className="group-workspace-actions">
                <button
                  className="button button-outline button-sm"
                  onClick={() => (currentUser ? setShowInviteModal(true) : onRequireAuth())}
                >
                  <UserPlus size={14} /> Mời thành viên
                </button>
                <button
                  className="button button-primary button-sm"
                  onClick={() => (currentUser ? setShowShareModal(true) : onRequireAuth())}
                >
                  <Share2 size={14} /> Chia sẻ học liệu
                </button>
                {currentUser && active.owner_id === currentUser.id && (
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
            {currentUser && active.owner_id === currentUser.id && friendsNotInGroup.length > 0 && (
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
                    onFocus={() => {
                      if (!currentUser) onRequireAuth();
                    }}
                    placeholder={
                      currentUser
                        ? 'Đặt câu hỏi nghiệp vụ, ghi chú nội dung buổi họp tổ hoặc chia sẻ kinh nghiệm giảng dạy…'
                        : 'Đăng nhập để tham gia trao đổi cùng các thầy cô trong tổ…'
                    }
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
                            onFocus={() => {
                              if (!currentUser) onRequireAuth();
                            }}
                            placeholder={
                              currentUser ? 'Gửi phản hồi cho đồng nghiệp…' : 'Đăng nhập để gửi phản hồi…'
                            }
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
                    onClick={() => (currentUser ? setShowShareModal(true) : onRequireAuth())}
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
                  {currentUser && active.owner_id === currentUser.id && (
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
                    const isMe = currentUser ? member.user_id === currentUser.id : false;
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
                          {currentUser && active.owner_id === currentUser.id && !isOwner && (
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
            <div className="unselected-icon-wrap">
              <UsersRound size={36} />
            </div>
            <h3>Chọn một nhóm chuyên môn</h3>
            <p>Chọn nhóm từ danh sách bên trái để xem kế hoạch bài dạy 5512, thảo luận và tài liệu nội bộ.</p>
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
