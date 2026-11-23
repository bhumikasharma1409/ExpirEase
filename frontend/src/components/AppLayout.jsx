import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AddItemModal from './AddItemModal';
import { useInventory } from '../context/InventoryContext';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { addProduct, updateProduct } = useInventory();
  const location = useLocation();
  const pageKey = location.pathname;
  const [editing, setEditing] = useState(null);
  return (
    <div className="app-shell">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} onAdd={() => setModalOpen(true)} />
      <main className="main-shell">
        <Navbar onMenu={() => setDrawerOpen(true)} onAdd={() => setModalOpen(true)} />
        <div key={pageKey} className="page-content"><Outlet context={{ openAdd: () => { setEditing(null); setModalOpen(true); }, openEdit: (product) => { setEditing(product); setModalOpen(true); } }} /></div>
      </main>
      <AddItemModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} product={editing} onSave={(product) => product.id ? updateProduct(product) : addProduct(product)} />
    </div>
  );
}
