import { CalendarDays, MoreHorizontal, Package2 } from 'lucide-react';
import { formatDate, getDaysLabel, getProductDays, getProductStatus } from '../utils/expiryUtils';
import ExpiryBadge from './ExpiryBadge';

const categoryMark = {
  'Food & Groceries': 'FOOD',
  Medicines: 'CARE',
  'Personal Care': 'CARE',
  Household: 'HOME',
  Others: 'OTHER',
};

export default function ProductCard({ product, onEdit, onDelete, onConsume, onDetails, view = 'grid' }) {
  const days = getProductDays(product);
  const status = getProductStatus(product);
  const classColor = product.color || 'sand';
  if (view === 'list') {
    return (
      <div className="product-list-row">
        <div className={`product-thumb thumb-${classColor}`}><Package2 size={20} /></div>
        <div className="min-w-0 flex-1">
          <button onClick={() => onDetails(product)} className="block truncate text-left font-semibold text-ivory hover:text-lime">{product.name}</button>
          <span className="text-xs text-muted">{product.category}</span>
        </div>
        <div className="hidden w-24 text-sm text-muted sm:block">{product.quantity} {product.unit}</div>
        <div className="hidden w-32 text-sm text-muted md:block">{formatDate(product.expiryDate)}</div>
        <div className="hidden w-28 text-sm text-ivory/80 lg:block">{getDaysLabel(days)}</div>
        <ExpiryBadge status={status} compact />
        <ProductActions onEdit={() => onEdit(product)} onDelete={() => onDelete(product)} onConsume={() => onConsume(product)} />
      </div>
    );
  }

  return (
    <article className="product-card group">
      <div className={`product-art art-${classColor}`}>
        <span className="product-category-mark">{categoryMark[product.category] || 'OTHER'}</span>
        <span className="product-art-number">NO. {String(product.id).slice(-2).toUpperCase()}</span>
        <div className="product-art-shape"><Package2 size={27} strokeWidth={1.3} /></div>
        <ProductActions onEdit={() => onEdit(product)} onDelete={() => onDelete(product)} onConsume={() => onConsume(product)} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button onClick={() => onDetails(product)} className="truncate text-left font-display text-[15px] font-semibold text-ivory hover:text-lime">{product.name}</button>
            <p className="mt-1 text-xs text-muted">{product.category}</p>
          </div>
          <ExpiryBadge status={status} compact />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted"><CalendarDays size={13} />{formatDate(product.expiryDate, { month: 'short', day: 'numeric' })}</span>
          <span className={`font-medium ${days <= 1 ? 'text-coral' : days <= 7 ? 'text-amber-300' : 'text-ivory/80'}`}>{getDaysLabel(days)}</span>
        </div>
      </div>
    </article>
  );
}

function ProductActions({ onEdit, onDelete, onConsume }) {
  return (
    <details className="product-actions">
      <summary aria-label="Product actions"><MoreHorizontal size={17} /></summary>
      <div className="product-action-menu">
        <button onClick={onEdit}>Edit item</button>
        <button onClick={onConsume}>Mark consumed</button>
        <button onClick={onDelete} className="text-coral">Delete item</button>
      </div>
    </details>
  );
}
