import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Building,
  Wrench,
  FileText,
  User,
  MapPin,
  Loader2,
  RotateCcw,
  Edit3,
  Flame,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { AiLeadExtracted, LeadPriority } from '../types/database';

interface AiLeadAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: (leadId: string) => void;
}

export const AiLeadAssistModal: React.FC<AiLeadAssistModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const { customers, services, addLead, runAiLeadAssist } = useAppStore();

  const [inquiryText, setInquiryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<AiLeadExtracted | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Editable fields strictly matching Section 2 & 3:
  // Service, Issue, Quantity, Preferred date, Location, Urgency, Summary
  const [service, setService] = useState('');
  const [matchedServiceId, setMatchedServiceId] = useState<string>('');
  const [issue, setIssue] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [preferredDate, setPreferredDate] = useState('Flexible');
  const [locationType, setLocationType] = useState('commercial');
  const [location, setLocation] = useState(customers[0]?.address || '124 Commercial Way, San Francisco, CA');
  const [urgency, setUrgency] = useState<LeadPriority>('medium');
  const [summary, setSummary] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');

  if (!isOpen) return null;

  // Test scenarios matching Section 15
  const testScenarios = [
    {
      label: '1. Standard Natural Request',
      text: 'My shop has two AC units that are not cooling properly. I need someone to inspect them tomorrow.',
    },
    {
      label: '2. Missing Service Info',
      text: 'Need someone at 450 Market St tomorrow morning, please come check things out.',
    },
    {
      label: '3. Ambiguous Request',
      text: 'Everything is weird in the back room and something broke earlier.',
    },
    {
      label: '4. Very Short Request',
      text: 'Fix AC',
    },
    {
      label: '5. Comprehensive Multi-Unit Request',
      text: 'Commercial warehouse facility at 800 Industrial Blvd. We have three rooftop packaged HVAC condensers making loud grinding noises, two faulty subpanel breakers tripping repeatedly, and we need certified emergency inspection before Friday 7am shift.',
    },
  ];

  const handleExtract = async (textToUse?: string, options?: { simulateFailure?: boolean; simulateInvalid?: boolean }) => {
    const text = textToUse !== undefined ? textToUse : inquiryText;
    if (!text.trim()) {
      setError('Please provide a service request description.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await runAiLeadAssist(text, options);
      setExtractedData(result);
      setUserHasEdited(false);

      // Populate review state strictly matching schema
      setService(result.service || 'Commercial Service');
      setIssue(result.issue || text);
      setQuantity(typeof result.quantity === 'number' ? result.quantity : parseInt(String(result.quantity)) || 1);
      setPreferredDate(result.preferred_date || 'Flexible');
      setLocationType(result.location_type || 'commercial');
      setUrgency(result.urgency || 'medium');
      setSummary(result.summary || `Customer requests service for ${result.service}.`);

      // Match against catalog services
      if (result.matched_service_id) {
        setMatchedServiceId(result.matched_service_id);
      } else {
        const found = services.find(
          (s) =>
            s.name.toLowerCase().includes(result.service.toLowerCase()) ||
            result.service.toLowerCase().includes(s.name.toLowerCase())
        );
        setMatchedServiceId(found ? found.id : services[0]?.id || '');
      }
    } catch (err: any) {
      // Phase 4, Section 5: Exact error handling
      setError(err.message || 'AI assistance is temporarily unavailable. You can still create the lead manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueManually = () => {
    // Continue manually while strictly preserving user original inquiry text
    setError(null);
    setExtractedData({
      service: 'General Trade Service',
      issue: inquiryText || 'Customer service inquiry',
      quantity: 1,
      preferred_date: 'Flexible',
      location_type: 'commercial',
      urgency: 'medium',
      summary: inquiryText ? `Manual intake: ${inquiryText.slice(0, 100)}` : 'Manual lead creation',
      raw_inquiry: inquiryText,
    });
    setService('General Trade Service');
    setIssue(inquiryText || 'Service requested');
    setQuantity(1);
    setPreferredDate('Flexible');
    setLocationType('commercial');
    setUrgency('medium');
    setSummary(inquiryText ? `Manual intake: ${inquiryText.slice(0, 120)}` : 'Manual inquiry');
    setIsEditMode(true);
    setUserHasEdited(true);
  };

  const handleStartOver = () => {
    setExtractedData(null);
    setIsEditMode(false);
    setError(null);
    setUserHasEdited(false);
  };

  const handleCreateLead = () => {
    if (!service.trim()) {
      setError('Service name is required.');
      return;
    }

    const title = `${service} (${quantity} unit${quantity > 1 ? 's' : ''})`;

    const newLead = addLead({
      customer_id: selectedCustomerId,
      service_id: matchedServiceId || undefined,
      title,
      description: inquiryText ? `${inquiryText}\n\n[Extracted Issue]: ${issue}` : issue,
      status: 'new',
      priority: urgency,
      source: 'website',
      location,
      preferred_date: preferredDate,
      ai_extracted: {
        service,
        issue,
        quantity,
        preferred_date: preferredDate,
        location_type: locationType,
        urgency,
        summary,
        matched_service_id: matchedServiceId || null,
        raw_inquiry: inquiryText || undefined,
        user_edited: userHasEdited,
        extracted_at: new Date().toISOString(),
      },
      ai_summary: summary,
    });

    onClose();
    if (onLeadCreated) onLeadCreated(newLead.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#12141c] border border-[#262b3c] rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212534] bg-gradient-to-r from-[#171a25] to-[#12141c] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center text-[#0b0c10] shadow-md">
              <Sparkles className="w-5 h-5 text-[#0b0c10]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f4efe6] flex items-center gap-2">
                AI Lead Assist
                <span className="text-[10px] font-mono uppercase bg-[#d4af37]/20 text-[#f3e5ab] px-2 py-0.5 rounded border border-[#d4af37]/40">
                  Gemini Server Service
                </span>
              </h2>
              <p className="text-xs text-[#a8a296]">
                Natural trade inquiry parsing with human review before record creation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181b26] text-[#a8a296] hover:text-[#f4efe6] hover:bg-[#202534] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* STEP 1: Natural Language Intake (Shown when not extracted yet) */}
          {!extractedData && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#cfc8bc] uppercase tracking-wider mb-1.5">
                  Natural Customer Inquiry
                </label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Example: My shop has two AC units that are not cooling properly. I need someone to inspect them tomorrow."
                  rows={4}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-3.5 text-sm text-[#f4efe6] placeholder-[#6b665c] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition"
                />
              </div>

              {/* Sample Scenarios for Testing */}
              <div className="p-3.5 rounded-xl bg-[#161924] border border-[#222736] space-y-2">
                <span className="text-[11px] font-mono text-[#d4af37] uppercase tracking-wider block">
                  Quick Test Scenarios (Phase 4 Validation):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {testScenarios.map((sc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setInquiryText(sc.text);
                        handleExtract(sc.text);
                      }}
                      className="text-[11px] p-2 rounded-lg bg-[#0b0c10] hover:bg-[#1e2332] text-[#cfc8bc] border border-[#242938] hover:border-[#d4af37]/40 text-left transition"
                    >
                      <div className="font-semibold text-[#f4efe6] truncate">{sc.label}</div>
                      <div className="text-[#8c867a] text-[10px] truncate mt-0.5">"{sc.text}"</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#202434] flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-[#8c867a] font-mono">Edge Case Simulation:</span>
                  <button
                    type="button"
                    onClick={() => handleExtract(inquiryText || 'AC inspection', { simulateFailure: true })}
                    className="text-[10px] px-2 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/60 transition"
                  >
                    Test 6: Simulate Gemini Failure
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtract(inquiryText || 'AC inspection', { simulateInvalid: true })}
                    className="text-[10px] px-2 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50 hover:bg-amber-900/60 transition"
                  >
                    Test 7: Simulate Invalid JSON Schema
                  </button>
                </div>
              </div>

              {/* Extraction Action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#8c867a]">
                  Requires review & confirmation before any record is created.
                </span>
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  disabled={isLoading || !inquiryText.trim()}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#0b0c10]" />
                  <span>Parse with Gemini AI</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 4: AI Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-4 animate-in fade-in duration-200">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#d4af37]/20 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-[#181b26] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-lg">
                  <Sparkles className="w-6 h-6 animate-pulse text-[#d4af37]" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f4efe6]">Analyzing request...</h3>
                <p className="text-xs text-[#a8a296] mt-1 max-w-sm mx-auto">
                  Extracting service classification, issue symptoms, unit quantities, and urgency rating.
                </p>
              </div>
            </div>
          )}

          {/* Section 5: AI Error Handling */}
          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-3">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-rose-300">
                    AI assistance is temporarily unavailable. You can still create the lead manually.
                  </div>
                  <div className="text-[11px] text-rose-400/90 mt-0.5">{error}</div>
                </div>
              </div>

              {inquiryText && (
                <div className="p-2.5 rounded-lg bg-[#0b0c10]/80 border border-rose-900/40 text-[11px] text-[#cfc8bc]">
                  <span className="text-[10px] uppercase font-mono text-[#8c867a] block mb-0.5">
                    Original Preserved Request:
                  </span>
                  "{inquiryText}"
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleContinueManually}
                  className="px-3.5 py-1.5 rounded-lg bg-[#181b26] hover:bg-[#222736] border border-[#2e3448] text-xs text-[#f4efe6] font-medium transition"
                >
                  Continue Manually
                </button>
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-800/40 hover:bg-rose-800/60 text-xs text-rose-200 border border-rose-700/50 transition"
                >
                  Retry Request
                </button>
              </div>
            </div>
          )}

          {/* Section 3 & Section 6: AI EXTRACTED DETAILS & HUMAN REVIEW */}
          {extractedData && !isLoading && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Review Header with Section 11 Auditability badge */}
              <div className="p-3.5 rounded-xl bg-[#161924] border border-[#262b3a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
                    AI EXTRACTED DETAILS
                  </div>
                  <div className="text-[11px] text-[#a8a296] mt-0.5">
                    Review and edit every field below before creating the lead record.
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#f3e5ab] border border-[#d4af37]/30">
                    Source: Gemini 3.8
                  </span>
                  {userHasEdited && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
                      User Modified
                    </span>
                  )}
                </div>
              </div>

              {/* Section 11: Original Preserved Request Box */}
              {inquiryText && (
                <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#202434] text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block mb-1">
                    Original Customer Request (Audited)
                  </span>
                  <p className="text-[#cfc8bc] italic leading-relaxed">"{inquiryText}"</p>
                </div>
              )}

              {/* The 7 Required Fields from Section 2 & 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Service */}
                <div>
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Service *</span>
                    <span className="text-[10px] text-[#8c867a]">Editable</span>
                  </label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => {
                      setService(e.target.value);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                    placeholder="e.g. AC Repair"
                  />
                </div>

                {/* Match with business catalog */}
                <div>
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Catalog Service Match</span>
                    <span className="text-[10px] text-[#8c867a]">Catalog Link</span>
                  </label>
                  <select
                    value={matchedServiceId}
                    onChange={(e) => {
                      setMatchedServiceId(e.target.value);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="">-- Select or No Match --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.base_price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Issue */}
                <div className="sm:col-span-2">
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Issue *</span>
                    <span className="text-[10px] text-[#8c867a]">Editable</span>
                  </label>
                  <textarea
                    rows={2}
                    value={issue}
                    onChange={(e) => {
                      setIssue(e.target.value);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                    placeholder="e.g. AC units are not cooling"
                  />
                </div>

                {/* 3. Quantity (Strictly numeric as per Section 6) */}
                <div>
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Quantity (Units/Rooms) *</span>
                    <span className="text-[10px] text-[#8c867a]">Numeric</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(parseInt(e.target.value) || 1);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>

                {/* 4. Preferred Date */}
                <div>
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Preferred Date / Timeline *</span>
                    <span className="text-[10px] text-[#8c867a]">Editable</span>
                  </label>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={(e) => {
                      setPreferredDate(e.target.value);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                    placeholder="e.g. tomorrow, next Saturday, or flexible"
                  />
                </div>

                {/* 5. Location */}
                <div>
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Location Address *</span>
                    <span className="text-[10px] text-[#8c867a]">Job Site</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                {/* 6. Urgency (Section 6: low, medium, high, urgent) */}
                <div>
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Urgency *</span>
                    <span className="text-[10px] text-[#8c867a]">Enum</span>
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => {
                      setUrgency(e.target.value as LeadPriority);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Associated Customer */}
                <div className="sm:col-span-2">
                  <label className="block text-[#a8a296] mb-1 font-medium">Customer Account</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const cust = customers.find((c) => c.id === e.target.value);
                      if (cust?.address) setLocation(cust.address);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email}) - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Summary */}
                <div className="sm:col-span-2">
                  <label className="block text-[#a8a296] mb-1 font-medium flex items-center justify-between">
                    <span>Summary *</span>
                    <span className="text-[10px] text-[#8c867a]">Commercial Summary</span>
                  </label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      setUserHasEdited(true);
                    }}
                    className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl p-2.5 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                    placeholder="e.g. Inspection and repair requested for two AC units."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Strictly with Buttons: 'Create Lead', 'Edit Details', 'Start Over' (Section 3) */}
        <div className="px-6 py-4 border-t border-[#212534] bg-[#0e1017] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#161924] hover:bg-[#202536] text-[#cfc8bc] text-xs font-medium transition"
          >
            Cancel
          </button>

          {extractedData && !isLoading && (
            <div className="flex items-center space-x-2.5">
              {/* Button: 'Start Over' */}
              <button
                type="button"
                onClick={handleStartOver}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#181b26] hover:bg-[#222736] border border-[#2e3448] text-xs text-[#cfc8bc] font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8c867a]" />
                <span>Start Over</span>
              </button>

              {/* Button: 'Edit Details' */}
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition ${
                  isEditMode
                    ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#f3e5ab]'
                    : 'bg-[#181b26] hover:bg-[#222736] border-[#2e3448] text-[#cfc8bc]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Editing Active' : 'Edit Details'}</span>
              </button>

              {/* Button: 'Create Lead' */}
              <button
                type="button"
                onClick={handleCreateLead}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition active:scale-95"
              >
                <span>Create Lead</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

