import React from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Wrench,
  Receipt,
  Users,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  Laptop,
  Check,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface PublicLandingViewProps {
  onOpenAiAssist: () => void;
  onNavigateToPortal: () => void;
  onNavigateToAdmin: () => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onOpenAiAssist,
  onNavigateToPortal,
  onNavigateToAdmin,
}) => {
  const scrollToWorkflow = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'Lead Intake',
      desc: 'Customer submits request via web portal or natural inquiry. Gemini AI parses items, locations, and urgency.',
      icon: Users,
      badge: 'Capture',
      color: '#38bdf8',
    },
    {
      step: '02',
      title: 'Itemized Quote',
      desc: 'Contractor generates structured proposals with material costs, labor, and warranty terms in seconds.',
      icon: FileText,
      badge: 'Estimate',
      color: '#c084fc',
    },
    {
      step: '03',
      title: 'Customer Approval',
      desc: 'Clients inspect clear breakdowns and approve online with a single verified click. No paper delays.',
      icon: CheckCircle2,
      badge: 'Sign-Off',
      color: '#34d399',
    },
    {
      step: '04',
      title: 'Job Dispatch',
      desc: 'Approved quotes automatically convert to work orders. Field technicians receive site notes and checklist.',
      icon: Wrench,
      badge: 'Execution',
      color: '#fbbf24',
    },
    {
      step: '05',
      title: 'Final Invoice',
      desc: 'Technicians log completion notes and photos; clean invoice is instantly issued for settlement recording.',
      icon: Receipt,
      badge: 'Settlement',
      color: '#d4af37',
    },
  ];

  const coreProblems = [
    {
      title: 'Fragmented Tools & Lost Inquiries',
      description:
        'Leads slip through cracks when intake happens across SMS, voicemail, and unorganized email threads with no central record.',
    },
    {
      title: 'Quoting Bottlenecks',
      description:
        'Contractors spend hours re-typing estimates into spreadsheets. Slow quote turnaround costs win rates with competitive clients.',
    },
    {
      title: 'Disconnected Field Work',
      description:
        'Technicians arrive on site without scope details or customer history, causing costly revisits and disputes over billing.',
    },
    {
      title: 'Delayed Invoicing & Cash Flow Gaps',
      description:
        'Manual reconciliation between job notes and accounting software delays billing weeks after service completion.',
    },
  ];

  const keyBenefits = [
    {
      title: 'Single Source of Truth',
      desc: 'From first phone inquiry to final paid invoice, every event and document is logged with immutable timestamps.',
    },
    {
      title: 'Human-in-the-Loop AI',
      desc: 'AI extracts structured scopes and summarizes complex jobs without ever executing unilateral database changes.',
    },
    {
      title: 'Field-Ready Mobile UX',
      desc: 'Technicians can view schedules, update work stages, and attach completion evidence from any smartphone.',
    },
    {
      title: 'Transparent Client Experience',
      desc: 'Customers enjoy a dedicated self-service portal to track estimates, review job status, and verify billing.',
    },
  ];

  return (
    <div className="space-y-20 py-6">
      {/* 1. Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#151824] via-[#10121a] to-[#0b0c10] border border-[#262b3c] p-8 sm:p-14 overflow-hidden shadow-2xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-mono font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Commercial Trade Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#f4efe6] tracking-tight leading-[1.12]">
            From First Lead to <span className="text-[#d4af37]">Final Invoice.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#b8b2a6] leading-relaxed max-w-2xl font-normal">
            LeadToQuote gives service businesses one streamlined workflow for managing customer requests, quotations, field work, and invoices.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onNavigateToAdmin}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center space-x-2"
            >
              <span>Start Managing Leads</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={scrollToWorkflow}
              className="px-5 py-3.5 rounded-xl bg-[#181b26] hover:bg-[#202534] text-xs sm:text-sm text-[#f4efe6] border border-[#2c3246] transition"
            >
              See How It Works
            </button>

            <button
              onClick={onOpenAiAssist}
              className="px-4 py-3.5 rounded-xl bg-transparent hover:bg-[#181b26] text-xs sm:text-sm text-[#f3e5ab] flex items-center space-x-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Try AI Intake</span>
            </button>
          </div>

          {/* Value Proof Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#202536] text-xs text-[#a8a296]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
              <span>Zero-fragmentation workflow</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
              <span>Role-governed security & RLS</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
              <span>Real-time client collaboration</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Workflow Progression (Section 3 Requirement) */}
      <section id="how-it-works-section" className="space-y-6 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
            UNIFIED TRADE PIPELINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f4efe6] tracking-tight">
            How Work Moves Through LeadToQuote
          </h2>
          <p className="text-xs sm:text-sm text-[#a8a296]">
            One continuous operational flow without data re-entry or dropped handoffs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {workflowSteps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] flex flex-col justify-between space-y-4 hover:border-[#d4af37]/40 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#d4af37]">{s.step}</span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                      style={{ color: s.color, backgroundColor: `${s.color}15` }}
                    >
                      {s.badge}
                    </span>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-[#1a1d28] border border-[#2b3144] flex items-center justify-center text-[#f4efe6] group-hover:scale-105 transition">
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>

                  <h3 className="font-bold text-sm text-[#f4efe6]">{s.title}</h3>
                  <p className="text-xs text-[#a8a296] leading-relaxed">{s.desc}</p>
                </div>

                {idx < workflowSteps.length - 1 && (
                  <div className="hidden lg:flex items-center text-[#40475e] pt-1">
                    <ChevronRight className="w-4 h-4 text-[#40475e]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Core Problem Section */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#11131a] border border-[#222738] space-y-8">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
            THE CORE INDUSTRY BOTTLENECK
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f4efe6] tracking-tight">
            Why Traditional Service Businesses Stall
          </h2>
          <p className="text-xs sm:text-sm text-[#a8a296]">
            Trade contractors lose 20% to 35% of their billable potential not from lack of skill, but from disconnected operational tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreProblems.map((prob, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#0b0c10] border border-[#202536] space-y-2.5"
            >
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <h4 className="font-semibold text-sm text-[#f4efe6]">{prob.title}</h4>
              </div>
              <p className="text-xs text-[#a8a296] leading-relaxed pl-6">{prob.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AI Assistance Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Human-in-the-Loop Gemini Intelligence</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-[#f4efe6] tracking-tight">
            AI That Accelerates Workflows, Never Replaces Human Judgment
          </h2>

          <p className="text-xs sm:text-sm text-[#a8a296] leading-relaxed">
            LeadToQuote leverages Gemini models strictly as an operational assistant. Every output is presented in an editable review modal before database persistence.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 text-xs text-[#cfc8bc]">
              <div className="w-5 h-5 rounded-md bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-[#f4efe6] block">Natural Language Lead Assist</span>
                <span>Transforms messy client voicemails, SMS, and emails into structured records with location, date, and urgency.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-[#cfc8bc]">
              <div className="w-5 h-5 rounded-md bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-[#f4efe6] block">Scope & Proposal Polishing</span>
                <span>Turns shorthand technician diagnostic notes into clear, commercial-standard customer descriptions.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-[#cfc8bc]">
              <div className="w-5 h-5 rounded-md bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-[#f4efe6] block">Executive Pipeline Insights</span>
                <span>Calculates conversion velocity, flags aged inquiries, and suggests priority dispatches automatically.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#12141c] border border-[#282d3e] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#212638]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span className="text-xs font-bold text-[#f4efe6]">AI Intake Preview</span>
            </div>
            <span className="text-[10px] font-mono bg-[#d4af37]/10 text-[#f3e5ab] px-2 py-0.5 rounded border border-[#d4af37]/20">
              Review Before Save
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#202434] text-xs text-[#a8a296]">
            <span className="text-[10px] font-mono text-[#8c867a] uppercase block mb-1">Customer Raw Input:</span>
            "Our restaurant walk-in freezer is making a grinding noise and temperature dropped to 48F. Need someone early tomorrow morning in downtown San Francisco."
          </div>

          <div className="p-3 rounded-xl bg-[#161924] border border-[#d4af37]/30 text-xs space-y-2">
            <span className="text-[10px] font-mono text-[#d4af37] uppercase font-bold block">
              Extracted Structured Proposal
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-[#8c867a]">Service:</span> Commercial HVAC / Refrigeration</div>
              <div><span className="text-[#8c867a]">Urgency:</span> <span className="text-rose-400 font-semibold">Urgent</span></div>
              <div><span className="text-[#8c867a]">Target Date:</span> Tomorrow Morning</div>
              <div><span className="text-[#8c867a]">Site:</span> Downtown San Francisco</div>
            </div>
          </div>

          <button
            onClick={onOpenAiAssist}
            className="w-full py-2.5 rounded-xl bg-[#1b1f2d] hover:bg-[#23283a] text-xs font-semibold text-[#f3e5ab] border border-[#2f354a] transition flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Open Interactive AI Assist Demo</span>
          </button>
        </div>
      </section>

      {/* 5. Key Benefits Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold">
            ENGINEERED FOR CONTRACTORS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f4efe6] tracking-tight">
            Key Architectural Advantages
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyBenefits.map((b, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-2 hover:border-[#d4af37]/30 transition"
            >
              <h3 className="font-semibold text-sm text-[#f4efe6]">{b.title}</h3>
              <p className="text-xs text-[#a8a296] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Bottom Call to Action */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#171a26] via-[#141720] to-[#171a26] border border-[#2a3044] text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f4efe6] tracking-tight">
            Ready to Streamline Your Trade Operations?
          </h2>
          <p className="text-xs sm:text-sm text-[#a8a296] leading-relaxed">
            Eliminate communication gaps between your front office, field technicians, and clients.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          <button
            onClick={onNavigateToAdmin}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center space-x-2"
          >
            <span>Launch Contractor Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateToPortal}
            className="px-5 py-3.5 rounded-xl bg-[#12141c] hover:bg-[#1a1d29] text-xs sm:text-sm text-[#cfc8bc] border border-[#2b3042] transition"
          >
            Switch to Client Portal
          </button>
        </div>
      </section>
    </div>
  );
};
