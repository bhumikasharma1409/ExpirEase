import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';

const styles = {
  expired: 'badge-expired',
  today: 'badge-today',
  soon: 'badge-soon',
  safe: 'badge-safe',
};
const labels = { expired: 'Expired', today: 'Today', soon: 'Expiring soon', safe: 'Safe' };
const icons = { expired: AlertCircle, today: Clock3, soon: Clock3, safe: CheckCircle2 };

export default function ExpiryBadge({ status, compact = false }) {
  const Icon = icons[status] || CheckCircle2;
  return (
    <span className={`expiry-badge ${styles[status] || styles.safe} ${compact ? 'px-2 py-1 text-[10px]' : ''}`}>
      <Icon size={compact ? 11 : 13} strokeWidth={2} />
      {labels[status] || 'Safe'}
    </span>
  );
}
