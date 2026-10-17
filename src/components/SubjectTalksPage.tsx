import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BellRing, BookOpen, CheckCircle2, ChevronRight, Compass, Flag, Heart, ImagePlus, MessageCircle, Send, Sparkles, UserRound, Users } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SUBJECT_NAMES } from '../lib/curriculum';
import { uploadPublicImage } from '../lib/mediaUpload';

const toChannelId = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const legacyChannelIds: Record<string, string> = { van: 'ngu-van', khtn: 'khoa-hoc-tu-nhien', 'tieng-anh': 'tieng-anh', 'tin-hoc-cong-nghe': 'tin-hoc', 'lich-su-dia-li': 'lich-su', 'chu-nhiem': 'cong-tac-chu-nhiem' };
const canonicalChannelId = (id: string) => legacyChannelIds[id] || id;
const channels = [
  { name: 'Tất cả bộ môn', id: 'all', icon: Compass },
  ...SUBJECT_NAMES.map((name, index) => ({ name, id: toChannelId(name), icon: [BookOpen, Sparkles, MessageCircle, Users][index % 4] })),
  { name: 'Công tác chủ nhiệm', id: 'cong-tac-chu-nhiem', icon: Users },
];
type Topic = { id: string; title: string; content: string; subject_channel: string; created_at: string; author_id?: string; accepted_reply_id?: string | null; attachment_urls?: string[]; author?: { full_name?: string; school_name?: string; avatar_url?: string }; replies?: { count: number }[]; votes?: { count: number }[] };
type Reply = { id: string; talk_id: string; parent_reply_id: string | null; author_id: string; content: string; created_at: string; attachment_urls?: string[]; author?: { full_name?: string; avatar_url?: string; school_name?: string }; likes?: { count: number }[] };
const initials = (name = 'Giáo viên') => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
const ago = (date: string) => { const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000)); return minutes < 1 ? 'vừa xong' : minutes < 60 ? `${minutes} phút trước` : minutes < 1440 ? `${Math.floor(minutes / 60)} giờ trước` : new Date(date).toLocaleDateString('vi-VN'); };

export function SubjectTalksPage({ currentUser, onRequireAuth, onNotice, detailId, onOpenDetail, onBack, onOpenTeacher }: { currentUser: User | null; onRequireAuth: () => void; onNotice: (message: string) => void; detailId?: string | null; onOpenDetail: (id: string) => void; onBack: () => void; onOpenTeacher: (id: string) => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filter, setFilter] = useState('all');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [answerFilter, setAnswerFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [sortMode, setSortMode] = useState<'newest' | 'helpful'>('newest');
  const [topicVotes, setTopicVotes] = useState<Set<string>>(new Set());
  const [topicVoteBusy, setTopicVoteBusy] = useState<Set<string>>(new Set());
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topicImage, setTopicImage] = useState<File | null>(null);
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [teachers, setTeachers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [topicMentions, setTopicMentions] = useState<string[]>([]);
  const [replyMentions, setReplyMentions] = useState<string[]>([]);
  const [mentionChoice, setMentionChoice] = useState('');
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
    const { data, error } = await supabase.from('talks').select('id,title,content,attachment_urls,mentioned_user_ids,subject_channel,created_at,author_id,accepted_reply_id,author:profiles!talks_author_id_fkey(full_name,school_name,avatar_url),replies:talk_replies!talk_replies_talk_id_fkey(count),votes:talk_votes(count)').order('created_at', { ascending: false }).limit(100);
    if (error) { onNotice(`Không tải được diễn đàn: ${error.message}`); return; }
    setTopics((data || []) as unknown as Topic[]);
    if (currentUser && data?.length) {
      const { data: myVotes } = await supabase.from('talk_votes').select('talk_id').eq('user_id', currentUser.id).in('talk_id', data.map((item) => item.id));
      setTopicVotes(new Set(myVotes?.map((item) => item.talk_id) || []));
    } else setTopicVotes(new Set());
  }, [currentUser, onNotice]);
  const loadReplies = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('talk_replies').select('id,talk_id,parent_reply_id,author_id,content,attachment_urls,mentioned_user_ids,created_at,author:profiles!talk_replies_author_id_fkey(full_name,avatar_url,school_name),likes:talk_reply_likes(count)').eq('talk_id', id).order('created_at', { ascending: true });
    if (error) { onNotice(`Không tải được câu trả lời: ${error.message}`); return; }
    setReplies((data || []) as unknown as Reply[]);
    if (currentUser && data?.length) {
      const { data: myLikes } = await supabase.from('talk_reply_likes').select('reply_id').eq('user_id', currentUser.id).in('reply_id', data.map((item) => item.id));
      setLiked(new Set(myLikes?.map((item) => item.reply_id) || []));
    }
  }, [currentUser, onNotice]);

  useEffect(() => { void loadTopics(); }, [loadTopics]);
  useEffect(() => { if (!supabase || !currentUser) return; let active = true; void supabase.from('profiles').select('id,full_name').neq('id', currentUser.id).order('full_name').limit(120).then(({ data }) => { if (active) setTeachers((data || []) as Array<{ id: string; full_name: string }>); }); return () => { active = false; }; }, [currentUser?.id]);
  useEffect(() => {
    if (!supabase || !currentUser) { setSubscribedChannels(new Set()); return; }
    let active = true;
    void supabase.from('talk_channel_subscriptions').select('subject_channel').eq('user_id', currentUser.id)
      .then(({ data }) => { if (active) setSubscribedChannels(new Set((data || []).map((item) => item.subject_channel))); });
    return () => { active = false; };
  }, [currentUser?.id]);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('eduhub-talk-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'talks' }, () => void loadTopics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'talk_votes' }, () => void loadTopics())
      .subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [loadTopics]);
  useEffect(() => {
    if (!detailId || !supabase) { setTopic(null); setReplies([]); return; }
    let alive = true;
    void supabase.from('talks').select('id,title,content,attachment_urls,mentioned_user_ids,subject_channel,created_at,author_id,accepted_reply_id,author:profiles!talks_author_id_fkey(full_name,school_name,avatar_url),replies:talk_replies!talk_replies_talk_id_fkey(count)').eq('id', detailId).maybeSingle().then(({ data, error }) => {
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'talks', filter: `id=eq.${detailId}` }, ({ new: row }) => setTopic((old) => old ? { ...old, accepted_reply_id: (row as { accepted_reply_id?: string | null }).accepted_reply_id || null } : old))
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
  const addMention = (target: 'topic' | 'reply') => {
    const selected = teachers.find((teacher) => teacher.id === mentionChoice);
    if (!selected) return;
    if (target === 'topic') { setContent((value) => `${value}${value.endsWith(' ') || !value ? '' : ' '}@${selected.full_name} `); setTopicMentions((ids) => ids.includes(selected.id) ? ids : [...ids, selected.id]); }
    else { setReplyText((value) => `${value}${value.endsWith(' ') || !value ? '' : ' '}@${selected.full_name} `); setReplyMentions((ids) => ids.includes(selected.id) ? ids : [...ids, selected.id]); }
    setMentionChoice('');
  };
  const createTopic = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; } if (!supabase) return;
    if (topicImage && (!topicImage.type.startsWith('image/') || topicImage.size > 5 * 1024 * 1024)) { onNotice('Ảnh thảo luận cần là tệp hình và tối đa 5 MB.'); return; }
    setBusy(true); let attachment: string | null = null; try { if (topicImage) attachment = (await uploadPublicImage(topicImage, `${currentUser.id}/talks/${crypto.randomUUID()}-${topicImage.name}`)).url; } catch (uploadError) { setBusy(false); onNotice(uploadError instanceof Error ? uploadError.message : 'Không tải được ảnh.'); return; }
    const { data, error } = await supabase.from('talks').insert({ title: title.trim(), content: content.trim(), subject_channel: channel, author_id: currentUser.id, attachment_urls: attachment ? [attachment] : [], mentioned_user_ids: topicMentions }).select('id').single(); setBusy(false);
    if (error) { onNotice(error.message); return; }
    setTitle(''); setContent(''); setTopicImage(null); setTopicMentions([]); setComposer(false); await loadTopics(); onNotice('Đã đăng chủ đề.'); if (data?.id) onOpenDetail(data.id);
  };
  const sendReply = async (event: FormEvent) => {
    event.preventDefault(); if (!currentUser) { onRequireAuth(); return; } if (!supabase || !detailId || !replyText.trim()) return;
    if (replyImage && (!replyImage.type.startsWith('image/') || replyImage.size > 5 * 1024 * 1024)) { onNotice('Ảnh trả lời cần là tệp hình và tối đa 5 MB.'); return; }
    setBusy(true); let attachment: string | null = null; try { if (replyImage) attachment = (await uploadPublicImage(replyImage, `${currentUser.id}/talks/${crypto.randomUUID()}-${replyImage.name}`)).url; } catch (uploadError) { setBusy(false); onNotice(uploadError instanceof Error ? uploadError.message : 'Không tải được ảnh.'); return; }
    const { error } = await supabase.from('talk_replies').insert({ talk_id: detailId, author_id: currentUser.id, parent_reply_id: replyTo?.id || null, content: replyText.trim(), attachment_urls: attachment ? [attachment] : [], mentioned_user_ids: replyMentions }); setBusy(false);
    if (error) { onNotice(error.message); return; } setReplyText(''); setReplyImage(null); setReplyMentions([]); setReplyTo(null); await loadReplies(detailId);
  };
  const toggleLike = async (reply: Reply) => {
    if (!currentUser) { onRequireAuth(); return; } if (!supabase) return;
    const has = liked.has(reply.id);
    setLiked((old) => { const next = new Set(old); has ? next.delete(reply.id) : next.add(reply.id); return next; });
    const result = has ? await supabase.from('talk_reply_likes').delete().eq('reply_id', reply.id).eq('user_id', currentUser.id) : await supabase.from('talk_reply_likes').insert({ reply_id: reply.id, user_id: currentUser.id });
    if (result.error) { setLiked((old) => { const next = new Set(old); has ? next.add(reply.id) : next.delete(reply.id); return next; }); onNotice(result.error.message); }
  };

  const toggleTopicVote = async (item: Topic) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (item.author_id === currentUser.id) { onNotice('Thầy cô không thể bình chọn cho chủ đề của mình.'); return; }
    if (!supabase || topicVoteBusy.has(item.id)) return;
    const has = topicVotes.has(item.id);
    setTopicVoteBusy((old) => new Set(old).add(item.id));
    setTopicVotes((old) => { const next = new Set(old); has ? next.delete(item.id) : next.add(item.id); return next; });
    setTopics((old) => old.map((topicItem) => topicItem.id === item.id ? { ...topicItem, votes: [{ count: Math.max(0, Number(topicItem.votes?.[0]?.count || 0) + (has ? -1 : 1)) }] } : topicItem));
    const result = has
      ? await supabase.from('talk_votes').delete().eq('talk_id', item.id).eq('user_id', currentUser.id)
      : await supabase.from('talk_votes').insert({ talk_id: item.id, user_id: currentUser.id });
    if (result.error) {
      setTopicVotes((old) => { const next = new Set(old); has ? next.add(item.id) : next.delete(item.id); return next; });
      setTopics((old) => old.map((topicItem) => topicItem.id === item.id ? { ...topicItem, votes: [{ count: Math.max(0, Number(topicItem.votes?.[0]?.count || 0) + (has ? 1 : -1)) }] } : topicItem));
      onNotice(`Chưa lưu được bình chọn: ${result.error.message}`);
    }
    setTopicVoteBusy((old) => { const next = new Set(old); next.delete(item.id); return next; });
  };

  const chooseAnswer = async (reply: Reply) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || !topic || topic.author_id !== currentUser.id) return;
    const nextId = topic.accepted_reply_id === reply.id ? null : reply.id;
    const previousId = topic.accepted_reply_id || null;
    setTopic({ ...topic, accepted_reply_id: nextId });
    const { error } = await supabase.from('talks').update({ accepted_reply_id: nextId }).eq('id', topic.id).eq('author_id', currentUser.id);
    if (error) { setTopic({ ...topic, accepted_reply_id: previousId }); onNotice(`Chưa lưu được câu trả lời: ${error.message}`); return; }
    onNotice(nextId ? 'Đã chọn câu trả lời hữu ích cho chủ đề.' : 'Đã bỏ đánh dấu câu trả lời.');
    await loadTopics();
  };

  const visible = useMemo(() => topics.filter((item) => (filter === 'all' || canonicalChannelId(item.subject_channel) === filter) && (answerFilter === 'all' || (answerFilter === 'answered' ? Boolean(item.accepted_reply_id) : !item.accepted_reply_id))).sort((a, b) => sortMode === 'helpful' ? Number(b.votes?.[0]?.count || 0) - Number(a.votes?.[0]?.count || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [answerFilter, filter, sortMode, topics]);
  const answerCounts = useMemo(() => ({ all: topics.length, unanswered: topics.filter((item) => !item.accepted_reply_id).length, answered: topics.filter((item) => Boolean(item.accepted_reply_id)).length }), [topics]);
  const channelName = (id: string) => channels.find((item) => item.id === canonicalChannelId(id))?.name || id;
  const toggleChannelSubscription = async () => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase || filter === 'all') return;
    const has = subscribedChannels.has(filter);
    const result = has
      ? await supabase.from('talk_channel_subscriptions').delete().eq('user_id', currentUser.id).eq('subject_channel', filter)
      : await supabase.from('talk_channel_subscriptions').insert({ user_id: currentUser.id, subject_channel: filter });
    if (result.error) { onNotice(`Không cập nhật được theo dõi bộ môn: ${result.error.message}`); return; }
    setSubscribedChannels((old) => { const next = new Set(old); has ? next.delete(filter) : next.add(filter); return next; });
    onNotice(has ? 'Đã tắt thông báo bộ môn.' : `Đã theo dõi ${channelName(filter)}; thầy cô sẽ nhận thông báo khi có chủ đề mới.`);
  };
  const reportContent = async (talkId: string, replyId?: string) => {
    if (!currentUser) { onRequireAuth(); return; }
    if (!supabase) return;
    const reasons = ['spam', 'harassment', 'student_privacy', 'copyright', 'other'] as const;
    const choice = window.prompt('Lý do báo cáo: 1. Spam/quảng cáo  2. Quấy rối/xúc phạm  3. Lộ thông tin học sinh  4. Bản quyền  5. Khác', '1');
    if (!choice) return;
    const reason = reasons[Math.max(0, Math.min(4, Number(choice) - 1))] || 'other';
    const details = window.prompt('Ghi chú cho quản trị viên (không bắt buộc):', '') || '';
    const { error } = await supabase.from('talk_content_reports').insert({ reporter_id: currentUser.id, talk_id: talkId, reply_id: replyId || null, reason, details: details.slice(0, 1200) });
    if (error) onNotice(`Không gửi được báo cáo: ${error.message}`); else onNotice('Đã gửi báo cáo kín cho quản trị viên.');
  };
  const visibleChannels = channels.filter((item) => item.id === 'all' || item.name.toLocaleLowerCase('vi').includes(subjectSearch.toLocaleLowerCase('vi')));
  const avatar = (author?: Reply['author'], authorId?: string) => <button className="talk-avatar" aria-label={`Mở tường ${author?.full_name || 'giáo viên'}`} onClick={() => authorId && onOpenTeacher(authorId)}>{author?.avatar_url ? <img src={author.avatar_url} alt="" /> : initials(author?.full_name)}</button>;
  const renderReply = (reply: Reply, nested = false) => <motion.article layout key={reply.id} className={`talk-message${nested ? ' talk-message-nested' : ''}${topic?.accepted_reply_id === reply.id ? ' talk-message-solution' : ''}`}>
    {avatar(reply.author, reply.author_id)}<div className="talk-bubble-wrap"><div className="talk-bubble">{topic?.accepted_reply_id === reply.id && <span className="talk-solution-badge"><CheckCircle2 size={12} /> Câu trả lời được chọn</span>}<header><button onClick={() => onOpenTeacher(reply.author_id)}>{reply.author?.full_name || 'Giáo viên EduHub'}</button>{reply.author?.school_name && <span>{reply.author.school_name}</span>}</header><p>{reply.content}</p>{reply.attachment_urls?.map((url) => <a className="talk-attachment" key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Ảnh đính kèm trong thảo luận" loading="lazy" /></a>)}</div><div className="talk-message-actions"><time>{ago(reply.created_at)}</time><button className={liked.has(reply.id) ? 'is-liked' : ''} onClick={() => void toggleLike(reply)}><Heart size={13} fill={liked.has(reply.id) ? 'currentColor' : 'none'} /> Thích {Number(reply.likes?.[0]?.count || 0) + (liked.has(reply.id) && !reply.likes?.[0]?.count ? 1 : 0) || ''}</button><button onClick={() => { setReplyTo(reply); document.querySelector<HTMLTextAreaElement>('.talk-reply-input')?.focus(); }}>Trả lời</button>{currentUser && currentUser.id !== reply.author_id && <button onClick={() => void reportContent(reply.talk_id, reply.id)}><Flag size={12} /> Báo cáo</button>}{topic?.author_id === currentUser?.id && <button className={topic.accepted_reply_id === reply.id ? 'is-solution' : ''} onClick={() => void chooseAnswer(reply)}><CheckCircle2 size={13} /> {topic.accepted_reply_id === reply.id ? 'Bỏ lời giải' : 'Chọn lời giải'}</button>}</div></div>
  </motion.article>;
  const renderThread = (reply: Reply, depth = 0): React.ReactNode => <div className="talk-thread" key={reply.id}>{renderReply(reply, depth > 0)}{replies.filter((child) => child.parent_reply_id === reply.id).map((child) => renderThread(child, depth + 1))}</div>;

  if (detailId) return <section className="talk-detail-page">
    <button className="talk-back-button" onClick={onBack}><ArrowLeft size={15} /> Trở lại diễn đàn</button>
    {!topic ? <div className="talk-detail-loading"><span /><span /><span /></div> : <motion.div className="talk-detail-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="talk-detail-kicker"><span>{channelName(topic.subject_channel)}</span><span className={topic.accepted_reply_id ? 'talk-status-solved' : 'talk-status-open'}>{topic.accepted_reply_id ? <><CheckCircle2 size={13} /> Đã có lời giải</> : 'Đang cần góp ý'}</span></div><h1>{topic.title}</h1><div className="talk-topic-author">{avatar(topic.author, topic.author_id)}<div><button onClick={() => topic.author_id && onOpenTeacher(topic.author_id)}>{topic.author?.full_name || 'Giáo viên EduHub'}</button><small>{[topic.author?.school_name, ago(topic.created_at)].filter(Boolean).join(' · ')}</small></div></div><p className="talk-topic-copy">{topic.content}</p>{topic.attachment_urls?.map((url) => <a className="talk-attachment" key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Ảnh đính kèm trong chủ đề" loading="lazy" /></a>)}
      <div className="talk-conversation-heading"><div><MessageCircle size={17} /><strong>Trao đổi cùng đồng nghiệp</strong><span>{replies.length} ý kiến</span></div><span className="talk-live-indicator"><i /> Đang trực tiếp</span></div>
      <div className="talk-conversation"><AnimatePresence initial={false}>{replies.filter((reply) => !reply.parent_reply_id).map((reply) => renderThread(reply))}</AnimatePresence>{!replies.length && <div className="talk-empty-replies"><span><MessageCircle size={18} /></span><b>Mở đầu cuộc trao đổi</b><p>Chia sẻ kinh nghiệm từ lớp học của thầy cô để mọi người cùng tham khảo.</p></div>}</div>
      {typingNames.length > 0 && <div className="talk-typing"><span className="typing-dots"><i /><i /><i /></span>{typingNames.join(', ')} đang nhập</div>}
      {replyTo && <div className="talk-replying-to">Đang trả lời <b>{replyTo.author?.full_name || 'đồng nghiệp'}</b><button onClick={() => setReplyTo(null)}>Hủy</button></div>}
      <form className="talk-reply-composer" onSubmit={sendReply}>{currentUser ? <span className="talk-current-avatar">{initials(currentUser.user_metadata?.full_name || currentUser.email)}</span> : <span className="talk-current-avatar"><UserRound size={16} /></span>}<textarea className="talk-reply-input" value={replyText} onChange={(event) => { setReplyText(event.target.value); startTyping(); }} onFocus={() => { if (!currentUser) onRequireAuth(); }} placeholder={currentUser ? replyTo ? `Trả lời ${replyTo.author?.full_name || 'đồng nghiệp'}...` : 'Viết chia sẻ của thầy cô...' : 'Đăng nhập để tham gia trao đổi'} rows={2} /><label className="talk-image-attach"><ImagePlus size={14} /><input type="file" accept="image/*" onChange={(event) => setReplyImage(event.target.files?.[0] || null)} />{replyImage?.name || 'Ảnh'}</label><select value={mentionChoice} onChange={(event) => setMentionChoice(event.target.value)}><option value="">Nhắc tên…</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select><button type="button" onClick={() => addMention('reply')} disabled={!mentionChoice}>@</button><button className="button button-primary" disabled={!replyText.trim() || busy}><Send size={15} /> Gửi</button></form>
    </motion.div>}
  </section>;

  return <section className="talks-page"><div className="talks-hero"><span className="talks-hero-icon"><img src="/assets/openmoji-speech.svg" alt="" /></span><div><div className="section-kicker">PHÒNG CHUYÊN MÔN EDUHUB</div><h1>Thảo luận cùng đồng nghiệp</h1><p>Hỏi từ lớp học thật. Nhận gợi ý từ thầy cô cùng bộ môn.</p></div><span className="talks-hero-flag">🇻🇳</span></div>
    <div className="talks-title-row"><div><h2>Diễn đàn bộ môn</h2><p>{topics.length} chủ đề đang được chia sẻ</p></div><button className="button button-primary" onClick={() => currentUser ? setComposer((open) => !open) : onRequireAuth()}><MessageCircle size={15} /> Mở thảo luận</button></div>
    <AnimatePresence>{composer && <motion.form className="talk-composer" onSubmit={createTopic} initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}><div className="talk-composer-heading"><span><Sparkles size={16} /></span><div><b>Mở một chủ đề mới</b><small>Đặt câu hỏi rõ để đồng nghiệp dễ chia sẻ kinh nghiệm.</small></div></div><div className="form-two-col"><label className="form-label">Bộ môn<select value={channel} onChange={(event) => setChannel(event.target.value)}>{channels.filter((item) => item.id !== 'all').map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="form-label">Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Thầy cô muốn trao đổi điều gì?" required maxLength={180} /></label></div><label className="form-label">Nội dung<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Mô tả tình huống, cách đã thử hoặc điều cần đồng nghiệp góp ý..." rows={4} required maxLength={6000} /></label><div className="talk-composer-extras"><label className="talk-image-attach"><ImagePlus size={14} />{topicImage?.name || 'Đính kèm ảnh'}<input type="file" accept="image/*" onChange={(event) => setTopicImage(event.target.files?.[0] || null)} /></label><span>Không đăng ảnh có thông tin nhận dạng học sinh.</span><select value={mentionChoice} onChange={(event) => setMentionChoice(event.target.value)}><option value="">Nhắc tên đồng nghiệp…</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select><button type="button" onClick={() => addMention('topic')} disabled={!mentionChoice}>Thêm @</button></div><div className="modal-footer-actions"><button type="button" className="button button-quiet" onClick={() => setComposer(false)}>Để sau</button><button className="button button-primary" disabled={busy}><Send size={14} /> {busy ? 'Đang đăng…' : 'Đăng chủ đề'}</button></div></motion.form>}</AnimatePresence>
    {filter !== 'all' && <div className="talk-follow-control"><span>Theo dõi môn {channelName(filter)} để nhận thông báo chủ đề mới</span><button className="button button-outline" onClick={() => void toggleChannelSubscription()}><BellRing size={13} /> {subscribedChannels.has(filter) ? 'Đang theo dõi' : 'Theo dõi bộ môn'}</button></div>}<div className="talks-browser"><aside className="talks-subjects"><b className="talks-subjects-heading">Bộ môn</b><input className="talks-subject-search" value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="Tìm môn học…" aria-label="Tìm môn học" />{visibleChannels.map((item) => <button className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} key={item.id}><item.icon size={16} /><span>{item.name}</span><ChevronRight size={14} /></button>)}</aside><div className="talks-stream"><div className="talks-feed-heading"><div><span className="talks-feed-live"><i /> Phòng giáo viên</span><h2>{channels.find((item) => item.id === filter)?.name || 'Tất cả bộ môn'}</h2></div><button onClick={() => void loadTopics()}>Làm mới <ArrowRight size={13} /></button></div>
      <div className="talk-list-controls"><div className="talk-answer-filters" role="group" aria-label="Lọc theo tình trạng trả lời">{([['all', 'Tất cả', answerCounts.all], ['unanswered', 'Đang cần góp ý', answerCounts.unanswered], ['answered', 'Đã có lời giải', answerCounts.answered]] as const).map(([id, label, count]) => <button className={answerFilter === id ? 'active' : ''} key={id} onClick={() => setAnswerFilter(id)}>{label}<span>{count}</span></button>)}</div><div className="talk-sort-controls" role="group" aria-label="Sắp xếp thảo luận"><button className={sortMode === 'newest' ? 'active' : ''} onClick={() => setSortMode('newest')}>Mới nhất</button><button className={sortMode === 'helpful' ? 'active' : ''} onClick={() => setSortMode('helpful')}>Hữu ích</button></div></div>
      {visible.length ? visible.map((item) => <motion.article layout className="talk-item" key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><button className="talk-avatar" onClick={() => item.author_id && onOpenTeacher(item.author_id)}>{item.author?.avatar_url ? <img src={item.author.avatar_url} alt="" /> : initials(item.author?.full_name)}</button><div className="talk-content"><div className="talk-meta"><span className="talk-subject-chip">{channelName(item.subject_channel)}</span><button onClick={() => item.author_id && onOpenTeacher(item.author_id)}>{item.author?.full_name || 'Giáo viên EduHub'}</button><span>· {ago(item.created_at)}</span></div><button className="talk-title" onClick={() => onOpenDetail(item.id)}>{item.title}</button><p>{item.content}</p><div className="talk-bottom"><button className={`talk-topic-vote${topicVotes.has(item.id) ? ' active' : ''}`} onClick={() => void toggleTopicVote(item)} disabled={currentUser?.id === item.author_id || topicVoteBusy.has(item.id)} aria-label={topicVotes.has(item.id) ? 'Bỏ bình chọn hữu ích' : 'Đánh dấu chủ đề hữu ích'}><Heart size={14} fill={topicVotes.has(item.id) ? 'currentColor' : 'none'} /> {Number(item.votes?.[0]?.count || 0)} hữu ích</button><span><MessageCircle size={14} /> {item.replies?.[0]?.count || 0} ý kiến</span><span className={item.accepted_reply_id ? 'talk-status-solved' : 'talk-status-open'}>{item.accepted_reply_id ? <><CheckCircle2 size={13} /> Đã có lời giải</> : 'Đang cần góp ý'}</span><button onClick={() => void reportContent(item.id)} aria-label="Báo cáo chủ đề"><Flag size={12} /> Báo cáo</button><button onClick={() => onOpenDetail(item.id)}>Vào trao đổi <ArrowRight size={14} /></button></div></div></motion.article>) : <div className="talk-empty-replies"><span><MessageCircle size={18} /></span><b>{answerFilter === 'answered' ? 'Chưa có chủ đề nào được giải đáp' : answerFilter === 'unanswered' ? 'Chưa có chủ đề cần góp ý' : 'Chưa có chủ đề ở đây'}</b><p>{answerFilter === 'answered' ? 'Khi người mở chủ đề chọn được câu trả lời phù hợp, chủ đề sẽ xuất hiện tại đây.' : 'Hãy mở đầu bằng một câu hỏi hoặc một kinh nghiệm từ lớp học của thầy cô.'}</p></div>}
    </div></div>
  </section>;
}
