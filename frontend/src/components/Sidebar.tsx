import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Rocket,
  Activity,
  Settings,
  LogOut,
  Plus,
  X,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/deployments', label: 'Deployments', icon: Rocket },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-surface-700/50">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="h-8 w-8 gradient-brand rounded-lg flex items-center justify-center">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">DeployEasy</span>
        </div>
      </div>

      {/* Deploy button */}
      <div className="p-4">
        <button
          onClick={() => navigate('/projects')}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Deploy Project
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-surface-700/50">
        {/* User profile */}
        <div className="flex items-center gap-3 p-3 glass-light rounded-xl border border-surface-700/30">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="h-9 w-9 rounded-full object-cover border border-brand-500/30" />
          ) : (
            <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center font-bold text-white text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-surface-400 truncate">{user?.email || 'user@deployeasy.dev'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-surface-800/50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 glass rounded-lg"
      >
        <Menu className="h-5 w-5 text-surface-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full glass-light flex flex-col animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-surface-700/50"
            >
              <X className="h-5 w-5 text-surface-400" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 glass-light border-r border-surface-700/30 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
