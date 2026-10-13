import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Check, FolderHeart, Globe2, LockKeyhole, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type EduCollection = { id: string; owner_id: string; title: string; description: string; subject: string; is_public: boolean; items: Array<{ id: string; resource_id: string }> };
type EduProject = { id: string; sourceId?: string; title: string; subject: string; grade: string; type: string; coverUrl?: string; teacher: string };

export function CollectionsView({ currentUser, projects, onRequireAuth, onNotice, onOpenProject }: { currentUser: User | null; projects: EduProject[]; onRequireAuth: () => void; onNotice: (message: string) => void; onOpenProject: (project: EduProject) => void }) {
  const [collections, setCollections] = useState<EduCollection[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Đa môn học');
  const [busy, setBusy] = useState(false);
  const [addingTo, setAddingTo] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const load = async () => {
    if (!supabase) return;
    let request = supabase.from('resource_collections').select('id,owner_id,title,description,subject,is_public').order('updated_at', { ascending: false });
    if (onlyMine && currentUser) request = request.eq('owner_id', currentUser.id);
    else if (!currentUser) request = request.eq('is_public', true);
    const { data, error } = await request.limit(40);
    if (error) { onNotice(error.message); return; }
    const rows = data || [];
    const ids = rows.map((item) => item.id);
    const { data: items } = ids.length ? await supabase.from('resource_collection_items').select('id,collection_id,resource_id').in('collection_id', ids) : { data: [] };
    setCollections(rows.map((item) => ({ ...item, items: (items || []).filter((entry) => entry.collection_id === item.id) })) as EduCollection[]);
  };
  useEffect(() => { void load(); }, [currentUser?.id, onlyMine]);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('resource_collections').insert({ owner_id: currentUser.id, title: title.trim(), description: description.trim(), subject, is_public: true });
    setBusy(false);
    if (error) { onNotice(error.message); return; }
    setTitle(''); setDescription(''); onNotice('Đã tạo bộ sưu tập công khai.'); await load();
  };
  const addResource = async (collectionId: string) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !resourceId) return;
    setBusy(true);
    const { error } = await supabase.from('resource_collection_items').insert({ collection_id: collectionId, resource_id: resourceId });
    setBusy(false); setAddingTo(''); setResourceId('');
    if (error) onNotice(error.code === '23505' ? 'Dự án đã có trong bộ sưu tập.' : error.message);
    else { onNotice('Đã thêm học liệu vào bộ sưu tập.'); await load(); }
  };
  const removeResource = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('resource_collection_items').delete().eq('id', id);
    if (error) onNotice(error.message); else await load();
  };
  const removeCollection = async (id: string) => {
    if (!supabase || !window.confirm('Xóa bộ sưu tập này và các liên kết học liệu?')) return;
    const { error } = await supabase.from('resource_collections').delete().eq('id', id);
    if (error) onNotice(error.message); else { onNotice('Đã xóa bộ sưu tập.'); await load(); }
  };

  return <section className="collections-page"><div className="collections-hero"><span className="collections-icon"><FolderHeart size={22} /></span><div><span className="section-kicker">TỦ HỌC LIỆU CỦA CỘNG ĐỒNG</span><h2>Bộ sưu tập theo chủ đề</h2><p>Gom những dự án đã được kiểm duyệt thành danh sách dễ dùng cho từng môn học, khối lớp hoặc hoạt động.</p></div><div className="collection-count"><b>{collections.length}</b><small>bộ sưu tập</small></div></div>
    {currentUser && <form className="collection-create" onSubmit={create}><div><span className="section-kicker">TẠO TUYỂN TẬP MỚI</span><h3>Chia sẻ một tủ tài nguyên hữu ích</h3></div><div className="form-two-col"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên bộ sưu tập · vd. STEM lớp 6" maxLength={100} required /><select value={subject} onChange={(event) => setSubject(event.target.value)}><option>Đa môn học</option>{['Toán học','Ngữ văn','Khoa học tự nhiên','Tiếng Anh','Lịch sử & Địa lí','Tin học & Công nghệ'].map((item) => <option key={item}>{item}</option>)}</select></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn đối tượng hoặc cách sử dụng bộ tài nguyên" maxLength={500} rows={2} /><button className="button button-primary" disabled={busy || !title.trim()}><Plus size={15} /> Tạo bộ sưu tập</button></form>}
    <div className="collection-toolbar"><div><h3>Khám phá tuyển tập</h3><p>{currentUser ? 'Các bộ sưu tập công khai của thầy cô trong cộng đồng.' : 'Đăng nhập để tạo và quản lý tủ học liệu của mình.'}</p></div>{currentUser && <button className="button button-outline" onClick={() => setOnlyMine((value) => !value)}>{onlyMine ? 'Xem cộng đồng' : 'Bộ sưu tập của tôi'}</button>}</div>
    {collections.length ? <div className="collection-grid">{collections.map((collection) => <article className="collection-card" key={collection.id}><div className="collection-card-head"><span><BookOpen size={17} /></span><b>{collection.subject}</b>{collection.owner_id === currentUser?.id ? <button aria-label="Xóa bộ sưu tập" onClick={() => void removeCollection(collection.id)}><Trash2 size={14} /></button> : null}</div><h3>{collection.title}</h3><p>{collection.description || 'Danh sách tài nguyên do giáo viên tuyển chọn.'}</p><div className="collection-card-meta">{collection.is_public ? <><Globe2 size={13} /> Công khai</> : <><LockKeyhole size={13} /> Riêng tư</>}<span>{collection.items.length} tài nguyên</span></div>
      {collection.owner_id === currentUser?.id && addingTo === collection.id ? <div className="collection-add-row"><select value={resourceId} onChange={(event) => setResourceId(event.target.value)}><option value="">Chọn dự án đã duyệt</option>{projects.filter((project) => project.sourceId && !collection.items.some((item) => item.resource_id === project.sourceId)).map((project) => <option key={project.id} value={project.sourceId}>{project.title}</option>)}</select><button className="button button-primary" disabled={busy || !resourceId} onClick={() => void addResource(collection.id)}>Thêm</button></div> : collection.owner_id === currentUser?.id ? <button className="collection-add-trigger" onClick={() => setAddingTo(collection.id)}><Plus size={13} /> Thêm học liệu</button> : null}
      <div className="collection-resource-list">{collection.items.map((item) => { const project = projects.find((entry) => entry.sourceId === item.resource_id); return <div className="collection-resource" key={item.id}><button onClick={() => project && onOpenProject(project)} disabled={!project}><span className="collection-resource-thumb">{project?.coverUrl ? <img src={project.coverUrl} alt="" /> : <BookOpen size={15} />}</span><span><b>{project?.title || 'Học liệu EduHub'}</b><small>{project?.grade || 'Tài nguyên đã duyệt'} · {project?.teacher || 'Giáo viên cộng đồng'}</small></span></button>{collection.owner_id === currentUser?.id && <button aria-label="Gỡ học liệu" onClick={() => void removeResource(item.id)}><Trash2 size={13} /></button>}</div>; })}{collection.items.length === 0 && <p className="collection-empty">Bộ sưu tập chưa có học liệu.</p>}</div>
      <span className="collection-author"><Check size={12} /> Được cộng đồng tuyển chọn</span></article>)}</div> : <div className="empty-state"><div className="empty-icon"><FolderHeart size={20} /></div><h3>{supabase ? 'Chưa có bộ sưu tập' : 'Cần kết nối Supabase'}</h3><p>Tạo tuyển tập theo môn, khối lớp, chủ đề hoặc mục tiêu tiết dạy rồi thêm các dự án đã duyệt.</p></div>}
  </section>;
}
