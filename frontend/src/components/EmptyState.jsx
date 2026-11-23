import { PackageOpen } from 'lucide-react';

export default function EmptyState({ title = 'Nothing on this shelf', description = 'When there is something to see, it will find its way here.', action, actionLabel = 'Add a product' }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration"><PackageOpen size={29} strokeWidth={1.4} /></div>
      <p className="mt-5 font-display text-lg font-semibold text-ivory">{title}</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      {action && <button className="button-primary mt-5" onClick={action}>{actionLabel}</button>}
    </div>
  );
}
