import React, { useState } from 'react';
import {
  X,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { ServiceItem } from '../types/database';

interface BusinessOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TRADE_PRESETS: {
  [trade: string]: {
    name: string;
    icon: string;
    services: Array<{ name: string; description: string; base_price: number; duration_minutes: number }>;
  };
} = {
  hvac: {
    name: 'HVAC & Climate Control',
    icon: '❄️',
    services: [
      { name: 'Seasonal HVAC Maintenance & Tune-Up', description: '28-point diagnostic, coil cleaning, electrical terminal check & refrigerant pressure test', base_price: 189.0, duration_minutes: 90 },
      { name: 'Central AC Compressor Diagnostic & Repair', description: 'Electrical and mechanical check, capacitor and relay testing with system refrigerant check', base_price: 245.0, duration_minutes: 120 },
      { name: 'Smart Thermostat Installation & Calibration', description: 'Mounting, 24V C-wire hookup, Wi-Fi pairing and zone balance setup', base_price: 165.0, duration_minutes: 60 },
      { name: 'Full Duct Inspection & Airflow Balancing', description: 'Airflow velocity measurement, leak inspection and register balancing', base_price: 320.0, duration_minutes: 150 },
    ],
  },
  plumbing: {
    name: 'Plumbing & Pipe Services',
    icon: '🔧',
    services: [
      { name: 'Tankless Water Heater Descale & Service', description: 'Acid flush descaling, heat exchanger cleanout, and pressure relief valve inspection', base_price: 260.0, duration_minutes: 120 },
      { name: 'Main Line Camera Inspection & Snake', description: 'High-definition video sewer camera snake and blockage diagnostics', base_price: 295.0, duration_minutes: 90 },
      { name: 'Whole-Home Water Pressure Regulator Replacement', description: 'Brass pressure regulating valve replacement and street pressure test', base_price: 380.0, duration_minutes: 120 },
      { name: 'Fixture Leak Isolation & Seal Replacement', description: 'Faucet, valve stem, and under-sink trap rebuild and leak testing', base_price: 175.0, duration_minutes: 60 },
    ],
  },
  electrical: {
    name: 'Electrical Contracting',
    icon: '⚡',
    services: [
      { name: '200A Main Service Panel Upgrade', description: 'Complete panel replacement, whole-home surge protector, grounding rods and permit check', base_price: 2400.0, duration_minutes: 360 },
      { name: 'Level 2 EV Charger Dedicated Circuit Installation', description: '50-amp 240V dedicated run with NEMA 14-50 receptacle and breaker', base_price: 850.0, duration_minutes: 180 },
      { name: 'Whole-House Recessed LED Conversion (10 pack)', description: 'IC-rated airtight recessed cans with Lutron smart dimmer switch', base_price: 650.0, duration_minutes: 240 },
      { name: 'Commercial Safety & Code Compliance Audit', description: 'Thermal camera breaker scan, arc fault verification, and emergency lighting test', base_price: 350.0, duration_minutes: 120 },
    ],
  },
  handyman: {
    name: 'General Contracting & Handyman',
    icon: '🔨',
    services: [
      { name: 'Drywall Repair, Patching & Texture Match', description: 'Hole patching, tape, skim coat, texture matching, and prime coat', base_price: 210.0, duration_minutes: 90 },
      { name: 'Exterior Door Weatherproofing & Hardware Set', description: 'Threshold realignment, deadbolt installation, and acoustic weather stripping', base_price: 195.0, duration_minutes: 75 },
      { name: 'Gutter Guard Installation & Downspout Flush', description: 'Micro-mesh aluminum gutter covers and downspout high-pressure flush', base_price: 450.0, duration_minutes: 180 },
    ],
  },
};

export const BusinessOnboardingModal: React.FC<BusinessOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { business, addService } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTrade, setSelectedTrade] = useState<string>('hvac');
  const [companyName, setCompanyName] = useState('Summit Trade Pros LLC');
  const [phone, setPhone] = useState('(555) 392-8810');
  const [city, setCity] = useState('Austin, TX');
  const [address, setAddress] = useState('1400 Industrial Parkway, Suite 200');
  const [selectedServices, setSelectedServices] = useState<number[]>([0, 1, 2]);

  if (!isOpen) return null;

  const currentTradeData = TRADE_PRESETS[selectedTrade] || TRADE_PRESETS.hvac;

  const toggleService = (idx: number) => {
    setSelectedServices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleFinishOnboarding = () => {
    // Add selected services to catalog
    selectedServices.forEach((idx) => {
      const s = currentTradeData.services[idx];
      if (s) {
        addService({
          name: s.name,
          description: s.description,
          base_price: s.base_price,
          duration_minutes: s.duration_minutes,
          is_active: true,
        });
      }
    });

    if (onComplete) onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c10]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#12141d] border border-[#262c3e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#222738] flex items-center justify-between bg-[#0e1017]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c1f2b] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f4efe6]">
                Contractor Onboarding Wizard
              </h2>
              <p className="text-[11px] text-[#a8a296]">
                Step {step} of 2: {step === 1 ? 'Trade Category & Business Profile' : 'Starter Service Catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181c28] text-[#a8a296] hover:text-[#f4efe6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-2 h-1 bg-[#1a1d28]">
          <div className="bg-[#d4af37]" />
          <div className={step === 2 ? 'bg-[#d4af37]' : 'bg-[#1a1d28]'} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#cfc8bc]">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[#a8a296] font-medium mb-1.5">
                  Select Your Primary Trade Sector
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TRADE_PRESETS).map(([key, item]) => {
                    const isSelected = selectedTrade === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTrade(key)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#f3e5ab]'
                            : 'bg-[#0b0c10] border-[#222738] text-[#8c867a] hover:bg-[#161924]'
                        }`}
                      >
                        <span className="text-xl block mb-1">{item.icon}</span>
                        <div className="font-semibold text-[11px] leading-tight text-[#f4efe6]">
                          {item.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[#a8a296] font-medium mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a8a296] font-medium mb-1">Dispatch Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a8a296] font-medium mb-1">Service City & Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a8a296] font-medium mb-1">Office / Yard Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0c10] border border-[#262c3e] rounded-xl text-[#f4efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#f4efe6] text-sm">
                  Recommended Service Packages for {currentTradeData.name}
                </h3>
                <p className="text-[#a8a296] text-xs mt-0.5">
                  Select the services you offer to seed your pricing book. You can modify rates anytime.
                </p>
              </div>

              <div className="space-y-2">
                {currentTradeData.services.map((srv, idx) => {
                  const isChecked = selectedServices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleService(idx)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#171a25] border-[#d4af37]/50 text-[#f4efe6]'
                          : 'bg-[#0b0c10] border-[#222738] text-[#8c867a]'
                      }`}
                    >
                      <div className="flex items-start space-x-3 pr-4">
                        <div
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 ${
                            isChecked
                              ? 'bg-[#d4af37] border-[#d4af37] text-[#0b0c10]'
                              : 'border-[#33384c]'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#f4efe6]">{srv.name}</div>
                          <p className="text-[11px] text-[#a8a296] line-clamp-1">{srv.description}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-[#f3e5ab] text-xs">
                          ${srv.base_price.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#8c867a]">{srv.duration_minutes} min</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222738] bg-[#0e1017] flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#181c28] hover:bg-[#202536] text-xs text-[#cfc8bc] border border-[#2a3042] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b0c10] font-bold text-xs hover:brightness-110 active:scale-95 transition"
            >
              <span>Continue to Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c29d2b] text-[#0b0c10] font-bold text-xs hover:brightness-110 active:scale-95 transition shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Setup & Launch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
