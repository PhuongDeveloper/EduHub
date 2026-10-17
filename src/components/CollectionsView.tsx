import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Check, Globe2, LockKeyhole, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';
import { SUBJECT_NAMES } from '../lib/curriculum';

type EduCollection = { id: string; owner_id: string; title: string; description: string; subject: string; is_public: boolean; items: Array<{ id: string; resource_id: string }> };
type EduProject = { id: string; sourceId?: string; title: string; subject: string; grade: string; type: string; coverUrl?: string; teacher: string; downloadUrl?: string; url?: string };

export function CollectionsView({ currentUser, projects, onRequireAuth, onNotice, onOpenProject }: { currentUser: User | null; projects: EduProject[]; onRequireAuth: () => void; onNotice: (message: string) => void; onOpenProject: (project: EduProject) => void }) {
  const [collections, setCollections] = useState<EduCollection[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Liên môn / nhiều môn');
  const [busy, setBusy] = useState(false);
  const [addingTo, setAddingTo] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [packingId, setPackingId] = useState('');
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
  const downloadCollectionZip = async (collection: EduCollection) => {
    if (!supabase) { onNotice('Cần kết nối Supabase để tìm tệp của bộ sưu tập.'); return; }
    setPackingId(collection.id);
    const zip = new JSZip(); const notes: string[] = [`${collection.title}`, collection.description, '', 'Một số website chặn tải tự động từ trình duyệt. Nếu tệp không có trong ZIP, mở liên kết gốc.'];
    let added = 0; let totalBytes = 0; const failed: string[] = [];
    const boundedItems = collection.items.slice(0,30);
    if (collection.items.length > boundedItems.length) notes.push(`Chỉ đóng gói 30 học liệu đầu tiên trong tuyển tập có ${collection.items.length} mục.`);
    for (const [index,item] of boundedItems.entries()) {
      const project = projects.find((entry) => entry.sourceId === item.resource_id);
      const filesResult = await supabase.from('resource_files').select('file_name,file_url,file_size,position').eq('resource_id',item.resource_id).order('position');
      const sources = [...(project?.downloadUrl ? [{name: project.title, url: project.downloadUrl, size: 0}] : []), ...((filesResult.data || []).map((row) => ({name: row.file_name, url: row.file_url, size: Number(row.file_size || 0)})))].slice(0, 10);
      notes.push(`${index + 1}. ${project?.title || 'Học liệu'}${project?.downloadUrl ? ` — ${project.downloadUrl}` : ''}`);
      for (const [fileIndex,file] of sources.entries()) {
        if (file.size && totalBytes + file.size > 200 * 1024 * 1024) { failed.push(`${file.name} (vượt giới hạn gói)`); continue; }
        try { const response = await fetch(file.url); if (!response.ok) throw new Error(`HTTP ${response.status}`); const blob = await response.blob(); if (totalBytes + blob.size > 200 * 1024 * 1024) throw new Error('Vượt 200 MB'); const name = `${String(index + 1).padStart(2,'0')}-${(project?.title || 'hoc-lieu').replace(/[^\p{L}\p{N}-]+/gu,'-').slice(0,60)}-${String(fileIndex+1).padStart(2,'0')}-${file.name.replace(/[\\/:*?"<>|]/g,'_')}`; zip.file(name,blob); totalBytes += blob.size; added += 1; }
        catch { failed.push(file.name); }
      }
    }
    if (added === 0) { setPackingId(''); onNotice('Không tải được tệp nào do liên kết ngoài chặn truy cập. Mở từng học liệu để tải trực tiếp.'); return; }
    if (failed.length) notes.push('', `Không thể đóng gói tự động (${failed.length} tệp):`, ...failed.map((name) => `- ${name}`));
    zip.file('README.txt',notes.join('\n'));
    try { const blob = await zip.generateAsync({type:'blob'}); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href=url; anchor.download=`${collection.title.replace(/[^\p{L}\p{N}-]+/gu,'-').slice(0,70)||'bo-hoc-lieu'}.zip`; anchor.click(); URL.revokeObjectURL(url); onNotice(`Đã đóng gói ${added} tệp${failed.length ? `; ${failed.length} liên kết cần mở thủ công` : ''}.`); }
    catch { onNotice('Không tạo được ZIP. Hãy thử bộ sưu tập có ít tệp hơn.'); } finally { setPackingId(''); }
  };

  return <section className="collections-page"><div className="collections-hero"><span className="collections-icon"><img src="/assets/openmoji-books.svg" alt="" /></span><div><span className="section-kicker">TỦ HỌC LIỆU CỦA CỘNG ĐỒNG</span><h2>Bộ sưu tập theo chủ đề</h2><p>Gom những dự án đã được kiểm duyệt thành danh sách dễ dùng cho từng môn học, khối lớp hoặc hoạt động.</p></div><div className="collection-count"><b>{collections.length}</b><small>bộ sưu tập</small></div></div>
    {currentUser && <form className="collection-create" onSubmit={create}><div><span className="section-kicker">TẠO TUYỂN TẬP MỚI</span><h3>Chia sẻ một tủ tài nguyên hữu ích</h3></div><div className="form-two-col"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên bộ sưu tập · vd. STEM lớp 6" maxLength={100} required /><select value={subject} onChange={(event) => setSubject(event.target.value)}><option>Liên môn / nhiều môn</option>{SUBJECT_NAMES.map((item) => <option key={item}>{item}</option>)}</select></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn đối tượng hoặc cách sử dụng bộ tài nguyên" maxLength={500} rows={2} /><button className="button button-primary" disabled={busy || !title.trim()}><Plus size={15} /> Tạo bộ sưu tập</button></form>}
    <div className="collection-toolbar"><div><h3>Khám phá tuyển tập</h3><p>{currentUser ? 'Các bộ sưu tập công khai của thầy cô trong cộng đồng.' : 'Đăng nhập để tạo và quản lý tủ học liệu của mình.'}</p></div>{currentUser && <button className="button button-outline" onClick={() => setOnlyMine((value) => !value)}>{onlyMine ? 'Xem cộng đồng' : 'Bộ sưu tập của tôi'}</button>}</div>
    {collections.length ? <div className="collection-grid">{collections.map((collection) => <article className="collection-card" key={collection.id}><div className="collection-card-head"><span><BookOpen size={17} /></span><b>{collection.subject}</b>{collection.owner_id === currentUser?.id ? <button aria-label="Xóa bộ sưu tập" onClick={() => void removeCollection(collection.id)}><Trash2 size={14} /></button> : null}</div><h3>{collection.title}</h3><p>{collection.description || 'Danh sách tài nguyên do giáo viên tuyển chọn.'}</p><div className="collection-card-meta">{collection.is_public ? <><Globe2 size={13} /> Công khai</> : <><LockKeyhole size={13} /> Riêng tư</>}<span>{collection.items.length} tài nguyên</span></div>
      {collection.owner_id === currentUser?.id && addingTo === collection.id ? <div className="collection-add-row"><select value={resourceId} onChange={(event) => setResourceId(event.target.value)}><option value="">Chọn dự án đã duyệt</option>{projects.filter((project) => project.sourceId && !collection.items.some((item) => item.resource_id === project.sourceId)).map((project) => <option key={project.id} value={project.sourceId}>{project.title}</option>)}</select><button className="button button-primary" disabled={busy || !resourceId} onClick={() => void addResource(collection.id)}>Thêm</button></div> : collection.owner_id === currentUser?.id ? <button className="collection-add-trigger" onClick={() => setAddingTo(collection.id)}><Plus size={13} /> Thêm học liệu</button> : null}
      {collection.items.length > 0 && <button className="button button-outline collection-download-zip" disabled={packingId === collection.id} onClick={() => void downloadCollectionZip(collection)}><BookOpen size={14}/>{packingId === collection.id ? 'Đang đóng gói…' : 'Tải gói ZIP'}</button>}<div className="collection-resource-list">{collection.items.map((item) => { const project = projects.find((entry) => entry.sourceId === item.resource_id); return <div className="collection-resource" key={item.id}><button onClick={() => project && onOpenProject(project)} disabled={!project}><span className="collection-resource-thumb">{project?.coverUrl ? <img src={project.coverUrl} alt="" /> : <BookOpen size={15} />}</span><span><b>{project?.title || 'Học liệu EduHub'}</b><small>{project?.grade || 'Tài nguyên đã duyệt'} · {project?.teacher || 'Giáo viên cộng đồng'}</small></span></button>{collection.owner_id === currentUser?.id && <button aria-label="Gỡ học liệu" onClick={() => void removeResource(item.id)}><Trash2 size={13} /></button>}</div>; })}{collection.items.length === 0 && <p className="collection-empty">Bộ sưu tập chưa có học liệu.</p>}</div>
      <span className="collection-author"><Check size={12} /> Được cộng đồng tuyển chọn</span></article>)}</div> : <div className="empty-state"><div className="empty-icon"><img src="/assets/openmoji-open-book.svg" alt="" /></div><h3>{supabase ? 'Chưa có bộ sưu tập' : 'Cần kết nối Supabase'}</h3><p>Tạo tuyển tập theo môn, khối lớp, chủ đề hoặc mục tiêu tiết dạy rồi thêm các dự án đã duyệt.</p></div>}
  </section>;
}
