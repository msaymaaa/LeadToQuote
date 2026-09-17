import React, { useState } from 'react';
import { Layers, Plus, Search, Zap, Flame, Droplets, X } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { ServiceItem } from '../types/database';

export const ServicesView: React.FC = () => {
  const { services, addService } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(500);
  const [unit, setUnit] = useState('job');
  const [category, setCategory] = useState<'hvac' | 'electrical' | 'plumbing' | 'general'>('hvac');

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addService({
      name: name.trim(),
      description: description.trim(),
      base_price: Number(basePrice) || 0,
      unit,
      category,
      is_active: true,
    });

    toast.success('Service rate created.', `${name.trim()} added to the catalog at $${Number(basePrice).toFixed(2)}.`);
    setName('');
    setDescription('');
    setBasePrice(500);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#d4af37]" />
            Trade Services Catalog & Pricing Sheet
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Standard scopes, base pricing rates, and category definitions used in quotes and AI matching.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] text-[#0b0c10] font-bold text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Rate</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[#12141c] border border-[#242838]">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#8c867a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog services..."
            className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f4efe6] placeholder-[#646056] focus:border-[#d4af37] focus:outline-none"
          />
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <Layers className="w-8 h-8 text-[#787265] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[#f4efe6]">No catalog services found</h3>
          <p className="text-xs text-[#a8a296] max-w-sm mx-auto">
            {searchTerm ? `No service items match "${searchTerm}".` : 'No services in catalog. Add your standard trade packages to populate quotes.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b0c10] font-bold text-xs shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Service Rate</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#2f354c] transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded">
                    {srv.category}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">Active</span>
                </div>

                <h3 className="font-semibold text-sm text-[#f4efe6] mt-2">{srv.name}</h3>
                <p className="text-xs text-[#a8a296] mt-1 leading-relaxed">{srv.description}</p>
              </div>

              <div className="pt-3 border-t border-[#1e2230] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8c867a] block">Base Rate</span>
                  <span className="text-base font-bold font-mono text-[#f3e5ab]">
                    ${srv.base_price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#8c867a] ml-1">/ {srv.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#07080b]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12141c] border border-[#282d3e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#212534]">
              <h3 className="text-sm font-semibold text-[#f4efe6]">Add Catalog Service Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#8c867a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a8a296] mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
                />
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
                >
                  <option value="hvac">HVAC & Heat Pumps</option>
                  <option value="electrical">Electrical & Controls</option>
                  <option value="plumbing">Plumbing & Boilers</option>
                  <option value="general">General Contracting</option>
                </select>
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Base Price ($)</label>
                <input
                  type="number"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#181b26] text-[#cfc8bc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89327] text-[#0b0c10] font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
