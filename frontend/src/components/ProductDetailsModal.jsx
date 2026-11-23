import { CalendarDays, Package2, X } from 'lucide-react';
import { formatDate, getDaysLabel, getProductDays, getProductStatus } from '../utils/expiryUtils';
import ExpiryBadge from './ExpiryBadge';

export default function ProductDetailsModal({ product, onClose, onEdit }) {
  if (!product) return null;
  const days = getProductDays(product);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-details-title" className="modal-panel max-w-lg">
        <div className={`product-detail-art art-${product.color || 'sand'}`}>
          <button onClick={onClose} className="icon-button absolute right-4 top-4" aria-label="Close dialog"><X size={18} /></button>
          {product.image ? <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" /> : <Package2 size={54} strokeWidth={1} className="relative z-10 opacity-70" />}
          <span className="absolute bottom-4 left-5 text-xs font-medium uppercase tracking-[.18em] text-ivory/75">{product.category}</span>
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">PRODUCT DETAIL</p><h2 id="product-details-title" className="mt-2 font-display text-2xl font-semibold">{product.name}</h2></div><ExpiryBadge status={getProductStatus(product)} /></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Detail label="Quantity" value={`${product.quantity} ${product.unit}`} />
            <Detail label="Time left" value={getDaysLabel(days)} />
            <Detail label="Purchased" value={formatDate(product.purchaseDate)} />
            <Detail label="Expiry date" value={formatDate(product.expiryDate)} />
          </div>
          {product.notes && <div className="mt-5 rounded-xl bg-white/[.04] p-4"><p className="field-label">Notes</p><p className="mt-2 text-sm leading-relaxed text-ivory/80">{product.notes}</p></div>}
          {product.category === 'Medicines' && <p className="mt-4 flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} />Expiry tracking only. No medical guidance is provided.</p>}
          <div className="mt-6 flex justify-end gap-3"><button className="button-secondary" onClick={onClose}>Close</button><button className="button-primary" onClick={() => onEdit(product)}>Edit item</button></div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3.5"><p className="field-label">{label}</p><p className="mt-2 text-sm font-medium text-ivory">{value}</p></div>;
}
