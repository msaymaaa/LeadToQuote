import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Play,
  Camera,
  AlertTriangle,
  User,
  ArrowRight,
  Send,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Job, JobStatus } from '../types/database';
import { StatusBadge } from './StatusBadge';

interface TechnicianViewProps {
  onSelectJob: (jobId: string) => void;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ onSelectJob }) => {
  const { jobs, customers, currentProfile, addJobUpdate, updateJob } = useAppStore();
  const toast = useToast();

  const [quickNoteJobId, setQuickNoteJobId] = useState<string | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickPhotoUrl, setQuickPhotoUrl] = useState('');

  // Sample verified proof photos technicians can quick-select
  const photoPresets = [
    { label: 'HVAC Condenser Unit', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&auto=format&fit=crop&q=80' },
    { label: 'Breaker Panel Complete', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80' },
    { label: 'Site Cleared & Tested', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80' },
  ];

  // Filter jobs assigned to current technician (or show all for owner/lead demo)
  const myJobs = jobs.filter(
    (j) => j.assigned_to === currentProfile.id || currentProfile.role === 'owner'
  );

  const activeJobs = myJobs.filter((j) => j.status === 'in_progress');
  const scheduledJobs = myJobs.filter((j) => j.status === 'scheduled' || j.status === 'assigned');
  const completedJobs = myJobs.filter((j) => j.status === 'completed' || j.status === 'verified');

  const handleStartJob = (jobId: string) => {
    addJobUpdate(jobId, 'in_progress', 'Technician arrived on site. Service work commenced.');
    toast.success('Job status updated: In Progress', 'Site arrival recorded.');
  };

  const handleCompleteJob = (jobId: string) => {
    addJobUpdate(jobId, 'completed', 'Work completed and tested operational. Ready for sign-off.', quickPhotoUrl || undefined);
    setQuickNoteJobId(null);
    setQuickNoteText('');
    setQuickPhotoUrl('');
    toast.success('Job marked as Completed.', 'Ready for client verification and invoicing.');
  };

  const handleSendQuickUpdate = (jobId: string) => {
    if (!quickNoteText.trim()) return;
    addJobUpdate(jobId, 'in_progress', quickNoteText.trim(), quickPhotoUrl || undefined);
    setQuickNoteText('');
    setQuickPhotoUrl('');
    setQuickNoteJobId(null);
    toast.success('Field update logged successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Durable Mobile Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#12141c] border border-[#272c3e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#1a1d2b] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-lg">
            {currentProfile.full_name?.charAt(0) || 'T'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37] font-semibold">
                Mobile Field Terminal
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#f4efe6]">{currentProfile.full_name}</h1>
            <p className="text-xs text-[#a8a296]">
              {myJobs.length} active assignment{myJobs.length === 1 ? '' : 's'} assigned to your board
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="px-3 py-2 rounded-xl bg-[#0b0c10] border border-[#232737] text-center">
            <span className="text-[10px] text-[#8c867a] block font-mono">ON-SITE</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{activeJobs.length}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#0b0c10] border border-[#232737] text-center">
            <span className="text-[10px] text-[#8c867a] block font-mono">SCHEDULED</span>
            <span className="text-sm font-bold text-[#38bdf8] font-mono">{scheduledJobs.length}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#0b0c10] border border-[#232737] text-center">
            <span className="text-[10px] text-[#8c867a] block font-mono">DONE</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{completedJobs.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Active In-Progress Work Orders (High Priority) */}
      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Active Work In Progress
            </span>
            <span className="text-[11px] font-mono text-[#8c867a]">Update status & attach proof</span>
          </div>

          {activeJobs.map((job) => {
            const cust = customers.find((c) => c.id === job.customer_id);
            const isNoteOpen = quickNoteJobId === job.id;

            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-[#141724] border-2 border-amber-500/50 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#f3e5ab] bg-[#d4af37]/20 px-2.5 py-1 rounded-md border border-[#d4af37]/30">
                    {job.job_number}
                  </span>
                  <StatusBadge status={job.status} type="job" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#f4efe6]">{job.description}</h3>
                  <div className="mt-2 text-xs text-[#cfc8bc] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#f4efe6] flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-[#d4af37]" />
                        {cust?.full_name}
                      </span>
                      {cust?.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="px-2.5 py-1 rounded-lg bg-[#1f2436] text-[#38bdf8] font-mono flex items-center gap-1 text-xs hover:bg-[#282f46]"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{cust.phone}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-start text-[#a8a296]">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-[#d4af37] flex-shrink-0" />
                      <span>{job.location || cust?.address}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Controls (Section 10) */}
                <div className="pt-3 border-t border-[#252b3e] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickNoteJobId(isNoteOpen ? null : job.id)}
                      className="px-3 py-2 rounded-xl bg-[#1b1f2e] hover:bg-[#242a3e] text-[#cfc8bc] border border-[#2e354a] text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>{isNoteOpen ? 'Hide Note & Photo' : 'Log Note / Photo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectJob(job.id)}
                      className="px-3 py-2 rounded-xl bg-[#181b26] hover:bg-[#202534] text-xs text-[#a8a296] border border-[#2a3044]"
                    >
                      Full Details
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompleteJob(job.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </button>
                </div>

                {/* Expandable Quick Note & Photo Evidence Box */}
                {isNoteOpen && (
                  <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#252a3a] space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-mono text-[#8c867a] block mb-1">
                        Technician Progress Note:
                      </label>
                      <textarea
                        rows={2}
                        value={quickNoteText}
                        onChange={(e) => setQuickNoteText(e.target.value)}
                        placeholder="e.g. Replaced filter, purged lines, system running at optimal 42 PSI..."
                        className="w-full bg-[#12141c] border border-[#282d3e] rounded-lg p-2 text-xs text-[#f4efe6] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-[#8c867a] block mb-1">
                        Attach Completion Evidence Photo:
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {photoPresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuickPhotoUrl(preset.url)}
                            className={`px-2.5 py-1 rounded-md text-[11px] border font-sans ${
                              quickPhotoUrl === preset.url
                                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3e5ab]'
                                : 'bg-[#151722] border-[#292e40] text-[#a8a296] hover:text-[#f4efe6]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={quickPhotoUrl}
                        onChange={(e) => setQuickPhotoUrl(e.target.value)}
                        placeholder="Or paste photo evidence URL..."
                        className="w-full bg-[#12141c] border border-[#282d3e] rounded-lg px-2.5 py-1.5 text-xs text-[#f4efe6] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendQuickUpdate(job.id)}
                        className="px-3 py-1.5 bg-[#1a1e2c] hover:bg-[#23283a] text-xs font-semibold text-[#f4efe6] rounded-lg border border-[#2e3448] flex items-center space-x-1"
                      >
                        <Send className="w-3 h-3 text-[#d4af37]" />
                        <span>Log Progress Update</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Scheduled / Assigned Work Orders */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider block">
          Upcoming Scheduled Work Orders
        </span>

        {scheduledJobs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12141c] border border-[#242838] text-center text-xs text-[#8c867a]">
            No upcoming work orders assigned to your schedule.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledJobs.map((job) => {
              const cust = customers.find((c) => c.id === job.customer_id);

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#2f364c] transition space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#d4af37]">
                        {job.job_number}
                      </span>
                      <StatusBadge status={job.status} type="job" />
                    </div>

                    <h4 className="font-semibold text-sm text-[#f4efe6] mt-2 line-clamp-2">
                      {job.description}
                    </h4>

                    <div className="mt-2.5 space-y-1 text-xs text-[#8c867a]">
                      <div className="text-[#cfc8bc] font-medium flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-[#8c867a]" />
                        {cust?.full_name}
                      </div>
                      <div className="flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#646056] flex-shrink-0" />
                        <span className="truncate">{job.location || cust?.address}</span>
                      </div>
                      <div className="flex items-center text-indigo-300 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        <span>
                          {job.scheduled_date} ({job.scheduled_start} - {job.scheduled_end})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1f2330] flex items-center justify-between text-xs">
                    <button
                      onClick={() => onSelectJob(job.id)}
                      className="text-xs text-[#8c867a] hover:text-[#f4efe6] transition"
                    >
                      Inspect Details
                    </button>

                    <button
                      onClick={() => handleStartJob(job.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0b0c10] font-bold text-xs flex items-center space-x-1.5 transition active:scale-95 shadow"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Work</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Completed History */}
      {completedJobs.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[#202434]">
          <span className="text-xs font-semibold text-[#8c867a] uppercase tracking-wider block">
            Completed by You ({completedJobs.length})
          </span>

          <div className="space-y-2">
            {completedJobs.map((job) => {
              const cust = customers.find((c) => c.id === job.customer_id);
              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className="p-3.5 rounded-xl bg-[#0e1017] border border-[#202434] hover:border-[#2b3144] transition flex items-center justify-between text-xs cursor-pointer"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[#a8a296] font-medium">{job.job_number}</span>
                      <StatusBadge status={job.status} type="job" />
                    </div>
                    <div className="text-[#cfc8bc] mt-0.5 truncate max-w-sm">
                      {cust?.full_name} • {job.description}
                    </div>
                  </div>

                  <span className="text-[11px] text-emerald-400 font-medium">
                    Verified / Completed
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
