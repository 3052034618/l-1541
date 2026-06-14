import { LayoutDashboard, Truck, Calendar, FileCheck, BarChart3, Settings, LogOut, Bell, FileText } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/dashboard', label: '3D大屏', icon: LayoutDashboard },
  { path: '/vehicles', label: '献血车管理', icon: Truck },
  { path: '/appointment', label: '预约管理', icon: Calendar },
  { path: '/approval', label: '审批中心', icon: FileCheck },
  { path: '/statistics', label: '统计报表', icon: BarChart3 },
  { path: '/logs', label: '操作日志', icon: FileText },
];

export function Sidebar() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const pendingCount = useApprovalStore((state) => state.getPendingCount());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleText: Record<string, string> = {
    donor: '献血者',
    nurse: '护士',
    director: '血站主任',
  };

  return (
    <div className="w-64 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">血</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">智慧城市献血</h1>
            <p className="text-xs text-slate-400">调度与血库联动平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                )
              }
            >
              <IconComponent size={18} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.path === '/approval' && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/50 space-y-3">
        {currentUser && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{currentUser.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400">{roleText[currentUser.role]}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </div>
  );
}
