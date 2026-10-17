import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { MessageCircle, ShieldCheck, UserCheck, UserMinus, Users, X, Search, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface FriendTeacher {
  id: string;
  full_name: string;
  school_name: string | null;
  subject_specialty: string | null;
  avatar_url: string | null;
  teacher_verified: boolean;
  edu_points?: number;
}

interface FriendsListModalProps {
  userId: string;
  userName: string;
  currentUser: User | null;
  onClose: () => void;
  onOpenProfile: (id: string) => void;
  onOpenChatWithTeacher?: (id: string) => void;
  onNotice: (msg: string) => void;
  onFriendshipChanged?: () => void;
}

export function FriendsListModal({
  userId,
  userName,
  currentUser,
  onClose,
  onOpenProfile,
  onOpenChatWithTeacher,
  onNotice,
  onFriendshipChanged,
}: FriendsListModalProps) {
  const [friends, setFriends] = useState<FriendTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unfriendingId, setUnfriendingId] = useState<string | null>(null);

  const isOwner = currentUser?.id === userId;

  const loadFriends = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // 1. Get all users that `userId` follows
      const { data: followingRows, error: followingError } = await supabase
        .from('teacher_follows')
        .select('followed_id')
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      const followedIds = new Set((followingRows || []).map((r) => r.followed_id));

      if (followedIds.size === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // 2. Get all users who follow `userId`
      const { data: followerRows, error: followerError } = await supabase
        .from('teacher_follows')
        .select('follower_id')
        .eq('followed_id', userId);

      if (followerError) throw followerError;

      // 3. Mutual follow intersection = Friends!
      const mutualIds = (followerRows || [])
        .map((r) => r.follower_id)
        .filter((id) => followedIds.has(id));

      if (mutualIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // 4. Fetch profiles for these mutual friends
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, school_name, subject_specialty, avatar_url, teacher_verified, edu_points')
        .in('id', mutualIds)
        .order('full_name', { ascending: true });

      if (profileError) throw profileError;

      setFriends((profiles || []) as FriendTeacher[]);
    } catch (err: any) {
      onNotice(err?.message || 'Không thể tải danh sách bạn bè.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFriends();
  }, [userId]);

  const handleUnfriend = async (friendId: string, friendName: string) => {
    if (!supabase || !currentUser) return;
    if (!window.confirm(`Hủy kết bạn với thầy cô ${friendName}? (Thầy cô sẽ bỏ theo dõi đồng nghiệp này).`)) return;

    setUnfriendingId(friendId);
    try {
      const { error } = await supabase
        .from('teacher_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('followed_id', friendId);

      if (error) throw error;

      onNotice(`Đã hủy kết bạn với ${friendName}.`);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      onFriendshipChanged?.();
    } catch (err: any) {
      onNotice(err?.message || 'Không thể hủy kết bạn.');
    } finally {
      setUnfriendingId(null);
    }
  };

  const filtered = friends.filter((f) =>
    `${f.full_name} ${f.school_name || ''} ${f.subject_specialty || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="friends-list-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="friends-modal-header">
          <div className="friends-modal-title">
            <span className="friends-modal-badge-icon">
              <Users size={18} />
            </span>
            <div>
              <h3>Bạn bè của {isOwner ? 'bạn' : userName}</h3>
              <p>Những đồng nghiệp cùng theo dõi lẫn nhau trên EduHub ({friends.length})</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>

        <div className="friends-search-box">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bạn bè, trường, môn..."
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="friends-modal-list">
          {loading ? (
            <div className="friends-loading-state">
              <span className="button-spinner" /> Đang tải danh sách bạn bè...
            </div>
          ) : filtered.length === 0 ? (
            <div className="friends-empty-state">
              <Sparkles size={28} className="empty-sparkle" />
              <b>{search ? 'Không tìm thấy bạn bè nào khớp từ khóa' : 'Chưa có bạn bè nào'}</b>
              <p>
                {isOwner
                  ? 'Khi thầy cô và đồng nghiệp khác cùng theo dõi nhau (follow chéo), hai người sẽ trở thành Bạn bè như trên TikTok.'
                  : `${userName} chưa có bạn bè kết nối hai chiều.`}
              </p>
            </div>
          ) : (
            filtered.map((friend) => (
              <div className="friend-row-card" key={friend.id}>
                <div
                  className="friend-row-avatar-link"
                  onClick={() => {
                    onClose();
                    onOpenProfile(friend.id);
                  }}
                >
                  <div className="friend-avatar">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.full_name} />
                    ) : (
                      <span>{friend.full_name.slice(-2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="friend-meta">
                    <div className="friend-name-row">
                      <b>{friend.full_name}</b>
                      {friend.teacher_verified && (
                        <ShieldCheck size={14} className="text-teal-600 fill-teal-100" />
                      )}
                      <span className="tiktok-friend-pill">
                        <UserCheck size={12} /> Bạn bè
                      </span>
                    </div>
                    <small>
                      {friend.subject_specialty || 'Giáo viên'}
                      {friend.school_name ? ` · ${friend.school_name}` : ''}
                    </small>
                  </div>
                </div>

                <div className="friend-actions">
                  {onOpenChatWithTeacher && currentUser?.id !== friend.id && (
                    <button
                      className="button button-primary button-sm"
                      onClick={() => {
                        onClose();
                        onOpenChatWithTeacher(friend.id);
                      }}
                      title="Nhắn tin với bạn bè"
                    >
                      <MessageCircle size={14} />
                      <span className="hidden sm:inline">Nhắn tin</span>
                    </button>
                  )}

                  {isOwner && (
                    <button
                      className="button button-quiet button-sm friend-unfriend-btn"
                      disabled={unfriendingId === friend.id}
                      onClick={() => handleUnfriend(friend.id, friend.full_name)}
                      title="Hủy kết bạn (bỏ theo dõi)"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="friends-modal-footer">
          <small>
            ✨ Hai giáo viên cùng theo dõi nhau sẽ tự động trở thành bạn bè và có thể nhắn tin riêng trực tiếp.
          </small>
        </footer>
      </div>
    </div>
  );
}
