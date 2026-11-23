import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search your inventory…', className = '' }) {
  return (
    <label className={`search-field ${className}`}>
      <Search size={17} className="shrink-0 text-muted" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label="Search products" />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="text-muted hover:text-ivory"><X size={15} /></button>}
      {!value && <kbd className="hidden text-[10px] text-muted sm:block">⌘ K</kbd>}
    </label>
  );
}
