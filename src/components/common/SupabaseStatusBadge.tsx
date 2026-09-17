import React, { useState } from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseStatusModal } from './SupabaseStatusModal';

export const SupabaseStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const isConfigured = isSupabaseConfigured();

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition ${
          isConfigured
            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40'
            : 'bg-[#181a24] text-[#cfc8bc] border-[#292e40] hover:bg-[#202434] hover:text-[#f4efe6]'
        } ${className}`}
        title="Click to view Supabase connection status & database diagnostic"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        <Database className="w-3 h-3 text-[#d4af37]" />
        <span className="hidden sm:inline">
          {isConfigured ? 'Supabase Connected' : 'Local DB Active'}
        </span>
      </button>

      <SupabaseStatusModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
