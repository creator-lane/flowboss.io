import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { EULA } from './pages/EULA';
import { Support } from './pages/Support';
import { DeleteAccount } from './pages/DeleteAccount';
import { AnalyticsTaxonomy } from './pages/AnalyticsTaxonomy';
import { StripeConnect } from './pages/StripeConnect';
import { Layout } from './pages/Layout';

export default function App() {
  return (
    <Routes>
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
    </Routes>
  );
}
