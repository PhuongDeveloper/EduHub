import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft, MessageCircle, Search, Send, UserCheck, UserRound, Users,
  UsersRound, X, Sparkles, CheckCheck, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { InviteToGroupModal } from './InviteToGroupModal';

type Person = {
  id: string;
  full_name: string;
  school_name?: string | null;
  subject_specialty?: string | null;
  avatar_url?: string | null;
  teacher_verified?: boolean;
};

type Member = {
  conversation_id: string;
  user_id: string;
  profile?: Person | null;
};

type Message = {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  created_at: string;
  members: Member[];
  messages: Message[];
};

export function TeacherMessagesPage({
  currentUser,
  onRequireAuth,
  onNotice,
  initialTeacherId,
  onOpenProfile,
}: {
  currentUser: User | null;
  onRequireAuth: () => void;
  onNotice: (text: string) => void;
  initialTeacherId?: string | null;
  onOpenProfile?: (teacherId: string) => void;
}) {
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [friends, setFriends] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'friends'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load conversations
  const loadConversations = async () => {
    if (!supabase || !currentUser) return;
    try {
      const { data: own, error: ownError } = await supabase
        .from('teacher_conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (ownError) throw ownError;

      const ids = [...new Set((own || []).map((item) => item.conversation_id))];
      if (!ids.length) {
        setConversations([]);
        return;
      }

      const [conversationRows, memberRows, messageRows] = await Promise.all([
        supabase
          .from('teacher_conversations')
          .select('id,created_at')
          .in('id', ids)
          .order('created_at', { ascending: false }),
        supabase
          .from('teacher_conversation_members')
          .select('conversation_id,user_id,profile:profiles!teacher_conversation_members_user_id_fkey(id,full_name,school_name,subject_specialty,avatar_url,teacher_verified)')
          .in('conversation_id', ids),
        supabase
          .from('teacher_messages')
          .select('id,conversation_id,author_id,content,created_at')
          .in('conversation_id', ids)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (conversationRows.error) throw conversationRows.error;

      const rows: Conversation[] = (conversationRows.data || []).map((conversation) => ({
        ...conversation,
        members: ((memberRows.data || []) as unknown as Member[]).filter(
          (item) => item.conversation_id === conversation.id
        ),
        messages: ((messageRows.data || []) as Message[]).filter(
          (item) => item.conversation_id === conversation.id
        ),
      }));

      setConversations(rows);
      if (!activeId && rows[0] && !initialTeacherId) {
        setActiveId(rows[0].id);
      }
    } catch (err: any) {
      onNotice(err?.message || 'Không thể tải danh sách hội thoại.');
    }
  };

  // 2. Load teachers and mutual friends
  const loadTeachersAndFriends = async () => {
    if (!supabase || !currentUser) return;

    try {
      // Load all teachers
      const { data: allTeachers } = await supabase
        .from('profiles')
        .select('id,full_name,school_name,subject_specialty,avatar_url,teacher_verified')
        .neq('id', currentUser.id)
        .order('full_name')
        .limit(250);

      setTeachers((allTeachers || []) as Person[]);

      // Load mutual friends (TikTok style)
      const [followingRes, followersRes] = await Promise.all([
        supabase.from('teacher_follows').select('followed_id').eq('follower_id', currentUser.id),
        supabase.from('teacher_follows').select('follower_id').eq('followed_id', currentUser.id),
      ]);

      const followingSet = new Set((followingRes.data || []).map((r) => r.followed_id));
      const mutualIds = (followersRes.data || [])
        .map((r) => r.follower_id)
        .filter((id) => followingSet.has(id));

      if (mutualIds.length) {
        const { data: friendsData } = await supabase
          .from('profiles')
          .select('id,full_name,school_name,subject_specialty,avatar_url,teacher_verified')
          .in('id', mutualIds);

        setFriends((friendsData || []) as Person[]);
      } else {
        setFriends([]);
      }
    } catch {
      // Ignored non-fatal load
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      return;
    }
    void loadConversations();
    void loadTeachersAndFriends();
  }, [currentUser?.id]);

  // 3. Start or switch conversation
  const startConversation = async (teacher: Person) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!supabase) return;

    const existing = conversations.find((conversation) =>
      conversation.members.some((member) => member.user_id === teacher.id)
    );

    if (existing) {
      setActiveId(existing.id);
      setSearch('');
      return;
    }

    setBusy(true);
    try {
      const { data: conversation, error } = await supabase
        .from('teacher_conversations')
        .insert({ created_by: currentUser.id })
        .select('id')
        .single();

      if (error || !conversation) throw error || new Error('Không thể mở hội thoại.');

      const { error: memberError } = await supabase.from('teacher_conversation_members').insert([
        { conversation_id: conversation.id, user_id: currentUser.id, invited_by: currentUser.id },
        { conversation_id: conversation.id, user_id: teacher.id, invited_by: currentUser.id },
      ]);

      if (memberError) throw memberError;

      await loadConversations();
      setActiveId(conversation.id);
      setSearch('');
    } catch (err: any) {
      onNotice(err?.message || 'Không thể bắt đầu cuộc trò chuyện.');
    } finally {
      setBusy(false);
    }
  };

  // 4. Handle initialTeacherId (when clicking 'Nhắn tin' on a profile)
  useEffect(() => {
    if (!initialTeacherId || !currentUser || !supabase) return;

    const existing = conversations.find((c) =>
      c.members.some((m) => m.user_id === initialTeacherId)
    );

    if (existing) {
      setActiveId(existing.id);
    } else {
      // Find teacher in loaded list or fetch directly
      const known = teachers.find((t) => t.id === initialTeacherId) || friends.find((f) => f.id === initialTeacherId);
      if (known) {
        void startConversation(known);
      } else {
        supabase
          .from('profiles')
          .select('id,full_name,school_name,subject_specialty,avatar_url,teacher_verified')
          .eq('id', initialTeacherId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) void startConversation(data as Person);
          });
      }
    }
  }, [initialTeacherId, conversations.length, currentUser?.id]);

  const active = conversations.find((item) => item.id === activeId) || null;

  // 5. Load messages for active conversation
  const loadMessages = async (conversationId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('teacher_messages')
      .select('id,conversation_id,author_id,content,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      onNotice(error.message);
    } else {
      setMessages((data || []) as Message[]);
      setTimeout(scrollToBottom, 50);
    }
  };

  useEffect(() => {
    if (!activeId || !supabase) {
      setMessages([]);
      return;
    }

    void loadMessages(activeId);

    const channel = supabase
      .channel(`teacher-messages-${activeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teacher_messages', filter: `conversation_id=eq.${activeId}` },
        () => void loadMessages(activeId)
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [activeId]);

  // 6. Send message
  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!supabase || !active || !text.trim() || sending) return;

    setSending(true);
    const content = text.trim();
    setText('');

    const { error } = await supabase.from('teacher_messages').insert({
      conversation_id: active.id,
      author_id: currentUser.id,
      content,
    });

    setSending(false);
    if (error) {
      onNotice(error.message);
      setText(content); // restore text on failure
    } else {
      await loadMessages(active.id);
      void loadConversations(); // refresh snippet
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!currentUser) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <MessageCircle size={28} />
        </div>
        <h3>Trao đổi riêng với đồng nghiệp</h3>
        <p>Đăng nhập để gửi tin nhắn, trao đổi chuyên môn hoặc chia sẻ kinh nghiệm cùng thầy cô khác.</p>
        <button className="button button-primary" onClick={onRequireAuth}>
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const otherPerson = (conversation: Conversation): Person | undefined =>
    conversation.members.find((member) => member.user_id !== currentUser.id)?.profile || undefined;

  const activeOtherTeacher = active ? otherPerson(active) : undefined;
  const isFriendWithActive = Boolean(
    activeOtherTeacher && friends.some((f) => f.id === activeOtherTeacher.id)
  );

  // Search filter
  const searchResults = teachers
    .filter((t) =>
      `${t.full_name} ${t.school_name || ''} ${t.subject_specialty || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .slice(0, 8);

  const displayedConversations = conversations.filter((c) => {
    if (sidebarFilter === 'friends') {
      const other = otherPerson(c);
      return other && friends.some((f) => f.id === other.id);
    }
    return true;
  });

  return (
    <section className="teacher-messages-page">
      {/* Page Header */}
      <header className="messages-page-header">
        <div className="messages-header-brand">
          <span className="messages-brand-icon">
            <MessageCircle size={22} />
          </span>
          <div>
            <span className="section-kicker">MẠNG LƯỚI KẾT NỐI GIÁO VIÊN</span>
            <h2>Tin nhắn riêng</h2>
            <p>Không gian trao đổi nghiệp vụ kín đáo giữa các thầy cô giáo trên EduHub.</p>
          </div>
        </div>
      </header>

      {/* Main Messenger Layout */}
      <div className={`messages-layout ${activeId ? 'has-active-chat' : ''}`}>
        {/* Left Aside: Chat list & Search */}
        <aside className="messages-sidebar">
          {/* Search Box */}
          <div className="messages-search-wrap">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm đồng nghiệp để nhắn tin…"
            />
            {search && (
              <button className="search-clear-btn" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Search Results Dropdown */}
          {search && (
            <div className="messages-search-results">
              <span className="search-results-label">Gợi ý tìm kiếm ({searchResults.length})</span>
              {searchResults.map((t) => {
                const isFriend = friends.some((f) => f.id === t.id);
                return (
                  <button
                    key={t.id}
                    className="messages-search-item"
                    onClick={() => void startConversation(t)}
                    disabled={busy}
                  >
                    <div className="search-item-avatar">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.full_name} />
                      ) : (
                        <span>{t.full_name.slice(-2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="search-item-meta">
                      <b>{t.full_name}</b>
                      <small>
                        {t.subject_specialty || 'Giáo viên'} · {t.school_name || 'EduHub'}
                      </small>
                    </div>
                    {isFriend && (
                      <span className="tiktok-friend-tag" title="Bạn bè">
                        <UserCheck size={11} />
                      </span>
                    )}
                  </button>
                );
              })}
              {!searchResults.length && (
                <div className="search-results-empty">Không tìm thấy giáo viên nào.</div>
              )}
            </div>
          )}

          {/* Quick Friends Strip (TikTok Direct style) */}
          {friends.length > 0 && (
            <div className="messages-friends-strip">
              <div className="friends-strip-title">
                <Users size={13} />
                <span>Bạn bè đồng nghiệp ({friends.length})</span>
              </div>
              <div className="friends-strip-scroll">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    className="friends-strip-avatar-btn"
                    onClick={() => void startConversation(friend)}
                    title={`Nhắn tin với ${friend.full_name}`}
                  >
                    <div className="strip-avatar-wrap">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.full_name} />
                      ) : (
                        <span>{friend.full_name.slice(-2).toUpperCase()}</span>
                      )}
                      <span className="strip-friend-dot" />
                    </div>
                    <small>{friend.full_name.split(' ').slice(-1)[0]}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Tabs: All vs Friends */}
          <div className="messages-filter-tabs">
            <button
              className={`filter-tab-pill ${sidebarFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSidebarFilter('all')}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              className={`filter-tab-pill ${sidebarFilter === 'friends' ? 'active' : ''}`}
              onClick={() => setSidebarFilter('friends')}
            >
              Bạn bè ({conversations.filter((c) => {
                const o = otherPerson(c);
                return o && friends.some((f) => f.id === o.id);
              }).length})
            </button>
          </div>

          {/* Conversation List */}
          <div className="messages-conversation-list">
            {displayedConversations.map((conversation) => {
              const person = otherPerson(conversation);
              const latest = conversation.messages[0];
              const isActive = activeId === conversation.id;
              const isFriend = person && friends.some((f) => f.id === person.id);

              return (
                <button
                  key={conversation.id}
                  className={`message-conversation-row ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveId(conversation.id)}
                >
                  <div className="conversation-avatar">
                    {person?.avatar_url ? (
                      <img src={person.avatar_url} alt={person.full_name} />
                    ) : (
                      <span>{person?.full_name ? person.full_name.slice(-2).toUpperCase() : 'GV'}</span>
                    )}
                  </div>
                  <div className="conversation-text">
                    <div className="conversation-header-line">
                      <b>{person?.full_name || 'Đồng nghiệp'}</b>
                      {isFriend && (
                        <span className="tiktok-friend-tag-mini" title="Bạn bè">
                          <UserCheck size={10} /> Bạn bè
                        </span>
                      )}
                      {latest && (
                        <time>
                          {new Date(latest.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      )}
                    </div>
                    <p className="conversation-snippet">
                      {latest
                        ? (latest.author_id === currentUser.id ? 'Bạn: ' : '') + latest.content
                        : 'Bắt đầu cuộc trò chuyện…'}
                    </p>
                  </div>
                </button>
              );
            })}

            {!displayedConversations.length && (
              <div className="messages-empty-list">
                <MessageCircle size={32} className="empty-icon-subtle" />
                <p>
                  {sidebarFilter === 'friends'
                    ? 'Chưa có tin nhắn với bạn bè.'
                    : 'Chưa có hội thoại nào. Tìm đồng nghiệp ở thanh trên để bắt đầu.'}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Article: Chat Thread */}
        <article className="messages-thread-panel">
          {active && activeOtherTeacher ? (
            <>
              {/* Thread Header */}
              <header className="messages-thread-header">
                <button
                  className="button-back-mobile icon-button"
                  onClick={() => setActiveId('')}
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft size={18} />
                </button>

                <div
                  className="thread-partner-info"
                  onClick={() => onOpenProfile?.(activeOtherTeacher.id)}
                  role="button"
                  title="Nhấn để xem hồ sơ"
                >
                  <div className="thread-partner-avatar">
                    {activeOtherTeacher.avatar_url ? (
                      <img src={activeOtherTeacher.avatar_url} alt={activeOtherTeacher.full_name} />
                    ) : (
                      <span>{activeOtherTeacher.full_name.slice(-2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="thread-partner-name-row">
                      <b>{activeOtherTeacher.full_name}</b>
                      {isFriendWithActive && (
                        <span className="tiktok-friend-pill">
                          <UserCheck size={12} /> Bạn bè
                        </span>
                      )}
                    </div>
                    <small>
                      {activeOtherTeacher.subject_specialty || 'Giáo viên'}
                      {activeOtherTeacher.school_name ? ` · ${activeOtherTeacher.school_name}` : ''}
                    </small>
                  </div>
                </div>

                <div className="thread-header-actions">
                  <button
                    className="button button-outline button-sm"
                    onClick={() => setShowInviteModal(true)}
                    title="Mời đồng nghiệp vào nhóm chuyên môn"
                  >
                    <UsersRound size={14} />
                    <span className="hidden sm:inline">Mời vào nhóm</span>
                  </button>
                  <button
                    className="button button-quiet button-sm"
                    onClick={() => onOpenProfile?.(activeOtherTeacher.id)}
                    title="Xem trang cá nhân"
                  >
                    <UserRound size={14} />
                    <span className="hidden sm:inline">Hồ sơ</span>
                  </button>
                </div>
              </header>

              {/* Message Bubbles Container */}
              <div className="messages-scroll-area">
                {isFriendWithActive && (
                  <div className="messages-thread-intro">
                    <Sparkles size={16} className="text-teal-600" />
                    <span>
                      Hai thầy cô là <strong>Bạn bè</strong> của nhau trên EduHub. Hãy chia sẻ tài liệu và cùng trao đổi kinh nghiệm giảng dạy nhé!
                    </span>
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="messages-thread-empty">
                    <MessageCircle size={36} className="text-teal-600/30" />
                    <b>Bắt đầu cuộc trao đổi</b>
                    <p>Gửi lời chào hoặc đặt câu hỏi về bài giảng, phương pháp dạy học cho đồng nghiệp.</p>
                  </div>
                )}

                {messages.map((message) => {
                  const isMine = message.author_id === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`message-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                    >
                      {!isMine && (
                        <div className="message-bubble-avatar">
                          {activeOtherTeacher.avatar_url ? (
                            <img src={activeOtherTeacher.avatar_url} alt="" />
                          ) : (
                            <span>{activeOtherTeacher.full_name.slice(-2).toUpperCase()}</span>
                          )}
                        </div>
                      )}
                      <div className="message-bubble-content">
                        <p>{message.content}</p>
                        <time>
                          {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Input Form */}
              <form className="messages-composer-form" onSubmit={handleSend}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn… (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
                  rows={2}
                  maxLength={4000}
                />
                <button
                  type="submit"
                  className="button button-primary messages-send-btn"
                  disabled={sending || !text.trim()}
                  title="Gửi tin nhắn"
                >
                  <Send size={15} />
                  <span>{sending ? 'Đang gửi…' : 'Gửi'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="messages-unselected-state">
              <div className="unselected-icon-wrap">
                <MessageCircle size={36} />
              </div>
              <h3>Không gian kết nối sư phạm</h3>
              <p>Chọn đồng nghiệp từ danh sách bên trái hoặc tìm kiếm giáo viên bộ môn để bắt đầu trao đổi chuyên môn.</p>

              {teachers.length > 0 && (
                <div className="messages-suggested-colleagues">
                  <span className="suggested-heading">Gợi ý đồng nghiệp trong cộng đồng</span>
                  <div className="suggested-teachers-grid">
                    {teachers.slice(0, 4).map((t) => (
                      <div key={t.id} className="suggested-teacher-card">
                        <div className="suggested-avatar">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt={t.full_name} />
                          ) : (
                            <span>{t.full_name.slice(-2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="suggested-info">
                          <b>{t.full_name}</b>
                          <small>{t.subject_specialty || 'Giáo viên'}{t.school_name ? ` · ${t.school_name}` : ''}</small>
                        </div>
                        <button
                          className="button button-outline button-sm"
                          onClick={() => void startConversation(t)}
                          disabled={busy}
                        >
                          Nhắn tin
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </article>
      </div>

      {/* Invite To Group Modal inside Messages */}
      {showInviteModal && currentUser && activeOtherTeacher && (
        <InviteToGroupModal
          currentUser={currentUser}
          targetTeacher={{
            id: activeOtherTeacher.id,
            full_name: activeOtherTeacher.full_name,
            avatar_url: activeOtherTeacher.avatar_url,
            subject_specialty: activeOtherTeacher.subject_specialty,
            school_name: activeOtherTeacher.school_name,
          }}
          onClose={() => setShowInviteModal(false)}
          onNotice={onNotice}
        />
      )}
    </section>
  );
}
