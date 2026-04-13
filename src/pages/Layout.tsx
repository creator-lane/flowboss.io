import { Outlet, Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Layout() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white scroll-smooth">
      {/* Nav */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FlowBoss</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="/#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="/#trades" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Trades
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log In
            </Link>
            <a
              href="https://apps.apple.com/app/id6761025816"
              className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
            >
              Get the App
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">FlowBoss</span>
              </Link>
              <p className="text-sm text-gray-500 max-w-xs">
                The field service app built for plumbers, HVAC techs, and electricians.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Legal</h4>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                  <li><Link to="/eula" className="hover:text-blue-600 transition-colors">EULA</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Support</h4>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li><a href="mailto:support@flowboss.io" className="hover:text-blue-600 transition-colors">support@flowboss.io</a></li>
                  <li><Link to="/support" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Account</h4>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li><Link to="/delete-account" className="hover:text-blue-600 transition-colors">Delete Account</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CreatorLane Studios. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
