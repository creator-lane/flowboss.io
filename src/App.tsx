import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { EULA } from './pages/EULA';
import { Support } from './pages/Support';
import { DeleteAccount } from './pages/DeleteAccount';
import { AnalyticsTaxonomy } from './pages/AnalyticsTaxonomy';
import { StripeConnect } from './pages/StripeConnect';
import { Layout } from './pages/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Pricing } from './pages/Pricing';
import { Checkout } from './pages/Checkout';
import { RequireAuth } from './components/auth/RequireAuth';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SchedulePage } from './pages/dashboard/SchedulePage';
import { JobsPage } from './pages/dashboard/JobsPage';
import { JobDetailPage } from './pages/dashboard/JobDetailPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { CustomerDetailPage } from './pages/dashboard/CustomerDetailPage';
import { InvoicesPage } from './pages/dashboard/InvoicesPage';
import { InvoiceDetailPage } from './pages/dashboard/InvoiceDetailPage';
import { FinancialsPage } from './pages/dashboard/FinancialsPage';
import { InsightsPage } from './pages/dashboard/InsightsPage';
import { ProjectsPage } from './pages/dashboard/ProjectsPage';
import { ProjectDetailPage } from './pages/dashboard/ProjectDetailPage';
import { ContractorsPage } from './pages/dashboard/ContractorsPage';
import { ContractorDetailPage } from './pages/dashboard/ContractorDetailPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { GCDashboardPage } from './pages/dashboard/GCDashboardPage';
import { GCProjectDetailPage } from './pages/dashboard/GCProjectDetailPage';
import { SubProjectViewPage } from './pages/dashboard/SubProjectViewPage';
import { InviteLanding } from './pages/InviteLanding';

export default function App() {
  return (
    <Routes>
      {/* Marketing site */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/eula" element={<EULA />} />
        <Route path="/support" element={<Support />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/analytics" element={<AnalyticsTaxonomy />} />
        <Route path="/stripe-connect" element={<StripeConnect />} />
      </Route>

      {/* Auth & public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/invite/:projectId/:tradeId" element={<InviteLanding />} />

      {/* Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard/schedule" replace />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="contractors" element={<ContractorsPage />} />
        <Route path="contractors/:id" element={<ContractorDetailPage />} />
        <Route path="gc" element={<GCDashboardPage />} />
        <Route path="gc/:id" element={<GCProjectDetailPage />} />
        <Route path="gc-projects/:id" element={<SubProjectViewPage />} />
        <Route path="financials" element={<FinancialsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
