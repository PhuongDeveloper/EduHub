import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Plus, School, Users, Check, X, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SUBJECT_NAMES } from '../lib/curriculum';

interface GroupInfo {
  id: string;
  name: string;
  school_name: string;
  subject: string;
  owner_id: string;
  isMember: boolean;
  memberCount: number;
}

interface InviteToGroupModalProps {
  currentUser: User;
  targetTeacher: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    subject_specialty?: string | null;
    school_name?: string | null;
  };
  onClose: () => void;
  onNotice: (message: string) => void;
  onNavToGroups?: () => void;
}

export function InviteToGroupModal({
  currentUser,
  targetTeacher,
  onClose,
  onNotice,
  onNavToGroups,
}: InviteToGroupModalProps) {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  
  // Create group form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState(`Tổ ${targetTeacher.subject_specialty || 'chuyên môn'}`);
  const [newGroupSchool, setNewGroupSchool] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState(targetTeacher.subject_specialty || SUBJECT_NAMES[0] || 'Toán');
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // 1. Fetch all groups where current user is a member/owner
      const { data: userGroupsData, error: userGroupsError } = await supabase
        .from('teacher_group_members')
        .select('group_id, role, group:teacher_groups!teacher_group_members_group_id_fkey(id, owner_id, name, school_name, subject)')
        .eq('user_id', currentUser.id);

      if (userGroupsError) throw userGroupsError;

      const groupRows = (userGroupsData || [])
        .map((row) => row.group)
        .filter(Boolean) as unknown as Array<{ id: string; owner_id: string; name: string; school_name: string; subject: string }>;

      const groupIds = groupRows.map((g) => g.id);

      if (!groupIds.length) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // 2. Check which of these groups the target teacher is already in
      const [targetMembersResult, allMembersResult] = await Promise.all([
        supabase
          .from('teacher_group_members')
          .select('group_id')
          .eq('user_id', targetTeacher.id)
          .in('group_id', groupIds),
        supabase
          .from('teacher_group_members')
          .select('group_id')
          .in('group_id', groupIds),
      ]);

      const targetGroupIds = new Set((targetMembersResult.data || []).map((row) => row.group_id));
      const memberCountMap: Record<string, number> = {};
      (allMembersResult.data || []).forEach((row) => {
        memberCountMap[row.group_id] = (memberCountMap[row.group_id] || 0) + 1;
      });

      const parsed: GroupInfo[] = groupRows.map((g) => ({
        id: g.id,
        name: g.name,
        school_name: g.school_name || 'Nhóm giáo viên',
        subject: g.subject,
        owner_id: g.owner_id,
        isMember: targetGroupIds.has(g.id),
        memberCount: memberCountMap[g.id] || 1,
      }));

      setGroups(parsed);
    } catch (err: any) {
      onNotice(err?.message || 'Không thể tải danh sách nhóm chuyên môn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, [currentUser.id, targetTeacher.id]);

  const handleInvite = async (groupId: string, groupName: string) => {
    if (!supabase) return;
    setInvitingId(groupId);

    try {
      const { error } = await supabase.from('teacher_group_members').insert({
        group_id: groupId,
        user_id: targetTeacher.id,
        role: 'member',
        added_by: currentUser.id,
      });

      if (error) {
        if (error.code === '23505') {
          onNotice(`Thầy cô ${targetTeacher.full_name} đã ở trong nhóm này rồi.`);
        } else {
          throw error;
        }
      } else {
        onNotice(`Đã thêm thầy cô ${targetTeacher.full_name} vào nhóm “${groupName}”.`);
        setGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g))
        );
      }
    } catch (err: any) {
      onNotice(err?.message || 'Không thể thêm thầy cô vào nhóm.');
    } finally {
      setInvitingId(null);
    }
  };

  const handleCreateGroupWithFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newGroupName.trim() || creating) return;

    setCreating(true);
    try {
      // 1. Create group
      const { data: newGroup, error: createError } = await supabase
        .from('teacher_groups')
        .insert({
          owner_id: currentUser.id,
          name: newGroupName.trim(),
          school_name: newGroupSchool.trim(),
          subject: newGroupSubject,
        })
        .select('id, name')
        .single();

      if (createError || !newGroup) throw createError || new Error('Không thể tạo nhóm.');

      // 2. Add target teacher to the newly created group
      const { error: inviteError } = await supabase.from('teacher_group_members').insert({
        group_id: newGroup.id,
        user_id: targetTeacher.id,
        role: 'member',
        added_by: currentUser.id,
      });

      if (inviteError) {
        onNotice(`Đã tạo nhóm “${newGroup.name}” nhưng chưa thêm được thầy cô: ${inviteError.message}`);
      } else {
        onNotice(`Đã tạo nhóm “${newGroup.name}” và thêm thầy cô ${targetTeacher.full_name} vào nhóm.`);
      }

      setShowCreateForm(false);
      await loadGroups();
    } catch (err: any) {
      onNotice(err?.message || 'Lỗi khi tạo nhóm mới.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="invite-group-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="invite-modal-header">
          <div className="invite-modal-title-wrap">
            <span className="invite-modal-icon">
              <Users size={20} />
            </span>
            <div>
              <h3>Mời vào nhóm chuyên môn</h3>
              <p>
                Thêm đồng nghiệp <strong>{targetTeacher.full_name}</strong> vào không gian sinh hoạt và chia sẻ học liệu.
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>

        <div className="invite-teacher-summary">
          <div className="invite-teacher-avatar">
            {targetTeacher.avatar_url ? (
              <img src={targetTeacher.avatar_url} alt={targetTeacher.full_name} />
            ) : (
              <span>{targetTeacher.full_name.slice(-2).toUpperCase()}</span>
            )}
          </div>
          <div className="invite-teacher-meta">
            <b>{targetTeacher.full_name}</b>
            <small>
              {targetTeacher.subject_specialty || 'Giáo viên'}
              {targetTeacher.school_name ? ` · ${targetTeacher.school_name}` : ''}
            </small>
          </div>
        </div>

        <div className="invite-modal-body">
          {loading ? (
            <div className="invite-loading-state">
              <span className="button-spinner" /> Đang tải danh sách nhóm của bạn...
            </div>
          ) : (
            <div className="invite-group-list">
              <div className="invite-section-title">
                <span>Nhóm của bạn ({groups.length})</span>
                {!showCreateForm && (
                  <button
                    type="button"
                    className="button-link-accent"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus size={14} /> Tạo nhóm mới
                  </button>
                )}
              </div>

              {groups.length === 0 && !showCreateForm ? (
                <div className="invite-empty-groups">
                  <School size={28} className="empty-icon-subtle" />
                  <p>Thầy cô chưa có nhóm chuyên môn nào.</p>
                  <button
                    className="button button-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus size={15} /> Tạo nhóm đầu tiên cùng đồng nghiệp
                  </button>
                </div>
              ) : (
                groups.map((group) => {
                  const isOwner = group.owner_id === currentUser.id;
                  return (
                    <div className="invite-group-row" key={group.id}>
                      <div className="invite-group-info">
                        <span className="invite-group-badge">{group.subject}</span>
                        <div>
                          <b>{group.name}</b>
                          <small>
                            {group.school_name} · {group.memberCount} thành viên
                            {isOwner && ' · Quản trị viên'}
                          </small>
                        </div>
                      </div>

                      <div className="invite-group-action">
                        {group.isMember ? (
                          <span className="invite-status-joined">
                            <Check size={14} /> Đã tham gia
                          </span>
                        ) : isOwner ? (
                          <button
                            className="button button-outline button-sm"
                            disabled={invitingId === group.id}
                            onClick={() => handleInvite(group.id, group.name)}
                          >
                            <UserPlus size={14} />
                            {invitingId === group.id ? 'Đang thêm...' : 'Thêm vào nhóm'}
                          </button>
                        ) : (
                          <span className="invite-status-restricted" title="Chỉ trưởng nhóm mới có quyền thêm thành viên">
                            Chỉ trưởng nhóm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {showCreateForm && (
                <form className="invite-create-group-card" onSubmit={handleCreateGroupWithFriend}>
                  <div className="invite-create-header">
                    <Sparkles size={16} className="text-teal-600" />
                    <b>Tạo nhóm kín mới</b>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShowCreateForm(false)}
                      aria-label="Hủy tạo nhóm"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Tên nhóm chuyên môn</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="VD: Tổ KHTN - Trường THCS Chu Văn An"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>Môn chuyên môn</label>
                      <select
                        value={newGroupSubject}
                        onChange={(e) => setNewGroupSubject(e.target.value)}
                      >
                        {SUBJECT_NAMES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Trường / Đơn vị</label>
                      <input
                        type="text"
                        value={newGroupSchool}
                        onChange={(e) => setNewGroupSchool(e.target.value)}
                        placeholder="VD: THCS Chu Văn An"
                        maxLength={120}
                      />
                    </div>
                  </div>
                  <div className="invite-create-actions">
                    <button
                      type="button"
                      className="button button-quiet"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={creating || !newGroupName.trim()}
                    >
                      <Plus size={15} />
                      {creating ? 'Đang tạo...' : 'Tạo nhóm & thêm bạn'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <footer className="invite-modal-footer">
          <p className="invite-footer-tip">
            💡 Thành viên trong nhóm có thể trao đổi kín, chia sẻ kế hoạch bài dạy và đóng góp tư liệu chuyên môn.
          </p>
          <div className="invite-footer-btns">
            {onNavToGroups && (
              <button
                type="button"
                className="button button-quiet button-sm"
                onClick={() => {
                  onClose();
                  onNavToGroups();
                }}
              >
                Mở trang Nhóm chuyên môn →
              </button>
            )}
            <button type="button" className="button button-outline button-sm" onClick={onClose}>
              Đóng
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
