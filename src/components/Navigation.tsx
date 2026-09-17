import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  Bell,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Shield,
  UserCheck,
  Briefcase,
  Layers,
  Database,
  PhoneCall,
  Clock,
  LogOut,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { UserRole } from '../types/database';
import { SupabaseStatusBadge } from './common/SupabaseStatusBadge';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAiAssist: () => void;
  onOpenAuth?: () => void;
  onOpenOnboarding?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  openAiAssist,
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const {
    business,
    profiles,
    currentProfile,
    switchProfile,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppStore();

  const { user, profile, signOut, selectDemoPersona } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter navigation items by active user role
  const getNavItems = () => {
    if (currentProfile.role === 'customer') {
      return [
        { id: 'customer-portal', label: 'Client Portal', icon: LayoutDashboard },
        { id: 'customer-requests', label: 'My Inquiries', icon: PhoneCall },
        { id: 'customer-quotes', label: 'Quotations', icon: FileText },
        { id: 'customer-jobs', label: 'Active Jobs', icon: Wrench },
        { id: 'customer-invoices', label: 'Invoices & Pay', icon: Receipt },
        { id: 'public-landing', label: 'Public Services Page', icon: ExternalLink },
      ];
    }

    if (currentProfile.role === 'technician') {
      return [
        { id: 'technician-jobs', label: 'Assigned Work Orders', icon: Wrench },
        { id: 'technician-leads', label: 'Site Inquiries', icon: Users },
        { id: 'customer-portal', label: 'Customer View Preview', icon: ExternalLink },
        { id: 'public-landing', label: 'Public Site', icon: ExternalLink },
      ];
    }

    // Owner / Staff
    return [
      { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin-leads', label: 'Leads & Inquiries', icon: Users },
      { id: 'admin-quotes', label: 'Quote Builder', icon: FileText },
      { id: 'admin-jobs', label: 'Jobs & Dispatch', icon: Wrench },
      { id: 'admin-invoices', label: 'Invoices & Payments', icon: Receipt },
      { id: 'admin-customers', label: 'Customers', icon: Briefcase },
      { id: 'admin-services', label: 'Services Catalog', icon: Layers },
      { id: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'admin-settings', label: 'Settings & Supabase', icon: Settings },
      { id: 'public-landing', label: 'Public Customer Site', icon: ExternalLink },
    ];
  };

  const navItems = getNavItems();

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  const myNotifications = notifications.filter(
    (n) => n.user_id === currentProfile.id || currentProfile.role === 'owner'
  );

  return (
    <>
      {/* Top Banner: Role Switcher & Status Bar */}
      <header className="sticky top-0 z-40 bg-[#0e1017]/95 backdrop-blur border-b border-[#222634] px-4 sm:px-6 py-2.5 flex items-center justify-between text-sm">
        {/* Mobile menu button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#181b24] text-[#f4efe6] border border-[#2a2f40] hover:bg-[#202430]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center font-bold text-[#0b0c10] text-xs shadow-md">
              LQ
            </div>
            <span className="font-semibold text-base tracking-tight text-[#f4efe6] hidden sm:inline">
              LeadToQuote
            </span>
            <span className="text-xs text-[#a8a296] hidden md:inline border-l border-[#2e3344] pl-2 font-mono">
              v1.0 • SaaS
            </span>
          </div>
        </div>

        {/* Center: AI Lead Assist Shortcut & DB Status */}
        <div className="flex items-center space-x-2.5">
          <SupabaseStatusBadge />

          <button
            onClick={openAiAssist}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37]/15 to-[#e5c068]/10 hover:from-[#d4af37]/25 hover:to-[#e5c068]/20 text-[#f3e5ab] border border-[#d4af37]/40 transition text-xs font-medium shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] animate-pulse" />
            <span>AI Lead Assist</span>
          </button>
        </div>

        {/* Right: Role Switcher Pill + Notifications */}
        <div className="flex items-center space-x-3">
          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setRoleDropdownOpen(false);
              }}
              className="relative p-2 rounded-lg bg-[#151720] text-[#cfc8bc] hover:text-[#f4efe6] border border-[#262b3a] hover:bg-[#1e2230] transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d4af37] text-[#0b0c10] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#14161f] border border-[#282d3e] shadow-2xl p-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-[#252a3a]">
                  <div className="flex items-center space-x-1.5">
                    <Bell className="w-4 h-4 text-[#d4af37]" />
                    <span className="font-semibold text-xs text-[#f4efe6]">Notifications</span>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-[#d4af37] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {myNotifications.length === 0 ? (
                    <p className="text-xs text-[#8c867a] py-4 text-center">No notifications yet</p>
                  ) : (
                    myNotifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          n.is_read
                            ? 'bg-[#11131a] border-[#222634] text-[#a8a296]'
                            : 'bg-[#1a1d27] border-[#d4af37]/30 text-[#f4efe6]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-[#f3e5ab]">{n.title}</span>
                          <span className="text-[10px] text-[#787265] flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#cfc8bc] line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authentication & Persona Menu */}
          {!user ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#161822] hover:bg-[#1f2230] border border-[#2b3042] text-xs font-semibold text-[#f4efe6] transition"
              >
                <LogIn className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Sign In</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b89528] text-[#0b0c10] font-bold text-xs shadow-sm hover:brightness-110 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#161822] hover:bg-[#1f2230] border border-[#2b3042] text-xs font-medium text-[#f4efe6] transition"
              >
                <img
                  src={profile?.avatar_url || currentProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                  alt={profile?.full_name || currentProfile.full_name}
                  className="w-5 h-5 rounded-full object-cover border border-[#d4af37]/40"
                />
                <div className="text-left hidden sm:block leading-tight">
                  <span className="font-semibold block truncate max-w-[110px]">
                    {profile?.full_name || currentProfile.full_name}
                  </span>
                  <span className="text-[10px] text-[#d4af37] uppercase tracking-wider font-mono">
                    {profile?.role || currentProfile.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#a8a296]" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#14161f] border border-[#2a2f42] shadow-2xl p-2 z-50 text-left">
                  <div className="px-2 py-1.5 border-b border-[#232737] mb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                        Instant Persona Switcher
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Demo
                      </span>
                    </div>
                    <p className="text-[10px] text-[#a8a296] mt-0.5">
                      Switch between roles to evaluate dashboards.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {profiles.map((p) => {
                      const isSelected = p.id === (profile?.id || currentProfile.id);
                      const roleLabel =
                        p.role === 'owner'
                          ? 'Business Owner (Admin)'
                          : p.role === 'admin'
                          ? 'Administrator'
                          : p.role === 'technician'
                          ? 'Field Tech (Work Orders)'
                          : 'Client / Customer';

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            selectDemoPersona(p.role);
                            switchProfile(p.id);
                            setRoleDropdownOpen(false);
                            if (p.role === 'customer') setCurrentTab('customer-portal');
                            else if (p.role === 'technician') setCurrentTab('technician-jobs');
                            else setCurrentTab('admin-dashboard');
                          }}
                          className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs transition ${
                            isSelected
                              ? 'bg-[#d4af37]/15 text-[#f3e5ab] border border-[#d4af37]/40'
                              : 'hover:bg-[#1c1f2b] text-[#cfc8bc]'
                          }`}
                        >
                          <img
                            src={p.avatar_url}
                            alt={p.full_name}
                            className="w-7 h-7 rounded-full object-cover border border-[#2b3042]"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-semibold text-[#f4efe6] truncate">{p.full_name}</div>
                            <div className="text-[10px] text-[#a8a296]">{roleLabel}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-[#232737] space-y-1">
                    {onOpenAuth && (
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-[#cfc8bc] hover:bg-[#1e2230] hover:text-[#f4efe6] transition"
                      >
                        <LogIn className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Switch User / New Login</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        setRoleDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400/80 hover:bg-red-950/20 hover:text-red-300 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0b0c10]/80 backdrop-blur-sm flex">
          <div className="w-72 bg-[#12141c] border-r border-[#242838] h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#202434]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-md bg-[#d4af37] text-[#0b0c10] flex items-center justify-center font-bold text-xs">
                    LQ
                  </div>
                  <span className="font-bold text-[#f4efe6]">LeadToQuote</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded bg-[#181b24] text-[#a8a296]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 text-xs font-semibold text-[#8c867a] uppercase tracking-wider px-2">
                {currentProfile.role === 'owner'
                  ? 'Commercial Suite'
                  : currentProfile.role === 'technician'
                  ? 'Technician Workspace'
                  : 'Customer Portal'}
              </div>

              <nav className="mt-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition ${
                        isActive
                          ? 'bg-[#d4af37]/15 text-[#f3e5ab] font-medium border border-[#d4af37]/30'
                          : 'text-[#cfc8bc] hover:bg-[#181b24]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-[#8c867a]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#202434]">
              <div className="text-[11px] text-[#8c867a]">
                Logged in as <span className="text-[#f4efe6] font-semibold">{currentProfile.full_name}</span> ({currentProfile.role})
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar (Rendered by parent wrapper) */}
    </>
  );
};

export const DesktopSidebar: React.FC<{
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAiAssist: () => void;
}> = ({ currentTab, setCurrentTab, openAiAssist }) => {
  const { business, currentProfile } = useAppStore();

  const getNavItems = () => {
    if (currentProfile.role === 'customer') {
      return [
        { id: 'customer-portal', label: 'Client Portal', icon: LayoutDashboard },
        { id: 'customer-requests', label: 'My Inquiries', icon: PhoneCall },
        { id: 'customer-quotes', label: 'Quotations', icon: FileText },
        { id: 'customer-jobs', label: 'Active Jobs', icon: Wrench },
        { id: 'customer-invoices', label: 'Invoices & Pay', icon: Receipt },
        { id: 'public-landing', label: 'Public Services Page', icon: ExternalLink },
      ];
    }

    if (currentProfile.role === 'technician') {
      return [
        { id: 'technician-jobs', label: 'My Work Orders', icon: Wrench },
        { id: 'technician-leads', label: 'Site Inquiries', icon: Users },
        { id: 'customer-portal', label: 'Customer View Preview', icon: ExternalLink },
        { id: 'public-landing', label: 'Public Site', icon: ExternalLink },
      ];
    }

    // Owner / Staff
    return [
      { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin-leads', label: 'Leads & Inquiries', icon: Users },
      { id: 'admin-quotes', label: 'Quote Builder', icon: FileText },
      { id: 'admin-jobs', label: 'Jobs & Dispatch', icon: Wrench },
      { id: 'admin-invoices', label: 'Invoices & Payments', icon: Receipt },
      { id: 'admin-customers', label: 'Customers', icon: Briefcase },
      { id: 'admin-services', label: 'Services Catalog', icon: Layers },
      { id: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'admin-settings', label: 'Settings & Supabase', icon: Settings },
      { id: 'public-landing', label: 'Public Customer Site', icon: ExternalLink },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0f1118] border-r border-[#202434] p-4 flex-shrink-0 min-h-[calc(100vh-53px)] justify-between">
      <div>
        {/* Business Badge */}
        <div className="p-3 rounded-xl bg-[#141722] border border-[#252a3c] mb-5">
          <div className="text-[10px] text-[#d4af37] font-mono uppercase tracking-wider font-semibold">
            Licensed Service Contractor
          </div>
          <div className="font-semibold text-sm text-[#f4efe6] truncate mt-0.5">{business.name}</div>
          <div className="text-[11px] text-[#8c867a] truncate mt-0.5">{business.city}</div>
        </div>

        {/* Navigation items */}
        <div className="text-[11px] font-semibold text-[#8c867a] uppercase tracking-wider px-2 mb-2">
          {currentProfile.role === 'owner'
            ? 'Commercial Operations'
            : currentProfile.role === 'technician'
            ? 'Technician Console'
            : 'Client Portal'}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#d4af37]/15 text-[#f3e5ab] border border-[#d4af37]/40 shadow-sm'
                    : 'text-[#cfc8bc] hover:bg-[#161924] hover:text-[#f4efe6]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-[#8c867a]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom AI Trigger Widget */}
      <div className="pt-4 border-t border-[#1f2333] mt-6">
        <button
          onClick={openAiAssist}
          className="w-full p-3 rounded-xl bg-gradient-to-b from-[#181b26] to-[#12141d] border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37] font-semibold flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-[#d4af37]" />
              AI Lead Assist
            </span>
            <span className="text-[10px] bg-[#d4af37]/20 text-[#f3e5ab] px-1.5 py-0.5 rounded font-mono">
              Gemini
            </span>
          </div>
          <p className="text-xs text-[#cfc8bc] mt-1 line-clamp-2">
            Paste natural inquiry text to auto-extract structured services & line items.
          </p>
        </button>

        <div className="mt-3 px-1 text-[11px] text-[#716c60] flex items-center justify-between font-mono">
          <span>Row Level Security (RLS)</span>
          <span className="text-emerald-400">ENFORCED</span>
        </div>
      </div>
    </aside>
  );
};
