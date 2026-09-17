import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  FileText,
  Wrench,
  Receipt,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Plus,
  Loader2,
  RotateCcw,
  Info,
  ChevronRight,
  Shield,
  Activity,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StatusBadge } from './StatusBadge';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAiAssist: () => void;
  onOpenQuoteBuilder: () => void;
  onSelectLead: (leadId: string) => void;
  onSelectJob: (jobId: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAiAssist,
  onOpenQuoteBuilder,
  onSelectLead,
  onSelectJob,
  onSelectInvoice,
}) => {
  const { business, leads, quotes, jobs, invoices, customers, profiles, getAiBusinessInsight } = useAppStore();

  // Primary Metrics from Real Store Data
  const activeLeads = leads.filter((l) => l.status !== 'converted' && l.status !== 'lost');
  const openQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'draft' || q.status === 'viewed');
  const activeJobs = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress' || j.status === 'assigned');
  const outstandingInvoices = invoices.filter((i) => i.status === 'issued' || i.status === 'pending');
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + i.total, 0);

  // Conversion calculations
  const totalLeads = leads.length;
  const approvedQuotes = quotes.filter((q) => q.status === 'approved').length;
  const realConversionRate =
    totalLeads > 0 ? `${((approvedQuotes / totalLeads) * 100).toFixed(1)}%` : '0.0%';
  const unquotedLeads = leads.filter((l) => l.status === 'new' || l.status === 'contacted');
  const hasInsufficientData = totalLeads === 0 && quotes.length === 0;

  // AI Business Insight state
  const [insightData, setInsightData] = useState<{
    insight: string;
    isEmpty?: boolean;
  } | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    setIsLoadingInsight(true);
    setInsightError(null);
    const res = await getAiBusinessInsight();
    setIsLoadingInsight(false);
    if (res.success) {
      setInsightData({ insight: res.insight, isEmpty: res.isEmpty });
    } else {
      setInsightError(res.error || 'Failed to fetch business insight.');
    }
  }, [getAiBusinessInsight]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight, leads.length, quotes.length, jobs.length, invoices.length]);

  // Section 6: Pipeline Stages (New → Contacted → Qualified → Quoted → Converted)
  const pipelineStages = useMemo(() => {
    return [
      {
        id: 'new',
        label: 'New',
        count: leads.filter((l) => l.status === 'new').length,
        color: '#38bdf8',
        desc: 'Uncontacted inquiries',
      },
      {
        id: 'contacted',
        label: 'Contacted',
        count: leads.filter((l) => l.status === 'contacted').length,
        color: '#fbbf24',
        desc: 'Initial touchpoint made',
      },
      {
        id: 'qualified',
        label: 'Qualified',
        count: leads.filter((l) => l.status === 'qualified').length,
        color: '#34d399',
        desc: 'Scope & budget confirmed',
      },
      {
        id: 'quoted',
        label: 'Quoted',
        count: leads.filter((l) => l.status === 'quoted').length,
        color: '#c084fc',
        desc: 'Proposal delivered',
      },
      {
        id: 'converted',
        label: 'Converted',
        count: leads.filter((l) => l.status === 'converted').length,
        color: '#d4af37',
        desc: 'Approved into active jobs',
      },
    ];
  }, [leads]);

  // Recent Activity synthesized from real application state
  const recentActivities = useMemo(() => {
    const list: { id: string; type: string; title: string; subtitle: string; time: string; targetId: string }[] = [];

    leads.slice(0, 3).forEach((l) => {
      const cust = customers.find((c) => c.id === l.customer_id);
      list.push({
        id: `act-lead-${l.id}`,
        type: 'lead',
        title: `Inquiry: ${l.title}`,
        subtitle: `${cust?.full_name || 'Client'} • Status: ${l.status}`,
        time: l.created_at,
        targetId: l.id,
      });
    });

    quotes.slice(0, 3).forEach((q) => {
      list.push({
        id: `act-quote-${q.id}`,
        type: 'quote',
        title: `Quotation ${q.quote_number}`,
        subtitle: `$${q.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} • ${q.status.toUpperCase()}`,
        time: q.created_at,
        targetId: q.id,
      });
    });

    jobs.slice(0, 2).forEach((j) => {
      list.push({
        id: `act-job-${j.id}`,
        type: 'job',
        title: `Work Order ${j.job_number}`,
        subtitle: `${j.scheduled_date} • ${j.status}`,
        time: j.created_at,
        targetId: j.id,
      });
    });

    invoices.slice(0, 2).forEach((i) => {
      list.push({
        id: `act-inv-${i.id}`,
        type: 'invoice',
        title: `Invoice ${i.invoice_number}`,
        subtitle: `$${i.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} • ${i.status.toUpperCase()}`,
        time: i.created_at,
        targetId: i.id,
      });
    });

    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);
  }, [leads, quotes, jobs, invoices, customers]);

  // Upcoming scheduled jobs
  const upcomingJobs = jobs.slice(0, 4);

  // Greeting based on client local hour
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* 1. TOP: Business Greeting + Date/Context (Section 4 Hierarchy) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4efe6] tracking-tight">
              {timeGreeting}, {business.name}
            </h1>
          </div>
          <p className="text-xs text-[#a8a296] mt-0.5 font-mono">
            {formattedDate} • Operational Command Center
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onOpenAiAssist}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Lead Intake</span>
          </button>
          <button
            onClick={onOpenQuoteBuilder}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#181b26] hover:bg-[#222736] border border-[#2e3448] text-xs text-[#f4efe6] font-medium transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>New Quote</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY METRICS: Active Leads, Open Quotes, Active Jobs, Outstanding Invoices (Section 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Leads */}
        <div
          onClick={() => onNavigateTab('admin-leads')}
          className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#38bdf8]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#8c867a]">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-[#f4efe6] font-mono">
            {activeLeads.length}
          </div>
          <div className="mt-1 text-[11px] text-[#a8a296] flex items-center justify-between">
            <span>{leads.filter((l) => l.status === 'new').length} uncontacted</span>
            <span className="text-xs text-[#38bdf8] group-hover:translate-x-0.5 transition flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Open Quotes */}
        <div
          onClick={() => onNavigateTab('admin-quotes')}
          className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#c084fc]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#8c867a]">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Open Quotes</span>
            <div className="w-8 h-8 rounded-lg bg-[#c084fc]/10 flex items-center justify-center text-[#c084fc]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-[#f4efe6] font-mono">
            {openQuotes.length}
          </div>
          <div className="mt-1 text-[11px] text-[#a8a296] flex items-center justify-between">
            <span>{quotes.filter((q) => q.status === 'sent').length} awaiting customer</span>
            <span className="text-xs text-[#c084fc] group-hover:translate-x-0.5 transition flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Active Jobs */}
        <div
          onClick={() => onNavigateTab('admin-jobs')}
          className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#fbbf24]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#8c867a]">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Active Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center text-[#fbbf24]">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-[#f4efe6] font-mono">
            {activeJobs.length}
          </div>
          <div className="mt-1 text-[11px] text-[#a8a296] flex items-center justify-between">
            <span>{jobs.filter((j) => j.status === 'in_progress').length} in field execution</span>
            <span className="text-xs text-[#fbbf24] group-hover:translate-x-0.5 transition flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div
          onClick={() => onNavigateTab('admin-invoices')}
          className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#d4af37]/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#d4af37]">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Outstanding Invoices</span>
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-[#f3e5ab] font-mono">
            ${outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[11px] text-[#a8a296] flex items-center justify-between">
            <span>{outstandingInvoices.length} pending settlement</span>
            <span className="text-xs text-[#d4af37] group-hover:translate-x-0.5 transition flex items-center">
              View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. AI: AI Business Insight (Section 4 & Section 9) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161924] to-[#11131a] border border-[#2a3044] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#202536]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#f4efe6] uppercase tracking-wider">
                  AI Business Insight
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#f3e5ab] border border-[#d4af37]/20">
                  Gemini Operations Engine
                </span>
              </div>
              <span className="text-[11px] text-[#8c867a]">
                Pipeline velocity, bottlenecks, and operational recommendations
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchInsight}
            disabled={isLoadingInsight}
            className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d29] hover:bg-[#23283a] text-xs text-[#cfc8bc] border border-[#2c3246] transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingInsight ? 'animate-spin text-[#d4af37]' : 'text-[#8c867a]'}`} />
            <span>{isLoadingInsight ? 'Analyzing...' : 'Refresh Insight'}</span>
          </button>
        </div>

        {/* Real Quantitative Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#202536]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Lead Intake Volume
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#f4efe6]">{totalLeads}</span>
              <span className="text-[11px] text-[#a8a296]">total customer requests</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#202536]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Pipeline Conversion Rate
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-400">{realConversionRate}</span>
              <span className="text-[11px] text-[#a8a296]">leads to approved quotes</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#202536]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block">
              Identified Bottlenecks
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-xl font-bold font-mono ${unquotedLeads.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {unquotedLeads.length}
              </span>
              <span className="text-[11px] text-[#a8a296]">awaiting quote draft</span>
            </div>
          </div>
        </div>

        {/* Narrative Insight & Empty State */}
        {hasInsufficientData || insightData?.isEmpty ? (
          <div className="p-4 rounded-xl bg-[#0b0c10]/60 border border-[#222738] flex items-start space-x-3 text-xs text-[#8c867a]">
            <Info className="w-4 h-4 mt-0.5 text-[#d4af37] flex-shrink-0" />
            <div>
              <span className="font-semibold text-[#cfc8bc] block">Insufficient Operational Data</span>
              <span>
                At least one lead and quotation are required to analyze conversion velocity. Use{' '}
                <button onClick={onOpenAiAssist} className="text-[#d4af37] underline hover:text-[#f3e5ab]">
                  AI Lead Intake
                </button>{' '}
                to record your first customer inquiry.
              </span>
            </div>
          </div>
        ) : isLoadingInsight ? (
          <div className="p-4 rounded-xl bg-[#0b0c10]/60 border border-[#222738] flex items-center space-x-3 text-xs text-[#a8a296]">
            <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
            <span>Synthesizing operational metrics with Gemini...</span>
          </div>
        ) : insightError ? (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{insightError}</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#0b0c10] border border-[#252b3d] space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#d4af37] font-semibold">
                Operational Narrative
              </span>
            </div>
            <p className="text-xs text-[#e2dcd0] leading-relaxed font-sans">
              {insightData?.insight ||
                'Pipeline velocity is healthy. Quotes with confirmed pricing within 24 hours show higher customer acceptance rates.'}
            </p>
          </div>
        )}
      </div>

      {/* 4. SECONDARY: Lead Pipeline (Section 4 & Section 6) */}
      <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider block">
              Lead Pipeline Velocity
            </span>
            <span className="text-[11px] text-[#8c867a]">
              Stage distribution: New → Contacted → Qualified → Quoted → Converted
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('admin-leads')}
            className="text-xs text-[#d4af37] hover:underline"
          >
            Manage Pipeline ({leads.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          {pipelineStages.map((stg) => (
            <div
              key={stg.id}
              onClick={() => onNavigateTab('admin-leads')}
              className="p-3.5 rounded-xl bg-[#0b0c10] border border-[#202434] hover:border-[#d4af37]/40 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8c867a]">
                <span className="font-semibold text-[#f4efe6]">{stg.label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stg.color }} />
              </div>
              <div className="text-2xl font-bold text-[#f4efe6] font-mono mt-1.5">{stg.count}</div>
              <div className="text-[10px] text-[#8c867a] mt-0.5 truncate">{stg.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SECONDARY: Upcoming Jobs & Recent Activity (Section 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Jobs */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#202434]">
            <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Upcoming Scheduled Jobs
            </span>
            <button
              onClick={() => onNavigateTab('admin-jobs')}
              className="text-[11px] text-[#d4af37] hover:underline"
            >
              View all ({jobs.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingJobs.length === 0 ? (
              <p className="text-xs text-[#8c867a] py-6 text-center">No upcoming jobs scheduled.</p>
            ) : (
              upcomingJobs.map((job) => {
                const cust = customers.find((c) => c.id === job.customer_id);
                const tech = profiles.find((p) => p.id === job.assigned_to);

                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    className="p-3 rounded-xl bg-[#0b0c10] border border-[#202434] hover:border-[#2f354a] transition cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[#d4af37]">{job.job_number}</span>
                      <StatusBadge status={job.status} type="job" />
                    </div>
                    <div className="font-medium text-[#f4efe6] truncate">
                      {cust?.full_name || 'Client'} • {job.description || 'Service Work Order'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#8c867a] pt-1">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {job.scheduled_date} at {job.scheduled_start || '09:00'}
                      </span>
                      <span>Tech: {tech?.full_name?.split(' ')[0] || 'Unassigned'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#202434]">
            <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#38bdf8]" />
              Recent Operations Activity
            </span>
            <span className="text-[11px] font-mono text-[#8c867a]">Live Log</span>
          </div>

          <div className="space-y-2.5">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-[#8c867a] py-6 text-center">No recent activity recorded.</p>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => {
                    if (act.type === 'lead') onSelectLead(act.targetId);
                    else if (act.type === 'job') onSelectJob(act.targetId);
                    else if (act.type === 'invoice') onSelectInvoice(act.targetId);
                    else onNavigateTab('admin-quotes');
                  }}
                  className="p-3 rounded-xl bg-[#0b0c10] border border-[#202434] hover:border-[#2f354a] transition cursor-pointer text-xs flex items-start space-x-3"
                >
                  <div className="w-6 h-6 rounded-md bg-[#181b26] flex items-center justify-center text-[#d4af37] flex-shrink-0 mt-0.5">
                    {act.type === 'lead' ? (
                      <Users className="w-3 h-3 text-[#38bdf8]" />
                    ) : act.type === 'quote' ? (
                      <FileText className="w-3 h-3 text-[#c084fc]" />
                    ) : act.type === 'job' ? (
                      <Wrench className="w-3 h-3 text-[#fbbf24]" />
                    ) : (
                      <Receipt className="w-3 h-3 text-[#d4af37]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#f4efe6] truncate">{act.title}</p>
                    <p className="text-[11px] text-[#8c867a] truncate">{act.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-[#6e695e] flex-shrink-0 font-mono">
                    {new Date(act.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
