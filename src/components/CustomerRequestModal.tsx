import React, { useState } from 'react';
import {
  X,
  Wrench,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { LeadPriority } from '../types/database';

interface CustomerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onRequestSubmitted?: (leadId: string) => void;
}

export const CustomerRequestModal: React.FC<CustomerRequestModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onRequestSubmitted,
}) => {
  const { services, customers, createCustomerRequest } = useAppStore();

  const customer = customers.find((c) => c.id === customerId) || customers[0];

  const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(customer?.address || '');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<LeadPriority>('medium');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a brief title for your request.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe what needs repair, inspection, or installation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdLead = createCustomerRequest({
        customerId: customer.id,
        serviceId: serviceId || undefined,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || customer.address || 'Client Location',
        preferredDate,
        priority,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onRequestSubmitted) onRequestSubmitted(createdLead.id);
        onClose();
        setIsSuccess(false);
      }, 800);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit service request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#12141c] border border-[#262b3c] rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212534] bg-[#161924] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f4efe6]">Request Trade Service</h2>
              <p className="text-[11px] text-[#a8a296]">
                Submit a new inquiry directly to our dispatch & estimating team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a1d28] text-[#a8a296] hover:text-[#f4efe6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#f4efe6]">Request Submitted!</h3>
            <p className="text-xs text-[#a8a296] max-w-sm mx-auto">
              Our engineering team has received your request and will prepare an itemized quote shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs text-[#a8a296] block mb-1">Service Category</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#f4efe6] block mb-1">
                Summary of Request *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AC compressor failure, no cold air on 2nd floor"
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#f4efe6] block mb-1">
                Details & Symptoms *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe any error codes, strange noises, when the issue started, and equipment access notes..."
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-3 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Preferred Service Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Urgency</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LeadPriority)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="low">Flexible / Routine maintenance</option>
                  <option value="medium">Standard (Within 2-3 days)</option>
                  <option value="high">High priority (Within 24 hours)</option>
                  <option value="urgent">Emergency (Immediate trade dispatch)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#a8a296] block mb-1">Service Location / Address</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Address where work is to be performed"
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-[#212534] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#181b26] hover:bg-[#202534] text-xs text-[#a8a296] hover:text-[#f4efe6] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Send Service Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
