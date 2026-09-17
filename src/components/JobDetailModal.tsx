import React, { useState } from 'react';
import {
  X,
  Wrench,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Camera,
  MessageSquare,
  ArrowRight,
  Receipt,
  FileCheck,
  AlertTriangle,
  Play,
  Check,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Job, JobStatus } from '../types/database';
import { StatusBadge } from './StatusBadge';

interface JobDetailModalProps {
  jobId: string | null;
  onClose: () => void;
  onGenerateInvoice?: (jobId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobId,
  onClose,
  onGenerateInvoice,
  onViewInvoice,
}) => {
  const {
    jobs,
    customers,
    profiles,
    invoices,
    currentProfile,
    updateJob,
    addJobUpdate,
    generateInvoiceFromJob,
  } = useAppStore();

  const [newNote, setNewNote] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newStatusSelect, setNewStatusSelect] = useState<JobStatus>('in_progress');

  if (!jobId) return null;
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;

  const customer = customers.find((c) => c.id === job.customer_id);
  const tech = profiles.find((p) => p.id === job.assigned_to);
  const relatedInvoice = invoices.find((inv) => inv.job_id === job.id);

  const isTechnician = currentProfile.role === 'technician';
  const isOwner = currentProfile.role === 'owner' || currentProfile.role === 'staff';

  const samplePhotoAssets = [
    { label: 'Equipment Cleanout', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80' },
    { label: 'Completed Breaker Panel', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80' },
    { label: 'HVAC Condenser Unit', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&auto=format&fit=crop&q=80' },
  ];

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    addJobUpdate(job.id, newStatusSelect, newNote.trim(), newPhotoUrl || undefined);
    setNewNote('');
    setNewPhotoUrl('');
  };

  const handleStartWork = () => {
    addJobUpdate(
      job.id,
      'in_progress',
      'Technician arrived on site. Safety perimeter set and tools deployed.'
    );
  };

  const handleMarkCompleted = () => {
    addJobUpdate(
      job.id,
      'completed',
      'Work order physically finished. System diagnostics tested and verified operational.'
    );
  };

  const handleVerifyJob = () => {
    updateJob(job.id, { status: 'verified' });
  };

  const timelineSteps: { key: JobStatus; label: string }[] = [
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'verified', label: 'Verified' },
  ];

  const getStepIndex = (st: JobStatus) => {
    const idx = timelineSteps.findIndex((s) => s.key === st);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(job.status);

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#12141c] border border-[#262b3c] rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212534] bg-[#161924] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center text-indigo-300">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-[#d4af37] font-semibold">{job.job_number}</span>
                <StatusBadge status={job.status} type="job" />
              </div>
              <h2 className="text-sm font-semibold text-[#f4efe6] mt-0.5">{job.description}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a1d28] text-[#a8a296] hover:text-[#f4efe6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Visual Status Timeline */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#222634]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block mb-3">
              Work Order Lifecycle Timeline
            </span>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#202534] -translate-y-1/2 z-0" />
              {timelineSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-[#d4af37] text-[#0b0c10] ring-4 ring-[#d4af37]/20 shadow-lg'
                          : isPassed
                          ? 'bg-emerald-500 text-[#0b0c10]'
                          : 'bg-[#1a1d28] text-[#787265] border border-[#2b3042]'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-medium ${
                        isCurrent ? 'text-[#f3e5ab] font-bold' : isPassed ? 'text-[#f4efe6]' : 'text-[#6e685c]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Job Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#141622] border border-[#242838]">
              <span className="text-[10px] uppercase font-mono text-[#8c867a] block">Customer</span>
              <div className="font-semibold text-[#f4efe6] mt-1">{customer?.full_name}</div>
              <div className="text-[#a8a296] text-[11px]">{customer?.phone}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#141622] border border-[#242838]">
              <span className="text-[10px] uppercase font-mono text-[#8c867a] block">Scheduled Window</span>
              <div className="font-semibold text-[#f4efe6] mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                {job.scheduled_date || 'Date TBD'}
              </div>
              <div className="text-[#a8a296] text-[11px] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {job.scheduled_start || '08:00'} - {job.scheduled_end || '16:00'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141622] border border-[#242838]">
              <span className="text-[10px] uppercase font-mono text-[#8c867a] block">Assigned Tech</span>
              <div className="font-semibold text-[#f4efe6] mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                {tech?.full_name || 'Unassigned'}
              </div>
              <div className="text-[#a8a296] text-[11px]">{tech?.phone || 'Dispatch Tech'}</div>
            </div>
          </div>

          {/* Location */}
          <div className="p-3 rounded-xl bg-[#141622] border border-[#242838] flex items-start space-x-2 text-xs">
            <MapPin className="w-4 h-4 text-[#d4af37] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-[#f4efe6] block">Job Site Address:</span>
              <span className="text-[#cfc8bc]">{job.location || customer?.address}</span>
            </div>
          </div>

          {/* Technician Action Buttons (Start, Complete, Verify) */}
          <div className="p-4 rounded-xl bg-[#161926] border border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#f4efe6] block">Field Dispatch Actions</span>
              <span className="text-[11px] text-[#8c867a]">
                Quick workflow triggers for active work order status
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {job.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={handleStartWork}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0b0c10] font-bold text-xs shadow transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Work Order</span>
                </button>
              )}

              {job.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0b0c10] font-bold text-xs shadow transition active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Work Completed</span>
                </button>
              )}

              {job.status === 'completed' && isOwner && (
                <button
                  type="button"
                  onClick={handleVerifyJob}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0b0c10] font-bold text-xs shadow transition active:scale-95"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Verify Completion</span>
                </button>
              )}

              {(job.status === 'completed' || job.status === 'verified') && (
                <>
                  {relatedInvoice ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onViewInvoice) onViewInvoice(relatedInvoice.id);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#202536] hover:bg-[#282f44] text-[#d4af37] border border-[#d4af37]/40 text-xs font-semibold"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Invoice ({relatedInvoice.invoice_number})</span>
                    </button>
                  ) : isOwner ? (
                    <button
                      type="button"
                      onClick={() => {
                        const inv = generateInvoiceFromJob(job.id);
                        if (inv && onGenerateInvoice) onGenerateInvoice(inv.id);
                      }}
                      className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow transition active:scale-95"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Generate Invoice</span>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Progress Notes & Photo Log */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider block">
              Technician Field Log & Photographic Evidence
            </span>

            {/* Updates list */}
            <div className="space-y-3">
              {job.updates && job.updates.length > 0 ? (
                job.updates.map((up) => {
                  const author = profiles.find((p) => p.id === up.user_id);
                  return (
                    <div
                      key={up.id}
                      className="p-3.5 rounded-xl bg-[#0b0c10] border border-[#232737] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[#8c867a]">
                        <span className="font-semibold text-[#f3e5ab] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#d4af37]" />
                          {author?.full_name || 'Staff Tech'} • Status: {up.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono">
                          {new Date(up.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[#cfc8bc] leading-relaxed">{up.note}</p>

                      {up.photo_url && (
                        <div className="pt-2">
                          <img
                            src={up.photo_url}
                            alt="Job Evidence"
                            className="w-48 h-32 object-cover rounded-lg border border-[#2a2f42] hover:opacity-90 transition cursor-pointer"
                            onClick={() => window.open(up.photo_url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-3 rounded-lg bg-[#0b0c10] border border-[#202434] text-xs text-[#8c867a]">
                  No technician notes logged yet.
                </div>
              )}
            </div>

            {/* Add progress update form */}
            <form onSubmit={handleAddUpdate} className="p-4 rounded-xl bg-[#141620] border border-[#242838] space-y-3">
              <span className="text-xs font-semibold text-[#cfc8bc] block">
                Post Technician Progress Update
              </span>

              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log diagnostic findings, materials installed, or inspection sign-off..."
                rows={2}
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2.5 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[#8c867a] text-[11px] mb-1">Set Job Status</label>
                  <select
                    value={newStatusSelect}
                    onChange={(e) => setNewStatusSelect(e.target.value as JobStatus)}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-1.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="in_progress">In Progress (Active Work)</option>
                    <option value="on_hold">On Hold (Awaiting Parts)</option>
                    <option value="completed">Completed (Tested)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c867a] text-[11px] mb-1">Select Photo Evidence</label>
                  <div className="flex gap-1.5">
                    {samplePhotoAssets.map((asset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewPhotoUrl(asset.url)}
                        className={`text-[10px] px-2 py-1 rounded border transition truncate max-w-[120px] ${
                          newPhotoUrl === asset.url
                            ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3e5ab]'
                            : 'bg-[#0b0c10] border-[#262a3a] text-[#8c867a]'
                        }`}
                      >
                        {asset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#1e2332] hover:bg-[#282f44] text-xs font-semibold text-[#f4efe6] border border-[#32384e] transition disabled:opacity-50"
                >
                  Submit Update
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#212534] bg-[#0e1017] flex items-center justify-between text-xs">
          <span className="text-[#8c867a] font-mono">Status: {job.status.toUpperCase()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#181b26] text-[#cfc8bc] hover:bg-[#202536]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
