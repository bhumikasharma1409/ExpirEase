import { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Grid2X2, List, Plus, SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';
import { CATEGORY_OPTIONS } from '../utils/expiryUtils';
import ProductCard from '../components/ProductCard';
import ProductTable from '../components/ProductTable';
import ProductDetailsModal from '../components/ProductDetailsModal';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';

export default function Inventory() {
  const { products, productsMeta, deleteProduct, consumeProduct, loadProducts, dataLoading } = useInventory();
  const { openAdd, openEdit } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') || '');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const [sort, setSort] = useState('nearest');
  const [view, setView] = useState('grid');
  const [details, setDetails] = useState(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    setQuery(params.get('search') || '');
    setPage(1);
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRequestError('');
      const selectedStatus = {
        'All statuses': undefined,
        'Expiring soon': 'soon',
        'Expiring today': 'today',
        Expired: 'expired',
        Safe: 'safe',
      }[status];
      loadProducts({
        search: query.trim(),
        category: category === 'All categories' ? undefined : category,
        status: selectedStatus,
        sort: sort === 'oldest' ? 'farthest' : sort,
        page,
        limit: 20,
      }).catch((error) => {
        setRequestError(error.message);
        toast.error(error.message);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, category, status, sort, page, loadProducts]);

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}" from your inventory?`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Item removed from inventory');
      if (details?.id === product.id) setDetails(null);
    } catch (error) {
      toast.error(error.message);
    }
  };
  const consume = async (product) => {
    try {
      await consumeProduct(product.id);
      toast.success('Marked as consumed');
    } catch (error) {
      toast.error(error.message);
    }
  };
  const resetFilters = () => {
    setQuery('');
    setCategory('All categories');
    setStatus('All statuses');
    setSort('nearest');
    setPage(1);
    setParams({});
  };
  const updateQuery = (value) => {
    setQuery(value);
    setPage(1);
    setParams(value ? { search: value } : {}, { replace: true });
  };
  const hasFilters = query || category !== 'All categories' || status !== 'All statuses';

  return (
    <div className="space-y-6">
      <div className="page-heading-row"><div><p className="eyebrow">EVERYTHING IN ITS PLACE</p><h1 className="page-title">My inventory<span className="heading-count">{productsMeta.total}</span></h1><p className="mt-2 text-sm text-muted">A considered view of everything you’re keeping.</p></div><button onClick={openAdd} className="button-primary"><Plus size={16} />Add a product</button></div>
      <section className="panel-card">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <SearchBar value={query} onChange={updateQuery} className="w-full sm:max-w-xs" />
            <div className={`grid grid-cols-2 gap-2 sm:flex ${mobileFilters ? '' : 'hidden sm:flex'}`}>
              <select aria-label="Filter by category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option>All categories</option>{CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
              <select aria-label="Filter by expiry status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option>All statuses</option><option>Expiring today</option><option>Expiring soon</option><option>Expired</option><option>Safe</option></select>
            </div>
            <button className="icon-button !flex sm:!hidden" onClick={() => setMobileFilters(!mobileFilters)} aria-label="Toggle filters"><SlidersHorizontal size={17} /></button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><span className="hidden text-[11px] text-muted sm:inline">Sort by</span><select aria-label="Sort inventory" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="nearest">Nearest expiry</option><option value="oldest">Furthest expiry</option><option value="name">Name A–Z</option></select></div>
            <div className="view-toggle"><button className={view === 'grid' ? 'view-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><Grid2X2 size={16} /></button><button className={view === 'list' ? 'view-active' : ''} onClick={() => setView('list')} aria-label="List view"><List size={17} /></button></div>
          </div>
        </div>
        {(hasFilters || productsMeta.total > 20) && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-[11px] text-muted">Showing {products.length} of {productsMeta.total}</span>{hasFilters && <button onClick={resetFilters} className="flex items-center gap-1 rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] text-ivory/80 hover:bg-white/[.1]">Clear filters <X size={11} /></button>}</div>}
      </section>

      {dataLoading && <p className="text-xs text-muted" role="status">Loading your inventory…</p>}
      {requestError && <p role="alert" className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">{requestError}</p>}
      {products.length ? view === 'grid' ? <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} onEdit={openEdit} onDelete={remove} onConsume={consume} onDetails={setDetails} />)}</section> : <section className="panel-card !p-0"><ProductTable products={products} onEdit={openEdit} onDelete={remove} onConsume={consume} onDetails={setDetails} /></section> : !dataLoading && !requestError && <section className="panel-card"><EmptyState title={hasFilters ? 'No matches on this shelf' : 'No products added yet. Start by adding your first item.'} description={hasFilters ? 'Try another search or clear the filters to see more.' : 'Keep track of expiry dates and reminders in one thoughtful place.'} action={hasFilters ? resetFilters : openAdd} actionLabel={hasFilters ? 'Clear filters' : 'Add Your First Product'} /></section>}
      {productsMeta.totalPages > 1 && <nav aria-label="Inventory pages" className="flex items-center justify-between"><span className="text-xs text-muted">Page {productsMeta.page} of {productsMeta.totalPages}</span><div className="flex gap-2"><button className="button-secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button className="button-secondary" disabled={page >= productsMeta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></nav>}
      <p className="page-footnote">A good place for everything. <span>— ExpirEase</span></p>
      <ProductDetailsModal product={details} onClose={() => setDetails(null)} onEdit={(product) => { setDetails(null); openEdit(product); }} />
    </div>
  );
}
