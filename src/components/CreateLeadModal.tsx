import React, { useState } from 'react';
import {
  X,
  Users,
  Building,
  UserPlus,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { LeadPriority, LeadSource } from '../types/database';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (leadId: string) => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const { customers, services, profiles, addLead, addCustomer } = useAppStore();

  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  // New Customer inline fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Lead fields
  const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<LeadPriority>('medium');
  const [source, setSource] = useState<LeadSource>('manual');
  const [assignedTo, setAssignedTo] = useState<string>('');

  // Form states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const staffOptions = profiles.filter((p) => p.role !== 'customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!title.trim()) {
      setValidationError('Lead Title / Service Summary is required.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Description or scope of work is required.');
      return;
    }

    let customerIdToUse = selectedCustomerId;

    if (isCreatingCustomer) {
      if (!newCustName.trim() || !newCustEmail.trim()) {
        setValidationError('Customer Full Name and Email are required.');
        return;
      }
      try {
        setIsSubmitting(true);
        const createdCustomer = addCustomer({
          full_name: newCustName.trim(),
          email: newCustEmail.trim(),
          phone: newCustPhone.trim() || undefined,
          address: newCustAddress.trim() || undefined,
        });
        customerIdToUse = createdCustomer.id;
      } catch (err: any) {
        setIsSubmitting(false);
        setValidationError(`Failed to create customer: ${err.message}`);
        return;
      }
    } else {
      if (!customerIdToUse) {
        setValidationError('Please select an existing customer or create a new one.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const chosenCustomer = customers.find((c) => c.id === customerIdToUse);
      const effectiveLocation = location.trim() || chosenCustomer?.address || 'Site Location TBD';

      const newLead = addLead({
        customer_id: customerIdToUse,
        service_id: serviceId || undefined,
        title: title.trim(),
        description: description.trim(),
        status: 'new',
        priority,
        source,
        location: effectiveLocation,
        preferred_date: preferredDate,
        assigned_to: assignedTo || undefined,
      });

      setSuccessMsg('Lead created successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        onLeadCreated(newLead.id);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(`Failed to save lead: ${err.message || 'Database error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#12141c] border border-[#262b3c] rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212534] bg-[#161924] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f4efe6]">Create New Service Lead</h2>
              <p className="text-[11px] text-[#a8a296]">
                Enter customer request, assign tradesperson, and set initial priority
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

        {/* Feedback banners */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Customer Selection / Creation */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#222634] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#d4af37] font-semibold">
                Customer Details
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
                className="text-xs text-[#a8a296] hover:text-[#f4efe6] flex items-center gap-1 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isCreatingCustomer ? 'Select Existing Client' : '+ Add New Client'}</span>
              </button>
            </div>

            {!isCreatingCustomer ? (
              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Select Client</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c?.address && !location) {
                      setLocation(c.address);
                    }
                  }}
                  className="w-full bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone || c.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-[#8c867a] block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Robert Hansen"
                    className="w-full bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-1.5 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8c867a] block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="e.g. robert@company.com"
                    className="w-full bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-1.5 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8c867a] block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="(415) 555-0199"
                    className="w-full bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-1.5 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8c867a] block mb-1">Property Address</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => {
                      setNewCustAddress(e.target.value);
                      setLocation(e.target.value);
                    }}
                    placeholder="1200 Industrial Pkwy, Bldg C"
                    className="w-full bg-[#141622] border border-[#282d3e] rounded-xl px-3 py-1.5 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lead Information */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#f4efe6] block mb-1">
                Lead Title / Summary *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Commercial RTU replacement & 400A subpanel installation"
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Trade Service Category</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="">General Trade Inquiry</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.base_price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LeadPriority)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="low">Low (General Inquiry)</option>
                  <option value="medium">Medium (Standard Quote)</option>
                  <option value="high">High (Active Project)</option>
                  <option value="urgent">Urgent (Service Outage / Emergency)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#f4efe6] block mb-1">
                Scope / Issue Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe client requirements, diagnostic symptoms, equipment model, and access constraints..."
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-3 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Inquiry Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="phone">Phone Inbound</option>
                  <option value="website">Website Portal</option>
                  <option value="referral">Client Referral</option>
                  <option value="other">Other Channel</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a8a296] block mb-1">Assign Estimator / Tech</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {staffOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#a8a296] block mb-1">Job Site Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Job site address or customer premises"
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl px-3.5 py-2 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Footer */}
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
                <span>Saving to Database...</span>
              ) : (
                <>
                  <span>Create Lead</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
