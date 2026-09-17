import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Send,
  Save,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  Loader2,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Customer, ServiceItem, Quote, QuoteItem } from '../types/database';

interface QuoteBuilderProps {
  existingQuote?: Quote | null;
  leadIdToConvert?: string | null;
  onClose: () => void;
  onSaved: (quoteId: string) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  existingQuote,
  leadIdToConvert,
  onClose,
  onSaved,
}) => {
  const toast = useToast();
  const {
    business,
    customers,
    services,
    leads,
    createQuote,
    updateQuote,
    sendQuote,
    generateAiQuoteDescription,
  } = useAppStore();

  const linkedLead = leadIdToConvert ? leads.find((l) => l.id === leadIdToConvert) : null;

  // Initialize form state
  const [customerId, setCustomerId] = useState<string>(() => {
    if (existingQuote) return existingQuote.customer_id;
    if (linkedLead) return linkedLead.customer_id;
    return customers[0]?.id || '';
  });

  const [quoteNumber, setQuoteNumber] = useState<string>(() => {
    if (existingQuote) return existingQuote.quote_number;
    return `QT-2026-${Math.floor(100 + Math.random() * 900)}`;
  });

  // Phase 4, Section 8: AI Assist in Quote Builder
  interface AiAssistModalState {
    targetType: 'item' | 'notes';
    itemId?: string;
    originalNotes: string;
    suggestion: string;
  }
  const [aiAssistModal, setAiAssistModal] = useState<AiAssistModalState | null>(null);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [aiAssistError, setAiAssistError] = useState<string | null>(null);

  const [validUntil, setValidUntil] = useState<string>(() => {
    if (existingQuote?.valid_until) return existingQuote.valid_until;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [notes, setNotes] = useState<string>(() => {
    if (existingQuote?.notes) return existingQuote.notes;
    return 'Includes standard manufacturer warranty, licensed journeyman labor, and site cleanup. Payment terms: 50% upon project kickoff, 50% upon final sign-off.';
  });

  interface FormItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
  }

  const [items, setItems] = useState<FormItem[]>(() => {
    if (existingQuote?.items && existingQuote.items.length > 0) {
      return existingQuote.items.map((i) => ({
        id: i.id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }));
    }
    if (linkedLead?.ai_extracted) {
      const ext = linkedLead.ai_extracted;
      const initialList: FormItem[] = [
        {
          id: '1',
          description: `${ext.service} (${ext.quantity || 'Standard Service'})`,
          quantity: 1,
          unit_price: 3200,
        },
      ];
      if (ext.additional_services) {
        ext.additional_services.forEach((task, idx) => {
          initialList.push({
            id: `add-${idx}`,
            description: task,
            quantity: 1,
            unit_price: 350 + idx * 100,
          });
        });
      }
      return initialList;
    }
    return [
      {
        id: '1',
        description: 'Commercial Mechanical / Trade Service',
        quantity: 1,
        unit_price: 1850.0,
      },
      {
        id: '2',
        description: 'Certified Contractor Labor & Diagnostic Equipment',
        quantity: 4,
        unit_price: 150.0,
      },
    ];
  });

  const [discountAmount, setDiscountAmount] = useState<number>(existingQuote?.discount || 150);
  const [taxRate, setTaxRate] = useState<number>(8.25); // 8.25%

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || customers[0],
    [customers, customerId]
  );

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unit_price) || 0);
      return sum + q * p;
    }, 0);
  }, [items]);

  const safeDiscount = Math.max(0, Number(discountAmount) || 0);
  const discount = Math.min(safeDiscount, subtotal);
  const taxableAmount = Math.max(0, subtotal - discount);
  const safeTaxRate = Math.max(0, Number(taxRate) || 0);
  const tax = parseFloat(((taxableAmount * safeTaxRate) / 100).toFixed(2));
  const total = parseFloat((taxableAmount + tax).toFixed(2));

  // Item handlers
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: 'Additional Trade Labor / Materials',
        quantity: 1,
        unit_price: 250,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof FormItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'quantity') {
          const num = Number(value);
          return { ...it, quantity: isNaN(num) ? 1 : Math.max(1, Math.floor(num)) };
        }
        if (field === 'unit_price') {
          const num = Number(value);
          return { ...it, unit_price: isNaN(num) ? 0 : Math.max(0, num) };
        }
        return { ...it, [field]: value };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Phase 4, Section 8: AI Assist Handlers
  const handleOpenAiAssist = async (targetType: 'item' | 'notes', itemId?: string) => {
    let initialNotes = '';
    if (targetType === 'item' && itemId) {
      const item = items.find((i) => i.id === itemId);
      initialNotes = item?.description || '';
    } else {
      initialNotes = notes || '';
    }

    const promptNotes =
      initialNotes.trim() || 'replaced blower motor, cleaned coils, tested pressure';

    setAiAssistModal({
      targetType,
      itemId,
      originalNotes: promptNotes,
      suggestion: '',
    });
    setIsAiAssisting(true);
    setAiAssistError(null);

    const res = await generateAiQuoteDescription(
      promptNotes,
      services[0]?.name || 'HVAC & Mechanical Service'
    );
    setIsAiAssisting(false);

    if (res.success && res.description) {
      setAiAssistModal((prev) =>
        prev ? { ...prev, originalNotes: promptNotes, suggestion: res.description! } : null
      );
    } else {
      setAiAssistError(res.error || 'Failed to generate quote description.');
    }
  };

  const handleAcceptAiSuggestion = () => {
    if (!aiAssistModal) return;
    const { targetType, itemId, suggestion } = aiAssistModal;
    if (targetType === 'item' && itemId) {
      handleUpdateItem(itemId, 'description', suggestion);
    } else {
      setNotes(suggestion);
    }
    setAiAssistModal(null);
  };

  const handleRejectAiSuggestion = () => {
    setAiAssistModal(null);
  };

  const handleApplyServiceTemplate = (srvId: string) => {
    const srv = services.find((s) => s.id === srvId);
    if (!srv) return;
    setItems((prev) => [
      ...prev,
      {
        id: `srv-${Date.now()}`,
        description: `${srv.name} - ${srv.description}`,
        quantity: 1,
        unit_price: srv.base_price,
      },
    ]);
  };

  const handleSave = (shouldSend = false) => {
    // Phase 6 Financial & Input Validation
    if (items.length === 0) {
      toast.error('Quotation Error', 'A quotation must contain at least one line item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description || it.description.trim() === '') {
        toast.error('Validation Error', `Line item #${i + 1} requires a valid description.`);
        return;
      }
      if (Number(it.quantity) <= 0 || isNaN(Number(it.quantity))) {
        toast.error('Validation Error', `Line item #${i + 1} quantity must be greater than zero.`);
        return;
      }
      if (Number(it.unit_price) < 0 || isNaN(Number(it.unit_price))) {
        toast.error('Validation Error', `Line item #${i + 1} unit price cannot be negative.`);
        return;
      }
    }

    if (Number(discountAmount) < 0 || isNaN(Number(discountAmount))) {
      toast.error('Validation Error', 'Discount amount cannot be negative.');
      return;
    }

    if (Number(taxRate) < 0 || isNaN(Number(taxRate))) {
      toast.error('Validation Error', 'Tax rate cannot be negative.');
      return;
    }

    const quoteItems: QuoteItem[] = items.map((it) => {
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      const price = Math.max(0, Number(it.unit_price) || 0);
      return {
        id: it.id,
        quote_id: existingQuote?.id || '',
        description: it.description.trim(),
        quantity: qty,
        unit_price: price,
        total: parseFloat((qty * price).toFixed(2)),
        created_at: new Date().toISOString(),
      };
    });

    if (existingQuote) {
      updateQuote(existingQuote.id, {
        customer_id: customerId,
        valid_until: validUntil,
        notes,
        subtotal,
        discount,
        tax,
        total,
        status: shouldSend ? 'sent' : existingQuote.status,
      });
      if (shouldSend && existingQuote.status === 'draft') {
        sendQuote(existingQuote.id);
      }
      toast.success('Quote updated.', `Quotation ${existingQuote.quote_number} saved.`);
      onSaved(existingQuote.id);
    } else {
      const created = createQuote({
        lead_id: linkedLead?.id || undefined,
        customer_id: customerId,
        quote_number: quoteNumber,
        status: shouldSend ? 'sent' : 'draft',
        subtotal,
        discount,
        tax,
        total,
        valid_until: validUntil,
        notes,
        items: quoteItems,
      });
      if (shouldSend) {
        sendQuote(created.id);
      }
      toast.success('Quote created.', `Quotation ${created.quote_number} created.`);
      onSaved(created.id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onClose}
          className="flex items-center space-x-1.5 text-xs text-[#a8a296] hover:text-[#f4efe6] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] hover:bg-[#202534] border border-[#2a2f42] text-xs text-[#cfc8bc] transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Print / PDF</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-[#1a1d28] hover:bg-[#242938] border border-[#d4af37]/40 text-xs text-[#f3e5ab] font-medium transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-xs text-[#0b0c10] font-bold shadow-md transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Customer</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Editor (Left) & Document Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Quote Editor */}
        <div className="lg:col-span-6 space-y-5 no-print">
          <div className="p-5 rounded-2xl bg-[#13151f] border border-[#232737] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202434]">
              <span className="text-xs font-semibold text-[#f4efe6] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#d4af37]" />
                Quote Parameters
              </span>
              <span className="text-[11px] font-mono text-[#d4af37] bg-[#d4af37]/15 px-2 py-0.5 rounded">
                {quoteNumber}
              </span>
            </div>

            {/* Customer & Lead Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#a8a296] mb-1 font-medium">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.city || 'CA'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1 font-medium">Valid Until Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Catalog Template Insert */}
            <div>
              <label className="block text-[11px] text-[#8c867a] mb-1">
                Insert Catalog Service Template:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleApplyServiceTemplate(s.id)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[#181b26] hover:bg-[#222736] text-[#cfc8bc] border border-[#282d3e] transition"
                  >
                    + {s.name.split(' ')[0]} (${s.base_price})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="p-5 rounded-2xl bg-[#13151f] border border-[#232737] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#202434]">
              <span className="text-xs font-semibold text-[#f4efe6] uppercase tracking-wider">
                Line Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs text-[#d4af37] hover:text-[#f3e5ab] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#0b0c10] border border-[#232737] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Scope of work description..."
                          className="w-full bg-transparent text-[#f4efe6] font-medium placeholder-[#5e5a52] focus:outline-none focus:border-b border-[#d4af37]"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAiAssist('item', item.id)}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#171a27] hover:bg-[#202538] text-[#d4af37] border border-[#2d344a] text-[10px] font-semibold transition active:scale-95"
                          title="AI Assist: Turn rough technician notes into professional customer-facing description"
                        >
                          <Sparkles className="w-3 h-3 text-[#d4af37]" />
                          <span>AI Assist</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length <= 1}
                          className="text-[#787265] hover:text-red-400 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 pt-1 border-t border-[#1a1d28] items-center">
                      <div className="col-span-4">
                        <span className="text-[10px] text-[#8c867a] block">Qty</span>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-[#141620] border border-[#262b3a] rounded px-2 py-1 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <span className="text-[10px] text-[#8c867a] block">Unit Price ($)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-[#141620] border border-[#262b3a] rounded px-2 py-1 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4 text-right">
                        <span className="text-[10px] text-[#8c867a] block">Line Total</span>
                        <span className="font-mono font-semibold text-[#f3e5ab]">
                          ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discount, Tax & Summary inputs */}
            <div className="pt-3 border-t border-[#202434] grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#a8a296] mb-1">Discount Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6] focus:border-[#d4af37] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-[#a8a296] font-medium">Terms, Scope Notes & Warranty</label>
                <button
                  type="button"
                  onClick={() => handleOpenAiAssist('notes')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#181c2a] hover:bg-[#22283b] text-[#d4af37] border border-[#2d364f] text-[11px] font-semibold transition active:scale-95 shadow-sm"
                  title="Turn technician notes into customer-facing scope"
                >
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>AI Assist Scope</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2.5 text-xs text-[#f4efe6] focus:border-[#d4af37] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Professional Quotation Preview */}
        <div className="lg:col-span-6">
          <div className="sticky top-16">
            <div className="mb-2 flex items-center justify-between no-print">
              <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#d4af37]" />
                Live Client Proposal Preview
              </span>
              <span className="text-[11px] text-[#8c867a]">
                Updates dynamically as you edit
              </span>
            </div>

            {/* Document sheet */}
            <div className="printable-document bg-[#151722] text-[#f4efe6] border border-[#282d3e] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-[#262b3c]">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#997d26] flex items-center justify-center font-bold text-[#0b0c10] text-sm">
                      LQ
                    </div>
                    <h3 className="font-bold text-lg text-[#f4efe6] tracking-tight">
                      {business.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#a8a296] mt-1.5">{business.description}</p>
                  <div className="text-[11px] text-[#8c867a] mt-1 space-x-2">
                    <span>{business.address}</span>
                    <span>•</span>
                    <span>{business.phone}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37] font-semibold block">
                    SERVICE QUOTATION
                  </span>
                  <div className="font-mono text-base font-bold text-[#f4efe6] mt-0.5">
                    {quoteNumber}
                  </div>
                  <div className="text-[11px] text-[#8c867a] mt-1">
                    Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </div>
                  <div className="text-[11px] text-[#a8a296]">
                    Valid Until: {validUntil || '30 Days'}
                  </div>
                </div>
              </div>

              {/* Prepared For & Site Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0e1017] border border-[#202434] text-xs">
                <div>
                  <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-semibold block font-mono">
                    CLIENT INFORMATION
                  </span>
                  <div className="font-semibold text-[#f4efe6] mt-1">
                    {selectedCustomer?.full_name}
                  </div>
                  <div className="text-[#a8a296]">{selectedCustomer?.email}</div>
                  <div className="text-[#a8a296]">{selectedCustomer?.phone}</div>
                </div>

                <div>
                  <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-semibold block font-mono">
                    JOB LOCATION
                  </span>
                  <div className="text-[#f4efe6] mt-1">{selectedCustomer?.address || 'Site Address TBD'}</div>
                  <div className="text-[#a8a296]">{selectedCustomer?.city || 'San Francisco, CA'}</div>
                  <div className="text-[11px] text-[#8c867a] mt-0.5">License #1084920 (C-20, C-10, C-36)</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#282d3e] text-[#a8a296] font-mono uppercase text-[10px]">
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium text-center">Qty</th>
                      <th className="pb-2 font-medium text-right">Unit Rate</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2230]">
                    {items.map((item, i) => (
                      <tr key={i} className="py-2.5">
                        <td className="py-2.5 text-[#f4efe6] font-medium pr-2">{item.description}</td>
                        <td className="py-2.5 text-center font-mono text-[#a8a296]">{item.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-[#a8a296]">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-[#f4efe6]">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-[#262b3c] flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-[#a8a296]">
                    <span>Subtotal</span>
                    <span className="font-mono text-[#f4efe6]">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Contractor Discount</span>
                      <span className="font-mono">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#a8a296]">
                    <span>Sales / Trade Tax ({taxRate}%)</span>
                    <span className="font-mono text-[#f4efe6]">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#282d3e] text-sm font-bold">
                    <span className="text-[#f4efe6]">Total Proposed</span>
                    <span className="font-mono text-[#d4af37] text-base">
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Authorization */}
              <div className="pt-4 border-t border-[#262b3c] space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c867a] block">
                    Terms & Conditions
                  </span>
                  <p className="text-[11px] text-[#a8a296] mt-0.5 leading-relaxed">{notes}</p>
                </div>

                <div className="pt-4 border-t border-dashed border-[#282d3e] grid grid-cols-2 gap-4 text-[11px] text-[#8c867a]">
                  <div>
                    <div className="h-10 border-b border-[#3b4154]" />
                    <span className="block mt-1">Authorized Contractor Representative</span>
                  </div>
                  <div>
                    <div className="h-10 border-b border-[#3b4154]" />
                    <span className="block mt-1">Customer Acceptance & Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 4, Section 8: AI Assist Preview & Decision Modal */}
      {aiAssistModal && (
        <div className="fixed inset-0 z-50 bg-[#07080b]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#12141c] border border-[#282e42] rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#212638]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#f4efe6]">AI Quote Scope Assist</h4>
                  <p className="text-[11px] text-[#8c867a]">
                    Transform rough technician notes into commercial customer-facing scope
                  </p>
                </div>
              </div>
              <button
                onClick={handleRejectAiSuggestion}
                className="p-1 text-[#8c867a] hover:text-[#f4efe6] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original Input Display */}
            <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#202536] text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c867a] block mb-1">
                Technician Rough Notes
              </span>
              <input
                type="text"
                value={aiAssistModal.originalNotes}
                onChange={(e) =>
                  setAiAssistModal({ ...aiAssistModal, originalNotes: e.target.value })
                }
                placeholder="e.g. replaced blower motor, cleaned coils, tested pressure"
                className="w-full bg-transparent text-[#cfc8bc] focus:outline-none border-b border-transparent focus:border-[#d4af37]"
              />
            </div>

            {isAiAssisting ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#d4af37] mx-auto" />
                <div className="text-xs text-[#cfc8bc] font-medium">
                  Generating professional trade description with Gemini...
                </div>
              </div>
            ) : aiAssistError ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{aiAssistError}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d4af37] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Proposed Customer-Facing Scope (Editable)
                  </span>
                  <span className="text-[10px] text-[#8c867a]">User can edit before accepting</span>
                </div>
                <textarea
                  rows={5}
                  value={aiAssistModal.suggestion}
                  onChange={(e) =>
                    setAiAssistModal({ ...aiAssistModal, suggestion: e.target.value })
                  }
                  className="w-full bg-[#0b0c10] border border-[#2c3349] focus:border-[#d4af37] rounded-xl p-3 text-xs text-[#f4efe6] focus:outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Actions: Accept, Edit (in-place), Reject (Section 8) */}
            <div className="flex items-center justify-between pt-2 border-t border-[#212638]">
              <button
                type="button"
                onClick={handleRejectAiSuggestion}
                className="px-3.5 py-1.5 rounded-lg bg-[#181b26] hover:bg-[#222736] text-xs text-[#cfc8bc] transition"
              >
                Reject / Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isAiAssisting}
                  onClick={() =>
                    handleOpenAiAssist(aiAssistModal.targetType, aiAssistModal.itemId)
                  }
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#1e2332] hover:bg-[#282f42] text-xs text-[#cfc8bc] border border-[#2e3549] transition"
                >
                  <RotateCcw className="w-3 h-3 text-[#8c867a]" />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  disabled={isAiAssisting || !aiAssistModal.suggestion}
                  onClick={handleAcceptAiSuggestion}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] hover:to-[#cda535] text-[#0b0c10] font-bold text-xs shadow-md transition disabled:opacity-50 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
