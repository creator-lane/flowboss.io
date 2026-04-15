import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, FileText, FolderKanban, HardHat } from 'lucide-react';
import { api } from '../../lib/api';

interface SearchResults {
  jobs: any[];
  customers: any[];
  invoices: any[];
  projects: any[];
  contractors: any[];
}

const emptyResults: SearchResults = { jobs: [], customers: [], invoices: [], projects: [], contractors: [] };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K to open, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(emptyResults);
    }
  }, [open]);

  const searchAll = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults(emptyResults);
      return;
    }

    setLoading(true);
    try {
      const [jobsRes, customersRes, invoicesRes, projectsRes, contractorsRes] = await Promise.all([
        api.getTodaysJobs(undefined, 'month').catch(() => ({ data: [] })),
        api.getCustomers({ search: q }).catch(() => ({ data: [] })),
        api.getInvoices().catch(() => ({ data: [] })),
        api.getGCProjects().catch(() => ({ data: [] })),
        api.getContractors().catch(() => ({ data: [] })),
      ]);

      const lq = q.toLowerCase();

      const jobs = (jobsRes.data || [])
        .filter(
          (j: any) =>
            j.description?.toLowerCase().includes(lq) ||
            j.customer?.firstName?.toLowerCase().includes(lq) ||
            j.customer?.lastName?.toLowerCase().includes(lq)
        )
        .slice(0, 5);

      const customers = (customersRes.data || []).slice(0, 5);

      const invoices = (invoicesRes.data || [])
        .filter(
          (i: any) =>
            i.invoiceNumber?.toLowerCase().includes(lq) ||
            i.customer?.firstName?.toLowerCase().includes(lq) ||
            i.customer?.lastName?.toLowerCase().includes(lq)
        )
        .slice(0, 5);

      const projects = (projectsRes.data || [])
        .filter(
          (p: any) =>
            p.name?.toLowerCase().includes(lq) ||
            p.customerName?.toLowerCase().includes(lq)
        )
        .slice(0, 5);

      const contractors = (contractorsRes.data || [])
        .filter(
          (c: any) =>
            c.company_name?.toLowerCase().includes(lq) ||
            c.contact_name?.toLowerCase().includes(lq) ||
            c.phone?.toLowerCase().includes(lq) ||
            c.email?.toLowerCase().includes(lq)
        )
        .slice(0, 5);

      setResults({ jobs, customers, invoices, projects, contractors });
    } catch {
      setResults(emptyResults);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAll(value), 300);
  };

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const hasResults =
    results.jobs.length > 0 ||
    results.customers.length > 0 ||
    results.invoices.length > 0 ||
    results.projects.length > 0 ||
    results.contractors.length > 0;

  const noResults = !hasResults && !loading;

  return (
    <>
      {/* Collapsed: icon button with shortcut hint */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
        title="Search (Cmd+K)"
      >
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </button>

      {/* Expanded: search overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Search panel */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white dark:bg-gray-900 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 border border-gray-200 overflow-hidden">
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search jobs, customers, invoices, contractors..."
                className="flex-1 text-sm outline-none bg-transparent dark:text-white dark:placeholder:text-gray-500"
              />
              <kbd className="text-[10px] text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {/* Loading indicator */}
              {loading && query.length >= 2 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Searching...
                </div>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Customers
                  </div>
                  {results.customers.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => goTo(`/dashboard/customers/${c.id}`)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/10 w-full text-left transition-colors"
                    >
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {c.firstName} {c.lastName}
                        </span>
                        {c.email && (
                          <span className="ml-2 text-xs text-gray-400">
                            {c.email}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {results.jobs.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Jobs
                  </div>
                  {results.jobs.map((j: any) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => goTo(`/dashboard/jobs/${j.id}`)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/10 w-full text-left transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-gray-900 dark:text-gray-100 truncate block">
                          {j.description || 'Untitled Job'}
                        </span>
                        {j.customer && (
                          <span className="text-xs text-gray-400">
                            {j.customer.firstName} {j.customer.lastName}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {results.invoices.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Invoices
                  </div>
                  {results.invoices.map((i: any) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => goTo(`/dashboard/invoices/${i.id}`)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/10 w-full text-left transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          #{i.invoiceNumber}
                        </span>
                        {i.customer && (
                          <span className="ml-2 text-xs text-gray-400">
                            {i.customer.firstName} {i.customer.lastName}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Projects
                  </div>
                  {results.projects.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => goTo(`/dashboard/projects/${p.id}`)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/10 w-full text-left transition-colors"
                    >
                      <FolderKanban className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {p.name}
                        </span>
                        {p.customerName && (
                          <span className="ml-2 text-xs text-gray-400">
                            {p.customerName}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Contractors */}
              {results.contractors.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Contractors
                  </div>
                  {results.contractors.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => goTo(`/dashboard/contractors/${c.id}`)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/10 w-full text-left transition-colors"
                    >
                      <HardHat className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {c.company_name || c.contact_name || 'Unnamed Contractor'}
                        </span>
                        {c.contact_name && c.company_name && (
                          <span className="ml-2 text-xs text-gray-400">
                            {c.contact_name}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {noResults && query.length >= 2 && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}

              {/* Hint when no query yet */}
              {query.length < 2 && !loading && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
