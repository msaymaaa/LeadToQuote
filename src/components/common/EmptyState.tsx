import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 sm:p-14 rounded-2xl bg-[#12141c] border border-[#222636] text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#181b26] border border-[#d4af37]/30 flex items-center justify-center mb-4 text-[#d4af37] shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#f4efe6] tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#a8a296] leading-relaxed max-w-md mb-6">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c29d2b] text-[#0b0c10] font-semibold text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 rounded-xl bg-[#181b26] hover:bg-[#202534] text-[#cfc8bc] border border-[#2c3245] text-xs sm:text-sm transition"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
