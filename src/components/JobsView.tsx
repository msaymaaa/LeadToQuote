import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Calendar,
  MapPin,
  User,
  Receipt,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { StatusBadge } from './StatusBadge';

interface JobsViewProps {
  onSelectJob: (jobId: string) => void;
  onGenerateInvoice: (jobId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  onSelectJob,
  onGenerateInvoice,
  onViewInvoice,
}) => {
  const { jobs, customers, profiles, invoices, generateInvoiceFromJob } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');

  const technicians = profiles.filter((p) => p.role !== 'customer');

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const cust = customers.find((c) => c.id === j.customer_id);
      const matchesSearch =
        j.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust?.full_name && cust.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (j.location && j.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchesTech = techFilter === 'all' || j.assigned_to === techFilter;

      return matchesSearch && matchesStatus && matchesTech;
    });
  }, [jobs, customers, searchTerm, statusFilter, techFilter]);

  const handleCreateInvoice = (jobId: string) => {
    const inv = generateInvoiceFromJob(jobId);
    if (inv) {
      toast.success('Invoice created from completed job.');
      onGenerateInvoice(inv.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            Jobs & Field Dispatch
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Work order assignments, technician scheduling, live progress logs, and verification.
          </p>
        </div>
      </div>

      {/* Filter Bar (Section 9) */}
      <div className="p-4 rounded-2xl bg-[#12141c] border border-[#242838] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8c867a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job #, customer, address..."
            className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f4efe6] placeholder-[#646056] focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="verified">Verified</option>
          </select>

          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
          >
            <option value="all">All Technicians</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <Wrench className="w-8 h-8 text-[#8c867a] mx-auto" />
          <p className="text-sm font-semibold text-[#f4efe6]">No work orders found matching filters</p>
          <p className="text-xs text-[#8c867a] max-w-sm mx-auto">
            Jobs are generated automatically when a customer approves a proposal quote.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< sm) */}
          <div className="sm:hidden space-y-3">
            {filteredJobs.map((job) => {
              const cust = customers.find((c) => c.id === job.customer_id);
              const tech = profiles.find((p) => p.id === job.assigned_to);
              const relatedInvoice = invoices.find((inv) => inv.job_id === job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className="p-4 rounded-xl bg-[#12141c] border border-[#242838] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#d4af37]">
                      {job.job_number}
                    </span>
                    <StatusBadge status={job.status} type="job" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-[#f4efe6]">{job.description}</h4>
                    <p className="text-xs text-[#a8a296] mt-0.5">{cust?.full_name}</p>
                    <p className="text-[11px] text-[#8c867a] flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1 text-[#646056]" />
                      {job.location || cust?.address}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1e2230] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8c867a]">
                      Tech: {tech?.full_name || 'Unassigned'}
                    </span>
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectJob(job.id)}
                        className="px-2.5 py-1 bg-[#181b26] text-xs text-[#cfc8bc] rounded-lg border border-[#282d3e]"
                      >
                        Inspect
                      </button>
                      {(job.status === 'completed' || job.status === 'verified') && (
                        <button
                          onClick={() => {
                            if (relatedInvoice) onViewInvoice(relatedInvoice.id);
                            else handleCreateInvoice(job.id);
                          }}
                          className="px-2.5 py-1 bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#0b0c10] font-bold rounded-lg text-xs"
                        >
                          Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Jobs Table */}
          <div className="hidden sm:block p-5 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#202434] text-[#8c867a] font-mono uppercase text-[10px]">
                    <th className="pb-3 font-medium">Job #</th>
                    <th className="pb-3 font-medium">Customer & Site</th>
                    <th className="pb-3 font-medium">Assigned Tech</th>
                    <th className="pb-3 font-medium">Scheduled</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Evidence / Updates</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181b24]">
                  {filteredJobs.map((job) => {
                    const cust = customers.find((c) => c.id === job.customer_id);
                    const tech = profiles.find((p) => p.id === job.assigned_to);
                    const relatedInvoice = invoices.find((inv) => inv.job_id === job.id);

                    return (
                      <tr key={job.id} className="hover:bg-[#151722]/50 transition">
                        <td className="py-3.5 font-mono font-semibold text-[#d4af37]">
                          {job.job_number}
                        </td>

                        <td className="py-3.5 text-[#f4efe6]">
                          <div className="font-medium">{cust?.full_name}</div>
                          <div className="text-[10px] text-[#8c867a] flex items-center mt-0.5 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 mr-1 text-[#646056] flex-shrink-0" />
                            {job.location || cust?.address}
                          </div>
                        </td>

                        <td className="py-3.5 text-[#cfc8bc]">
                          <div className="flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-[#8c867a]" />
                            <span>{tech?.full_name || 'Unassigned'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 text-[#a8a296]">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-[#787265]" />
                            <span>{job.scheduled_date}</span>
                          </div>
                          <div className="text-[10px] text-[#787265] mt-0.5">
                            {job.scheduled_start} - {job.scheduled_end}
                          </div>
                        </td>

                        <td className="py-3.5">
                          <StatusBadge status={job.status} type="job" />
                        </td>

                        <td className="py-3.5 text-[#a8a296]">
                          <span className="text-[11px]">
                            {job.updates?.length || 0} updates logged
                          </span>
                        </td>

                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onSelectJob(job.id)}
                              className="px-2.5 py-1 bg-[#181b26] hover:bg-[#222736] text-[#f4efe6] rounded-lg text-xs border border-[#2a2f42] flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-[#d4af37]" />
                              <span>Details</span>
                            </button>

                            {(job.status === 'completed' || job.status === 'verified') && (
                              <>
                                {relatedInvoice ? (
                                  <button
                                    onClick={() => onViewInvoice(relatedInvoice.id)}
                                    className="px-2.5 py-1 bg-[#1a1d28] hover:bg-[#242938] text-emerald-400 rounded-lg text-xs border border-emerald-800/40 flex items-center gap-1"
                                  >
                                    <Receipt className="w-3 h-3" />
                                    <span>Invoice</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCreateInvoice(job.id)}
                                    className="px-2.5 py-1 bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold rounded-lg text-xs flex items-center gap-1 shadow transition active:scale-95"
                                  >
                                    <Receipt className="w-3 h-3" />
                                    <span>Invoice</span>
                                  </button>
                                )}
                              </>
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
