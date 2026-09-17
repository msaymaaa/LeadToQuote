import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  FileText,
  Wrench,
  ArrowRight,
  Shield,
  Edit2,
  Trash2,
  Layers,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Lead, LeadStatus, LeadPriority } from '../types/database';
import { StatusBadge } from './StatusBadge';

interface LeadDetailModalProps {
  leadId: string | null;
  onClose: () => void;
  onCreateQuote: (leadId: string) => void;
  onViewQuote?: (quoteId: string) => void;
  onViewJob?: (jobId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onCreateQuote,
  onViewQuote,
  onViewJob,
}) => {
  const {
    leads,
    customers,
    services,
    profiles,
    quotes,
    jobs,
    updateLead,
    deleteLead,
    generateAiLeadSummary,
    saveAiLeadSummary,
  } = useAppStore();

  if (!leadId) return null;
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  const customer = customers.find((c) => c.id === lead.customer_id);
  const service = services.find((s) => s.id === lead.service_id);
  const assignedProfile = profiles.find((p) => p.id === lead.assigned_to);

  // Check related quotes or jobs
  const relatedQuote = quotes.find((q) => q.lead_id === lead.id);
  const relatedJob = jobs.find((j) => j.lead_id === lead.id || (relatedQuote && j.quote_id === relatedQuote.id));

  // AI Summary State (Phase 4, Section 7)
  const [summaryText, setSummaryText] = useState(lead.ai_summary || '');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summarySavedNotification, setSummarySavedNotification] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setSummarySavedNotification(false);

    const result = await generateAiLeadSummary(lead.id);
    setIsGeneratingSummary(false);

    if (result.success && result.summary) {
      setSummaryText(result.summary);
    } else {
      setSummaryError(result.error || 'Failed to generate summary.');
    }
  };

  const handleSaveSummary = () => {
    if (!summaryText.trim()) return;
    saveAiLeadSummary(lead.id, summaryText);
    setSummarySavedNotification(true);
    setTimeout(() => setSummarySavedNotification(false), 3000);
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateLead(lead.id, { status: newStatus });
  };

  const handlePriorityChange = (newPriority: LeadPriority) => {
    updateLead(lead.id, { priority: newPriority });
  };

  const handleAssigneeChange = (profileId: string) => {
    updateLead(lead.id, { assigned_to: profileId || undefined });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to archive / delete this lead?')) {
      deleteLead(lead.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#12141c] border border-[#262b3c] rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212534] bg-[#161924] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={lead.status} type="lead" />
              <StatusBadge status={lead.priority} type="priority" />
              <span className="text-xs text-[#8c867a] font-mono">
                Source: {lead.source}
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#f4efe6] mt-1.5">{lead.title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDelete}
              title="Delete / Archive Lead"
              className="p-1.5 rounded-lg bg-[#1a1d28] text-[#8c867a] hover:text-rose-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1a1d28] text-[#a8a296] hover:text-[#f4efe6] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Customer & Location Box */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#232737] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#d4af37] font-semibold block">
                CUSTOMER CONTACT
              </span>
              <div className="font-semibold text-sm text-[#f4efe6] mt-1">{customer?.full_name || 'Anonymous Client'}</div>
              <div className="text-[#a8a296] flex items-center mt-1">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-[#8c867a]" />
                {customer?.email || 'No email provided'}
              </div>
              <div className="text-[#a8a296] flex items-center mt-0.5">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-[#8c867a]" />
                {customer?.phone || 'No phone provided'}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#d4af37] font-semibold block">
                LOCATION & SERVICE DETAILS
              </span>
              <div className="text-[#f4efe6] flex items-start mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-[#8c867a] flex-shrink-0" />
                <span>{lead.location || customer?.address || 'Site Address TBD'}</span>
              </div>
              <div className="text-[#a8a296] flex items-center mt-1">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#8c867a]" />
                <span>Preferred: {lead.preferred_date || 'Flexible schedule'}</span>
              </div>
              {service && (
                <div className="text-[#38bdf8] flex items-center mt-1">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-[#38bdf8]" />
                  <span>Category: {service.name} (Base ${service.base_price})</span>
                </div>
              )}
            </div>
          </div>

          {/* Inquiry Description - Kept Intact */}
          <div>
            <span className="text-xs font-semibold text-[#a8a296] uppercase tracking-wider block mb-1">
              Customer Inquiry Description (Original)
            </span>
            <p className="text-xs text-[#cfc8bc] bg-[#161924] p-3 rounded-xl border border-[#242938] leading-relaxed whitespace-pre-wrap">
              {lead.description}
            </p>
          </div>

          {/* Section 7: AI LEAD SUMMARY CARD */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c2a] to-[#121520] border border-[#2c3349] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#f4efe6]">AI Operational Summary</span>
                  <span className="text-[10px] text-[#8c867a] block">
                    Concise distillation for dispatchers & technicians
                  </span>
                </div>
              </div>

              {/* Explicit User Button to Generate (Section 7: Do not auto-generate silently) */}
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c068] text-[#0b0c10] font-semibold text-xs transition disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Summarizing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Summary</span>
                  </>
                )}
              </button>
            </div>

            {summaryError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{summaryError}</span>
              </div>
            )}

            {/* Editable summary container */}
            {summaryText ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#a8a296] font-medium">Editable Summary:</span>
                  <span className="text-[10px] text-[#8c867a]">Reviewable before saving</span>
                </div>
                <textarea
                  rows={2}
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#2c3349] focus:border-[#d4af37] rounded-xl p-3 text-xs text-[#f4efe6] focus:outline-none transition leading-relaxed"
                  placeholder="Click 'Generate AI Summary' above or type notes here..."
                />
                <div className="flex items-center justify-between">
                  {summarySavedNotification ? (
                    <span className="text-[11px] text-emerald-400 flex items-center font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Summary saved to lead record!
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#7a7468]">
                      Click save below to persist to lead records.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSummary}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1e2334] hover:bg-[#282f46] text-xs text-[#d4af37] font-medium border border-[#313a52] transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Summary to Lead</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#8c867a] italic p-3 rounded-lg bg-[#0b0c10]/50 border border-[#202534]">
                No summary generated yet. Click "Generate AI Summary" above to have Gemini produce a concise dispatch summary.
              </div>
            )}
          </div>

          {/* AI Extracted Details Box */}
          {lead.ai_extracted && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#181b27] to-[#12141c] border border-[#d4af37]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#d4af37] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  AI Lead Assist Extraction
                </span>
                <span className="text-[10px] font-mono bg-[#d4af37]/20 text-[#f3e5ab] px-2 py-0.5 rounded">
                  Trade Intelligence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#0b0c10]/60 border border-[#262b3a]">
                  <span className="text-[10px] text-[#8c867a] block">Service Scope</span>
                  <span className="text-[#f4efe6] font-medium">{lead.ai_extracted.service}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0b0c10]/60 border border-[#262b3a]">
                  <span className="text-[10px] text-[#8c867a] block">Quantity / Scope</span>
                  <span className="text-[#f4efe6] font-medium">{lead.ai_extracted.quantity || 'Standard'}</span>
                </div>
              </div>

              {lead.ai_extracted.additional_services && lead.ai_extracted.additional_services.length > 0 && (
                <div>
                  <span className="text-[10px] text-[#8c867a] block mb-1">Auxiliary Scopes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.ai_extracted.additional_services.map((task, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#1e2332] text-[#cfc8bc] border border-[#2d3246]"
                      >
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lead.ai_summary && (
                <div className="text-[11px] text-[#a8a296] italic border-t border-[#232737] pt-2">
                  Summary: "{lead.ai_summary}"
                </div>
              )}
            </div>
          )}

          {/* Workflow Status & Assignment Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[#a8a296] mb-1 font-medium">Pipeline Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              >
                <option value="new">New Inquiry</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="quoted">Quoted</option>
                <option value="converted">Converted to Job</option>
                <option value="lost">Lost / Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-[#a8a296] mb-1 font-medium">Priority Level</label>
              <select
                value={lead.priority}
                onChange={(e) => handlePriorityChange(e.target.value as LeadPriority)}
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[#a8a296] mb-1 font-medium">Assigned Staff</label>
              <select
                value={lead.assigned_to || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              >
                <option value="">Unassigned</option>
                {profiles
                  .filter((p) => p.role !== 'customer')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Timestamps */}
          <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#212534] flex flex-wrap items-center justify-between text-[11px] text-[#8c867a]">
            <span>
              Created:{' '}
              <strong className="text-[#cfc8bc]">
                {new Date(lead.created_at).toLocaleString()}
              </strong>
            </span>
            <span>
              Last Updated:{' '}
              <strong className="text-[#cfc8bc]">
                {new Date(lead.updated_at).toLocaleString()}
              </strong>
            </span>
          </div>

          {/* Connected Quotation & Job Cards */}
          <div className="space-y-2 pt-2 border-t border-[#212534]">
            <span className="text-xs font-semibold text-[#a8a296] uppercase tracking-wider block">
              Related Documents & Work Orders
            </span>

            {relatedQuote ? (
              <div className="p-3 rounded-xl bg-[#151722] border border-[#262b3c] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <div className="font-semibold text-xs text-[#f4efe6]">
                      {relatedQuote.quote_number} • Total ${relatedQuote.total.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#8c867a]">Status: {relatedQuote.status.toUpperCase()}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onViewQuote) onViewQuote(relatedQuote.id);
                  }}
                  className="px-3 py-1 bg-[#1e2230] hover:bg-[#282d40] text-xs text-[#d4af37] rounded-lg"
                >
                  View Quote
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#11131a] border border-[#222634] flex items-center justify-between text-xs text-[#8c867a]">
                <span>No quotation issued yet for this lead.</span>
                <button
                  onClick={() => {
                    onClose();
                    onCreateQuote(lead.id);
                  }}
                  className="text-[#d4af37] hover:underline font-medium"
                >
                  + Create Quote Now
                </button>
              </div>
            )}

            {relatedJob && (
              <div className="p-3 rounded-xl bg-[#151722] border border-[#262b3c] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-xs text-[#f4efe6]">
                      {relatedJob.job_number} • Scheduled: {relatedJob.scheduled_date}
                    </div>
                    <div className="text-[10px] text-[#8c867a]">Status: {relatedJob.status.toUpperCase()}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onViewJob) onViewJob(relatedJob.id);
                  }}
                  className="px-3 py-1 bg-[#1e2230] hover:bg-[#282d40] text-xs text-emerald-400 rounded-lg"
                >
                  View Job
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#212534] bg-[#0e1017] flex items-center justify-between">
          <span className="text-[11px] text-[#787265] font-mono">
            Lead UUID: {lead.id}
          </span>

          {!relatedQuote && (
            <button
              onClick={() => {
                onClose();
                onCreateQuote(lead.id);
              }}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Quotation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
