import React, { useState } from 'react';
import {
  FileText,
  Wrench,
  Receipt,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  CreditCard,
  Printer,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Eye,
  ShieldCheck,
  Plus,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Quote, Job, Invoice, Lead } from '../types/database';
import { StatusBadge } from './StatusBadge';
import { CustomerRequestModal } from './CustomerRequestModal';

interface CustomerPortalViewProps {
  onOpenAiAssist: () => void;
  onViewQuote: (quoteId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  onOpenAiAssist,
  onViewQuote,
  onViewInvoice,
}) => {
  const {
    business,
    currentProfile,
    customers,
    services,
    leads,
    quotes,
    jobs,
    invoices,
    approveQuote,
    requestQuoteChange,
    declineQuote,
    markInvoicePaid,
  } = useAppStore();
  const toast = useToast();

  const [changeNoteInput, setChangeNoteInput] = useState<{ [key: string]: string }>({});
  const [showChangeDialog, setShowChangeDialog] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Match current profile to customer record, or fallback to first customer
  const myCustomer =
    customers.find((c) => c.profile_id === currentProfile.id || c.email === currentProfile.email) ||
    customers[0];

  const myLeads = leads.filter((l) => l.customer_id === myCustomer?.id);
  const myQuotes = quotes.filter((q) => q.customer_id === myCustomer?.id);
  const myJobs = jobs.filter((j) => j.customer_id === myCustomer?.id);
  const myInvoices = invoices.filter((i) => i.customer_id === myCustomer?.id);

  const handleApprove = async (quoteId: string) => {
    await approveQuote(quoteId);
    toast.success('Quote approved successfully.', 'Work order has been queued for technician dispatch.');
  };

  const handleSendChangeRequest = async (quoteId: string) => {
    const note = changeNoteInput[quoteId] || 'Please adjust the scheduled dates and line items.';
    await requestQuoteChange(quoteId, note);
    setShowChangeDialog(null);
    toast.info('Change request submitted.', 'Our team will review your adjustments and update the proposal.');
  };

  const handleDecline = async (quoteId: string) => {
    await declineQuote(quoteId, 'Customer selected alternative quote or deferred project.');
    toast.info('Quote marked as declined.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Customer Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#171a27] via-[#12141d] to-[#0f1118] border border-[#272c3e] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-[#d4af37] uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span>Verified Client Portal • {business.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f4efe6] tracking-tight mt-1">
              Welcome, {myCustomer?.full_name || currentProfile.full_name}
            </h1>
            <p className="text-xs text-[#a8a296] mt-1 max-w-xl">
              Track project milestones, submit new service requests, review and authorize quotations, monitor live technician updates, and pay invoices.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1c2132] hover:bg-[#252c42] border border-[#303852] text-xs font-semibold text-[#f4efe6] transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#38bdf8]" />
              <span>Submit Request</span>
            </button>
            <button
              onClick={onOpenAiAssist}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-lg transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Trade Assist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 0: My Inquiries & Service Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#212534]">
          <div>
            <h2 className="text-base font-bold text-[#f4efe6] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#38bdf8]" />
              My Service Inquiries & Requests ({myLeads.length})
            </h2>
            <span className="text-xs text-[#a8a296]">
              Status of your submitted repair, maintenance, and installation requests.
            </span>
          </div>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="text-xs text-[#38bdf8] hover:underline font-medium"
          >
            + New Request
          </button>
        </div>

        {myLeads.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] text-center text-xs text-[#8c867a]">
            You have no active inquiries. Click "Submit Request" to have our trade team prepare an estimate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myLeads.map((lead) => {
              const srv = services.find((s) => s.id === lead.service_id);
              const relatedQuote = quotes.find((q) => q.lead_id === lead.id);

              return (
                <div
                  key={lead.id}
                  className="p-5 rounded-2xl bg-[#131520] border border-[#242838] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={lead.status} type="lead" />
                    <span className="text-[11px] text-[#8c867a]">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#f4efe6]">{lead.title}</h3>
                    {srv && (
                      <span className="text-[11px] text-[#38bdf8] font-medium block mt-0.5">
                        Category: {srv.name}
                      </span>
                    )}
                    <p className="text-xs text-[#cfc8bc] line-clamp-2 mt-1.5 leading-relaxed">
                      {lead.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1e2230] flex items-center justify-between text-xs text-[#8c867a]">
                    <span>Preferred Date: {lead.preferred_date || 'Flexible'}</span>
                    {relatedQuote && (
                      <button
                        onClick={() => onViewQuote(relatedQuote.id)}
                        className="text-[#d4af37] font-semibold hover:underline"
                      >
                        View Quote (${relatedQuote.total.toFixed(2)}) →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 1: Quotations Awaiting Review / Approval */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#212534]">
          <div>
            <h2 className="text-base font-bold text-[#f4efe6] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#c084fc]" />
              Quotations & Commercial Proposals ({myQuotes.length})
            </h2>
            <span className="text-xs text-[#a8a296]">
              Review line items, authorize project commencement, or request adjustments.
            </span>
          </div>
        </div>

        {myQuotes.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] text-center text-xs text-[#8c867a]">
            No proposals currently open. Click "Submit Request" to start an inquiry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myQuotes.map((quote) => (
              <div
                key={quote.id}
                className={`p-5 rounded-2xl bg-[#131520] border transition space-y-4 ${
                  quote.status === 'sent'
                    ? 'border-[#d4af37]/50 shadow-lg shadow-[#d4af37]/5'
                    : 'border-[#242838]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#d4af37]">
                      {quote.quote_number}
                    </span>
                    <div className="text-lg font-bold font-mono text-[#f3e5ab] mt-0.5">
                      ${quote.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <StatusBadge status={quote.status} type="quote" />
                </div>

                <div className="text-xs text-[#cfc8bc] space-y-1.5 p-3 rounded-xl bg-[#0b0c10] border border-[#202434]">
                  <div className="font-medium text-[#f4efe6]">
                    {quote.items?.[0]?.description || 'Trade Service Agreement'}
                  </div>
                  {quote.items && quote.items.length > 1 && (
                    <div className="text-[11px] text-[#8c867a]">
                      + {quote.items.length - 1} additional service item(s)
                    </div>
                  )}
                  <div className="text-[11px] text-[#8c867a] flex items-center pt-1 border-t border-[#1a1d26]">
                    <Clock className="w-3 h-3 mr-1 text-[#787265]" />
                    <span>Valid until: {quote.valid_until || '30 days'}</span>
                  </div>
                </div>

                {quote.notes && (
                  <p className="text-[11px] text-[#8c867a] italic line-clamp-2">
                    Terms: {quote.notes}
                  </p>
                )}

                {/* Actions Bar */}
                <div className="pt-2 border-t border-[#1e2230] flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onViewQuote(quote.id)}
                    className="text-xs text-[#cfc8bc] hover:text-[#f4efe6] font-medium flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Read Full Quote</span>
                  </button>

                  {quote.status === 'sent' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowChangeDialog(quote.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#181b26] hover:bg-[#202534] text-xs text-[#cfc8bc] border border-[#282d3e]"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => handleDecline(quote.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-xs text-red-300 border border-red-800/40"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(quote.id)}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Quote</span>
                      </button>
                    </div>
                  )}

                  {quote.status === 'approved' && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                      {quote.approved_at && (
                        <span className="text-[10px] text-[#8c867a] font-normal ml-1">
                          ({new Date(quote.approved_at).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Change Request Input Box */}
                {showChangeDialog === quote.id && (
                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#2b3042] space-y-2 pt-2">
                    <span className="text-xs font-semibold text-[#f4efe6] block">
                      Specify Desired Adjustments
                    </span>
                    <textarea
                      rows={2}
                      value={changeNoteInput[quote.id] || ''}
                      onChange={(e) =>
                        setChangeNoteInput({ ...changeNoteInput, [quote.id]: e.target.value })
                      }
                      placeholder="e.g. Could we reschedule to next Monday and add haul-away for two extra units?"
                      className="w-full bg-[#141622] border border-[#282d3e] rounded-lg p-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowChangeDialog(null)}
                        className="px-2.5 py-1 text-xs text-[#8c867a]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendChangeRequest(quote.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-[#0b0c10] font-bold text-xs rounded-lg"
                      >
                        Submit Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Active Trade Jobs & Real-time Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#212534]">
          <div>
            <h2 className="text-base font-bold text-[#f4efe6] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Service Jobs & Repair Timeline ({myJobs.length})
            </h2>
            <span className="text-xs text-[#a8a296]">
              Real-time updates, scheduled appointment windows, and technician field logs.
            </span>
          </div>
        </div>

        {myJobs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] text-center text-xs text-[#8c867a]">
            No active jobs scheduled yet.
          </div>
        ) : (
          <div className="space-y-4">
            {myJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-[#131520] border border-[#242838] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#d4af37]">
                      {job.job_number}
                    </span>
                    <h3 className="font-bold text-sm text-[#f4efe6] mt-0.5">{job.description}</h3>
                  </div>
                  <StatusBadge status={job.status} type="job" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#0b0c10] border border-[#202434] text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#8c867a] block">
                      Scheduled Window
                    </span>
                    <div className="font-semibold text-[#f4efe6] mt-0.5">
                      {job.scheduled_date} ({job.scheduled_start} - {job.scheduled_end})
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#8c867a] block">
                      Site Address
                    </span>
                    <div className="font-semibold text-[#f4efe6] mt-0.5">{job.location}</div>
                  </div>
                </div>

                {/* Progress Log for Customer */}
                {job.updates && job.updates.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1e2230]">
                    <span className="text-[11px] font-mono text-[#8c867a] uppercase tracking-wider block">
                      Technician Field Progress
                    </span>
                    <div className="space-y-2">
                      {job.updates.slice(0, 3).map((up) => (
                        <div
                          key={up.id}
                          className="p-3 rounded-lg bg-[#0e1017] border border-[#202434] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[#8c867a]">
                            <span className="font-semibold text-[#f3e5ab]">
                              Status: {up.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono">
                              {new Date(up.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[#cfc8bc]">{up.note}</p>
                          {up.photo_url && (
                            <img
                              src={up.photo_url}
                              alt="Job Evidence"
                              className="w-32 h-20 object-cover rounded-lg border border-[#2a2f42] mt-1"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Billing & Invoices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#212534]">
          <div>
            <h2 className="text-base font-bold text-[#f4efe6] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Invoices & Payment Settlement ({myInvoices.length})
            </h2>
            <span className="text-xs text-[#a8a296]">
              Verified work orders billed on Net 14 terms. Settlements accepted via bank wire, ACH, or commercial check.
            </span>
          </div>
        </div>

        {myInvoices.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] text-center text-xs text-[#8c867a]">
            No invoices issued yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl bg-[#131520] border border-[#242838] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-[#d4af37]">
                      {inv.invoice_number}
                    </span>
                    <StatusBadge status={inv.status} type="invoice" />
                  </div>
                  <div className="font-bold text-lg font-mono text-[#f4efe6] mt-1">
                    ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-[#8c867a]">
                    Due Date: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Upon receipt'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewInvoice(inv.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#181b26] hover:bg-[#202534] text-xs text-[#cfc8bc] border border-[#282d3e] flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>View / Print</span>
                  </button>

                  {inv.status !== 'paid' ? (
                    <button
                      onClick={async () => {
                        await markInvoicePaid(inv.id);
                        toast.success('Offline settlement recorded.', `Invoice ${inv.invoice_number} marked as settled.`);
                      }}
                      title="Confirm offline payment via check, ACH, or bank transfer"
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Record Offline Settlement (${inv.total.toFixed(2)})</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Paid & Settled
                      {inv.paid_at && (
                        <span className="text-[10px] text-[#8c867a] font-normal ml-1">
                          ({new Date(inv.paid_at).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <CustomerRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        customerId={myCustomer.id}
      />
    </div>
  );
};
