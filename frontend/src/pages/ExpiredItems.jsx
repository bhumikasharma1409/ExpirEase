import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArchiveRestore, CircleAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';
import { formatDate, getProductDays } from '../utils/expiryUtils';
import EmptyState from '../components/EmptyState';

export default function ExpiredItems() {
  const { products, dashboard, deleteProduct, discardProduct, loadProducts, dataLoading } = useInventory();
  const { openAdd, openEdit } = useOutletContext();
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState('');
  const expired = useMemo(() => products, [products]);
  const discardedCount = dashboard?.statistics?.discardedProducts || 0;
  useEffect(() => {
    setRequestError('');
    loadProducts({}, '/api/products/expired').catch((error) => {
      setRequestError(error.message);
      toast.error(error.message);
    });
  }, [loadProducts]);

  const discard = async (product) => {
    try {
      await discardProduct(product.id);
      toast.success('Marked as discarded');
    } catch (error) {
      toast.error(error.message);
    }
  };
  const remove = async (product) => {
    if (!window.confirm(`Permanently delete "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Item deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-heading-row"><div><p className="eyebrow">PAST THEIR DATE</p><h1 className="page-title">Expired items<span className="heading-count heading-count-coral">{expired.length}</span></h1><p className="mt-2 text-sm text-muted">Review what’s past its date and clear it from your active shelf.</p></div><button onClick={() => navigate('/inventory')} className="button-secondary">All inventory</button></div>
      {expired.length > 0 && <div className="expired-callout"><CircleAlert size={18} /><p><strong>{expired.length} {expired.length === 1 ? 'item is' : 'items are'}</strong> past its expiry date. Please check the product label and decide what to do next.</p></div>}
      {dataLoading && <p role="status" className="text-xs text-muted">Loading expired products…</p>}
      {requestError && <p role="alert" className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">{requestError}</p>}
      {expired.length ? <section className="space-y-3">{expired.map((product) => <article key={product.id} className="expired-card">
        <div className="expired-flag"><CircleAlert size={16} />EXPIRED {Math.abs(getProductDays(product))} {Math.abs(getProductDays(product)) === 1 ? 'DAY' : 'DAYS'} AGO</div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`product-thumb thumb-${product.color || 'sand'}`}><CircleAlert size={18} /></span>
          <div className="min-w-0 flex-1"><h2 className="truncate font-display text-sm font-semibold text-ivory">{product.name}</h2><p className="mt-1 text-xs text-muted">{product.category} <span className="mx-1.5 text-white/20">·</span>{product.quantity} {product.unit}</p></div>
          <div className="hidden text-right sm:block"><p className="text-xs text-muted">Expiry date</p><p className="mt-1 text-xs text-ivory/80">{formatDate(product.expiryDate)}</p></div>
          <button onClick={() => openEdit(product)} className="button-secondary !px-3 !py-2 text-xs">Edit</button>
          <button onClick={() => discard(product)} className="button-secondary !border-coral/20 !px-3 !py-2 text-xs !text-coral hover:!bg-coral/10"><ArchiveRestore size={13} />Discarded</button>
          <button onClick={() => remove(product)} className="icon-button !h-8 !w-8 !text-muted hover:!text-coral" aria-label={`Delete ${product.name}`}><Trash2 size={15} /></button>
        </div>
      </article>)}</section> : !dataLoading && !requestError && <section className="panel-card"><EmptyState title="No expired products. Great job!" description="Your active inventory has nothing past its expiry date." action={openAdd} actionLabel="Add Your First Product" /></section>}
      {discardedCount > 0 && <p className="text-xs text-muted">{discardedCount} {discardedCount === 1 ? 'item has' : 'items have'} been marked discarded and removed from active tracking.</p>}
      <p className="page-footnote">Clear space for the next good thing. <span>— ExpirEase</span></p>
    </div>
  );
}
