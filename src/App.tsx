import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OverviewPage from '@/pages/OverviewPage';
import SegmentsPage from '@/pages/SegmentsPage';
import PredictionsPage from '@/pages/PredictionsPage';
import AlertsPage from '@/pages/AlertsPage';
import ReviewsPage from '@/pages/ReviewsPage';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('reviewpulse_auth') !== null;
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="segments" element={<SegmentsPage />} />
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
