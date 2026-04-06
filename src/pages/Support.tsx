import { Mail, MessageCircle, Clock, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    q: 'How do I connect my Stripe account?',
    a: 'Go to Settings > Payment Processing in the app and tap "Connect Stripe." You\'ll be redirected to Stripe to authorize the connection. Once connected, you can send invoices with payment links.',
  },
  {
    q: 'Can I use FlowBoss with QuickBooks?',
    a: 'Yes! FlowBoss syncs customers, invoices, and estimates with QuickBooks Online. Go to Settings > QuickBooks to connect your account. Invoices sent through QuickBooks will include their built-in payment links.',
  },
  {
    q: 'How does route optimization work?',
    a: 'When you have 2 or more jobs scheduled for the day, tap the menu icon on the schedule screen and select "Optimize Route." FlowBoss will calculate the most efficient order to visit your job sites, saving you drive time.',
  },
  {
    q: 'Can I switch between trades?',
    a: 'Your trade (plumbing, HVAC, or electrical) is selected during onboarding and determines your pricebook items, project templates, and job categories. Contact support if you need to change your trade after setup.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Subscriptions are managed through Google Play. Open Google Play > Payments & Subscriptions > Subscriptions > FlowBoss > Cancel. You\'ll retain access until the end of your current billing period.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. FlowBoss uses industry-standard encryption (TLS) for all data in transit, encryption at rest for stored data, and row-level security policies ensuring you can only access your own data.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-gray-900">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>}
    </div>
  );
}

export function Support() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Support</h1>
      <p className="text-gray-600 mb-12">We're here to help. Find answers below or reach out directly.</p>

      {/* Contact */}
      <div className="grid sm:grid-cols-2 gap-4 mb-16">
        <div className="border border-gray-100 rounded-xl p-6">
          <Mail className="w-6 h-6 text-brand-500 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
          <p className="text-sm text-gray-600 mb-3">Get help from our team directly.</p>
          <a href="mailto:support@creatorlanestudios.com" className="text-sm text-brand-500 font-medium hover:underline">
            support@creatorlanestudios.com
          </a>
        </div>
        <div className="border border-gray-100 rounded-xl p-6">
          <Clock className="w-6 h-6 text-brand-500 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
          <p className="text-sm text-gray-600">We typically respond within 24 hours on business days.</p>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div>
        {faqs.map((faq) => (
          <FAQItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}
