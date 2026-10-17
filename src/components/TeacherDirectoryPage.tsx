import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  MapPin, Search, ShieldCheck, UsersRound, MessageCircle, UserCheck,
  UserPlus, Check, Sparkles, Filter, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Teacher = {
  id: string;
  full_name: string;
  school_name: string | null;
  province: string | null;
  ward: string | null;
  show_school: boolean;
  show_location: boolean;
  subject_specialty: string | null;
  teaching_levels: string[] | null;
  years_experience: number | null;
  expertise_tags: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  teacher_verified: boolean;
};

export function TeacherDirectoryPage({
  currentUser,
  onOpenProfile,
  onOpenChatWithTeacher,
  onRequireAuth,
  onNotice,
}: {
  currentUser?: User | null;
  onOpenProfile: (id: string) => void;
  onOpenChatWithTeacher?: (id: string) => void;
  onRequireAuth?: () => void;
  onNotice: (message: string) => void;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());
  const [busyFollowId, setBusyFollowId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [province, setProvince] = useState('');
  const [filterFriendOnly, setFilterFriendOnly] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));

  const loadData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id,full_name,school_name,province,ward,show_school,show_location,subject_specialty,teaching_levels,years_experience,expertise_tags,avatar_url,bio,teacher_verified'
        )
        .order('full_name')
        .limit(250);

      if (error) throw error;

      setTeachers(
        ((data || []) as Teacher[]).map((teacher) => ({
          ...teacher,
          school_name: teacher.show_school ? teacher.school_name : null,
          province: teacher.show_location ? teacher.province : null,
          ward: teacher.show_location ? teacher.ward : null,
        }))
      );

      // If logged in, fetch follow relationships
      if (currentUser) {
        const [followingRes, followersRes] = await Promise.all([
          supabase.from('teacher_follows').select('followed_id').eq('follower_id', currentUser.id),
          supabase.from('teacher_follows').select('follower_id').eq('followed_id', currentUser.id),
        ]);

        setFollowingIds(new Set((followingRes.data || []).map((r) => r.followed_id)));
        setFollowerIds(new Set((followersRes.data || []).map((r) => r.follower_id)));
      }
    } catch (err: any) {
      onNotice(`Không tải được danh bạ giáo viên: ${err?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentUser?.id]);

  const toggleFollow = async (targetId: string, targetName: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (!supabase || busyFollowId) return;

    setBusyFollowId(targetId);
    const isCurrentlyFollowing = followingIds.has(targetId);
    const followsMe = followerIds.has(targetId);

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('teacher_follows')
          .delete()
          .eq('followed_id', targetId)
          .eq('follower_id', currentUser.id);

        if (error) throw error;

        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });

        if (followsMe) {
          onNotice(`Đã hủy kết bạn (bỏ theo dõi) với ${targetName}.`);
        } else {
          onNotice(`Đã bỏ theo dõi ${targetName}.`);
        }
      } else {
        const { error } = await supabase
          .from('teacher_follows')
          .insert({ followed_id: targetId, follower_id: currentUser.id });

        if (error) throw error;

        setFollowingIds((prev) => new Set([...prev, targetId]));

        if (followsMe) {
          onNotice(`🎉 Hai thầy cô đã trở thành Bạn bè trên EduHub! Giờ có thể nhắn tin riêng trực tiếp.`);
        } else {
          onNotice(`Đã theo dõi ${targetName}.`);
        }
      }
    } catch (err: any) {
      onNotice(err?.message || 'Không thể cập nhật theo dõi.');
    } finally {
      setBusyFollowId(null);
    }
  };

  const subjects = useMemo(
    () =>
      [...new Set(teachers.map((t) => t.subject_specialty).filter((item): item is string => Boolean(item)))].sort(
        (a, b) => a.localeCompare(b, 'vi')
      ),
    [teachers]
  );

  const provinces = useMemo(
    () =>
      [...new Set(teachers.map((t) => t.province).filter((item): item is string => Boolean(item)))].sort(
        (a, b) => a.localeCompare(b, 'vi')
      ),
    [teachers]
  );

  const filtered = useMemo(() => {
    return teachers.filter((teacher) => {
      const haystack = `${teacher.full_name} ${teacher.subject_specialty || ''} ${teacher.school_name || ''} ${teacher.province || ''} ${teacher.ward || ''} ${(teacher.expertise_tags || []).join(' ')} ${(teacher.teaching_levels || []).join(' ')}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .toLocaleLowerCase('vi');

      const matchesQuery =
        !query ||
        haystack.includes(
          query
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .toLocaleLowerCase('vi')
        );

      const matchesSubject = !subject || teacher.subject_specialty === subject;
      const matchesLevel = !level || (teacher.teaching_levels || []).includes(level);
      const matchesProvince = !province || teacher.province === province;

      const isMutualFriend = followingIds.has(teacher.id) && followerIds.has(teacher.id);
      const matchesFriends = !filterFriendOnly || isMutualFriend;

      return matchesQuery && matchesSubject && matchesLevel && matchesProvince && matchesFriends;
    });
  }, [teachers, query, subject, level, province, filterFriendOnly, followingIds, followerIds]);

  const clearFilters = () => {
    setQuery('');
    setSubject('');
    setLevel('');
    setProvince('');
    setFilterFriendOnly(false);
  };

  const hasActiveFilters = Boolean(query || subject || level || province || filterFriendOnly);

  return (
    <section className="teacher-directory-page">
      {/* Directory Hero */}
      <header className="directory-hero">
        <div className="directory-hero-content">
          <span className="directory-hero-icon">
            <UsersRound size={22} />
          </span>
          <div>
            <span className="section-kicker">MẠNG LƯỚI ĐỒNG NGHIỆP GDPT 2018</span>
            <h2>Danh bạ giáo viên toàn quốc</h2>
            <p>
              Tìm kiếm đồng nghiệp cùng chuyên môn, cùng cấp dạy hoặc địa bàn tỉnh thành để kết bạn và cùng trao đổi kinh nghiệm.
            </p>
          </div>
        </div>
        <div className="directory-hero-count">
          <b>{filtered.length}</b>
          <span>hồ sơ giáo viên</span>
        </div>
      </header>

      {/* Directory Filter Bar */}
      <div className="directory-filters-container">
        <div className="directory-search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên giáo viên, thế mạnh, trường học…"
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="directory-filter-selects">
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Tất cả chuyên môn</option>
            {subjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Mọi cấp học</option>
            {['Tiểu học', 'THCS', 'THPT', 'Mầm non'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={province} onChange={(e) => setProvince(e.target.value)}>
            <option value="">Mọi tỉnh thành</option>
            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {currentUser && (
            <button
              className={`directory-friend-filter-btn ${filterFriendOnly ? 'active' : ''}`}
              onClick={() => setFilterFriendOnly(!filterFriendOnly)}
              title="Chỉ hiển thị giáo viên là bạn bè"
            >
              <UserCheck size={14} />
              <span>Chỉ bạn bè ({followingIds.size ? [...followingIds].filter((id) => followerIds.has(id)).length : 0})</span>
            </button>
          )}

          {hasActiveFilters && (
            <button className="button button-quiet button-sm" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="directory-grid">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div className="directory-card-skeleton" key={item}>
              <span className="skeleton-avatar" />
              <div className="skeleton-lines">
                <i className="skeleton-line" />
                <i className="skeleton-line-sub" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length ? (
        <div className="directory-grid">
          {filtered.map((teacher) => {
            const isMe = currentUser?.id === teacher.id;
            const isFollowing = followingIds.has(teacher.id);
            const followsMe = followerIds.has(teacher.id);
            const isMutual = isFollowing && followsMe;

            return (
              <div className="directory-teacher-card" key={teacher.id}>
                <div
                  className="directory-card-main"
                  onClick={() => onOpenProfile(teacher.id)}
                  role="button"
                >
                  <div className="directory-avatar-wrap">
                    {teacher.avatar_url ? (
                      <img src={teacher.avatar_url} alt="" loading="lazy" />
                    ) : (
                      <span>{teacher.full_name.slice(-2).toUpperCase()}</span>
                    )}
                    {isMutual && (
                      <span className="directory-friend-badge" title="Bạn bè hai chiều">
                        <UserCheck size={12} />
                      </span>
                    )}
                  </div>

                  <div className="directory-teacher-copy">
                    <div className="directory-name-line">
                      <b>{teacher.full_name}</b>
                      {teacher.teacher_verified && (
                        <ShieldCheck
                          size={14}
                          className="text-teal-600 fill-teal-100"
                          title="Đã xác minh"
                        />
                      )}
                    </div>

                    <span className="directory-subject-pill">
                      {teacher.subject_specialty || 'Giáo viên'}
                    </span>

                    {(teacher.school_name || teacher.province) && (
                      <small className="directory-location">
                        <MapPin size={12} />
                        {[teacher.school_name, teacher.province].filter(Boolean).join(' · ')}
                      </small>
                    )}

                    {teacher.bio && <p className="directory-bio-snippet">{teacher.bio}</p>}

                    {teacher.expertise_tags && teacher.expertise_tags.length > 0 && (
                      <div className="directory-expertise-tags">
                        {teacher.expertise_tags.slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="directory-card-footer">
                  <span className="directory-exp-tag">
                    {teacher.years_experience ? `${teacher.years_experience} năm KN` : 'Thành viên'}
                  </span>

                  {!isMe && (
                    <div className="directory-actions-row">
                      {/* Follow / Friend Button */}
                      {isMutual ? (
                        <button
                          className="button button-friends button-xs"
                          onClick={() => toggleFollow(teacher.id, teacher.full_name)}
                          disabled={busyFollowId === teacher.id}
                          title="Hai bạn là bạn bè. Nhấn để hủy kết bạn"
                        >
                          <UserCheck size={13} />
                          <span>Bạn bè</span>
                        </button>
                      ) : followsMe && !isFollowing ? (
                        <button
                          className="button button-primary button-xs"
                          onClick={() => toggleFollow(teacher.id, teacher.full_name)}
                          disabled={busyFollowId === teacher.id}
                          title="Đồng nghiệp này đang theo dõi bạn"
                        >
                          <UserPlus size={13} />
                          <span>Theo dõi lại</span>
                        </button>
                      ) : isFollowing ? (
                        <button
                          className="button button-outline button-xs"
                          onClick={() => toggleFollow(teacher.id, teacher.full_name)}
                          disabled={busyFollowId === teacher.id}
                        >
                          <Check size={13} />
                          <span>Đang theo dõi</span>
                        </button>
                      ) : (
                        <button
                          className="button button-outline button-xs"
                          onClick={() => toggleFollow(teacher.id, teacher.full_name)}
                          disabled={busyFollowId === teacher.id}
                        >
                          <UserPlus size={13} />
                          <span>Theo dõi</span>
                        </button>
                      )}

                      {/* Direct Message Button */}
                      {onOpenChatWithTeacher && (
                        <button
                          className="button button-quiet button-xs"
                          onClick={() => onOpenChatWithTeacher(teacher.id)}
                          title="Nhắn tin riêng"
                        >
                          <MessageCircle size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={24} />
          </div>
          <h3>Không tìm thấy hồ sơ giáo viên phù hợp</h3>
          <p>Thử bỏ bớt bộ lọc môn học, cấp dạy hoặc tìm kiếm bằng từ khóa khác.</p>
          <button className="button button-primary" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        </div>
      )}
    </section>
  );
}
