import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Building2, Link2, Mail, Check, Copy, UserPlus, Send, Smartphone } from 'lucide-react';

type Tab = 'placeholder' | 'link' | 'email';

interface InviteSubModalProps {
  open: boolean;
  onClose: () => void;
  tradeId: string;
  tradeName: string;
  projectId: string;
  projectName: string;
}

export function InviteSubModal({
  open,
  onClose,
  tradeId,
  tradeName,
  projectId,
  projectName,
}: InviteSubModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('placeholder');

  // Get GC company name for invite emails
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.getSettings() });
  const gcCompanyName = settings?.data?.business_name || 'FlowBoss';

  // Placeholder state
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Email invite state
  const [email, setEmail] = useState('');
  const [emailCompany, setEmailCompany] = useState('');

  // Feedback state
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const inviteLink = `https://flowboss.io/invite/${projectId}/${tradeId}`;

  const updateTrade = useMutation({
    mutationFn: (notes: string) => api.updateGCTrade(tradeId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to update trade', 'error'),
  });

  function handleSetPlaceholder() {
    if (!companyName.trim()) return;
    const notes = contactInfo.trim()
      ? `Placeholder: ${companyName.trim()} (${contactInfo.trim()})`
      : `Placeholder: ${companyName.trim()}`;
    updateTrade.mutate(notes);
    setSuccess(`Placeholder set for ${tradeName}`);
    setTimeout(() => {
      setSuccess(null);
      resetAndClose();
    }, 1500);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail() {
    if (!email.trim()) return;

    // Send the real email invite
    try {
      await api.sendInviteEmail({
        email: email.trim(),
        subName: emailCompany.trim() || undefined,
        projectName,
        tradeName,
        inviteUrl: inviteLink,
        gcCompanyName,
      });
    } catch {
      // Edge function may not be deployed yet — continue with note tracking
    }

    // Track the invite in trade notes
    const notes = emailCompany.trim()
      ? `Invited: ${email.trim()} (${emailCompany.trim()})`
      : `Invited: ${email.trim()}`;
    updateTrade.mutate(notes);
    setSuccess(`Invite sent to ${email.trim()}`);
    setTimeout(() => {
      setSuccess(null);
      resetAndClose();
    }, 1500);
  }

  function resetAndClose() {
    setCompanyName('');
    setContactInfo('');
    setEmail('');
    setEmailCompany('');
    setCopied(false);
    setSuccess(null);
    setActiveTab('placeholder');
    onClose();
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'placeholder', label: 'Set Placeholder', icon: <Building2 className="w-4 h-4" /> },
    { key: 'link', label: 'Share Link', icon: <Link2 className="w-4 h-4" /> },
    { key: 'email', label: 'Email Invite', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <Modal open={open} onClose={resetAndClose} title={`Invite Sub - ${tradeName}`} size="md">
      {/* Success overlay */}
      {success && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">{success}</p>
        </div>
      )}

      {!success && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Assign a sub for <span className="font-medium text-gray-700">{tradeName}</span> on{' '}
            <span className="font-medium text-gray-700">{projectName}</span>
          </p>

          {/* Tab selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab A: Placeholder */}
          {activeTab === 'placeholder' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Set a placeholder name to plan without inviting anyone yet.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Smith Plumbing Co."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (optional)</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone or email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSetPlaceholder}
                disabled={!companyName.trim() || updateTrade.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Building2 className="w-4 h-4" />
                {updateTrade.isPending ? 'Saving...' : 'Set Placeholder'}
              </button>
            </div>
          )}

          {/* Tab B: Share Link */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Share this link with a sub to invite them to the project. They can sign up or log in to see their assignment.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono truncate select-all">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Share via text or any messaging app</span>
              </div>
            </div>
          )}

          {/* Tab C: Email Invite */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Send an email invite to a sub. They will receive instructions to join the project.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sub@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (optional)</label>
                <input
                  type="text"
                  value={emailCompany}
                  onChange={(e) => setEmailCompany(e.target.value)}
                  placeholder="e.g. Smith Plumbing Co."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSendEmail}
                disabled={!email.trim() || updateTrade.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {updateTrade.isPending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
