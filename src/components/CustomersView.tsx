import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileText,
  Wrench,
  User,
  X,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Customer } from '../types/database';

export const CustomersView: React.FC = () => {
  const { customers, quotes, jobs, addCustomer } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    await addCustomer({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim() || 'San Francisco, CA',
    });

    toast.success('Customer profile added.', `${fullName.trim()} has been registered in the directory.`);
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#212534]">
        <div>
          <h1 className="text-xl font-bold text-[#f4efe6] tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#d4af37]" />
            Customer Directory
          </h1>
          <p className="text-xs text-[#a8a296] mt-0.5">
            Client accounts, service addresses, quotation histories, and work order records.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89327] hover:from-[#e5c068] text-[#0b0c10] font-bold text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[#12141c] border border-[#242838]">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#8c867a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, phone, email..."
            className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f4efe6] placeholder-[#646056] focus:border-[#d4af37] focus:outline-none"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12141c] border border-[#242838] space-y-3">
          <Briefcase className="w-8 h-8 text-[#787265] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[#f4efe6]">No customer accounts found</h3>
          <p className="text-xs text-[#a8a296] max-w-sm mx-auto">
            {searchTerm ? `No customer records match "${searchTerm}".` : 'No customers registered yet. Click "New Customer" to register your first client account.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#d4af37] text-[#0b0c10] font-bold text-xs shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Customer Account</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const custQuotes = quotes.filter((q) => q.customer_id === cust.id);
            const custJobs = jobs.filter((j) => j.customer_id === cust.id);

            return (
              <div
                key={cust.id}
                className="p-5 rounded-2xl bg-[#12141c] border border-[#242838] hover:border-[#2e344a] transition space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#181b26] border border-[#2a2f42] flex items-center justify-center text-[#d4af37] font-bold text-sm">
                    {cust.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#f4efe6]">{cust.full_name}</h3>
                    <div className="text-[11px] text-[#8c867a] font-mono">ID: {cust.id}</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[#cfc8bc] pt-2 border-t border-[#1e2230]">
                  <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2 text-[#787265]" />
                    <span>{cust.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2 text-[#787265]" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-3.5 h-3.5 mr-2 mt-0.5 text-[#787265] flex-shrink-0" />
                    <span className="truncate">{cust.address || 'Address on file'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2230] flex items-center justify-between text-[11px] text-[#8c867a]">
                  <span>{custQuotes.length} Quotation(s)</span>
                  <span>{custJobs.length} Work Order(s)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add customer modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#07080b]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12141c] border border-[#282d3e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#212534]">
              <h3 className="text-sm font-semibold text-[#f4efe6]">Add Customer Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#8c867a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a8a296] mb-1">Full Name / Property Entity</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
                />
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
                />
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0b0c10] border border-[#282d3e] rounded-lg p-2 text-[#f4efe6]"
                />
              </div>

              <div>
                <label className="block text-[#a8a296] mb-1">Job Site Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
