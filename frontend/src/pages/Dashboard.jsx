import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ArrowUpRight, CircleAlert, Clock3, PackageCheck, PackageOpen, Sparkles } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { daysUntil, formatDate, getDaysLabel, getExpiryStatus, toDateKey } from '../utils/expiryUtils';
import StatCard from '../components/StatCard';
import ExpiryBadge from '../components/ExpiryBadge';
import EmptyState from '../components/EmptyState';

const COLORS = ['#C7F36B', '#E4B86C', '#D98B70', '#65566F'];

export default function Dashboard() {
  const { products } = useInventory();
  const { openAdd } = useOutletContext();
  const navigate = useNavigate();
  const summary = useMemo(() => {
    const statuses = products.map((product) => getExpiryStatus(product.expiryDate));
    return {
      total: products.length,
      soon: statuses.filter((status) => status === 'today' || status === 'soon').length,
      expired: statuses.filter((status) => status === 'expired').length,
      safe: statuses.filter((status) => status === 'safe').length,
    };
  }, [products]);
  const priority = [...products].filter((product) => daysUntil(product.expiryDate) >= 0)
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)).slice(0, 4);
  const recent = [...products].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)).slice(0, 5);
  const chartData = [
    { name: 'Safe', value: summary.safe, fill: COLORS[0] },
    { name: 'This week', value: summary.soon, fill: COLORS[1] },
    { name: 'Expired', value: summary.expired, fill: COLORS[2] },
  ];
  const trendData = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const key = toDateKey(date);
    return {
      day: offset === 0 ? 'Today' : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      expiring: products.filter((product) => product.expiryDate === key).length,
    };
  });

  return (
    <div className="space-y-7">
      <section className="dashboard-hero">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow text-lime"><Sparkles size={13} /> {products.length ? 'YOUR WEEK, AT A GLANCE' : 'A FRESH START'}</p>
          {products.length ? <>
            <h1 className="mt-3 font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">A little attention.<br /><span className="text-lime">A lot less waste.</span></h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">You have <strong className="font-medium text-ivory">{summary.soon} {summary.soon === 1 ? 'item' : 'items'}</strong> coming up this week. Keep the good stuff moving.</p>
            <button onClick={() => navigate('/expiring-soon')} className="hero-link mt-5">See what needs you <ArrowRight size={14} /></button>
          </> : <>
            <h1 className="mt-3 font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">Your inventory is<br /><span className="text-lime">looking fresh!</span></h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">Add your first product to start keeping track of expiry dates and reminders.</p>
            <button onClick={openAdd} className="button-primary mt-5">Add Your First Product <ArrowRight size={14} /></button>
          </>}
        </div>
        <div className="hero-orbit"><span className="orbit-ring orbit-ring-one" /><span className="orbit-ring orbit-ring-two" /><span className="orbit-core"><PackageCheck size={26} /></span><span className="orbit-spark">✳</span></div>
        <span className="hero-stamp">LESS WASTE<br />MORE GOOD</span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={summary.total} note="Across your shelves" icon={PackageOpen} tone="lime" />
        <StatCard label="Expiring Soon" value={summary.soon} note="Worth a closer look" icon={Clock3} tone="amber" />
        <StatCard label="Expired Items" value={summary.expired} note="Check and clear" icon={CircleAlert} tone="coral" />
        <StatCard label="Safe Products" value={summary.safe} note="More than 7 days left" icon={PackageCheck} tone="lavender" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.5fr]">
        <article className="panel-card">
          <SectionHeading eyebrow="THE BIG PICTURE" title="Expiry overview" trailing={<button onClick={() => navigate('/inventory')} className="text-muted transition hover:text-lime"><ArrowUpRight size={16} /></button>} />
          {products.length ? <div className="mt-3 grid items-center gap-1 sm:grid-cols-[1fr_1fr]">
            <div className="relative h-[190px]">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={4} stroke="none">{chartData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-3xl font-semibold">{summary.total}</span><span className="text-[10px] uppercase tracking-[.15em] text-muted">products</span></div>
            </div>
            <div className="space-y-3">{chartData.map((item) => <div key={item.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-muted"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />{item.name}</span><span className="font-medium text-ivory">{item.value} <span className="text-muted">({summary.total ? Math.round(item.value / summary.total * 100) : 0}%)</span></span></div>)}</div>
          </div> : <EmptyState title="Your inventory is looking fresh!" description="Your expiry overview will appear here after you add your first product." action={openAdd} actionLabel="Add Your First Product" />}
          <div className="mt-4 border-t border-white/[.07] pt-3"><div className="flex items-center justify-between"><span className="text-[11px] text-muted">Items in good shape this week</span><span className="text-xs font-semibold text-lime">{summary.safe} products</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-lime transition-all" style={{ width: `${summary.total ? summary.safe / summary.total * 100 : 0}%` }} /></div></div>
        </article>
        <article className="panel-card">
          <SectionHeading eyebrow="THE NEXT SEVEN DAYS" title="Expiry outlook" trailing={<span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] text-muted">LIVE DATA</span>} />
          {products.length ? <div className="mt-3 h-[205px]">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ left: -20, right: 4, top: 10, bottom: 0 }}><defs><linearGradient id="savedGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#C7F36B" stopOpacity={0.28} /><stop offset="95%" stopColor="#C7F36B" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(245,240,231,.07)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8F8297', fontSize: 10 }} dy={9} /><YAxis hide domain={[0, 'dataMax + 3']} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="expiring" name="Expiring items" stroke="#C7F36B" strokeWidth={2} fill="url(#savedGradient)" activeDot={{ r: 4, fill: '#C7F36B', stroke: '#21182B', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer>
          </div> : <EmptyState title="Your outlook starts here" description="Add a product to see what’s coming up over the next seven days." action={openAdd} actionLabel="Add Your First Product" />}
          {products.length > 0 && <div className="flex items-center justify-between border-t border-white/[.07] pt-3 text-[11px]"><span className="text-muted">Items expiring each day this week</span><span className="flex items-center gap-1 text-lime"><ArrowUpRight size={12} />{summary.soon} this week</span></div>}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[.88fr_1.52fr]">
        <article className="panel-card">
          <SectionHeading eyebrow="THE NEAREST DATES" title="Use these first" trailing={<button onClick={() => navigate('/expiring-soon')} className="text-xs font-medium text-lime hover:text-lime/80">See all <ArrowRight size={13} className="inline" /></button>} />
          <div className="mt-4 space-y-2.5">
            {priority.length ? priority.map((product, index) => <button key={product.id} className={`priority-row ${daysUntil(product.expiryDate) <= 1 ? 'priority-urgent' : ''}`} onClick={() => navigate('/inventory')}>
              <span className="priority-index">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-semibold text-ivory">{product.name}</span><span className="mt-1 block text-[10px] text-muted">{product.category}</span></span><span className={`text-right text-[11px] font-medium ${daysUntil(product.expiryDate) <= 1 ? 'text-coral' : 'text-amber-200'}`}>{getDaysLabel(daysUntil(product.expiryDate))}<span className="mt-1 block text-[9px] font-normal text-muted">{formatDate(product.expiryDate, { month: 'short', day: 'numeric' })}</span></span>
            </button>) : <EmptyState title={products.length ? 'Nothing urgent' : 'Your inventory is looking fresh!'} description={products.length ? 'A clear horizon. Your next reminders will show up here.' : 'Add your first product to see priority reminders.'} action={products.length ? undefined : openAdd} actionLabel="Add Your First Product" />}
          </div>
        </article>
        <article className="panel-card !p-0">
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6"><SectionHeading eyebrow="JUST ADDED" title="Recent inventory" /><button onClick={() => navigate('/inventory')} className="flex items-center gap-1 text-xs font-medium text-lime hover:text-lime/80">All items <ArrowRight size={13} /></button></div>
          {recent.length ? <div className="mt-3 overflow-x-auto"><table className="product-table recent-table"><thead><tr><th>Product</th><th>Quantity</th><th>Expiry date</th><th>Time left</th><th>Status</th></tr></thead><tbody>{recent.map((product) => <tr key={product.id}><td><button className="font-semibold text-ivory hover:text-lime" onClick={() => navigate('/inventory')}>{product.name}</button><span className="mt-1 block text-[10px] text-muted">{product.category}</span></td><td>{product.quantity} {product.unit}</td><td>{formatDate(product.expiryDate)}</td><td>{getDaysLabel(daysUntil(product.expiryDate))}</td><td><ExpiryBadge status={getExpiryStatus(product.expiryDate)} compact /></td></tr>)}</tbody></table></div> : <EmptyState title="Your inventory is looking fresh!" description="Your recent products will appear here once you add an item." action={openAdd} actionLabel="Add Your First Product" />}
        </article>
      </section>
      <p className="page-footnote">Small steps, longer shelf lives. <span>— ExpirEase</span></p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, trailing }) {
  return <div className="flex items-end justify-between"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ivory">{title}</h2></div>{trailing}</div>;
}
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span className="text-muted">{label || payload[0].name}</span><strong>{payload[0].value} items</strong></div>;
}
