import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Compass, Heart, MessageCircle, Send, Sparkles, UserRound, Users } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const channels = [
  { name: 'Tất cả bộ môn', id: 'all', icon: Compass }, { name: 'Toán học', id: 'toan', icon: Sparkles },
  { name: 'Ngữ văn', id: 'van', icon: BookOpen }, { name: 'Khoa học tự nhiên', id: 'khtn', icon: Compass },
  { name: 'Tiếng Anh', id: 'tieng-anh', icon: MessageCircle }, { name: 'Tin học & Công nghệ', id: 'tin-hoc-cong-nghe', icon: Sparkles },
  { name: 'Lịch sử & Địa lí', id: 'lich-su-dia-li', icon: BookOpen }, { name: 'Công tác chủ nhiệm', id: 'chu-nhiem', icon: Users },
];
type Topic = { id: string; title: string; content: string; subject_channel: string; created_at: string; author_id?: string; author?: { full_name?: string; school_name?: string; avatar_url?: string }; replies?: { count: number }[] };
type Reply = { id: string; talk_id: string; parent_reply_id: string | null; author_id: string; content: string; created_at: string; author?: { full_name?: string; avatar_url?: string; school_name?: string }; likes?: { count: number }[] };
const initials = (name = 'Giáo viên') => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
const ago = (date: string) => { const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000)); return minutes < 1 ? 'vừa xong' : minutes < 60 ? `${minutes} phút trước` : minutes < 1440 ? `${Math.floor(minutes / 60)} giờ trước` : new Date(date).toLocaleDateString('vi-VN'); };

export function SubjectTalksPage({ currentUser, onRequireAuth, onNotice, detailId, onOpenDetail, onBack, onOpenTeacher }: { currentUser: User | null; onRequireAuth: () => void; onNotice: (message: string) => void; detailId?: string | null; onOpenDetail: (id: string) => void; onBack: () => void; onOpenTeacher: (id: string) => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filter, setFilter] = useState('all');
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('toan');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState<Reply | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const roomRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  const loadTopics = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('talks').select('id,title,content,subject_channel,created_at,author_id,author:profiles!talks_author_id_fkey(full_name,school_name,avatar_url),replies:talk_replies(count)').order('created_at', { ascending: false }).limit(100);
    if (error) { onNotice(`Không tải được diễn đàn: ${error.message}`); return; }
    setTopics((data || []) as unknown as Topic[]);
  }, [onNotice]);
  const loadReplies = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('talk_replies').select('id,talk_id,parent_reply_id,author_id,content,created_at,author:profiles!talk_replies_author_id_fkey(full_name,avatar_url,school_name),likes:talk_reply_likes(count)').eq('talk_id', id).order('created_at', { ascending: true });
    if (error) { onNotice(`Không tải được câu trả lời: ${error.message}`); return; }
    setReplies((data || []) as unknown as Reply[]);
    if (currentUser && data?.length) {
      const { data: myLikes } = await supabase.from('talk_reply_likes').select('reply_id').eq('user_id', currentUser.id).in('reply_id', data.map((item) => item.id));
      setLiked(new Set(myLikes?.map((item) => item.reply_id) || []));
    }
  }, [currentUser, onNotice]);

  useEffect(() => { void loadTopics(); }, [loadTopics]);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('eduhub-talk-feed').on('postgres_changes', { event: '*', schema: 'public', table: 'talks' }, () => void loadTopics()).subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [loadTopics]);
  useEffect(() => {
    if (!detailId || !supabase) { setTopic(null); setReplies([]); return; }
    let alive = true;
    void supabase.from('talks').select('id,title,content,subject_channel,created_at,author_id,author:profiles!talks_author_id_fkey(full_name,school_name,avatar_url),replies:talk_replies(count)').eq('id', detailId).maybeSingle().then(({ data, error }) => {
      if (!alive) return;
      if (error || !data) { onNotice('Không tìm thấy chủ đề này.'); onBack(); return; }
      setTopic(data as unknown as Topic); void loadReplies(detailId);
    });
    return () => { alive = false; };
  }, [detailId, loadReplies, onBack, onNotice]);
  useEffect(() => {
    if (!detailId || !supabase) return;
    let names: string[] = [];
    const room = supabase.channel(`talk-room-${detailId}`, { config: { presence: { key: currentUser?.id || crypto.randomUUID() }, broadcast: { self: false } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'talk_replies', filter: `talk_id=eq.${detailId}` }, () => void loadReplies(detailId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'talk_reply_likes' }, () => void loadReplies(detailId))
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const name = String(payload?.name || 'Một giáo viên'); names = [...new Set([...names, name])]; setTypingNames(names);
        window.setTimeout(() => { names = names.filter((item) => item !== name); setTypingNames(names); }, 1800);
      }).subscribe();
    roomRef.current = room;
    return () => { roomRef.current = null; void supabase?.removeChannel(room); };
  }, [detailId, loadReplies, currentUser?.id]);

  const startTyping = () => {
    if (currentUser && roomRef.current) void roomRef.current.send({ type: 'broadcast', event: 'typing', payload: { name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Một giáo viên' } });
  };
  const createTopic = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; } if (!supabase) return;
    setBusy(true); const { data, error } = await supabase.from('talks').insert({ title: title.trim(), content: content.trim(), subject_channel: channel, author_id: currentUser.id }).select('id').single(); setBusy(false);
    if (error) { onNotice(error.message); return; }
    setTitle(''); setContent(''); setComposer(false); await loadTopics(); onNotice('Đã đăng chủ đề.'); if (data?.id) onOpenDetail(data.id);
  };
  const sendReply = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; } if (!supabase || !detailId || !replyText.trim()) return;
    setBusy(true); const { error } = await supabase.from('talk_replies').insert({ talk_id: detailId, author_id: currentUser.id, parent_reply_id: replyTo?.id || null, content: replyText.trim() }); setBusy(false);
    if (error) { onNotice(error.message); return; } setReplyText(''); setReplyTo(null); await loadReplies(detailId);
  };
  const toggleLike = async (reply: Reply) => {
    if (!currentUser) { onRequireAuth(); return; } if (!supabase) return;
    const has = liked.has(reply.id);
    setLiked((old) => { const next = new Set(old); has ? next.delete(reply.id) : next.add(reply.id); return next; });
    const result = has ? await supabase.from('talk_reply_likes').delete().eq('reply_id', reply.id).eq('user_id', currentUser.id) : await supabase.from('talk_reply_likes').insert({ reply_id: reply.id, user_id: currentUser.id });
    if (result.error) { setLiked((old) => { const next = new Set(old); has ? next.add(reply.id) : next.delete(reply.id); return next; }); onNotice(result.error.message); }
  };

  const visible = useMemo(() => filter === 'all' ? topics : topics.filter((item) => item.subject_channel === filter), [filter, topics]);
  const channelName = (id: string) => channels.find((item) => item.id === id)?.name || id;
  const avatar = (author?: Reply['author'], authorId?: string) => <button className="talk-avatar" aria-label={`Mở tường ${author?.full_name || 'giáo viên'}`} onClick={() => authorId && onOpenTeacher(authorId)}>{author?.avatar_url ? <img src={author.avatar_url} alt="" /> : initials(author?.full_name)}</button>;
  const renderReply = (reply: Reply, nested = false) => <motion.article layout key={reply.id} className={`talk-message${nested ? ' talk-message-nested' : ''}`}>
    {avatar(reply.author, reply.author_id)}<div className="talk-bubble-wrap"><div className="talk-bubble"><header><button onClick={() => onOpenTeacher(reply.author_id)}>{reply.author?.full_name || 'Giáo viên EduHub'}</button>{reply.author?.school_name && <span>{reply.author.school_name}</span>}</header><p>{reply.content}</p></div><div className="talk-message-actions"><time>{ago(reply.created_at)}</time><button className={liked.has(reply.id) ? 'is-liked' : ''} onClick={() => void toggleLike(reply)}><Heart size={13} fill={liked.has(reply.id) ? 'currentColor' : 'none'} /> Thích {Number(reply.likes?.[0]?.count || 0) + (liked.has(reply.id) && !reply.likes?.[0]?.count ? 1 : 0) || ''}</button><button onClick={() => { setReplyTo(reply); document.querySelector<HTMLTextAreaElement>('.talk-reply-input')?.focus(); }}>Trả lời</button></div></div>
  </motion.article>;
  const renderThread = (reply: Reply, depth = 0): React.ReactNode => <div className="talk-thread" key={reply.id}>{renderReply(reply, depth > 0)}{replies.filter((child) => child.parent_reply_id === reply.id).map((child) => renderThread(child, depth + 1))}</div>;

  if (detailId) return <section className="talk-detail-page">
    <button className="talk-back-button" onClick={onBack}><ArrowLeft size={15} /> Trở lại diễn đàn</button>
    {!topic ? <div className="talk-detail-loading"><span /><span /><span /></div> : <motion.div className="talk-detail-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="talk-detail-kicker"><span>{channelName(topic.subject_channel)}</span><span>Trao đổi chuyên môn</span></div><h1>{topic.title}</h1><div className="talk-topic-author">{avatar(topic.author, topic.author_id)}<div><button onClick={() => topic.author_id && onOpenTeacher(topic.author_id)}>{topic.author?.full_name || 'Giáo viên EduHub'}</button><small>{[topic.author?.school_name, ago(topic.created_at)].filter(Boolean).join(' · ')}</small></div></div><p className="talk-topic-copy">{topic.content}</p>
      <div className="talk-conversation-heading"><div><MessageCircle size={17} /><strong>Trao đổi cùng đồng nghiệp</strong><span>{replies.length} ý kiến</span></div><span className="talk-live-indicator"><i /> Đang trực tiếp</span></div>
      <div className="talk-conversation"><AnimatePresence initial={false}>{replies.filter((reply) => !reply.parent_reply_id).map((reply) => renderThread(reply))}</AnimatePresence>{!replies.length && <div className="talk-empty-replies"><span><MessageCircle size={18} /></span><b>Mở đầu cuộc trao đổi</b><p>Chia sẻ kinh nghiệm từ lớp học của thầy cô để mọi người cùng tham khảo.</p></div>}</div>
      {typingNames.length > 0 && <div className="talk-typing"><span className="typing-dots"><i /><i /><i /></span>{typingNames.join(', ')} đang nhập</div>}
      {replyTo && <div className="talk-replying-to">Đang trả lời <b>{replyTo.author?.full_name || 'đồng nghiệp'}</b><button onClick={() => setReplyTo(null)}>Hủy</button></div>}
      <form className="talk-reply-composer" onSubmit={sendReply}>{currentUser ? <span className="talk-current-avatar">{initials(currentUser.user_metadata?.full_name || currentUser.email)}</span> : <span className="talk-current-avatar"><UserRound size={16} /></span>}<textarea className="talk-reply-input" value={replyText} onChange={(event) => { setReplyText(event.target.value); startTyping(); }} onFocus={() => { if (!currentUser) onRequireAuth(); }} placeholder={currentUser ? replyTo ? `Trả lời ${replyTo.author?.full_name || 'đồng nghiệp'}...` : 'Viết chia sẻ của thầy cô...' : 'Đăng nhập để tham gia trao đổi'} rows={2} /><button className="button button-primary" disabled={!replyText.trim() || busy}><Send size={15} /> Gửi</button></form>
    </motion.div>}
  </section>;

  return <section className="talks-page"><div className="talks-hero"><span className="talks-hero-icon"><MessageCircle size={22} /></span><div><div className="section-kicker">PHÒNG CHUYÊN MÔN EDUHUB</div><h1>Thảo luận cùng đồng nghiệp</h1><p>Hỏi từ lớp học thật. Nhận gợi ý từ thầy cô cùng bộ môn.</p></div><span className="talks-hero-flag">🇻🇳</span></div>
    <div className="talks-title-row"><div><h2>Diễn đàn bộ môn</h2><p>{topics.length} chủ đề đang được chia sẻ</p></div><button className="button button-primary" onClick={() => currentUser ? setComposer((open) => !open) : onRequireAuth()}><MessageCircle size={15} /> Mở thảo luận</button></div>
    <AnimatePresence>{composer && <motion.form className="talk-composer" onSubmit={createTopic} initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}><div className="talk-composer-heading"><span><Sparkles size={16} /></span><div><b>Mở một chủ đề mới</b><small>Đặt câu hỏi rõ để đồng nghiệp dễ chia sẻ kinh nghiệm.</small></div></div><div className="form-two-col"><label className="form-label">Bộ môn<select value={channel} onChange={(event) => setChannel(event.target.value)}>{channels.filter((item) => item.id !== 'all').map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="form-label">Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Thầy cô muốn trao đổi điều gì?" required maxLength={180} /></label></div><label className="form-label">Nội dung<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Mô tả tình huống, cách đã thử hoặc điều cần đồng nghiệp góp ý..." rows={4} required maxLength={6000} /></label><div className="modal-footer-actions"><button type="button" className="button button-quiet" onClick={() => setComposer(false)}>Để sau</button><button className="button button-primary" disabled={busy}><Send size={14} /> {busy ? 'Đang đăng…' : 'Đăng chủ đề'}</button></div></motion.form>}</AnimatePresence>
    <div className="talks-browser"><aside className="talks-subjects"><b className="talks-subjects-heading">Bộ môn</b>{channels.map((item) => <button className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} key={item.id}><item.icon size={16} /><span>{item.name}</span><ChevronRight size={14} /></button>)}</aside><div className="talks-stream"><div className="talks-feed-heading"><div><span className="talks-feed-live"><i /> Phòng giáo viên</span><h2>{channels.find((item) => item.id === filter)?.name || 'Tất cả bộ môn'}</h2></div><button onClick={() => void loadTopics()}>Làm mới <ArrowRight size={13} /></button></div>
      {visible.length ? visible.map((item) => <motion.article layout className="talk-item" key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><button className="talk-avatar" onClick={() => item.author_id && onOpenTeacher(item.author_id)}>{item.author?.avatar_url ? <img src={item.author.avatar_url} alt="" /> : initials(item.author?.full_name)}</button><div className="talk-content"><div className="talk-meta"><span className="talk-subject-chip">{channelName(item.subject_channel)}</span><button onClick={() => item.author_id && onOpenTeacher(item.author_id)}>{item.author?.full_name || 'Giáo viên EduHub'}</button><span>· {ago(item.created_at)}</span></div><button className="talk-title" onClick={() => onOpenDetail(item.id)}>{item.title}</button><p>{item.content}</p><div className="talk-bottom"><span><MessageCircle size={14} /> {item.replies?.[0]?.count || 0} ý kiến</span><button onClick={() => onOpenDetail(item.id)}>Vào trao đổi <ArrowRight size={14} /></button></div></div></motion.article>) : <div className="talk-empty-replies"><span><MessageCircle size={18} /></span><b>Chưa có chủ đề ở đây</b><p>Hãy mở đầu bằng một câu hỏi hoặc một kinh nghiệm từ lớp học của thầy cô.</p></div>}
    </div></div>
  </section>;
}
