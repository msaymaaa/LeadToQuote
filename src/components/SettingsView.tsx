import React, { useState } from 'react';
import {
  Settings,
  Building,
  Shield,
  Database,
  Users,
  Key,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseStatusModal } from './common/SupabaseStatusModal';

export const SettingsView: React.FC = () => {
  const { business, profiles, resetToDefaults } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const supabaseConfigured = isSupabaseConfigured();

  const handleCopySchema = () => {
    navigator.clipboard.writeText(
      `-- Supabase LeadToQuote Production Schema & RLS
-- Run in Supabase SQL Editor to provision tables and Row Level Security:
-- Check /supabase/schema.sql in the project root.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-[#212534]">
        <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#d4af37]" />
          Platform Settings & Infrastructure
        </h1>
        <p className="text-xs text-[#a8a296] mt-0.5">
          Company profile, role-based access configuration, and Supabase PostgreSQL persistence status.
        </p>
      </div>

      {/* Business Details */}
      <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#202434]">
          <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-[#d4af37]" />
            Commercial Contractor Profile
          </span>
          <span className="text-[11px] font-mono text-[#8c867a]">License Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#8c867a] mb-1 font-medium">Business Name</label>
            <input
              type="text"
              readOnly
              value={business.name}
              className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
            />
          </div>

          <div>
            <label className="block text-[#8c867a] mb-1 font-medium">Headquarters Address</label>
            <input
              type="text"
              readOnly
              value={business.address}
              className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
            />
          </div>

          <div>
            <label className="block text-[#8c867a] mb-1 font-medium">Official Dispatch Phone</label>
            <input
              type="text"
              readOnly
              value={business.phone}
              className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
            />
          </div>

          <div>
            <label className="block text-[#8c867a] mb-1 font-medium">Operations Email</label>
            <input
              type="text"
              readOnly
              value={business.email}
              className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
            />
          </div>
        </div>
      </div>

      {/* Database & Security Configuration */}
      <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#202434]">
          <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[#38bdf8]" />
            Database & Security Architecture (Supabase / PostgreSQL)
          </span>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-mono text-[#a8a296]">
              {supabaseConfigured ? 'Supabase Connected' : 'Local Persistence (Active)'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#a8a296] leading-relaxed">
          LeadToQuote comes with a production-grade relational PostgreSQL schema in{' '}
          <code className="text-[#f3e5ab] bg-[#181b26] px-1.5 py-0.5 rounded border border-[#2a2f42] font-mono">
            /supabase/schema.sql
          </code>{' '}
          including foreign keys, check constraints, automatic timestamp triggers, and comprehensive
          Row Level Security (RLS) policies enforcing role isolation for Owner, Technician, and Customer.
        </p>

        <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#202434] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#f4efe6]">Environment Variables Configuration</span>
            <span className="text-[11px] text-[#8c867a]">Managed via Settings / .env</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between py-1 border-b border-[#1a1d28]">
              <span className="text-[#a8a296]">GEMINI_API_KEY</span>
              <span className="text-emerald-400">Configured (Server-Side Proxy)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1d28]">
              <span className="text-[#a8a296]">VITE_SUPABASE_URL</span>
              <span className={supabaseConfigured ? 'text-emerald-400' : 'text-[#8c867a]'}>
                {supabaseConfigured ? 'Connected' : 'Optional (Local fallback active)'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#a8a296]">VITE_SUPABASE_ANON_KEY</span>
              <span className={supabaseConfigured ? 'text-emerald-400' : 'text-[#8c867a]'}>
                {supabaseConfigured ? 'Connected' : 'Optional (Local fallback active)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopySchema}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#181b26] hover:bg-[#222736] text-xs text-[#cfc8bc] border border-[#2a2f42] transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
            <span>{copied ? 'Copied schema reference!' : 'Copy Supabase Schema Path'}</span>
          </button>

          <button
            onClick={() => setStatusModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1a1f2e] hover:bg-[#22283a] text-xs text-[#38bdf8] border border-[#2a3854] transition font-medium"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Inspect & Ping Database</span>
          </button>
        </div>
      </div>

      {/* Team Profiles Directory */}
      <div className="p-6 rounded-2xl bg-[#12141c] border border-[#242838] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#202434]">
          <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#c084fc]" />
            Configured User Personas & Permissions
          </span>
          <span className="text-[11px] font-mono text-[#8c867a]">{profiles.length} Active Accounts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {profiles.map((p) => (
            <div key={p.id} className="p-3.5 rounded-xl bg-[#0b0c10] border border-[#202434] space-y-2">
              <div className="flex items-center space-x-2.5">
                <img
                  src={p.avatar_url}
                  alt={p.full_name}
                  className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/30"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-[#f4efe6] truncate">{p.full_name}</div>
                  <div className="text-[10px] font-mono uppercase text-[#d4af37]">{p.role}</div>
                </div>
              </div>
              <div className="text-[11px] text-[#8c867a] truncate">{p.email}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Factory Reset */}
      <div className="p-6 rounded-2xl bg-[#12141c] border border-red-900/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">
              Reset Application State
            </h3>
            <p className="text-xs text-[#8c867a] mt-0.5">
              Reset all local trade leads, quotes, work orders, and invoices back to baseline seed data.
            </p>
          </div>

          {resetConfirm ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  resetToDefaults();
                  setResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Yes, Reset All
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg bg-[#181b26] text-xs text-[#a8a296]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#1a171d] hover:bg-red-950/40 text-xs text-red-400 border border-red-800/40 transition"
            >
              Reset to Defaults
            </button>
          )}
        </div>
      </div>

      <SupabaseStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />
    </div>
  );
};
