import { useState, useMemo, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
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
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../hooks/useTheme';
import { GlobalSearch } from './GlobalSearch';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const BASE_NAV: NavItem[] = [
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

/**
 * Reorder sidebar nav based on onboarding data.
 *
 * - GC: Projects + Contractors move up right after Home
 * - Sub: Schedule + Jobs first, Projects hidden (they see assigned projects inline)
 * - Solo: Contractors hidden (no crew to manage)
 * - Priorities bump matching items higher in the list
 */
function personaliseNav(
  role: string | undefined,
  isSolo: boolean,
  priorities: string[],
): NavItem[] {
  let items = [...BASE_NAV];

  // Map priority labels → nav labels for promotion
  const PRIORITY_TO_NAV: Record<string, string> = {
    'Scheduling & dispatch': 'Schedule',
    'Invoicing & payments': 'Invoices',
    'Project management': 'Projects',
    'Finding reliable subs': 'Contractors',
    'Tracking job costs': 'Financials',
    'Building my reputation': 'Settings', // FlowBoss Score lives here
  };

  // Hide items that aren't relevant
  if (role === 'sub') {
    // Subs don't create GC projects — they see assigned ones on Command Center
    items = items.filter((i) => i.label !== 'Projects');
  }
  if (isSolo) {
    // Solo operators don't manage a crew
    items = items.filter((i) => i.label !== 'Contractors');
  }

  // GC: promote Projects + Contractors right after Home
  if (role === 'gc' || role === 'both') {
    const promoted = ['Projects', 'Contractors'];
    const homeIdx = items.findIndex((i) => i.label === 'Home');
    const toPromote = items.filter((i) => promoted.includes(i.label));
    const rest = items.filter((i) => !promoted.includes(i.label));
    items = [...rest.slice(0, homeIdx + 1), ...toPromote, ...rest.slice(homeIdx + 1)];
  }

  // Priorities: promote matching nav items (after Home, before Settings)
  if (priorities.length > 0) {
    const promotedLabels = priorities
      .map((p) => PRIORITY_TO_NAV[p])
      .filter(Boolean)
      .filter((label) => items.some((i) => i.label === label));

    if (promotedLabels.length > 0) {
      const homeIdx = items.findIndex((i) => i.label === 'Home');
      const settingsIdx = items.findIndex((i) => i.label === 'Settings');
      const middleItems = items.slice(homeIdx + 1, settingsIdx === -1 ? undefined : settingsIdx);
      const beforeHome = items.slice(0, homeIdx + 1);
      const afterSettings = settingsIdx === -1 ? [] : items.slice(settingsIdx);

      // Sort middle: promoted first (in priority order), then the rest in original order
      const promoted = middleItems.filter((i) => promotedLabels.includes(i.label));
      const notPromoted = middleItems.filter((i) => !promotedLabels.includes(i.label));
      promoted.sort((a, b) => promotedLabels.indexOf(a.label) - promotedLabels.indexOf(b.label));

      items = [...beforeHome, ...promoted, ...notPromoted, ...afterSettings];
    }
  }

  return items;
}

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

// ── Visited pages tracker (for pulse dots on unvisited nav items) ──
const VISITED_KEY = 'flowboss-visited-pages';
const SIGNUP_KEY = 'flowboss-signup-ts';

function useVisitedPages() {
  const location = useLocation();
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(VISITED_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Track first signup time for "new user" detection
  const isNewUser = useMemo(() => {
    try {
      const ts = localStorage.getItem(SIGNUP_KEY);
      if (!ts) {
        localStorage.setItem(SIGNUP_KEY, Date.now().toString());
        return true;
      }
      return Date.now() - parseInt(ts) < 7 * 24 * 60 * 60 * 1000; // 7 days
    } catch {
      return false;
    }
  }, []);

  // Mark current page as visited
  useEffect(() => {
    const page = location.pathname.replace('/dashboard/', '').split('/')[0] || 'home';
    if (!visited.has(page)) {
      const next = new Set(visited);
      next.add(page);
      setVisited(next);
      try {
        localStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
      } catch { /* ignore */ }
    }
  }, [location.pathname]);

  const hasVisited = useCallback((label: string) => {
    const key = label.toLowerCase();
    return visited.has(key);
  }, [visited]);

  return { hasVisited, isNewUser };
}

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const { profile, isGC, isSub, isSolo, priorities } = useProfile();
  const { theme, toggle: toggleTheme, isDark } = useTheme();
  const { hasVisited, isNewUser } = useVisitedPages();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems = useMemo(
    () => personaliseNav(profile?.business_role, isSolo, priorities),
    [profile?.business_role, isSolo, priorities],
  );

  const mobilePrimaryItems = navItems.filter((item) => item.label !== 'Settings').slice(0, MOBILE_PRIMARY_COUNT);
  const mobileOverflowItems = navItems.filter((item) => item.label !== 'Settings').slice(MOBILE_PRIMARY_COUNT);

  const initials = getUserInitials(user?.email);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — dark theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08]">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">FlowBoss</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const showDot = isNewUser && label !== 'Home' && label !== 'Settings' && !hasVisited(label);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-500/20 text-white shadow-sm shadow-brand-500/10 border-l-[3px] border-brand-400 ml-0'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
                {showDot && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section + sign out */}
        <div className="px-3 py-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 bg-brand-500/30 text-brand-300 rounded-full flex items-center justify-center text-xs font-semibold ring-1 ring-brand-400/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800 shadow-sm shadow-gray-200/50 dark:shadow-black/20 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb area — just branding for now */}
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 hidden lg:block">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center text-xs font-semibold lg:hidden">
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
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden">
        {/* More menu overflow */}
        {moreMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMoreMenuOpen(false)} />
            <div className="absolute bottom-16 right-2 z-30 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[180px]">
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
