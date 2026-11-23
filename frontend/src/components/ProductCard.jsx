import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const edge = 8;
      const gap = 6;
      const menuRect = menu.getBoundingClientRect();
      const menuHeight = menuRect.height;
      const menuWidth = menuRect.width;
      const belowSpace = viewportTop + viewportHeight - rect.bottom - edge - gap;
      const aboveSpace = rect.top - viewportTop - edge - gap;
      const openBelow = belowSpace >= menuHeight;
      const availableHeight = Math.max(0, Math.min(menuHeight, openBelow ? belowSpace : aboveSpace));
      const left = Math.max(
        viewportLeft + edge,
        Math.min(rect.right - menuWidth, viewportLeft + viewportWidth - menuWidth - edge),
      );
      const top = openBelow
        ? rect.bottom + gap
        : Math.max(viewportTop + edge, rect.top - gap - availableHeight);

      setPosition({ left, top, maxHeight: availableHeight });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);

    const onPointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const runAction = (action) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <div className="product-actions">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Product actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            setPosition(null);
            setOpen((current) => !current);
          }}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
      {open && createPortal(
        <div
          ref={menuRef}
          className="product-action-menu"
          role="menu"
          style={{
            left: position?.left ?? 0,
            top: position?.top ?? 0,
            maxHeight: position?.maxHeight ?? 'min(180px, calc(100dvh - 16px))',
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          <button type="button" role="menuitem" onClick={() => runAction(onEdit)}>Edit item</button>
          <button type="button" role="menuitem" onClick={() => runAction(onConsume)}>Mark consumed</button>
          <button type="button" role="menuitem" onClick={() => runAction(onDelete)} className="text-coral">Delete item</button>
        </div>,
        document.body,
      )}
    </>
  );
}
