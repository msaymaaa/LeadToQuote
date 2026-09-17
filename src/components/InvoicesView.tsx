import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Calendar,
  Eye,
  FileCheck,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { StatusBadge } from './StatusBadge';

interface InvoicesViewProps {
  onSelectInvoice: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onSelectInvoice }) => {
  const { invoices, customers, jobs, markInvoicePaid } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const cust = customers.find((c) => c.id === inv.customer_id);
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, customers, searchTerm, statusFilter]);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const totalCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const handleRecordOfflineSettlement = async (invoiceId: string) => {
    await markInvoicePaid(invoiceId);
    toast.success(
      'Manual settlement recorded.',
      'Invoice marked as settled via offline bank transfer / check.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Invoices & Settlement
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Commercial billing statements generated upon job completion with Net terms and manual settlement tracking.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#141622] border border-[#242838]">
            <span className="text-[#8c867a] block text-[10px] uppercase font-mono">Outstanding</span>
            <span className="font-mono font-bold text-rose-400">
              ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#141622] border border-[#d4af37]/30">
            <span className="text-[#8c867a] block text-[10px] uppercase font-mono">Collected</span>
            <span className="font-mono font-bold text-[#d4af37]">
              ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#12141c] border border-[#242838] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8c867a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice # or customer..."
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
            <option value="all">All Invoices</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <Receipt className="w-8 h-8 text-[#8c867a] mx-auto" />
          <p className="text-sm font-semibold text-[#f4efe6]">No invoices found</p>
          <p className="text-xs text-[#8c867a] max-w-sm mx-auto">
            Invoices are issued automatically when a field job is completed and verified.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="sm:hidden space-y-3">
            {filteredInvoices.map((invoice) => {
              const cust = customers.find((c) => c.id === invoice.customer_id);

              return (
                <div
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice.id)}
                  className="p-4 rounded-xl bg-[#12141c] border border-[#242838] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#f4efe6]">
                      {invoice.invoice_number}
                    </span>
                    <StatusBadge status={invoice.status} type="invoice" />
                  </div>

                  <div>
                    <div className="font-medium text-xs text-[#f4efe6]">{cust?.full_name}</div>
                    <div className="text-[11px] text-[#8c867a]">{cust?.email}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e2230] text-xs">
                    <span className="font-mono font-bold text-[#d4af37]">
                      ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>

                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectInvoice(invoice.id)}
                        className="px-2.5 py-1 bg-[#181b26] text-xs text-[#cfc8bc] rounded-lg border border-[#282d3e]"
                      >
                        View
                      </button>

                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleRecordOfflineSettlement(invoice.id)}
                          title="Record offline settlement"
                          className="px-2.5 py-1 bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-medium"
                        >
                          Manual Settle
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
                    <th className="pb-3 font-medium">Invoice #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Job Reference</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181b24]">
                  {filteredInvoices.map((invoice) => {
                    const cust = customers.find((c) => c.id === invoice.customer_id);
                    const relatedJob = invoice.job_id ? jobs.find((j) => j.id === invoice.job_id) : null;

                    return (
                      <tr key={invoice.id} className="hover:bg-[#151722]/50 transition">
                        <td className="py-3.5 font-mono font-semibold text-[#f4efe6]">
                          {invoice.invoice_number}
                        </td>

                        <td className="py-3.5 text-[#f4efe6]">
                          <div className="font-medium">{cust?.full_name}</div>
                          <div className="text-[10px] text-[#8c867a]">{cust?.email}</div>
                        </td>

                        <td className="py-3.5 text-[#a8a296]">
                          {relatedJob ? (
                            <span className="font-mono text-[11px] text-[#cfc8bc]">
                              {relatedJob.job_number}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#706a5e]">Standard Trade Contract</span>
                          )}
                        </td>

                        <td className="py-3.5 text-[#a8a296]">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-[#787265]" />
                            <span>{invoice.due_date || 'Due upon receipt'}</span>
                          </div>
                        </td>

                        <td className="py-3.5">
                          <StatusBadge status={invoice.status} type="invoice" />
                        </td>

                        <td className="py-3.5 text-right font-mono font-bold text-[#f3e5ab] text-sm">
                          ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onSelectInvoice(invoice.id)}
                              className="px-2.5 py-1 bg-[#181b26] hover:bg-[#222736] text-[#f4efe6] rounded-lg text-xs border border-[#2a2f42] flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-[#d4af37]" />
                              <span>View / Print</span>
                            </button>

                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => handleRecordOfflineSettlement(invoice.id)}
                                title="Record Offline / Manual Settlement (Cash, Check, Wire)"
                                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 rounded-lg text-xs border border-emerald-800/60 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Record Manual Settlement</span>
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
