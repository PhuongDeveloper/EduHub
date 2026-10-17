import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowDown, ArrowUp, BookOpen, Copy, Download, FileText, Globe2, LockKeyhole, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GRADE_LABELS, SUBJECT_NAMES } from '../lib/curriculum';

type PlanItem = { id: string; plan_id: string; resource_id: string | null; custom_title: string; activity: string; duration_minutes: number; position: number };
type PlanCollaborator = { id?: string; user_id: string; role: 'viewer' | 'editor'; profile?: { full_name?: string } | null };
type Plan = { id: string; author_id: string; title: string; subject: string; grade_level: string; duration_minutes: number; objectives: string; prep_notes: string; is_public: boolean; updated_at: string; items: PlanItem[]; author?: { full_name?: string } | null; collaborators?: PlanCollaborator[] };
type TeacherOption = { id: string; full_name: string; subject_specialty: string | null };
type ResourceOption = { id: string; sourceId?: string; title: string; subject: string; grade: string; teacher: string };

export function LessonPlannerPage({ currentUser, projects, onRequireAuth, onNotice }: { currentUser: User | null; projects: ResourceOption[]; onRequireAuth: () => void; onNotice: (message: string) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeId, setActiveId] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [duration, setDuration] = useState(45);
  const [objectives, setObjectives] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [resourceToAdd, setResourceToAdd] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [inviteTeacherId, setInviteTeacherId] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);

  const load = async () => {
    if (!supabase) return;
    let request = supabase.from('lesson_plans').select('id,author_id,title,subject,grade_level,duration_minutes,objectives,prep_notes,is_public,updated_at,author:profiles!lesson_plans_author_id_fkey(full_name)').order('updated_at', { ascending: false }).limit(60);
    if (!currentUser) request = request.eq('is_public', true);
    const { data, error } = await request;
    if (error) { onNotice(`Không tải được kế hoạch tiết dạy: ${error.message}`); return; }
    const rows = (data || []) as unknown as Plan[];
    const ids = rows.map((row) => row.id);
    const { data: items, error: itemError } = ids.length ? await supabase.from('lesson_plan_items').select('id,plan_id,resource_id,custom_title,activity,duration_minutes,position').in('plan_id', ids).order('position') : { data: [], error: null };
    if (itemError) { onNotice(`Không tải được hoạt động trong kế hoạch: ${itemError.message}`); return; }
    let collaborators: PlanCollaborator[] = [];
    if (currentUser && ids.length) {
      const { data: collaboratorRows, error: collaboratorError } = await supabase.from('lesson_plan_collaborators').select('id,plan_id,user_id,role,profile:profiles!lesson_plan_collaborators_user_id_fkey(full_name)').in('plan_id', ids);
      if (collaboratorError) { onNotice(`Không tải được danh sách cộng tác viên: ${collaboratorError.message}`); return; }
      collaborators = (collaboratorRows || []) as unknown as Array<PlanCollaborator & { plan_id: string }>;
    }
    setPlans(rows.map((row) => ({ ...row, items: ((items || []) as PlanItem[]).filter((item) => item.plan_id === row.id), collaborators: collaborators.filter((item) => (item as PlanCollaborator & { plan_id?: string }).plan_id === row.id) })));
  };
  useEffect(() => { void load(); }, [currentUser?.id]);

  const activePlan = plans.find((plan) => plan.id === activeId) || null;
  const isPlanOwner = Boolean(currentUser && activePlan?.author_id === currentUser.id);
  const myRole = activePlan?.collaborators?.find((item) => item.user_id === currentUser?.id)?.role;
  const editable = Boolean(isPlanOwner || myRole === 'editor');
  const resources = useMemo(() => projects.filter((project) => !activePlan || project.subject === activePlan.subject || project.grade.includes(activePlan.grade_level)), [activePlan, projects]);
  useEffect(() => {
    if (!activePlan) return;
    setTitle(activePlan.title); setSubject(activePlan.subject); setGrade(activePlan.grade_level); setDuration(activePlan.duration_minutes); setObjectives(activePlan.objectives || ''); setPrepNotes(activePlan.prep_notes || ''); setIsPublic(activePlan.is_public);
  }, [activeId]);
  useEffect(() => {
    if (!supabase || !currentUser || !isPlanOwner) { setTeacherOptions([]); return; }
    void supabase.from('profiles').select('id,full_name,subject_specialty').neq('id', currentUser.id).order('full_name').limit(200)
      .then(({ data, error }) => { if (error) onNotice(`Không tải được danh sách giáo viên: ${error.message}`); else setTeacherOptions((data || []) as TeacherOption[]); });
  }, [currentUser?.id, activeId, isPlanOwner]);

  const createPlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !title.trim() || !subject || !grade) return;
    setBusy(true);
    const { data, error } = await supabase.from('lesson_plans').insert({ author_id: currentUser.id, title: title.trim(), subject, grade_level: grade, duration_minutes: duration, objectives, prep_notes: prepNotes, is_public: isPublic }).select('id,author_id,title,subject,grade_level,duration_minutes,objectives,prep_notes,is_public,updated_at').single();
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    onNotice('Đã tạo kế hoạch tiết dạy.'); await load(); setActiveId(data.id);
  };
  const savePlan = async () => {
    if (!supabase || !activePlan || !editable) return;
    setBusy(true);
    const { error } = await supabase.from('lesson_plans').update({ title: title.trim(), subject, grade_level: grade, duration_minutes: duration, objectives: objectives.trim(), prep_notes: prepNotes.trim(), is_public: isPublic, updated_at: new Date().toISOString() }).eq('id', activePlan.id);
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    onNotice('Đã lưu kế hoạch.'); await load();
  };
  const addActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !activePlan || !editable || !resourceToAdd) return;
    const resource = projects.find((item) => (item.sourceId || item.id) === resourceToAdd);
    if (!resource) return;
    const { error } = await supabase.from('lesson_plan_items').insert({ plan_id: activePlan.id, resource_id: resourceToAdd, custom_title: resource.title, activity: '', duration_minutes: 10, position: activePlan.items.length + 1 });
    if (error) { onNotice(error.message); return; }
    setResourceToAdd(''); await load();
  };
  const addCustomActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !activePlan || !editable || !customTitle.trim()) return;
    const { error } = await supabase.from('lesson_plan_items').insert({ plan_id: activePlan.id, custom_title: customTitle.trim(), activity: '', duration_minutes: 10, position: activePlan.items.length + 1 });
    if (error) { onNotice(error.message); return; }
    setCustomTitle(''); await load();
  };
  const updateItem = async (item: PlanItem, patch: Partial<PlanItem>) => {
    if (!supabase || !editable) return;
    const { error } = await supabase.from('lesson_plan_items').update(patch).eq('id', item.id);
    if (error) { onNotice(error.message); return; }
    setPlans((current) => current.map((plan) => plan.id === activePlan?.id ? { ...plan, items: plan.items.map((entry) => entry.id === item.id ? { ...entry, ...patch } : entry) } : plan));
  };
  const removeItem = async (item: PlanItem) => {
    if (!supabase || !editable) return;
    const { error } = await supabase.from('lesson_plan_items').delete().eq('id', item.id);
    if (error) { onNotice(error.message); return; }
    await load();
  };
  const moveItem = async (index: number, offset: -1 | 1) => {
    if (!supabase || !activePlan || !editable) return;
    const other = index + offset;
    if (other < 0 || other >= activePlan.items.length) return;
    const ordered = [...activePlan.items]; [ordered[index], ordered[other]] = [ordered[other], ordered[index]];
    const results = await Promise.all(ordered.map((item, position) => supabase.from('lesson_plan_items').update({ position }).eq('id', item.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) { onNotice(failed.error.message); return; }
    await load();
  };
  const copyPlan = async (plan: Plan) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase) return;
    const { data, error } = await supabase.from('lesson_plans').insert({ author_id: currentUser.id, title: `${plan.title} · Bản sao`, subject: plan.subject, grade_level: plan.grade_level, duration_minutes: plan.duration_minutes, objectives: plan.objectives, prep_notes: plan.prep_notes, is_public: false }).select('id').single();
    if (error) { onNotice(error.message); return; }
    if (plan.items.length) {
      const { error: copyError } = await supabase.from('lesson_plan_items').insert(plan.items.map((item, position) => ({ plan_id: data.id, resource_id: item.resource_id, custom_title: item.custom_title, activity: item.activity, duration_minutes: item.duration_minutes, position })));
      if (copyError) onNotice(copyError.message);
    }
    await load(); setActiveId(data.id); onNotice('Đã sao chép kế hoạch vào không gian riêng của thầy cô.');
  };
  const inviteCollaborator = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !currentUser || !activePlan || !isPlanOwner || !inviteTeacherId) return;
    const { error } = await supabase.from('lesson_plan_collaborators').insert({ plan_id: activePlan.id, user_id: inviteTeacherId, invited_by: currentUser.id, role: inviteRole });
    if (error) { onNotice(error.code === '23505' ? 'Giáo viên này đã được mời vào kế hoạch.' : `Không mời được cộng tác viên: ${error.message}`); return; }
    setInviteTeacherId(''); onNotice('Đã chia sẻ kế hoạch với đồng nghiệp.'); await load();
  };
  const removeCollaborator = async (userId: string) => {
    if (!supabase || !activePlan || !isPlanOwner) return;
    const { error } = await supabase.from('lesson_plan_collaborators').delete().eq('plan_id', activePlan.id).eq('user_id', userId);
    if (error) onNotice(error.message); else { onNotice('Đã gỡ quyền cộng tác.'); await load(); }
  };
  const exportWordDocument = (plan: Plan) => {
    const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
    const activities = plan.items.map((item, index) => `<tr><td>${index + 1}</td><td><b>${escape(item.custom_title)}</b><br>${escape(item.activity || '')}</td><td>${item.duration_minutes} phút</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(plan.title)}</title><style>body{font-family:Arial,sans-serif;color:#26352b}h1{text-align:center}h2{border-bottom:1px solid #cad7ca;padding-bottom:6px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbc7bb;padding:8px;vertical-align:top}th{background:#e8efe6}p{line-height:1.6}</style></head><body><h1>${escape(plan.title)}</h1><p><b>Môn:</b> ${escape(plan.subject)} &nbsp; <b>Khối:</b> ${escape(plan.grade_level)} &nbsp; <b>Thời lượng:</b> ${plan.duration_minutes} phút</p><h2>Mục tiêu bài học</h2><p>${escape(plan.objectives || 'Chưa ghi mục tiêu')}</p><h2>Chuẩn bị</h2><p>${escape(plan.prep_notes || 'Chưa ghi chú')}</p><h2>Tiến trình dạy học</h2><table><thead><tr><th>STT</th><th>Hoạt động và cách tổ chức</th><th>Thời lượng</th></tr></thead><tbody>${activities}</tbody></table><p>Xuất từ EduHub · ${new Date().toLocaleDateString('vi-VN')}</p></body></html>`;
    const url = URL.createObjectURL(new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${plan.title.replace(/[^\p{L}\p{N}-]+/gu, '-').slice(0, 80) || 'ke-hoach-day-hoc'}.doc`; anchor.click(); URL.revokeObjectURL(url);
    onNotice('Đã xuất giáo án Word có thể chỉnh sửa trong Microsoft Word.');
  };

  return <section className="lesson-planner-page">
    <header className="lesson-planner-hero"><span className="lesson-planner-icon"><FileText size={22} /></span><div><span className="section-kicker">XÂY DỰNG MỘT TIẾT DẠY CÓ CHỦ ĐÍCH</span><h2>Kế hoạch tiết dạy</h2><p>Ghép mục tiêu, thời lượng và học liệu thành một trình tự có thể dùng lại hoặc chia sẻ với đồng nghiệp.</p></div></header>
    {!currentUser && <div className="planner-signin"><LockKeyhole size={16} /> Đăng nhập để tạo và lưu kế hoạch riêng. Thầy cô vẫn có thể xem các kế hoạch được chia sẻ.</div>}
    <div className="lesson-planner-layout"><aside className="lesson-plan-list"><div className="lesson-plan-list-heading"><b>Kế hoạch cộng đồng</b><span>{plans.length}</span></div>{plans.map((plan) => <button className={`lesson-plan-list-item${activeId === plan.id ? ' active' : ''}`} key={plan.id} onClick={() => setActiveId(plan.id)}><span><b>{plan.title}</b><small>{plan.subject} · {plan.grade_level}</small></span>{plan.is_public ? <Globe2 size={13} /> : <LockKeyhole size={13} />}</button>)}{plans.length === 0 && <p className="planner-empty-note">Chưa có kế hoạch công khai.</p>}</aside>
      <div className="lesson-plan-workspace">{activePlan ? <>
        <div className="lesson-plan-editor-heading"><div><span className="section-kicker">{editable ? 'KẾ HOẠCH CỦA THẦY CÔ' : `CHIA SẺ BỞI ${activePlan.author?.full_name || 'GIÁO VIÊN'}`}</span><h3>{activePlan.title}</h3></div><div className="lesson-plan-actions">{!editable && <button className="button button-outline" onClick={() => void copyPlan(activePlan)}><Copy size={14} /> Sao chép</button>}<button className="button button-outline" onClick={() => exportWordDocument(activePlan)}><Download size={14} /> Tải Word</button><button className="button button-outline" onClick={() => window.print()}><Printer size={14} /> In</button>{editable && <button className="button button-primary" onClick={() => void savePlan()} disabled={busy}><Save size={14} /> Lưu</button>}</div></div>
        <div className="lesson-plan-fields"><label>Tên kế hoạch<input value={title} onChange={(event) => setTitle(event.target.value)} disabled={!editable} /></label><div className="form-two-col"><label>Môn<select value={subject} onChange={(event) => setSubject(event.target.value)} disabled={!editable}>{SUBJECT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></label><label>Khối<select value={grade} onChange={(event) => setGrade(event.target.value)} disabled={!editable}>{GRADE_LABELS.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Thời lượng (phút)<input type="number" min={10} max={240} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} disabled={!editable} /></label><label>Mục tiêu bài học<textarea value={objectives} onChange={(event) => setObjectives(event.target.value)} rows={2} disabled={!editable} placeholder="Sau tiết học, học sinh có thể…" /></label><label>Chuẩn bị trước giờ dạy<textarea value={prepNotes} onChange={(event) => setPrepNotes(event.target.value)} rows={2} disabled={!editable} placeholder="Thiết bị, học liệu cần chuẩn bị…" /></label><label className="plan-public-toggle"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} disabled={!editable} /> Chia sẻ công khai với giáo viên khác</label></div>
        {isPlanOwner && <section className="plan-collaboration"><div><span className="section-kicker">CÙNG SOẠN GIÁO ÁN</span><b>Mời đồng nghiệp cộng tác</b><small>Người xem chỉ đọc; người biên soạn có thể sửa mục tiêu và hoạt động.</small></div><form onSubmit={inviteCollaborator}><select value={inviteTeacherId} onChange={(event) => setInviteTeacherId(event.target.value)} required><option value="">Chọn giáo viên</option>{teacherOptions.filter((teacher) => !activePlan.collaborators?.some((item) => item.user_id === teacher.id)).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}{teacher.subject_specialty ? ` · ${teacher.subject_specialty}` : ''}</option>)}</select><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'viewer' | 'editor')}><option value="viewer">Chỉ xem</option><option value="editor">Cùng biên soạn</option></select><button className="button button-outline" disabled={!inviteTeacherId}><Plus size={13} /> Mời</button></form>{Boolean(activePlan.collaborators?.length) && <div className="plan-collaborator-list">{activePlan.collaborators?.map((item) => <span key={item.user_id}><b>{item.profile?.full_name || 'Giáo viên'}</b><small>{item.role === 'editor' ? 'Cùng biên soạn' : 'Chỉ xem'}</small><button onClick={() => void removeCollaborator(item.user_id)} aria-label="Gỡ cộng tác viên"><Trash2 size={12} /></button></span>)}</div>}</section>}{!isPlanOwner && myRole && <div className="plan-collaborator-banner"><BookOpen size={14} /> {myRole === 'editor' ? 'Thầy cô được mời cùng biên soạn kế hoạch này.' : 'Thầy cô được chia sẻ quyền xem kế hoạch này.'}</div>}
<div className="lesson-activities-heading"><div><span className="section-kicker">TIẾN TRÌNH TRÊN LỚP</span><h4>Hoạt động & học liệu</h4></div><span>{activePlan.items.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0)} phút · {activePlan.items.length} hoạt động</span></div>
        <div className="lesson-activity-list">{activePlan.items.map((item, index) => <article className="lesson-activity" key={item.id}><div className="lesson-activity-index">{String(index + 1).padStart(2, '0')}</div><div className="lesson-activity-body"><b>{item.custom_title}</b><textarea defaultValue={item.activity} onBlur={(event) => { if (event.target.value !== item.activity) void updateItem(item, { activity: event.target.value }); }} disabled={!editable} placeholder="Ghi cách tổ chức hoạt động hoặc mục đích sử dụng học liệu…" rows={2} /><div>{item.resource_id && <small><BookOpen size={11} /> Học liệu EduHub đã gắn</small>}<label>Phút<input type="number" min={1} max={180} defaultValue={item.duration_minutes} onBlur={(event) => { const minutes = Math.min(180, Math.max(1, Number(event.target.value) || 1)); event.target.value = String(minutes); if (minutes !== item.duration_minutes) void updateItem(item, { duration_minutes: minutes }); }} disabled={!editable} /></label></div></div>{editable && <div className="lesson-activity-controls"><button onClick={() => void moveItem(index, -1)} aria-label="Chuyển lên"><ArrowUp size={13} /></button><button onClick={() => void moveItem(index, 1)} aria-label="Chuyển xuống"><ArrowDown size={13} /></button><button onClick={() => void removeItem(item)} aria-label="Xóa hoạt động"><Trash2 size={13} /></button></div>}</article>)}{activePlan.items.length === 0 && <p className="planner-empty-note">Thêm hoạt động khởi động, hình thành kiến thức, luyện tập hoặc vận dụng.</p>}</div>
        {editable && <div className="planner-add-tools"><form onSubmit={addActivity}><select value={resourceToAdd} onChange={(event) => setResourceToAdd(event.target.value)}><option value="">Chọn học liệu đã duyệt</option>{resources.map((resource) => <option key={resource.sourceId || resource.id} value={resource.sourceId || resource.id}>{resource.title}</option>)}</select><button className="button button-outline" disabled={!resourceToAdd}><Plus size={13} /> Thêm học liệu</button></form><form onSubmit={addCustomActivity}><input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Tên hoạt động do thầy cô tự thêm" /><button className="button button-outline" disabled={!customTitle.trim()}><Plus size={13} /> Thêm hoạt động</button></form></div>}
      </> : <form className="lesson-plan-create" onSubmit={createPlan}><div className="lesson-plan-create-icon"><FileText size={20} /></div><h3>Tạo kế hoạch đầu tiên</h3><p>Xác định môn, khối lớp và thời lượng; sau đó ghép các học liệu thành tiến trình dạy học.</p><label>Tên kế hoạch<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Ôn tập phân số bằng trò chơi" required /></label><div className="form-two-col"><label>Môn<select value={subject} onChange={(event) => setSubject(event.target.value)} required><option value="">Chọn môn</option>{SUBJECT_NAMES.map((name) => <option key={name}>{name}</option>)}</select></label><label>Khối<select value={grade} onChange={(event) => setGrade(event.target.value)} required><option value="">Chọn khối</option>{GRADE_LABELS.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Thời lượng<input type="number" min={10} max={240} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label><button className="button button-primary" disabled={!currentUser || busy}><Plus size={14} /> Tạo kế hoạch riêng</button>{!currentUser && <button type="button" className="button button-outline" onClick={onRequireAuth}>Đăng nhập để tạo</button>}</form>}</div>
    </div>
  </section>;
}
