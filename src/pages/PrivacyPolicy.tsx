export function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-sm text-brand-500 font-semibold uppercase tracking-wide mb-2">Legal</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: March 23, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-700">
        <p>CreatorLane Studios ("Company," "we," "us," or "our") operates the FlowBoss mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use FlowBoss.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
        <p><strong>Account Information:</strong> When you create an account, we collect your name, email address, phone number, and company name.</p>
        <p><strong>Business Data:</strong> Customer records, job details, invoices, estimates, scheduling data, and pricebook information you enter into the App.</p>
        <p><strong>Payment Information:</strong> If you connect a payment provider (Stripe or QuickBooks), we store connection tokens but never store credit card numbers or bank account details directly.</p>
        <p><strong>Device Information:</strong> Device type, operating system version, and app version for troubleshooting and compatibility purposes.</p>
        <p><strong>Location Data:</strong> With your permission, we collect location data solely for route optimization features. You can disable this at any time in your device settings.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide, maintain, and improve the App and its features</li>
          <li>Process transactions and send related information (invoices, receipts, payment confirmations)</li>
          <li>Optimize routes between job locations</li>
          <li>Send administrative messages, updates, and security alerts</li>
          <li>Respond to support requests</li>
          <li>Analyze usage patterns to improve the product</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Information Sharing</h2>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Service Providers:</strong> Third-party services that help us operate (Supabase for data storage, Stripe for payments, Intuit/QuickBooks for accounting integration, Resend for email delivery)</li>
          <li><strong>Your Customers:</strong> Information you choose to include in invoices and estimates sent through the App</li>
          <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Data Security</h2>
        <p>We use industry-standard security measures including encryption in transit (TLS), encryption at rest, and row-level security policies to protect your data. However, no electronic transmission or storage method is 100% secure.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Data Retention</h2>
        <p>We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time through the App settings or by contacting us.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Your Rights</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Export your data in a portable format</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Children's Privacy</h2>
        <p>FlowBoss is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes through the App or via email. Your continued use of FlowBoss after changes are posted constitutes acceptance.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at:</p>
        <p>
          <strong>CreatorLane Studios</strong><br />
          Email: <a href="mailto:info@creatorlanestudios.com" className="text-brand-500 hover:underline">info@creatorlanestudios.com</a>
        </p>
      </div>
    </div>
  );
}
