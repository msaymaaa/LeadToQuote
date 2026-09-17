import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  ShieldCheck,
  Layers,
  Terminal,
} from 'lucide-react';
import { getSupabaseDiagnostics, testSupabaseConnection } from '../../lib/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const diagnostics = getSupabaseDiagnostics();

  const handleTestConnection = async () => {
    setTesting(true);
    const res = await testSupabaseConnection();
    setTesting(false);
    setTestResult({ tested: true, ...res });
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText(
      `-- LeadToQuote Supabase PostgreSQL Schema & RLS
-- Run in Supabase SQL Editor:
-- Check file /supabase/schema.sql in the root directory.`
    );
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c10]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#12141d] border border-[#262c3e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#222738] flex items-center justify-between bg-[#0e1017]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a1f2e] border border-[#3b82f6]/30 flex items-center justify-center text-[#38bdf8]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f4efe6]">
                Supabase PostgreSQL & Security Status
              </h2>
              <p className="text-xs text-[#a8a296]">
                Phase 2 Architecture: RLS, Multi-tenant Isolation & Persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181c28] text-[#a8a296] hover:text-[#f4efe6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#cfc8bc]">
          {/* Active Engine Card */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#222738] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-mono text-[#8c867a] tracking-wider font-semibold">
                Active Persistence Engine
              </div>
              <div className="text-sm font-bold text-[#f4efe6] flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    diagnostics.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {diagnostics.isConfigured
                  ? 'Live Supabase Cloud (PostgreSQL)'
                  : 'Local Persistence Engine (Active & Fully Operational)'}
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d28] hover:bg-[#232838] border border-[#2e3448] text-xs text-[#f4efe6] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Pinging...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Test Connection Output */}
          {testResult && testResult.tested && (
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-semibold block">
                  {testResult.success ? 'Connected successfully!' : 'Connection ping feedback:'}
                </span>
                {testResult.latencyMs && (
                  <span className="text-[11px] font-mono">Response latency: {testResult.latencyMs}ms</span>
                )}
                {testResult.error && (
                  <p className="mt-0.5 text-[11px] opacity-90">{testResult.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Variables Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c867a] font-semibold block">
              Environment Variables Diagnostic
            </span>
            <div className="rounded-xl border border-[#222738] bg-[#0b0c10] divide-y divide-[#1e2332] font-mono text-[11px]">
              <div className="p-2.5 flex justify-between items-center">
                <span className="text-[#a8a296]">VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL</span>
                <span className={diagnostics.url ? 'text-emerald-400 truncate max-w-[240px]' : 'text-amber-400'}>
                  {diagnostics.url ? diagnostics.url : 'Not supplied (fallback active)'}
                </span>
              </div>
              <div className="p-2.5 flex justify-between items-center">
                <span className="text-[#a8a296]">VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_...</span>
                <span className={diagnostics.hasAnonKey ? 'text-emerald-400' : 'text-amber-400'}>
                  {diagnostics.hasAnonKey ? 'Valid key loaded' : 'Not configured'}
                </span>
              </div>
              <div className="p-2.5 flex justify-between items-center">
                <span className="text-[#a8a296]">Row Level Security (RLS) Schema</span>
                <span className="text-[#d4af37]">Ready in /supabase/schema.sql</span>
              </div>
            </div>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c867a] font-semibold block">
              How to Connect to Supabase Cloud
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#222738] space-y-1">
                <span className="text-[10px] font-mono text-[#d4af37] font-bold">STEP 1</span>
                <h4 className="font-semibold text-[#f4efe6]">Create Project</h4>
                <p className="text-[11px] text-[#8c867a]">
                  Sign up at supabase.com and create a new PostgreSQL project.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#222738] space-y-1">
                <span className="text-[10px] font-mono text-[#d4af37] font-bold">STEP 2</span>
                <h4 className="font-semibold text-[#f4efe6]">Run schema.sql</h4>
                <p className="text-[11px] text-[#8c867a]">
                  Paste <code className="text-[#f3e5ab]">/supabase/schema.sql</code> into the Supabase SQL Editor.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#222738] space-y-1">
                <span className="text-[10px] font-mono text-[#d4af37] font-bold">STEP 3</span>
                <h4 className="font-semibold text-[#f4efe6]">Provide Keys</h4>
                <p className="text-[11px] text-[#8c867a]">
                  Add <code className="text-[#f3e5ab]">VITE_SUPABASE_URL</code> & <code className="text-[#f3e5ab]">VITE_SUPABASE_ANON_KEY</code> to Settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222738] bg-[#0e1017] flex items-center justify-between">
          <button
            onClick={handleCopySchemaPath}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#181c28] hover:bg-[#222738] text-xs text-[#cfc8bc] border border-[#2b3145] transition"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
            <span>{copiedSchema ? 'Copied schema reference!' : 'Copy Schema Info'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b0c10] font-semibold text-xs hover:brightness-110 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
