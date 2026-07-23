import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('reviewpulse_auth');
    navigate('/');
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#FAFAFA]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={location.pathname}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopHeader />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
