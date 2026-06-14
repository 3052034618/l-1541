import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Vehicles from '@/pages/Vehicles';
import Appointment from '@/pages/Appointment';
import NurseCollection from '@/pages/NurseCollection';
import Approval from '@/pages/Approval';
import Statistics from '@/pages/Statistics';
import Logs from '@/pages/Logs';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/useAuthStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="appointment" element={<Appointment />} />
          <Route path="collection" element={<NurseCollection />} />
          <Route path="approval" element={<Approval />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
