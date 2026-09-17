import React from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Receipt,
  Calendar,
  CreditCard,
  Building,
  DollarSign,
  ArrowDownToLine,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Invoice } from '../types/database';
import { StatusBadge } from './StatusBadge';

interface InvoiceDetailModalProps {
  invoiceId: string | null;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoiceId,
  onClose,
}) => {
  const { business, invoices, customers, jobs, markInvoicePaid } = useAppStore();
  const toast = useToast();

  if (!invoiceId) return null;
  const invoice = invoices.find((inv) => inv.id === invoiceId);
  if (!invoice) return null;

  const customer = customers.find((c) => c.id === invoice.customer_id);
  const relatedJob = invoice.job_id ? jobs.find((j) => j.id === invoice.job_id) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#12141c] border border-[#262b3c] rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#212534] bg-[#161924] flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-[#d4af37] font-semibold">{invoice.invoice_number}</span>
                <StatusBadge status={invoice.status} type="invoice" />
              </div>
              <h2 className="text-sm font-semibold text-[#f4efe6]">
                Billing Statement • Total ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] hover:bg-[#202534] border border-[#2a2f42] text-xs text-[#cfc8bc] transition"
            >
              <Printer className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1a1d28] text-[#a8a296] hover:text-[#f4efe6] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6 printable-document">
          {/* Top Company & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-[#262b3c]">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#997d26] flex items-center justify-center font-bold text-[#0b0c10] text-sm">
                  LQ
                </div>
                <h3 className="font-bold text-lg text-[#f4efe6] tracking-tight">{business.name}</h3>
              </div>
              <p className="text-xs text-[#a8a296] mt-1">{business.description}</p>
              <div className="text-[11px] text-[#8c867a] mt-0.5">
                {business.address} • {business.phone}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold block">
                COMMERCIAL INVOICE
              </span>
              <div className="font-mono text-base font-bold text-[#f4efe6] mt-0.5">
                {invoice.invoice_number}
              </div>
              <div className="text-[11px] text-[#8c867a] mt-1">
                Issued: {new Date(invoice.issued_at || invoice.created_at).toLocaleDateString()}
              </div>
              <div className="text-[11px] text-[#a8a296] font-medium">
                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}
              </div>
              {invoice.paid_at && (
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  ✓ Paid in Full on {new Date(invoice.paid_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Bill To & Reference */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0e1017] border border-[#202434] text-xs">
            <div>
              <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-semibold block font-mono">
                BILLED TO
              </span>
              <div className="font-semibold text-sm text-[#f4efe6] mt-1">{customer?.full_name}</div>
              <div className="text-[#a8a296]">{customer?.email}</div>
              <div className="text-[#a8a296]">{customer?.phone}</div>
              <div className="text-[#8c867a] mt-1">{customer?.address || 'San Francisco, CA'}</div>
            </div>

            <div>
              <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-semibold block font-mono">
                SERVICE REFERENCE
              </span>
              {relatedJob ? (
                <>
                  <div className="font-semibold text-[#f4efe6] mt-1">Job #{relatedJob.job_number}</div>
                  <div className="text-[#a8a296] text-[11px] mt-0.5">{relatedJob.description}</div>
                  <div className="text-[#8c867a] text-[11px] mt-1">
                    Completed: {relatedJob.completed_at ? new Date(relatedJob.completed_at).toLocaleDateString() : 'Yes'}
                  </div>
                </>
              ) : (
                <div className="text-[#a8a296] mt-1">Direct Trade Service Agreement</div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#282d3e] text-[#a8a296] font-mono uppercase text-[10px]">
                  <th className="pb-2 font-medium">Service / Material Description</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2230]">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="py-2.5">
                      <td className="py-2.5 text-[#f4efe6] font-medium pr-2">{item.description}</td>
                      <td className="py-2.5 text-center font-mono text-[#a8a296]">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono text-[#a8a296]">
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-[#f4efe6]">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-[#8c867a]">
                      Verified completed service fee
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-[#262b3c] flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#a8a296]">
                <span>Subtotal</span>
                <span className="font-mono text-[#f4efe6]">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">-${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#a8a296]">
                <span>Tax</span>
                <span className="font-mono text-[#f4efe6]">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#282d3e] text-sm font-bold">
                <span className="text-[#f4efe6]">Amount Due</span>
                <span className="font-mono text-[#d4af37] text-base">
                  ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Wire info */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#202434] text-xs text-[#a8a296] space-y-1">
            <span className="font-mono text-[10px] text-[#d4af37] uppercase tracking-wider block font-semibold">
              PAYMENT TERMS & REMITTANCE INSTRUCTIONS
            </span>
            <p className="text-[11px]">{invoice.notes || 'Payment due net 14 days from statement date.'}</p>
            <p className="text-[11px] text-[#8c867a]">
              ACH / Wire Transfer: Apex Commercial Bank • Routing: 121000358 • Acct: ****8492
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#212534] bg-[#0e1017] flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#181b26] text-xs text-[#cfc8bc] hover:bg-[#202536]"
          >
            Close
          </button>

          {invoice.status !== 'paid' ? (
            <button
              onClick={async () => {
                await markInvoicePaid(invoice.id);
                toast.success('Manual settlement recorded.', `Invoice ${invoice.invoice_number} marked as settled.`);
              }}
              title="Record offline payment via check, cash, or wire transfer"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0b0c10] font-bold text-xs shadow-lg transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Offline / Manual Settlement (${invoice.total.toFixed(2)})</span>
            </button>
          ) : (
            <div className="flex items-center text-xs text-emerald-400 font-semibold space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Offline Settlement Recorded & Cleared</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
