import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { daysUntil, formatDate, getDaysLabel, getExpiryStatus } from '../utils/expiryUtils';
import ExpiryBadge from './ExpiryBadge';

export default function ProductTable({ products, onEdit, onDelete, onDetails }) {
  if (!products.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="product-table">
        <thead><tr><th>Product</th><th>Category</th><th>Quantity</th><th>Expiry date</th><th>Time left</th><th>Status</th><th /></tr></thead>
        <tbody>
          {products.map((product) => {
            const days = daysUntil(product.expiryDate);
            return (
              <tr key={product.id}>
                <td><button className="font-semibold text-ivory hover:text-lime" onClick={() => onDetails(product)}>{product.name}</button></td>
                <td>{product.category}</td>
                <td>{product.quantity} {product.unit}</td>
                <td>{formatDate(product.expiryDate)}</td>
                <td className={days <= 1 ? 'text-coral' : ''}>{getDaysLabel(days)}</td>
                <td><ExpiryBadge status={getExpiryStatus(product.expiryDate)} compact /></td>
                <td><div className="flex justify-end gap-1">
                  <button className="icon-button !h-8 !w-8" onClick={() => onEdit(product)} title="Edit"><Pencil size={14} /></button>
                  <button className="icon-button !h-8 !w-8" onClick={() => onDelete(product)} title="Delete"><Trash2 size={14} /></button>
                  <button className="icon-button !h-8 !w-8" onClick={() => onDetails(product)} title="Details"><ArrowUpRight size={14} /></button>
                </div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
