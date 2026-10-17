import { useEffect, useState } from 'react';
import { ArrowDownToLine, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ResourceFile = { id: string; file_name: string; file_url: string; file_size: number; mime_type: string; position: number };
export function ResourceFilesList({ resourceId, onNotice }: { resourceId?: string; onNotice: (message: string) => void }) {
  const [files, setFiles] = useState<ResourceFile[]>([]);
  useEffect(() => { let active = true; if (!supabase || !resourceId) return; void supabase.from('resource_files').select('id,file_name,file_url,file_size,mime_type,position').eq('resource_id',resourceId).order('position').then(({data,error}) => { if (!active) return; if (error && !error.message.includes('resource_files')) onNotice(error.message); else setFiles((data || []) as ResourceFile[]); }); return () => { active=false; }; }, [resourceId]);
  if (!files.length) return null;
  return <section className="resource-files-list"><header><span className="section-kicker">TỆP ĐI KÈM</span><b>{files.length} tài liệu trong dự án</b></header>{files.map((file) => <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer" onClick={() => { void supabase?.rpc('record_resource_action',{p_resource_id:resourceId,p_action:'download'}).then(({error}) => { if(error) onNotice('Không ghi được lịch sử tải; hãy chạy SQL mới nhất.'); }); }}><span><FileText size={16}/></span><span><b>{file.file_name}</b><small>{file.mime_type || 'Tài liệu'} · {(file.file_size/1024/1024).toFixed(file.file_size < 1024*1024 ? 2 : 1)} MB</small></span><ArrowDownToLine size={16}/></a>)}</section>;
}
