import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Activity, ArrowDownToLine, Eye, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Row = { resource_id: string; title: string; day: string; views: number; unique_visitors: number };
export function CreatorAnalyticsPage({ currentUser, onNotice }: { currentUser: User | null; onNotice: (message: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(Boolean(currentUser));
  useEffect(() => {
    if (!currentUser || !supabase) { setRows([]); setLoading(false); return; }
    let active = true; setLoading(true);
    const start = new Date(); start.setDate(start.getDate() - range + 1);
    void supabase.rpc('get_my_creator_analytics', { p_from: start.toISOString().slice(0, 10) }).then(({ data, error }) => {
      if (!active) return;
      if (error) onNotice(`Không tải được phân tích dự án: ${error.message}`);
      setRows((data || []) as Row[]); setLoading(false);
    });
    return () => { active = false; };
  }, [currentUser?.id, range]);
  const byResource = useMemo(() => {
    const totals = new Map<string, { resource_id: string; title: string; views: number; unique: number; days: Set<string> }>();
    rows.forEach((row) => { const item = totals.get(row.resource_id) || { resource_id: row.resource_id, title: row.title, views: 0, unique: 0, days: new Set<string>() }; item.views += Number(row.views); item.unique += Number(row.unique_visitors); item.days.add(row.day); totals.set(row.resource_id, item); });
    return [...totals.values()].sort((a, b) => b.views - a.views);
  }, [rows]);
  const totalViews = rows.reduce((sum, row) => sum + Number(row.views), 0);
  const visitors = rows.reduce((sum, row) => sum + Number(row.unique_visitors), 0);
  if (!currentUser) return <section className="creator-analytics-page"><div className="empty-state"><div className="empty-icon"><Activity size={20} /></div><h3>Đăng nhập để xem hiệu quả chia sẻ</h3><p>Bảng này chỉ tổng hợp lượt xem học liệu của tài khoản đang đăng nhập.</p></div></section>;
  return <section className="creator-analytics-page"><header className="creator-analytics-hero"><span><TrendingUp size={23} /></span><div><span className="section-kicker">SỐ LIỆU RIÊNG CỦA TÁC GIẢ</span><h2>Phân tích dự án</h2><p>Chỉ xem số liệu tổng hợp theo dự án; không hiển thị danh tính hay lịch sử xem của từng giáo viên.</p></div><select value={range} onChange={(event) => setRange(Number(event.target.value))}><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select></header><div className="creator-metrics"><article><span><Eye size={16} /></span><small>Lượt xem</small><b>{totalViews.toLocaleString('vi-VN')}</b><em>trong {range} ngày</em></article><article><span><Activity size={16} /></span><small>Lượt xem duy nhất / ngày</small><b>{visitors.toLocaleString('vi-VN')}</b><em>đã gộp theo ngày</em></article><article><span><FileText size={16} /></span><small>Dự án có lượt xem</small><b>{byResource.length.toLocaleString('vi-VN')}</b><em>tổng hợp riêng tư</em></article></div>{loading ? <div className="creator-analytics-loading"><span className="button-spinner" /> Đang tổng hợp số liệu…</div> : byResource.length ? <div className="creator-resource-analytics"><div><h3>Hiệu quả theo học liệu</h3><small>Lượt xem được ghi nhận kể từ khi bật theo dõi.</small></div>{byResource.map((item) => <article key={item.resource_id}><span><b>{item.title}</b><small>{item.days.size} ngày có lượt xem</small></span><strong><Eye size={14} /> {item.views.toLocaleString('vi-VN')}<small>{item.unique.toLocaleString('vi-VN')} lượt xem duy nhất/ngày</small></strong></article>)}</div> : <div className="empty-state"><div className="empty-icon"><ArrowDownToLine size={20} /></div><h3>Chưa có lượt xem trong kỳ</h3><p>Khi giáo viên mở trang chi tiết dự án, số liệu tổng hợp sẽ xuất hiện tại đây.</p></div>}</section>;
}
