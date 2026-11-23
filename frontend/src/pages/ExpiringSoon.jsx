import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';
import { formatDate, getDaysLabel, getProductDays } from '../utils/expiryUtils';
import ExpiryBadge from '../components/ExpiryBadge';
import EmptyState from '../components/EmptyState';

export default function ExpiringSoon() {
  const { products, deleteProduct, loadProducts, dataLoading } = useInventory();
  const { openAdd, openEdit } = useOutletContext();
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState('');
  const upcoming = useMemo(() => [...products].sort((a, b) => getProductDays(a) - getProductDays(b)), [products]);
  useEffect(() => {
    setRequestError('');
    loadProducts({}, ['/api/products/expiring/today', '/api/products/expiring/soon'])
      .catch((error) => {
        setRequestError(error.message);
        toast.error(error.message);
      });
  }, [loadProducts]);
  const todayCount = upcoming.filter((product) => getProductDays(product) <= 1).length;
  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}" from your inventory?`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Item removed from inventory');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-heading-row"><div><p className="eyebrow">A GENTLE HEADS-UP</p><h1 className="page-title">Coming up soon<span className="heading-count">{upcoming.length}</span></h1><p className="mt-2 text-sm text-muted">Items with an expiry date in the next 7 days.</p></div><button onClick={() => navigate('/inventory')} className="button-secondary">All inventory <ArrowRight size={15} /></button></div>
      {upcoming.length > 0 && <div className="attention-banner"><span className="attention-icon"><Sun size={18} /></span><div><p className="text-sm font-semibold text-ivory">{todayCount ? `${todayCount} ${todayCount === 1 ? 'item deserves' : 'items deserve'} a look today` : 'You’re right on time'}</p><p className="mt-1 text-xs text-muted">A quick check now can keep good things from going to waste.</p></div></div>}
      {dataLoading && <p role="status" className="text-xs text-muted">Loading expiry reminders…</p>}
      {requestError && <p role="alert" className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">{requestError}</p>}
      {upcoming.length ? <div className="space-y-3">{upcoming.map((product, index) => {
        const days = getProductDays(product);
        const urgent = days <= 1;
        return <article key={product.id} className={`upcoming-card ${urgent ? 'upcoming-urgent' : ''}`}>
          <span className={`upcoming-index ${urgent ? 'text-coral' : 'text-muted'}`}>{String(index + 1).padStart(2, '0')}</span>
          {product.image ? <img src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <span className={`product-thumb thumb-${product.color || 'sand'}`}><Clock3 size={19} /></span>}
          <div className="min-w-0 flex-1"><h2 className="truncate font-display text-sm font-semibold text-ivory">{product.name}</h2><p className="mt-1 text-xs text-muted">{product.category} <span className="mx-1.5 text-white/20">·</span>{product.quantity} {product.unit}</p></div>
          <div className="hidden text-right sm:block"><p className={`text-xs font-medium ${urgent ? 'text-coral' : 'text-ivory/80'}`}>{getDaysLabel(days)}</p><p className="mt-1 text-[10px] text-muted">{formatDate(product.expiryDate)}</p></div>
          <ExpiryBadge status={days === 0 ? 'today' : 'soon'} compact />
          <button onClick={() => openEdit(product)} className="button-secondary !px-3 !py-2 text-xs">Edit</button>
          <button onClick={() => remove(product)} className="text-xs text-muted transition hover:text-coral" aria-label={`Delete ${product.name}`}>Remove</button>
        </article>;
      })}</div> : !dataLoading && !requestError && <section className="panel-card"><EmptyState title="No products are approaching expiry." description="Your next seven days are clear. Add an item and we’ll keep an eye on its expiry date." action={openAdd} actionLabel="Add Your First Product" /></section>}
      <p className="page-footnote">Timing is everything. <span>— ExpirEase</span></p>
    </div>
  );
}
