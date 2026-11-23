import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, note, icon: Icon, tone = 'lime', trend }) {
  return (
    <article className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-muted">{label}</p>
          <p className="mt-3 font-display text-[32px] font-semibold leading-none tracking-tight text-ivory">{value}</p>
        </div>
        <span className={`stat-icon stat-icon-${tone}`}><Icon size={19} strokeWidth={1.8} /></span>
      </div>
      <div className="mt-5 flex items-center justify-between text-[11px]">
        <span className="text-muted">{note}</span>
        {trend && <span className="flex items-center gap-1 text-lime"><ArrowUpRight size={13} />{trend}</span>}
        {!trend && tone === 'coral' && <ArrowDownRight size={14} className="text-coral" />}
      </div>
    </article>
  );
}
