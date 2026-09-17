import React from 'react';
import { LeadStatus, LeadPriority, QuoteStatus, JobStatus, InvoiceStatus } from '../types/database';

interface BadgeProps {
  status: string;
  type?: 'lead' | 'priority' | 'quote' | 'job' | 'invoice';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, type = 'lead' }) => {
  const getColors = () => {
    switch (status) {
      // Leads
      case 'new':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'contacted':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'qualified':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      case 'quoted':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
      case 'converted':
        return 'bg-[#d4af37]/15 text-[#f3e5ab] border-[#d4af37]/40';
      case 'lost':
        return 'bg-zinc-900 text-zinc-400 border-zinc-700/60';

      // Priorities
      case 'urgent':
        return 'bg-red-950/70 text-red-300 border-red-700/70 animate-pulse';
      case 'high':
        return 'bg-orange-950/60 text-orange-300 border-orange-700/60';
      case 'medium':
        return 'bg-amber-950/50 text-amber-300 border-amber-800/50';
      case 'low':
        return 'bg-zinc-900 text-zinc-400 border-zinc-700/60';

      // Quotes
      case 'draft':
        return 'bg-zinc-900 text-zinc-300 border-zinc-700';
      case 'sent':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'viewed':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
      case 'approved':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60';
      case 'change_requested':
        return 'bg-orange-950/60 text-orange-300 border-orange-700/60';
      case 'declined':
        return 'bg-red-950/60 text-red-300 border-red-800/60';
      case 'expired':
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';

      // Jobs
      case 'scheduled':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60';
      case 'assigned':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'in_progress':
        return 'bg-amber-950/60 text-amber-300 border-amber-600/70';
      case 'on_hold':
        return 'bg-red-950/60 text-red-300 border-red-800/60';
      case 'completed':
        return 'bg-teal-950/60 text-teal-300 border-teal-700/60';
      case 'verified':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60';
      case 'cancelled':
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';

      // Invoices
      case 'issued':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'pending':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      case 'paid':
        return 'bg-emerald-950/70 text-emerald-200 border-emerald-500/70';
      case 'overdue':
        return 'bg-rose-950/70 text-rose-300 border-rose-700/70';

      default:
        return 'bg-zinc-900 text-zinc-300 border-zinc-700';
    }
  };

  const formatText = (str: string) => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase border ${getColors()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {formatText(status)}
    </span>
  );
};
