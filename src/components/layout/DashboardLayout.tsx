import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Wrench,
  Home,
  Calendar,
  Briefcase,
  Users,
  FileText,
  FolderKanban,
  HardHat,
  BarChart3,
  Lightbulb,
  Settings,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { to: '/dashboard/home', label: 'Home', icon: Home },
  { to: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { to: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/dashboard/customers', label: 'Customers', icon: Users },
  { to: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/contractors', label: 'Contractors', icon: HardHat },
  { to: '/dashboard/financials', label: 'Financials', icon: BarChart3 },
  { to: '/dashboard/insights', label: 'Insights', icon: Lightbulb },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

// Show first 4 items + a "More" toggle for the rest on mobile
const MOBILE_PRIMARY_COUNT = 4;

function getUserInitials(email: string | undefined): string {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const mobilePrimaryItems = navItems.filter((item) => item.label !== 'Settings').slice(0, MOBILE_PRIMARY_COUNT);
  const mobileOverflowItems = navItems.filter((item) => item.label !== 'Settings').slice(MOBILE_PRIMARY_COUNT);

  const initials = getUserInitials(user?.email);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">FlowBoss</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">FlowBoss</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 lg:hidden">
        {/* More menu overflow */}
        {moreMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMoreMenuOpen(false)} />
            <div className="absolute bottom-16 right-2 z-30 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[160px]">
              {mobileOverflowItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'text-brand-600 bg-brand-50 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </>
        )}
        <div className="flex items-center justify-around h-16">
          {mobilePrimaryItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreMenuOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
                  isActive
                    ? 'text-brand-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreMenuOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
              moreMenuOpen ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
