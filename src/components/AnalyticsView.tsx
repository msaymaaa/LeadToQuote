import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Wrench,
  Receipt,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  PieChart as PieChartIcon,
  Percent,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '../lib/store';

export const AnalyticsView: React.FC = () => {
  const { leads, quotes, jobs, invoices } = useAppStore();

  const isDataEmpty =
    leads.length === 0 && quotes.length === 0 && jobs.length === 0 && invoices.length === 0;

  // 1. LEAD ANALYTICS (Real Data)
  const leadsOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const d = new Date(l.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [leads]);

  const leadStatusDistribution = useMemo(() => {
    const statuses = [
      { name: 'New', count: leads.filter((l) => l.status === 'new').length, color: '#38bdf8' },
      { name: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length, color: '#fbbf24' },
      { name: 'Qualified', count: leads.filter((l) => l.status === 'qualified').length, color: '#34d399' },
      { name: 'Quoted', count: leads.filter((l) => l.status === 'quoted').length, color: '#c084fc' },
      { name: 'Converted', count: leads.filter((l) => l.status === 'converted').length, color: '#d4af37' },
      { name: 'Lost', count: leads.filter((l) => l.status === 'lost').length, color: '#71717a' },
    ];
    return statuses.filter((s) => s.count > 0);
  }, [leads]);

  const leadSourceDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || 'direct';
      map[src] = (map[src] || 0) + 1;
    });
    const colors = ['#d4af37', '#38bdf8', '#34d399', '#c084fc', '#fbbf24'];
    return Object.entries(map).map(([source, count], idx) => ({
      name: source.replace(/_/g, ' ').toUpperCase(),
      value: count,
      color: colors[idx % colors.length],
    }));
  }, [leads]);

  // 2. QUOTE ANALYTICS (Real Data)
  const quotesCreated = quotes.length;
  const quotesApproved = quotes.filter((q) => q.status === 'approved').length;
  const quotesDeclined = quotes.filter((q) => q.status === 'declined').length;
  const quotesPending = quotes.filter((q) => q.status === 'sent' || q.status === 'viewed').length;
  const quoteApprovalRate =
    quotesCreated > 0 ? ((quotesApproved / quotesCreated) * 100).toFixed(1) : '0.0';

  const quoteStatusDistribution = useMemo(() => {
    return [
      { stage: 'Approved', count: quotesApproved, fill: '#34d399' },
      { stage: 'Pending Client', count: quotesPending, fill: '#38bdf8' },
      { stage: 'Declined', count: quotesDeclined, fill: '#f87171' },
      { stage: 'Drafts', count: quotes.filter((q) => q.status === 'draft').length, fill: '#94a3b8' },
    ].filter((q) => q.count > 0);
  }, [quotes, quotesApproved, quotesPending, quotesDeclined]);

  // 3. JOB ANALYTICS (Real Data)
  const jobsScheduled = jobs.filter((j) => j.status === 'scheduled').length;
  const jobsInProgress = jobs.filter((j) => j.status === 'in_progress').length;
  const jobsCompleted = jobs.filter((j) => j.status === 'completed').length;
  const jobsVerified = jobs.filter((j) => j.status === 'verified').length;

  const jobMetrics = [
    { label: 'Scheduled', count: jobsScheduled, color: '#38bdf8' },
    { label: 'In Progress', count: jobsInProgress, color: '#fbbf24' },
    { label: 'Completed', count: jobsCompleted, color: '#2dd4bf' },
    { label: 'Verified', count: jobsVerified, color: '#34d399' },
  ];

  // 4. INVOICE ANALYTICS (Real Data)
  const outstandingInvoices = invoices.filter((i) => i.status === 'issued' || i.status === 'pending');
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + i.total, 0);

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const paidTotal = paidInvoices.reduce((sum, i) => sum + i.total, 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.total, 0);

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);

  if (isDataEmpty) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-[#212534]">
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d4af37]" />
            Commercial Operations Analytics
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Real-time pipeline metrics derived directly from your live Supabase database.
          </p>
        </div>

        <div className="p-12 rounded-3xl bg-[#12141c] border border-[#242838] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#1a1d28] border border-[#2b3144] flex items-center justify-center text-[#d4af37] mx-auto">
            <Info className="w-6 h-6 text-[#d4af37]" />
          </div>
          <h3 className="font-bold text-base text-[#f4efe6]">No Operational Records Found</h3>
          <p className="text-xs text-[#a8a296] leading-relaxed">
            Analytics populate dynamically from genuine customer inquiries, itemized quotes, field job executions, and issued invoices. Create your first lead or quotation to begin tracking performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="pb-2 border-b border-[#212534] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d4af37]" />
            Operations & Financial Analytics
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Calculated strictly from database records — zero simulated metrics.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1 rounded-lg bg-[#141722] border border-[#262b3a] text-[#cfc8bc]">
          Records: {leads.length} Leads • {quotes.length} Quotes • {jobs.length} Jobs • {invoices.length} Invoices
        </div>
      </div>

      {/* SECTION A: LEAD ANALYTICS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-[#38bdf8]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f4efe6]">
            1. Lead Volume & Intake Distribution
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Leads Over Time */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f4efe6]">Inquiries by Date</span>
              <span className="text-[11px] font-mono text-[#8c867a]">{leads.length} total logged</span>
            </div>
            <div className="h-52 w-full">
              {leadsOverTime.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#8c867a]">No date points available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#6e695e" fontSize={11} />
                    <YAxis stroke="#6e695e" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#151722',
                        borderColor: '#2e3448',
                        borderRadius: '8px',
                        color: '#f4efe6',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Lead Status & Source */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-4">
            <span className="text-xs font-semibold text-[#f4efe6] block">Status Breakdown</span>
            <div className="space-y-2">
              {leadStatusDistribution.map((st) => (
                <div key={st.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    <span className="text-[#cfc8bc]">{st.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-[#f4efe6] font-bold">{st.count}</span>
                    <span className="text-[#8c867a]">
                      ({((st.count / Math.max(1, leads.length)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#1e2332]">
              <span className="text-[11px] font-mono text-[#8c867a] uppercase block mb-2">
                Intake Source Breakdown
              </span>
              <div className="flex flex-wrap gap-2">
                {leadSourceDistribution.map((src) => (
                  <span
                    key={src.name}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#0b0c10] border border-[#222738] text-[#f4efe6]"
                  >
                    {src.name}: <span className="text-[#d4af37] font-bold">{src.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: QUOTE ANALYTICS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[#c084fc]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f4efe6]">
            2. Quotations & Conversion Velocity
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-[#12141c] border border-[#242838]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Quotes Created
            </span>
            <div className="text-2xl font-bold font-mono text-[#f4efe6] mt-1">{quotesCreated}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141c] border border-[#242838]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Quotes Approved
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{quotesApproved}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141c] border border-[#242838]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Quotes Declined
            </span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{quotesDeclined}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141c] border border-[#242838]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Quote Approval Rate
            </span>
            <div className="text-2xl font-bold font-mono text-[#d4af37] mt-1">{quoteApprovalRate}%</div>
          </div>
        </div>
      </div>

      {/* SECTION C: JOB EXECUTION ANALYTICS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-[#fbbf24]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f4efe6]">
            3. Field Job Execution Statuses
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {jobMetrics.map((jm) => (
            <div key={jm.label} className="p-4 rounded-xl bg-[#12141c] border border-[#242838]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a]">
                  {jm.label}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: jm.color }} />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe6] mt-1.5">{jm.count}</div>
              <div className="text-[10px] text-[#8c867a] mt-0.5">
                {jobs.length > 0 ? `${((jm.count / jobs.length) * 100).toFixed(0)}% of work orders` : '0%'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION D: INVOICE & REVENUE ANALYTICS */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-[#d4af37]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f4efe6]">
            4. Invoicing & Settlement Reconciliation
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
              Outstanding Pending
            </span>
            <div className="text-2xl font-bold font-mono text-[#f4efe6]">
              ${outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[#8c867a]">{outstandingInvoices.length} issued invoices</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
              Settled Paid
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-300">
              ${paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[#8c867a]">{paidInvoices.length} paid invoices</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold block">
              Overdue Invoices
            </span>
            <div className="text-2xl font-bold font-mono text-rose-300">
              ${overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[#8c867a]">{overdueInvoices.length} past due invoices</div>
          </div>
        </div>
      </div>
    </div>
  );
};
