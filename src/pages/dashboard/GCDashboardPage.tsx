import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  Plus,
  MapPin,
  DollarSign,
  Users,
  FolderKanban,
  Activity,
  Search,
  Inbox,
  Phone,
  Briefcase,
  UserPlus,
  X,
  Star,
  Zap,
  Trash2,
} from 'lucide-react';
import { CreateGCProjectModal } from '../../components/gc/CreateGCProjectModal';
import { TypeToConfirmDialog } from '../../components/ui/TypeToConfirmDialog';
import { loadAllDemoData } from '../../lib/demoData';

const STATUS_CONFIG: Record<string, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  planning: { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-500/20', dot: 'bg-gray-400', label: 'Planning' },
  active: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', dot: 'bg-blue-500', label: 'Active' },
  on_hold: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20', dot: 'bg-amber-500', label: 'On Hold' },
  completed: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-500/20', dot: 'bg-green-500', label: 'Completed' },
};

const TRADE_COLORS: Record<string, string> = {
  Plumbing: 'bg-blue-100 text-blue-700',
  Electrical: 'bg-yellow-100 text-yellow-700',
  HVAC: 'bg-cyan-100 text-cyan-700',
  Framing: 'bg-orange-100 text-orange-700',
  Drywall: 'bg-stone-100 text-stone-700',
  Painting: 'bg-purple-100 text-purple-700',
  Roofing: 'bg-red-100 text-red-700',
  Concrete: 'bg-gray-200 text-gray-700',
  Flooring: 'bg-amber-100 text-amber-700',
  Landscaping: 'bg-green-100 text-green-700',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.planning;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ProjectCard({ project, onClick, onDelete }: { project: any; onClick: () => void; onDelete: () => void }) {
  const trades: any[] = project.trades || [];
  const totalTasks = trades.reduce((s: number, t: any) => s + (t.tasks?.length || 0), 0);
  const doneTasks = trades.reduce(
    (s: number, t: any) => s + (t.tasks?.filter((tk: any) => tk.done).length || 0),
    0
  );
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const assigned = trades.filter((t: any) => t.assignedUserId || t.assignedOrgId).length;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 hover:border-gray-300 transition-all duration-200 cursor-pointer dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1 dark:text-white">{project.name}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-0.5"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {(project.city || project.state) && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3 dark:text-gray-400">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {[project.city, project.state].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1 dark:text-gray-400">
          <span>{doneTasks} of {totalTasks} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden dark:bg-white/10">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Trade pills */}
      {trades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {trades.slice(0, 5).map((t: any) => (
            <span
              key={t.id}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                TRADE_COLORS[t.trade] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.trade}
            </span>
          ))}
          {trades.length > 5 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
              +{trades.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
        <span>{assigned} of {trades.length} trades assigned</span>
        {project.budget && (
          <span className="font-medium text-gray-700 dark:text-gray-200">{formatCurrency(project.budget)}</span>
        )}
      </div>
    </div>
  );
}

/** Simple org check — creates org on first visit if needed */
function useAutoOrg() {
  const [ready, setReady] = useState(false);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    (async () => {
      try {
        const { data: org } = await api.getOrganization();
        if (!org) {
          await api.createOrganization({ name: 'My Company', type: 'gc' }).catch(() => {});
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  return { ready, isLoading: !ready };
}

type GCTab = 'projects' | 'subs';

function InviteToProjectModal({
  open,
  onClose,
  sub,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  sub: any;
  projects: any[];
}) {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
  // Only show unassigned trades for the selected project
  const availableTrades = (selectedProject?.trades || []).filter(
    (t: any) => !t.assignedUserId && !t.assignedOrgId
  );

  const handleAssign = async () => {
    if (!selectedTradeId) return;
    setAssigning(true);
    setError('');
    try {
      await api.assignSubToTrade(selectedTradeId, sub.userId);
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      queryClient.invalidateQueries({ queryKey: ['gc-sub-directory'] });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign sub');
    } finally {
      setAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 dark:border dark:border-white/10 rounded-2xl shadow-xl dark:shadow-black/50 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invite to Project</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg dark:hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Assign <span className="font-medium text-gray-700 dark:text-gray-200">{sub.businessName}</span> to a trade on one of your projects.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedTradeId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
            >
              <option value="">Select a project</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Trade (unassigned only)</label>
              {availableTrades.length === 0 ? (
                <p className="text-sm text-gray-400 italic dark:text-gray-500">All trades on this project are already assigned.</p>
              ) : (
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-white/5 dark:backdrop-blur-sm"
                >
                  <option value="">Select a trade</option>
                  {availableTrades.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.trade}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTradeId || assigning}
            className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubCard({
  sub,
  onInvite,
  onViewProfile,
}: {
  sub: any;
  onInvite: (sub: any) => void;
  onViewProfile: (sub: any) => void;
}) {
  const perfQuery = useQuery({
    queryKey: ['trade-rating', sub.userId],
    queryFn: () => api.getSubPerformance(sub.userId),
    enabled: !sub.isPlaceholder && !!sub.userId,
  });
  const score = perfQuery.data?.data?.score;
  const totalRatings = perfQuery.data?.data?.totalRatings || 0;

  return (
    <div
      onClick={() => onViewProfile(sub)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-600 transition-colors dark:text-white">{sub.businessName}</h3>
            {sub.isPlaceholder && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                Placeholder
              </span>
            )}
            {!sub.isPlaceholder && score !== null && score !== undefined && totalRatings > 0 ? (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${score >= 4 ? 'text-green-600' : score >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                <Star className="w-3 h-3 fill-current" />
                {score.toFixed(1)}
              </span>
            ) : !sub.isPlaceholder ? (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">No ratings</span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{sub.tradePrimary}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <Briefcase className="w-3 h-3" />
          {sub.projectCount} project{sub.projectCount !== 1 ? 's' : ''}
        </span>
      </div>

      {sub.phone && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3 dark:text-gray-400">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          {sub.phone}
        </div>
      )}

      {/* Trade pills */}
      {sub.trades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sub.trades.map((t: string) => (
            <span
              key={t}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                TRADE_COLORS[t] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Projects list */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1 dark:text-gray-500">Projects</p>
        <div className="flex flex-wrap gap-1">
          {sub.projects.slice(0, 3).map((p: any) => (
            <span key={p.id} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded dark:bg-white/[0.02] dark:text-gray-300">
              {p.name}
            </span>
          ))}
          {sub.projects.length > 3 && (
            <span className="text-xs text-gray-400 px-1 dark:text-gray-500">+{sub.projects.length - 3} more</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onViewProfile(sub); }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors dark:border-white/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
        >
          View Profile
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onInvite(sub); }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </button>
      </div>
    </div>
  );
}

/* ─── Demo Project Data ─── */

const DEMO_PROJECT = {
  name: 'Henderson Estate — Full Gut Renovation',
  customerName: 'Robert & Lisa Henderson',
  address: '4200 Westlake Hills Blvd',
  city: 'Austin',
  state: 'TX',
  zip: '78746',
  structureType: 'house',
  sqFootage: 5800,
  bedrooms: 5,
  bathrooms: 4,
  stories: 2,
  budget: 715000,
  startDate: '2026-01-06',
  targetEndDate: '2026-09-15',
  status: 'active',
  zones: [
    {
      name: 'Kitchen',
      zoneType: 'kitchen',
      trades: [
        { trade: 'Plumbing', laborHours: 48, laborRate: 110, materialsBudget: 12000, status: 'completed', notes: 'Placeholder: Mike\'s Plumbing (512-555-0101)',
          tasks: [
            { name: 'Demo existing plumbing', done: true },
            { name: 'Rough-in new gas lines', done: true },
            { name: 'Rough-in water supply', done: true },
            { name: 'Install pot filler', done: true },
            { name: 'Install double sink', done: true },
            { name: 'Connect dishwasher', done: true },
            { name: 'Connect ice maker line', done: true },
            { name: 'Final pressure test', done: true },
          ]},
        { trade: 'Electrical', laborHours: 60, laborRate: 110, materialsBudget: 15000, status: 'completed', notes: 'Placeholder: Sparks Electric (512-555-0202)',
          tasks: [
            { name: 'New 200A sub-panel for kitchen', done: true },
            { name: 'Run dedicated circuits (8)', done: true },
            { name: 'Install recessed lighting (24)', done: true },
            { name: 'Under-cabinet LED strips', done: true },
            { name: 'Pendant light wiring (3)', done: true },
            { name: 'Smart switch installation', done: true },
            { name: 'Code inspection', done: true },
          ]},
        { trade: 'HVAC', laborHours: 16, laborRate: 110, materialsBudget: 4000, status: 'completed', notes: 'Placeholder: CoolAir HVAC',
          tasks: [
            { name: 'Relocate supply vents', done: true },
            { name: 'Install range hood exhaust', done: true },
            { name: 'Balance airflow', done: true },
          ]},
        { trade: 'Flooring', laborHours: 32, laborRate: 75, materialsBudget: 18000, status: 'in_progress', notes: 'Placeholder: Premier Floors',
          tasks: [
            { name: 'Remove old tile', done: true },
            { name: 'Level subfloor', done: true },
            { name: 'Install heated floor mat', done: true },
            { name: 'Lay Italian porcelain tile', done: false },
            { name: 'Grout and seal', done: false },
          ]},
        { trade: 'Painting', laborHours: 24, laborRate: 65, materialsBudget: 2500, status: 'not_started',
          tasks: [
            { name: 'Prep and prime all surfaces', done: false },
            { name: 'Two coats — Benjamin Moore OC-17', done: false },
            { name: 'Cabinet touch-ups', done: false },
            { name: 'Final walk-through', done: false },
          ]},
      ],
    },
    {
      name: 'Master Suite',
      zoneType: 'bedroom',
      trades: [
        { trade: 'Plumbing', laborHours: 40, laborRate: 110, materialsBudget: 18000, status: 'in_progress', notes: 'Placeholder: Mike\'s Plumbing (512-555-0101)',
          tasks: [
            { name: 'Demo master bath', done: true },
            { name: 'Rough-in freestanding tub', done: true },
            { name: 'Rough-in double vanity', done: true },
            { name: 'Rough-in walk-in shower (dual heads)', done: true },
            { name: 'Install body sprays', done: false },
            { name: 'Install fixtures', done: false },
            { name: 'Final connections', done: false },
          ]},
        { trade: 'Electrical', laborHours: 32, laborRate: 110, materialsBudget: 8000, status: 'completed', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'Chandelier wiring', done: true },
            { name: 'Closet lighting system', done: true },
            { name: 'Bath GFCI outlets (4)', done: true },
            { name: 'Heated mirror wiring', done: true },
            { name: 'Motorized shade wiring', done: true },
          ]},
        { trade: 'Tiling', laborHours: 80, laborRate: 75, materialsBudget: 25000, status: 'in_progress', notes: 'Placeholder: Artisan Tile Co',
          tasks: [
            { name: 'Waterproof shower pan', done: true },
            { name: 'Tile shower walls — marble slab', done: true },
            { name: 'Tile shower floor — mosaic', done: true },
            { name: 'Tile tub surround', done: false },
            { name: 'Tile bathroom floor', done: false },
            { name: 'Install niche shelves', done: false },
            { name: 'Grout, seal, and polish', done: false },
          ]},
        { trade: 'Painting', laborHours: 20, laborRate: 65, materialsBudget: 1500, status: 'not_started',
          tasks: [
            { name: 'Bedroom walls and ceiling', done: false },
            { name: 'Walk-in closet', done: false },
            { name: 'Trim and crown molding', done: false },
          ]},
      ],
    },
    {
      name: 'Bathroom 2',
      zoneType: 'bathroom',
      trades: [
        { trade: 'Plumbing', laborHours: 24, laborRate: 110, materialsBudget: 6000, status: 'completed', notes: 'Placeholder: Mike\'s Plumbing',
          tasks: [
            { name: 'Rough-in', done: true },
            { name: 'Install toilet', done: true },
            { name: 'Install vanity and faucet', done: true },
            { name: 'Install tub/shower combo', done: true },
          ]},
        { trade: 'Tiling', laborHours: 32, laborRate: 75, materialsBudget: 6000, status: 'completed', notes: 'Placeholder: Artisan Tile Co',
          tasks: [
            { name: 'Tub surround tile', done: true },
            { name: 'Floor tile', done: true },
            { name: 'Backsplash', done: true },
            { name: 'Grout and seal', done: true },
          ]},
        { trade: 'Electrical', laborHours: 8, laborRate: 110, materialsBudget: 1500, status: 'completed', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'GFCI outlets', done: true },
            { name: 'Vanity light', done: true },
            { name: 'Exhaust fan', done: true },
          ]},
        { trade: 'Painting', laborHours: 8, laborRate: 65, materialsBudget: 400, status: 'completed',
          tasks: [
            { name: 'Walls and ceiling', done: true },
            { name: 'Trim', done: true },
          ]},
      ],
    },
    {
      name: 'Bathroom 3',
      zoneType: 'bathroom',
      trades: [
        { trade: 'Plumbing', laborHours: 20, laborRate: 110, materialsBudget: 5000, status: 'completed', notes: 'Placeholder: Mike\'s Plumbing',
          tasks: [
            { name: 'Rough-in', done: true },
            { name: 'Install fixtures', done: true },
          ]},
        { trade: 'Tiling', laborHours: 24, laborRate: 75, materialsBudget: 4500, status: 'in_progress', notes: 'Placeholder: Artisan Tile Co',
          tasks: [
            { name: 'Shower tile', done: true },
            { name: 'Floor tile', done: false },
            { name: 'Grout and seal', done: false },
          ]},
      ],
    },
    {
      name: 'Living Room',
      zoneType: 'living',
      trades: [
        { trade: 'Electrical', laborHours: 24, laborRate: 110, materialsBudget: 6000, status: 'completed', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'Recessed lighting layout (18)', done: true },
            { name: 'Fireplace wiring', done: true },
            { name: 'AV pre-wire (surround sound)', done: true },
            { name: 'Smart home hub wiring', done: true },
          ]},
        { trade: 'Flooring', laborHours: 40, laborRate: 75, materialsBudget: 22000, status: 'in_progress', notes: 'Placeholder: Premier Floors',
          tasks: [
            { name: 'Remove carpet', done: true },
            { name: 'Install white oak hardwood', done: true },
            { name: 'Sand and finish (3 coats)', done: false },
            { name: 'Stair treads', done: false },
          ]},
        { trade: 'Painting', laborHours: 32, laborRate: 65, materialsBudget: 3000, status: 'not_started',
          tasks: [
            { name: 'Walls — Sherwin Williams Agreeable Gray', done: false },
            { name: 'Ceiling — flat white', done: false },
            { name: 'Accent wall — board and batten', done: false },
            { name: 'All trim — semi-gloss white', done: false },
          ]},
      ],
    },
    {
      name: 'Exterior',
      zoneType: 'exterior',
      trades: [
        { trade: 'Roofing', laborHours: 80, laborRate: 80, materialsBudget: 35000, status: 'completed', notes: 'Placeholder: Summit Roofing',
          tasks: [
            { name: 'Tear off existing', done: true },
            { name: 'Replace decking (30%)', done: true },
            { name: 'Ice & water shield', done: true },
            { name: 'Install architectural shingles', done: true },
            { name: 'Flash chimneys and skylights', done: true },
            { name: 'Install ridge vent', done: true },
            { name: 'Final inspection — passed', done: true },
          ]},
        { trade: 'Concrete', laborHours: 48, laborRate: 70, materialsBudget: 15000, status: 'completed', notes: 'Placeholder: Texas Concrete Co',
          tasks: [
            { name: 'Demo old driveway', done: true },
            { name: 'Grade and form', done: true },
            { name: 'Pour new driveway', done: true },
            { name: 'Pour patio extension', done: true },
            { name: 'Stamp and seal patio', done: true },
          ]},
        { trade: 'Landscaping', laborHours: 60, laborRate: 55, materialsBudget: 20000, status: 'not_started', notes: 'Placeholder: Green Valley Landscape',
          tasks: [
            { name: 'Remove dead trees (3)', done: false },
            { name: 'Grade and level yard', done: false },
            { name: 'Install irrigation system', done: false },
            { name: 'Plant beds and shrubs', done: false },
            { name: 'Sod front and back yard', done: false },
            { name: 'Outdoor lighting (low voltage)', done: false },
          ]},
      ],
    },
    {
      name: 'Garage',
      zoneType: 'garage',
      trades: [
        { trade: 'Electrical', laborHours: 24, laborRate: 110, materialsBudget: 5000, status: 'completed', notes: 'Placeholder: Sparks Electric',
          tasks: [
            { name: 'EV charger circuit (60A)', done: true },
            { name: 'LED shop lighting', done: true },
            { name: 'Subpanel installation', done: true },
          ]},
        { trade: 'Concrete', laborHours: 16, laborRate: 70, materialsBudget: 3000, status: 'completed', notes: 'Placeholder: Texas Concrete Co',
          tasks: [
            { name: 'Repair cracks', done: true },
            { name: 'Epoxy floor coating', done: true },
          ]},
      ],
    },
    {
      name: 'General / Structural',
      zoneType: 'general',
      trades: [
        { trade: 'Framing', laborHours: 160, laborRate: 75, materialsBudget: 35000, status: 'completed', notes: 'Placeholder: ABC Framing',
          tasks: [
            { name: 'Demo non-bearing walls', done: true },
            { name: 'Install LVL beams (kitchen open concept)', done: true },
            { name: 'Frame master closet expansion', done: true },
            { name: 'Frame new pantry', done: true },
            { name: 'Sister floor joists (2nd floor)', done: true },
            { name: 'Structural engineering inspection', done: true },
          ]},
        { trade: 'HVAC', laborHours: 80, laborRate: 110, materialsBudget: 45000, status: 'in_progress', notes: 'Placeholder: CoolAir HVAC',
          tasks: [
            { name: 'Remove old system', done: true },
            { name: 'Install dual-zone system', done: true },
            { name: 'Run new ductwork (both floors)', done: true },
            { name: 'Install smart thermostats (3)', done: true },
            { name: 'Balance and commission', done: false },
            { name: 'Final inspection', done: false },
          ]},
        { trade: 'Drywall', laborHours: 120, laborRate: 60, materialsBudget: 12000, status: 'in_progress', notes: 'Placeholder: DFW Drywall',
          tasks: [
            { name: 'Hang drywall — 1st floor', done: true },
            { name: 'Hang drywall — 2nd floor', done: true },
            { name: 'Tape and mud — 1st floor', done: true },
            { name: 'Tape and mud — 2nd floor', done: false },
            { name: 'Sand smooth (Level 5 finish)', done: false },
            { name: 'Touch-up and repair', done: false },
          ]},
        { trade: 'Insulation', laborHours: 40, laborRate: 55, materialsBudget: 10000, status: 'completed', notes: 'Placeholder: Eco Insulation',
          tasks: [
            { name: 'Spray foam exterior walls', done: true },
            { name: 'Batt insulation interior walls', done: true },
            { name: 'Attic blown-in (R-49)', done: true },
            { name: 'Inspection — passed', done: true },
          ]},
      ],
    },
  ],
};

const DEMO_MESSAGES = [
  { message: 'Framing crew finished the kitchen beam install today. Looks great — passed structural inspection first try.', offset: -14 },
  { message: 'Plumbing rough-in for master bath is done. Waiting on the shower fixtures from supplier — ETA Thursday.', offset: -12 },
  { message: 'Heads up: tile for master shower arrived damaged. Reordered — adds 5 days to that zone.', offset: -10 },
  { message: 'Roofing is 100% done! Passed final inspection. One less thing to worry about.', offset: -8 },
  { message: 'Sparks Electric finished all kitchen and living room rough-in. Code inspection scheduled for Monday.', offset: -7 },
  { message: 'Drywall crew started 1st floor today. Should have both floors hung by end of week.', offset: -5 },
  { message: 'Replacement tile for master shower came in. Artisan Tile starts back up tomorrow morning.', offset: -4 },
  { message: 'HVAC dual-zone system installed. Running ductwork now. Should be balanced and ready for inspection by next Friday.', offset: -3 },
  { message: 'Quick update: Kitchen flooring started — heated mat is down, porcelain going in tomorrow.', offset: -2 },
  { message: 'Bathroom 2 is DONE — plumbing, tile, electrical, paint all complete. First zone fully signed off! 🎉', offset: -1 },
];

export function GCDashboardPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<GCTab>('projects');
  const [inviteModalSub, setInviteModalSub] = useState<any>(null);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { ready: orgReady, isLoading: orgLoading } = useAutoOrg();

  const projectsQuery = useQuery({
    queryKey: ['gc-projects'],
    queryFn: () => api.getGCProjects(),
    enabled: orgReady,
  });

  const subsQuery = useQuery({
    queryKey: ['gc-sub-directory'],
    queryFn: () => api.getGCSubDirectory(),
    enabled: orgReady && activeTab === 'subs',
  });

  const invitedQuery = useQuery({
    queryKey: ['invited-projects'],
    queryFn: () => api.getInvitedProjects(),
  });
  const invitedProjects: any[] = invitedQuery.data?.data || [];

  const projects: any[] = projectsQuery.data?.data || [];
  const subs: any[] = subsQuery.data?.data || [];

  // Demo data loader — full business data
  const [demoProgress, setDemoProgress] = useState<string | null>(null);
  const loadDemoMutation = useMutation({
    mutationFn: async () => {
      // First load the Henderson Estate (original demo)
      setDemoProgress('Creating Henderson Estate project...');
      const result = await api.createGCProject(DEMO_PROJECT);
      const projectId = result?.data?.id;
      if (projectId) {
        for (const msg of DEMO_MESSAGES) {
          try { await api.sendGCMessage(projectId, msg.message); } catch {}
        }
      }

      // Then load all additional demo data (2 more projects + historical business data)
      const stats = await loadAllDemoData((msg) => setDemoProgress(msg));
      return stats;
    },
    onSuccess: (stats) => {
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      queryClient.invalidateQueries({ queryKey: ['gc-sub-directory'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      setDemoProgress(null);
      addToast(
        `Demo loaded! 3 projects ($3.2M), ${stats?.jobs || 0} jobs, ${stats?.invoices || 0} invoices, ${stats?.expenses || 0} expenses`,
        'success',
      );
    },
    onError: () => {
      setDemoProgress(null);
      addToast('Some demo data may have failed — check your dashboard', 'error');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.deleteGCProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-projects'] });
      addToast('Project deleted', 'success');
    },
    onError: (err: any) => addToast(err.message || 'Failed to delete', 'error'),
  });

  const handleDeleteProject = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const totalBudget = projects.reduce((s: number, p: any) => s + (p.budget || 0), 0);
  const totalTrades = projects.reduce((s: number, p: any) => s + (p.trades?.length || 0), 0);
  const assignedTrades = projects.reduce(
    (s: number, p: any) => s + (p.trades?.filter((t: any) => t.assignedUserId || t.assignedOrgId).length || 0),
    0
  );

  // Filter subs by search
  const filteredSubs = useMemo(() => {
    if (!search.trim() || activeTab !== 'subs') return subs;
    const q = search.toLowerCase();
    return subs.filter(
      (s: any) =>
        s.businessName?.toLowerCase().includes(q) ||
        s.tradePrimary?.toLowerCase().includes(q) ||
        s.trades?.some((t: string) => t.toLowerCase().includes(q)) ||
        s.phone?.includes(q)
    );
  }, [subs, search, activeTab]);

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative p-4 lg:p-6 max-w-7xl mx-auto dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-[radial-gradient(circle_at_75%_10%,rgba(59,130,246,0.12),transparent_55%)] dark:before:-z-10">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4 dark:text-gray-500">
        <span>{activeTab === 'projects' ? 'Projects' : 'My Subs'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'projects' ? 'Projects' : 'My Subs'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
            {activeTab === 'projects'
              ? 'Manage your construction projects and trade assignments'
              : 'Your sub-contractor directory across all projects'}
          </p>
        </div>
        {activeTab === 'projects' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDemoMutation.mutate()}
              disabled={loadDemoMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <Zap className="w-3.5 h-3.5" />
              {loadDemoMutation.isPending ? (demoProgress || 'Loading...') : 'Load Demo Data'}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        )}
      </div>

      {/* Tab Toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6 max-w-xs dark:bg-white/10">
        <button
          type="button"
          onClick={() => { setActiveTab('projects'); setSearch(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
            activeTab === 'projects'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          } dark:text-white`}
        >
          <FolderKanban className="w-4 h-4" />
          Projects
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('subs'); setSearch(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
            activeTab === 'subs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          } dark:text-white`}
        >
          <Users className="w-4 h-4" />
          My Subs
        </button>
      </div>

      {/* ── Projects Tab ── */}
      {activeTab === 'projects' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1 dark:text-gray-400">
                <FolderKanban className="w-3.5 h-3.5" />
                Total Projects
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProjects}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1 dark:text-gray-400">
                <Activity className="w-3.5 h-3.5" />
                Active
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{activeProjects}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1 dark:text-gray-400">
                <DollarSign className="w-3.5 h-3.5" />
                Total Budget
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1 dark:text-gray-400">
                <Users className="w-3.5 h-3.5" />
                Trades Assigned
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignedTrades} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/ {totalTrades}</span>
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            />
          </div>

          {/* Invited Projects */}
          {invitedProjects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">Projects You're Invited To</h2>
              <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">Projects where you've been assigned as a sub-contractor.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {invitedProjects.map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                    onDelete={() => handleDeleteProject(project.id, project.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Project Grid */}
          {projectsQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1 dark:text-white">No projects yet</h3>
              <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">Create your first project to get started.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
                <button
                  onClick={() => loadDemoMutation.mutate()}
                  disabled={loadDemoMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                >
                  <Zap className="w-4 h-4" />
                  {loadDemoMutation.isPending ? (demoProgress || 'Loading...') : 'Load Demo Data'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  onDelete={() => handleDeleteProject(project.id, project.name)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My Subs Tab ── */}
      {activeTab === 'subs' && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search subs by name, trade, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            />
          </div>

          {subsQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1 dark:text-white">No subs yet</h3>
              <p className="text-sm text-gray-500 mb-2 max-w-md mx-auto dark:text-gray-400">
                When you assign sub-contractors to trades on your projects, they'll appear here as your rolodex.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Go to a project and invite a sub to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSubs.map((sub: any) => (
                <SubCard
                  key={sub.userId}
                  sub={sub}
                  onInvite={(s) => setInviteModalSub(s)}
                  onViewProfile={(s) => {
                    const profileId = s.isPlaceholder ? encodeURIComponent(s.businessName) : s.userId;
                    navigate(`/dashboard/subs/${profileId}`);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateGCProjectModal open={showCreate} onClose={() => setShowCreate(false)} />

      <TypeToConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        message={`This will permanently delete "${deleteTarget?.name}" and all its zones, trades, tasks, and messages. This cannot be undone.`}
        confirmWord="DELETE"
        confirmLabel="Delete Project"
        loading={deleteProjectMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteProjectMutation.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {inviteModalSub && (
        <InviteToProjectModal
          open={!!inviteModalSub}
          onClose={() => setInviteModalSub(null)}
          sub={inviteModalSub}
          projects={projects}
        />
      )}
    </div>
  );
}
