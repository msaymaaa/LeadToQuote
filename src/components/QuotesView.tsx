import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Send,
  Wrench,
  Calendar,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { StatusBadge } from './StatusBadge';

interface QuotesViewProps {
  onOpenQuoteBuilder: (quoteId?: string) => void;
  onConvertQuoteToJob: (quoteId: string) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  onOpenQuoteBuilder,
  onConvertQuoteToJob,
}) => {
  const { quotes, customers, sendQuote } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const cust = customers.find((c) => c.id === q.customer_id);
      const matchesSearch =
        q.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust?.full_name && cust.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.notes && q.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, customers, searchTerm, statusFilter]);

  const handleSendQuote = async (quoteId: string) => {
    await sendQuote(quoteId);
    toast.success('Quote sent successfully to client.', 'Customer portal has been updated with review permissions.');
  };

  const handleConvertJob = (quoteId: string) => {
    onConvertQuoteToJob(quoteId);
    toast.info('Initiating work order dispatch for approved quote.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#c084fc]" />
            Quotations & Estimates
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Commercial trade proposals, client review statuses, and one-click dispatch conversion.
          </p>
        </div>

        <button
          onClick={() => onOpenQuoteBuilder()}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quote</span>
        </button>
      </div>

      {/* Filter Bar (Section 8: Visual distinctions) */}
      <div className="p-4 rounded-2xl bg-[#12141c] border border-[#242838] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8c867a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by quote # or customer name..."
            className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f4efe6] placeholder-[#646056] focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-[#8c867a]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="approved">Approved</option>
            <option value="change_requested">Change Requested</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <FileText className="w-8 h-8 text-[#8c867a] mx-auto" />
          <p className="text-sm font-semibold text-[#f4efe6]">No quotations found</p>
          <p className="text-xs text-[#8c867a] max-w-sm mx-auto">
            Create an itemized quote from scratch or convert an existing customer lead.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onOpenQuoteBuilder()}
              className="px-4 py-2 bg-[#1c2030] text-xs font-semibold text-[#f4efe6] rounded-xl border border-[#2d3448] hover:bg-[#252b40]"
            >
              + Create Quote
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="sm:hidden space-y-3">
            {filteredQuotes.map((quote) => {
              const cust = customers.find((c) => c.id === quote.customer_id);

              return (
                <div
                  key={quote.id}
                  onClick={() => onOpenQuoteBuilder(quote.id)}
                  className="p-4 rounded-xl bg-[#12141c] border border-[#242838] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#f4efe6]">
                      {quote.quote_number}
                    </span>
                    <StatusBadge status={quote.status} type="quote" />
                  </div>

                  <div>
                    <div className="font-medium text-xs text-[#f4efe6]">{cust?.full_name}</div>
                    <div className="text-[11px] text-[#8c867a]">{cust?.phone}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e2230] text-xs">
                    <span className="font-mono font-bold text-[#f3e5ab]">
                      ${quote.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenQuoteBuilder(quote.id)}
                        className="px-2 py-1 bg-[#181b26] text-xs text-[#cfc8bc] rounded-lg border border-[#282d3e]"
                      >
                        Edit
                      </button>
                      {quote.status === 'draft' && (
                        <button
                          onClick={() => handleSendQuote(quote.id)}
                          className="px-2.5 py-1 bg-blue-950/70 text-blue-300 rounded-lg text-xs font-medium border border-blue-800/60"
                        >
                          Send
                        </button>
                      )}
                      {quote.status === 'approved' && (
                        <button
                          onClick={() => handleConvertJob(quote.id)}
                          className="px-2.5 py-1 bg-[#d4af37] text-[#0b0c10] font-bold rounded-lg text-xs"
                        >
                          Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#202434] text-[#8c867a] font-mono uppercase text-[10px]">
                    <th className="pb-3 font-medium">Quote #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Line Items</th>
                    <th className="pb-3 font-medium">Valid Until</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Grand Total</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181b24]">
                  {filteredQuotes.map((quote) => {
                    const cust = customers.find((c) => c.id === quote.customer_id);

                    return (
                      <tr key={quote.id} className="hover:bg-[#151722]/50 transition">
                        <td className="py-3.5 font-mono font-semibold text-[#f4efe6]">
                          {quote.quote_number}
                        </td>

                        <td className="py-3.5 text-[#f4efe6]">
                          <div className="font-medium">{cust?.full_name}</div>
                          <div className="text-[10px] text-[#8c867a]">{cust?.phone}</div>
                        </td>

                        <td className="py-3.5 text-[#cfc8bc]">
                          <span className="text-[11px] text-[#a8a296]">
                            {quote.items?.length || 1} line item(s)
                          </span>
                        </td>

                        <td className="py-3.5 text-[#a8a296]">
                          <span className="flex items-center text-[11px]">
                            <Calendar className="w-3 h-3 mr-1 text-[#787265]" />
                            {quote.valid_until || '30 Days'}
                          </span>
                        </td>

                        <td className="py-3.5">
                          <StatusBadge status={quote.status} type="quote" />
                        </td>

                        <td className="py-3.5 text-right font-mono font-bold text-[#f3e5ab] text-sm">
                          ${quote.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onOpenQuoteBuilder(quote.id)}
                              className="px-2.5 py-1 bg-[#181b26] hover:bg-[#222736] text-[#f4efe6] rounded-lg text-xs border border-[#2a2f42] flex items-center gap-1"
                              title="Open Editor & Printable View"
                            >
                              <Eye className="w-3 h-3 text-[#d4af37]" />
                              <span>View/Edit</span>
                            </button>

                            {quote.status === 'draft' && (
                              <button
                                onClick={() => handleSendQuote(quote.id)}
                                className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 rounded-lg text-xs border border-blue-800/60 flex items-center gap-1"
                                title="Send to client for approval"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send</span>
                              </button>
                            )}

                            {quote.status === 'approved' && (
                              <button
                                onClick={() => handleConvertJob(quote.id)}
                                className="px-3 py-1 bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold rounded-lg text-xs flex items-center gap-1 shadow transition active:scale-95"
                                title="Dispatch and schedule work order"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Dispatch Job</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
