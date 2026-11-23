import { Navigate, Route, Routes } from 'react-router-dom';
import { useInventory } from './context/InventoryContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ExpiringSoon from './pages/ExpiringSoon';
import ExpiredItems from './pages/ExpiredItems';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { user } = useInventory();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/expiring-soon" element={<ExpiringSoon />} />
        <Route path="/expired" element={<ExpiredItems />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
