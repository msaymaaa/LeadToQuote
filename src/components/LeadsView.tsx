import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Sparkles,
  Clock,
  Trash2,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  RefreshCw,
  Eye,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { LeadPriority } from '../types/database';
import { StatusBadge } from './StatusBadge';
import { CreateLeadModal } from './CreateLeadModal';

interface LeadsViewProps {
  onOpenAiAssist: () => void;
  onSelectLead: (leadId: string) => void;
  onCreateQuoteFromLead: (leadId: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'priority' | 'customer';

export const LeadsView: React.FC<LeadsViewProps> = ({
  onOpenAiAssist,
  onSelectLead,
  onCreateQuoteFromLead,
}) => {
  const { leads, customers, services, profiles, deleteLead, isLiveSupabase, dbLoading, refreshFromDatabase } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const priorityWeight: Record<LeadPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const filteredAndSortedLeads = useMemo(() => {
    const list = leads.filter((lead) => {
      const cust = customers.find((c) => c.id === lead.customer_id);
      const matchesSearch =
        lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust?.full_name && cust.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.location && lead.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.description && lead.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cust?.phone && cust.phone.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      const matchesService = serviceFilter === 'all' || lead.service_id === serviceFilter;
      const matchesStaff = staffFilter === 'all' || lead.assigned_to === staffFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesService && matchesStaff;
    });

    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'customer') {
        const custA = customers.find((c) => c.id === a.customer_id)?.full_name || '';
        const custB = customers.find((c) => c.id === b.customer_id)?.full_name || '';
        return custA.localeCompare(custB);
      }
      return 0;
    });
  }, [leads, customers, searchTerm, statusFilter, priorityFilter, serviceFilter, staffFilter, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFromDatabase();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Leads synchronized from database.');
    }, 400);
  };

  const handleDeleteLead = async (leadId: string) => {
    await deleteLead(leadId);
    toast.success('Lead archived successfully.');
  };

  // Pipeline stages for Section 6 visual bar
  const pipelineStages = [
    { id: 'new', label: 'New', count: leads.filter((l) => l.status === 'new').length, color: '#38bdf8' },
    { id: 'contacted', label: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length, color: '#fbbf24' },
    { id: 'qualified', label: 'Qualified', count: leads.filter((l) => l.status === 'qualified').length, color: '#34d399' },
    { id: 'quoted', label: 'Quoted', count: leads.filter((l) => l.status === 'quoted').length, color: '#c084fc' },
    { id: 'converted', label: 'Converted', count: leads.filter((l) => l.status === 'converted').length, color: '#d4af37' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#38bdf8]" />
              Leads & Service Requests
            </h1>
            {isLiveSupabase && (
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                Supabase Live
              </span>
            )}
          </div>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Manage incoming customer requests, qualification pipelines, and quotation conversions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            title="Refresh from Database"
            disabled={isRefreshing || dbLoading}
            className="p-2 rounded-xl bg-[#141722] hover:bg-[#1c2030] text-[#a8a296] hover:text-[#f4efe6] border border-[#242838] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || dbLoading ? 'animate-spin text-[#d4af37]' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1a1e2c] hover:bg-[#22273a] text-xs font-semibold text-[#f4efe6] border border-[#2c3246] transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#38bdf8]" />
            <span>New Lead</span>
          </button>

          <button
            onClick={onOpenAiAssist}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Intake</span>
          </button>
        </div>
      </div>

      {/* Section 6: Interactive Pipeline Stages Bar */}
      <div className="p-3 rounded-2xl bg-[#12141c] border border-[#242838] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#8c867a]">
          <span className="font-semibold uppercase tracking-wider font-mono">Pipeline Conversion Funnel</span>
          <span>Click stage to filter</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {pipelineStages.map((stage) => {
            const isSelected = statusFilter === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setStatusFilter(isSelected ? 'all' : stage.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-[#1a1d2b] border-[#d4af37] shadow-sm ring-1 ring-[#d4af37]/30'
                    : 'bg-[#0b0c10] border-[#202534] hover:border-[#2f354a]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#8c867a]">
                  <span className={`font-semibold ${isSelected ? 'text-[#d4af37]' : 'text-[#f4efe6]'}`}>
                    {stage.label}
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                </div>
                <div className="text-xl font-bold font-mono text-[#f4efe6] mt-1">{stage.count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Control Bar (Section 7) */}
      <div className="p-4 rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8c867a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, title, phone, scope..."
              className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f4efe6] placeholder-[#646056] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-2.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="quoted">Quoted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-2.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Service */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-2.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none max-w-[130px] truncate"
            >
              <option value="all">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Assigned Staff Filter */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="bg-[#0b0c10] border border-[#282d3e] rounded-xl px-2.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none max-w-[130px] truncate"
            >
              <option value="all">All Staff</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center space-x-1 bg-[#0b0c10] border border-[#282d3e] rounded-xl px-2.5 py-2 text-xs text-[#f4efe6]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8c867a]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-[#f4efe6] focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-[#12141c]">Newest First</option>
                <option value="oldest" className="bg-[#12141c]">Oldest First</option>
                <option value="priority" className="bg-[#12141c]">Priority (Urgent)</option>
                <option value="customer" className="bg-[#12141c]">Customer Name</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#0b0c10] border border-[#282d3e] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-[#222738] text-[#f4efe6]' : 'text-[#8c867a] hover:text-[#f4efe6]'
                }`}
                title="Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-[#222738] text-[#f4efe6]' : 'text-[#8c867a] hover:text-[#f4efe6]'
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedLeads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <Users className="w-8 h-8 text-[#8c867a] mx-auto" />
          <p className="text-sm font-semibold text-[#f4efe6]">No leads found matching criteria</p>
          <p className="text-xs text-[#8c867a] max-w-sm mx-auto">
            Try adjusting your search query, or create a new lead manually or with AI intake.
          </p>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#1c2030] text-xs font-semibold text-[#f4efe6] rounded-xl border border-[#2d3448] hover:bg-[#252b40]"
            >
              + Create Lead
            </button>
            <button
              onClick={onOpenAiAssist}
              className="px-4 py-2 bg-[#181b26] text-xs text-[#d4af37] rounded-xl border border-[#d4af37]/30 hover:bg-[#202536]"
            >
              Launch AI Intake
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card List (Screen < sm) */}
          <div className="sm:hidden space-y-3">
            {filteredAndSortedLeads.map((lead) => {
              const cust = customers.find((c) => c.id === lead.customer_id);
              const srv = services.find((s) => s.id === lead.service_id);

              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead.id)}
                  className="p-4 rounded-xl bg-[#12141c] border border-[#242838] active:border-[#d4af37]/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={lead.status} type="lead" />
                    <StatusBadge status={lead.priority} type="priority" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-[#f4efe6]">{lead.title}</h4>
                    <p className="text-xs text-[#a8a296] mt-0.5">{cust?.full_name} • {cust?.phone || cust?.email}</p>
                  </div>

                  {srv && (
                    <div className="text-[11px] text-[#38bdf8] font-mono">
                      Service: {srv.name}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#1e2232] flex items-center justify-between">
                    <span className="text-[10px] text-[#8c867a]">
                      {new Date(lead.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onCreateQuoteFromLead(lead.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#181b26] text-[#d4af37] border border-[#d4af37]/30 text-xs font-semibold"
                      >
                        Quote
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1 rounded-lg text-[#8c867a] hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          {viewMode === 'table' ? (
            <div className="hidden sm:block rounded-2xl bg-[#12141c] border border-[#242838] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1017] border-b border-[#212534] text-[#8c867a] uppercase font-mono text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Lead Title</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Assigned Staff</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2230]">
                    {filteredAndSortedLeads.map((lead) => {
                      const cust = customers.find((c) => c.id === lead.customer_id);
                      const srv = services.find((s) => s.id === lead.service_id);
                      const assignee = profiles.find((p) => p.id === lead.assigned_to);

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-[#161925] transition group cursor-pointer"
                          onClick={() => onSelectLead(lead.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#f4efe6] group-hover:text-[#d4af37] transition">
                              {cust?.full_name || 'Unknown Client'}
                            </div>
                            <div className="text-[11px] text-[#8c867a]">
                              {cust?.phone || cust?.email || 'No contact'}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {srv ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#181b26] text-[#cfc8bc] border border-[#282d3e] text-[11px] font-medium">
                                {srv.name}
                              </span>
                            ) : (
                              <span className="text-[#646056] text-[11px]">General Trade</span>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-[240px]">
                            <div className="font-medium text-[#e2ded5] truncate">{lead.title}</div>
                            {lead.ai_extracted && (
                              <div className="flex items-center gap-1 text-[10px] text-[#d4af37] mt-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>AI Scoped</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status={lead.status} type="lead" />
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status={lead.priority} type="priority" />
                          </td>

                          <td className="py-3 px-4">
                            {assignee ? (
                              <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#202534] text-[10px] text-[#cfc8bc] flex items-center justify-center font-bold">
                                  {assignee.full_name.charAt(0)}
                                </div>
                                <span className="text-[#cfc8bc] text-xs">{assignee.full_name}</span>
                              </div>
                            ) : (
                              <span className="text-[#646056] italic text-[11px]">Unassigned</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[#8c867a] whitespace-nowrap text-[11px]">
                            {new Date(lead.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td
                            className="py-3 px-4 text-right space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onSelectLead(lead.id)}
                              title="View Details"
                              className="p-1.5 rounded-lg bg-[#181b26] text-[#8c867a] hover:text-[#f4efe6] hover:bg-[#22273a] transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onCreateQuoteFromLead(lead.id)}
                              title="Create Quote"
                              className="px-2.5 py-1 rounded-lg bg-[#181b26] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition text-[11px] font-semibold"
                            >
                              Quote
                            </button>

                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              title="Archive / Delete"
                              className="p-1.5 rounded-lg bg-[#181b26] text-[#8c867a] hover:text-rose-400 hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Desktop Grid Cards View */
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedLeads.map((lead) => {
                const cust = customers.find((c) => c.id === lead.customer_id);
                const srv = services.find((s) => s.id === lead.service_id);

                return (
                  <div
                    key={lead.id}
                    className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#2f354c] transition flex flex-col justify-between group space-y-4 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <StatusBadge status={lead.status} type="lead" />
                        <StatusBadge status={lead.priority} type="priority" />
                      </div>

                      <h3
                        onClick={() => onSelectLead(lead.id)}
                        className="font-semibold text-sm text-[#f4efe6] hover:text-[#d4af37] cursor-pointer transition line-clamp-1"
                      >
                        {lead.title}
                      </h3>

                      <div className="mt-1 text-xs text-[#a8a296] flex items-center space-x-1.5">
                        <span className="font-medium text-[#cfc8bc]">{cust?.full_name}</span>
                        <span>•</span>
                        <span>{cust?.phone || cust?.email}</span>
                      </div>

                      {srv && (
                        <div className="mt-2 text-[11px] text-[#38bdf8]">
                          Service: {srv.name}
                        </div>
                      )}

                      {lead.ai_extracted ? (
                        <div className="mt-2.5 p-2 rounded-lg bg-[#0b0c10] border border-[#d4af37]/20 text-[11px] text-[#cfc8bc] flex items-start space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                          <div className="line-clamp-2">
                            <span className="text-[#f3e5ab] font-medium">Scope:</span> {lead.ai_extracted.service} ({lead.ai_extracted.quantity || '1x'})
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[#8c867a] line-clamp-2">
                          {lead.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#1d202c] flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-[#8c867a]">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(lead.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectLead(lead.id)}
                          className="text-xs text-[#a8a296] hover:text-[#f4efe6] transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onCreateQuoteFromLead(lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#181b26] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 text-xs font-semibold transition"
                        >
                          Quote
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={(leadId) => {
          toast.success('Lead created successfully.');
          onSelectLead(leadId);
        }}
      />
    </div>
  );
};
