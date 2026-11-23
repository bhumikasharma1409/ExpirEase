import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORY_OPTIONS, toDateKey } from '../utils/expiryUtils';

const emptyForm = () => ({
  name: '', category: 'Food & Groceries', quantity: '1', unit: 'pieces',
  purchaseDate: toDateKey(), expiryDate: '', notes: '', image: '',
});
const units = ['pieces', 'kg', 'grams', 'litres', 'ml', 'packs'];

export default function AddItemModal({ open, onClose, product, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? { ...emptyForm(), ...product, quantity: String(product.quantity) } : emptyForm());
      setError('');
    }
  }, [open, product]);

  if (!open) return null;
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file to continue.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setError('Images must be 1 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('image', reader.result);
    reader.onerror = () => setError('This image could not be read. Please try another.');
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Add a product name.');
    if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0) return setError('Quantity must be greater than zero.');
    if (!form.purchaseDate || !form.expiryDate) return setError('Choose both a purchase date and expiry date.');
    if (form.expiryDate < form.purchaseDate) return setError('Expiry date cannot be before purchase date.');
    setBusy(true);
    try {
      await onSave({ ...form, name: form.name.trim(), quantity: Number(form.quantity) });
      toast.success(product ? 'Item updated' : 'Item added to your inventory');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="item-form-title" className="modal-panel">
        <div className="flex items-start justify-between border-b border-white/[.08] px-5 py-5 sm:px-7">
          <div><p className="eyebrow">YOUR INVENTORY</p><h2 id="item-form-title" className="mt-2 font-display text-2xl font-semibold">{product ? 'Refine your item' : 'Add something new'}</h2><p className="mt-1 text-sm text-muted">A little detail now makes reminders more useful later.</p></div>
          <button onClick={onClose} className="icon-button" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" className="sm:col-span-2"><input autoFocus value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Almond milk" /></Field>
            <Field label="Category"><select value={form.category} onChange={(event) => setField('category', event.target.value)}>{CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select></Field>
            <Field label="Quantity"><div className="flex gap-2"><input type="number" min="0.01" step="any" value={form.quantity} onChange={(event) => setField('quantity', event.target.value)} /><select aria-label="Unit" value={form.unit} onChange={(event) => setField('unit', event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></div></Field>
            <Field label="Purchase date"><input type="date" value={form.purchaseDate} onChange={(event) => setField('purchaseDate', event.target.value)} /></Field>
            <Field label="Expiry date"><input type="date" value={form.expiryDate} min={form.purchaseDate} onChange={(event) => setField('expiryDate', event.target.value)} /></Field>
          </div>
          <Field label="Notes" optional><textarea rows="3" maxLength="300" value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Where you keep it, or anything useful to remember…" /></Field>
          <div>
            <label className="field-label">Photo <span className="text-muted">(optional)</span></label>
            <label className="upload-field">
              {form.image ? <img src={form.image} alt="Product preview" className="h-10 w-10 rounded-lg object-cover" /> : <ImagePlus size={18} className="text-muted" />}
              <span>{form.image ? 'Choose a different image' : 'Add a photo'}<small>JPG, PNG or WebP · up to 1 MB</small></span>
              <input type="file" accept="image/*" onChange={handleImage} className="sr-only" />
            </label>
          </div>
          {error && <p role="alert" className="rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-white/[.08] pt-4">
            <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
            <button disabled={busy} className="button-primary">{busy ? 'Saving…' : product ? 'Save changes' : 'Add to inventory'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, optional, className = '', children }) {
  return <label className={className}><span className="field-label">{label} {optional && <span className="text-muted">(optional)</span>}</span>{children}</label>;
}
