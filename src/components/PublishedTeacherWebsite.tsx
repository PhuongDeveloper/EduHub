import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Globe2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sandboxWebsiteHtml } from '../lib/sandboxWebsite';

type PublishedWebsite = { title: string; website_html: string; website_slug: string; author?: { full_name?: string } | null };

export function PublishedTeacherWebsite({ slug }: { slug: string }) {
  const [website, setWebsite] = useState<PublishedWebsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!supabase) { setError('Website tạm thời chưa thể tải.'); setLoading(false); return () => { active = false; }; }
    setLoading(true); setError('');
    void Promise.resolve(supabase.from('resources').select('title,website_html,website_slug,author:profiles!resources_author_id_fkey(full_name)').eq('website_slug', slug).eq('resource_type', 'teacher_website').eq('moderation_status', 'approved').maybeSingle())
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else if (!data?.website_html) setError('Không tìm thấy website hoặc website chưa được duyệt công khai.');
        else setWebsite(data as unknown as PublishedWebsite);
        setLoading(false);
      }).catch(() => {
        if (!active) return;
        setError('Không kết nối được tới EduHub. Thầy cô thử tải lại trang sau nhé.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!website) return;
    const originalTitle = document.title;
    document.title = `${website.title} · EduHub`;
    return () => { document.title = originalTitle; };
  }, [website]);

  if (loading || error || !website) return <main className="published-website-state"><a href="/" className="button button-quiet"><ArrowLeft size={15} /> Về EduHub</a><div><Globe2 size={26} /><h1>{loading ? 'Đang mở website…' : 'Chưa thể mở website'}</h1><p>{loading ? 'Đang tải website đã được duyệt.' : error}</p>{!loading && <a href="/" className="button button-primary">Khám phá học liệu EduHub</a>}</div></main>;

  return <main className="published-website-page"><header><a href="/" aria-label="Quay lại EduHub"><ArrowLeft size={15} /><span>EduHub</span></a><div><b>{website.title}</b><small>Tạo bởi {website.author?.full_name || 'giáo viên EduHub'}</small></div><span className="published-website-label"><Globe2 size={14} /> Website cộng đồng</span></header><iframe title={website.title} sandbox="allow-scripts allow-popups" referrerPolicy="no-referrer" srcDoc={sandboxWebsiteHtml(website.website_html)} /><a className="published-website-credit" href="/" target="_top"><ExternalLink size={12} /> Được tạo và chia sẻ trên EduHub</a></main>;
}
