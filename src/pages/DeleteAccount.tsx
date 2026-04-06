import { AlertTriangle } from 'lucide-react';

export function DeleteAccount() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Your Account</h1>
      <p className="text-gray-600 mb-10">We're sorry to see you go. Here's how to delete your FlowBoss account and data.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 mb-1">This action is permanent</p>
          <p className="text-sm text-amber-700">Deleting your account will permanently remove all your data including customers, jobs, invoices, estimates, and scheduling history. This cannot be undone.</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">How to delete your account</h2>

      <div className="space-y-6 mb-12">
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-gray-600 text-sm">1</div>
          <div>
            <h3 className="font-medium text-gray-900">Cancel your subscription first</h3>
            <p className="text-sm text-gray-600 mt-1">Open Google Play &gt; Payments &amp; Subscriptions &gt; Subscriptions &gt; FlowBoss &gt; Cancel. This prevents future charges.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-gray-600 text-sm">2</div>
          <div>
            <h3 className="font-medium text-gray-900">Request account deletion</h3>
            <p className="text-sm text-gray-600 mt-1">Send an email to <a href="mailto:support@creatorlanestudios.com?subject=Account%20Deletion%20Request" className="text-brand-500 hover:underline">support@creatorlanestudios.com</a> with the subject "Account Deletion Request" and include the email address associated with your FlowBoss account.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-gray-600 text-sm">3</div>
          <div>
            <h3 className="font-medium text-gray-900">Confirmation</h3>
            <p className="text-sm text-gray-600 mt-1">We will process your request within 7 business days and send a confirmation email once your account and all associated data have been permanently deleted.</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">What gets deleted</h2>
      <ul className="space-y-2 text-sm text-gray-600 mb-10">
        <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Your account profile and login credentials</li>
        <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> All customer records and contact information</li>
        <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Jobs, projects, and scheduling history</li>
        <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Invoices, estimates, and payment records</li>
        <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> Pricebook and materials data</li>
        <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">&#10005;</span> All app settings and preferences</li>
      </ul>

      <p className="text-sm text-gray-500">Note: Third-party services (Stripe, QuickBooks) maintain their own data retention policies. Deleting your FlowBoss account removes the connection but does not delete data stored by those services. Contact them directly to manage your data there.</p>
    </div>
  );
}
