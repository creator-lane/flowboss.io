import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Eager: HomePage is the marketing landing and needs to paint instantly.
// Layout + auth primitives are used on nearly every navigation; lazying them
// would just trade one network request for another on the critical path.
import { HomePage } from './pages/HomePage';
import { Layout } from './pages/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireSubscription } from './components/auth/RequireSubscription';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProGate } from './components/upgrade/ProGate';
import { LazyChunkBoundary } from './components/LazyChunkBoundary';

// Lazy marketing / auxiliary / auth-flow pages — infrequently visited,
// should not ship in the entry bundle.
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const EULA = lazy(() => import('./pages/EULA').then(m => ({ default: m.EULA })));
const Support = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount').then(m => ({ default: m.DeleteAccount })));
const AnalyticsTaxonomy = lazy(() => import('./pages/AnalyticsTaxonomy').then(m => ({ default: m.AnalyticsTaxonomy })));
const StripeConnect = lazy(() => import('./pages/StripeConnect').then(m => ({ default: m.StripeConnect })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const InviteLanding = lazy(() => import('./pages/InviteLanding').then(m => ({ default: m.InviteLanding })));
const Demo = lazy(() => import('./pages/Demo').then(m => ({ default: m.Demo })));
const DemoPicker = lazy(() => import('./demo/DemoPicker').then(m => ({ default: m.DemoPicker })));
const DemoSandbox = lazy(() => import('./demo/DemoSandbox').then(m => ({ default: m.DemoSandbox })));
const DemoCustomerPayPage = lazy(() => import('./demo/DemoCustomerPayPage').then(m => ({ default: m.DemoCustomerPayPage })));
const DemoRoutePreviewPage = lazy(() => import('./demo/DemoRoutePreviewPage').then(m => ({ default: m.DemoRoutePreviewPage })));

// Lazy-loaded dashboard pages for code-splitting
const SchedulePage = lazy(() => import('./pages/dashboard/SchedulePage').then(m => ({ default: m.SchedulePage })));
const JobsPage = lazy(() => import('./pages/dashboard/JobsPage').then(m => ({ default: m.JobsPage })));
const JobDetailPage = lazy(() => import('./pages/dashboard/JobDetailPage').then(m => ({ default: m.JobDetailPage })));
const CustomersPage = lazy(() => import('./pages/dashboard/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('./pages/dashboard/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const InvoicesPage = lazy(() => import('./pages/dashboard/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const InvoiceDetailPage = lazy(() => import('./pages/dashboard/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const InvoicePreviewPage = lazy(() => import('./pages/dashboard/InvoicePreviewPage').then(m => ({ default: m.InvoicePreviewPage })));
const FinancialsPage = lazy(() => import('./pages/dashboard/FinancialsPage').then(m => ({ default: m.FinancialsPage })));
const InsightsPage = lazy(() => import('./pages/dashboard/InsightsPage').then(m => ({ default: m.InsightsPage })));
const CommandCenterPage = lazy(() => import('./pages/dashboard/CommandCenterPage').then(m => ({ default: m.CommandCenterPage })));
const ContractorsPage = lazy(() => import('./pages/dashboard/ContractorsPage').then(m => ({ default: m.ContractorsPage })));
const ContractorDetailPage = lazy(() => import('./pages/dashboard/ContractorDetailPage').then(m => ({ default: m.ContractorDetailPage })));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })));
const GCDashboardPage = lazy(() => import('./pages/dashboard/GCDashboardPage').then(m => ({ default: m.GCDashboardPage })));
const GCProjectDetailPage = lazy(() => import('./pages/dashboard/GCProjectDetailPage').then(m => ({ default: m.GCProjectDetailPage })));
const SubProjectViewPage = lazy(() => import('./pages/dashboard/SubProjectViewPage').then(m => ({ default: m.SubProjectViewPage })));
const SubProfilePage = lazy(() => import('./pages/dashboard/SubProfilePage').then(m => ({ default: m.SubProfilePage })));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  // LazyChunkBoundary catches ChunkLoadError (stale bundle after deploy) and
  // recovers by reloading the page once. Before this, navigating to a lazy
  // route after we'd deployed a new build would hang in Suspense forever
  // and render a black screen until the user manually refreshed.
  return (
    <LazyChunkBoundary>
      <Suspense fallback={<LazyFallback />}>{children}</Suspense>
    </LazyChunkBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Marketing site */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<Lazy><PrivacyPolicy /></Lazy>} />
        <Route path="/terms" element={<Lazy><TermsOfService /></Lazy>} />
        <Route path="/eula" element={<Lazy><EULA /></Lazy>} />
        <Route path="/support" element={<Lazy><Support /></Lazy>} />
        <Route path="/delete-account" element={<Lazy><DeleteAccount /></Lazy>} />
        <Route path="/analytics" element={<Lazy><AnalyticsTaxonomy /></Lazy>} />
        <Route path="/stripe-connect" element={<Lazy><StripeConnect /></Lazy>} />
      </Route>

      {/* Auth & public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<Lazy><ForgotPassword /></Lazy>} />
      <Route path="/reset-password" element={<Lazy><ResetPassword /></Lazy>} />
      <Route path="/onboarding" element={<Lazy><Onboarding /></Lazy>} />
      <Route path="/pricing" element={<Lazy><Pricing /></Lazy>} />
      <Route path="/checkout" element={<Lazy><Checkout /></Lazy>} />
      <Route path="/invite/:projectId/:tradeId" element={<Lazy><InviteLanding /></Lazy>} />
      <Route path="/demo" element={<Lazy><Demo /></Lazy>} />
      <Route path="/demo/full" element={<Lazy><DemoPicker /></Lazy>} />

      {/* Customer-pay preview — rendered outside the dashboard chrome on
          purpose: this is what the *customer* sees on the Stripe hosted page.
          Reached from InvoiceDetailPage via "Preview as customer". Auth-gated
          so we don't expose invoice data, but no DashboardLayout wrapper. */}
      <Route
        path="/invoices/:id/preview"
        element={
          <RequireAuth>
            <RequireSubscription>
              <Lazy><InvoicePreviewPage /></Lazy>
            </RequireSubscription>
          </RequireAuth>
        }
      />

      {/* Customer-facing pay-page preview — outside the dashboard chrome
          on purpose: this is the page the *customer* sees. Reached when a
          contractor in demo mode clicks "Create payment link" on an
          invoice (apiOverride wires the link here instead of Stripe). */}
      <Route path="/demo/full/:persona/customer-pay/:invoiceId" element={<Lazy><DemoCustomerPayPage /></Lazy>} />

      {/* Sandboxed full demo — separate provider tree, no auth, no real Supabase. */}
      <Route path="/demo/full/:persona/dashboard" element={<Lazy><DemoSandbox /></Lazy>}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Lazy><CommandCenterPage /></Lazy>} />
        <Route path="schedule" element={<Lazy><SchedulePage /></Lazy>} />
        <Route path="route-preview" element={<Lazy><DemoRoutePreviewPage /></Lazy>} />
        <Route path="jobs" element={<Lazy><JobsPage /></Lazy>} />
        <Route path="jobs/:id" element={<Lazy><JobDetailPage /></Lazy>} />
        <Route path="customers" element={<Lazy><CustomersPage /></Lazy>} />
        <Route path="customers/:id" element={<Lazy><CustomerDetailPage /></Lazy>} />
        <Route path="invoices" element={<Lazy><InvoicesPage /></Lazy>} />
        <Route path="invoices/:id" element={<Lazy><InvoiceDetailPage /></Lazy>} />
        <Route path="contractors" element={<Lazy><ContractorsPage /></Lazy>} />
        <Route path="contractors/:id" element={<Lazy><ContractorDetailPage /></Lazy>} />
        <Route path="projects" element={<Lazy><GCDashboardPage /></Lazy>} />
        <Route path="projects/:id" element={<Lazy><GCProjectDetailPage /></Lazy>} />
        <Route path="projects/assigned/:id" element={<Lazy><SubProjectViewPage /></Lazy>} />
        <Route path="subs/:subId" element={<Lazy><SubProfilePage /></Lazy>} />
        <Route path="financials" element={<Lazy><FinancialsPage /></Lazy>} />
        <Route path="insights" element={<Lazy><InsightsPage /></Lazy>} />
        <Route path="settings" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>

      {/* Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RequireSubscription>
              <DashboardLayout />
            </RequireSubscription>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard/home" replace />} />
        <Route path="schedule" element={<Lazy><SchedulePage /></Lazy>} />
        <Route path="jobs" element={<ProGate feature="jobs"><Lazy><JobsPage /></Lazy></ProGate>} />
        <Route path="jobs/:id" element={<ProGate feature="jobs"><Lazy><JobDetailPage /></Lazy></ProGate>} />
        <Route path="customers" element={<ProGate feature="customers"><Lazy><CustomersPage /></Lazy></ProGate>} />
        <Route path="customers/:id" element={<ProGate feature="customers"><Lazy><CustomerDetailPage /></Lazy></ProGate>} />
        <Route path="invoices" element={<ProGate feature="invoices"><Lazy><InvoicesPage /></Lazy></ProGate>} />
        <Route path="invoices/:id" element={<ProGate feature="invoices"><Lazy><InvoiceDetailPage /></Lazy></ProGate>} />
        <Route path="home" element={<Lazy><CommandCenterPage /></Lazy>} />
        <Route path="contractors" element={<Lazy><ContractorsPage /></Lazy>} />
        <Route path="contractors/:id" element={<Lazy><ContractorDetailPage /></Lazy>} />
        <Route path="projects" element={<Lazy><GCDashboardPage /></Lazy>} />
        <Route path="projects/:id" element={<Lazy><GCProjectDetailPage /></Lazy>} />
        <Route path="projects/assigned/:id" element={<Lazy><SubProjectViewPage /></Lazy>} />
        <Route path="subs/:subId" element={<Lazy><SubProfilePage /></Lazy>} />
        <Route path="financials" element={<ProGate feature="financials"><Lazy><FinancialsPage /></Lazy></ProGate>} />
        <Route path="insights" element={<ProGate feature="insights"><Lazy><InsightsPage /></Lazy></ProGate>} />
        <Route path="settings" element={<Lazy><SettingsPage /></Lazy>} />
        {/* 404 catch-all within dashboard */}
        <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
      </Route>

      {/* Global 404 catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
