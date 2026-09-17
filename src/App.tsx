import React, { useState, useEffect } from 'react';
import { AppStoreProvider, useAppStore } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { Navigation, DesktopSidebar } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { QuotesView } from './components/QuotesView';
import { QuoteBuilder } from './components/QuoteBuilder';
import { JobsView } from './components/JobsView';
import { InvoicesView } from './components/InvoicesView';
import { CustomersView } from './components/CustomersView';
import { ServicesView } from './components/ServicesView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TechnicianView } from './components/TechnicianView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { PublicLandingView } from './components/PublicLandingView';
import { AiLeadAssistModal } from './components/AiLeadAssistModal';
import { LeadDetailModal } from './components/LeadDetailModal';
import { JobDetailModal } from './components/JobDetailModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { AuthModal } from './components/AuthModal';
import { AuthView } from './components/AuthView';
import { BusinessOnboardingModal } from './components/BusinessOnboardingModal';

function MainAppContent() {
  const { currentProfile, quotes, convertQuoteToJob, syncAuthProfile } = useAppStore();
  const {
    user,
    profile,
    loading: authLoading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isOnboardingOpen,
    setIsOnboardingOpen,
  } = useAuth();

  // Tab State
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (currentProfile.role === 'customer') return 'customer-portal';
    if (currentProfile.role === 'technician') return 'technician-jobs';
    return 'admin-dashboard';
  });

  // Keep app store profile in sync with authenticated Supabase user profile
  useEffect(() => {
    if (profile) {
      syncAuthProfile(profile);
    }
  }, [profile, syncAuthProfile]);

  // Modal & Builder States
  const [isAiAssistOpen, setIsAiAssistOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Quote Builder State
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [leadIdToConvert, setLeadIdToConvert] = useState<string | null>(null);

  const handleOpenAiAssist = () => {
    setIsAiAssistOpen(true);
  };

  const handleOpenQuoteBuilder = (quoteId?: string) => {
    setActiveQuoteId(quoteId || null);
    setLeadIdToConvert(null);
    setIsQuoteBuilderOpen(true);
    setCurrentTab('admin-quotes');
  };

  const handleCreateQuoteFromLead = (leadId: string) => {
    setActiveQuoteId(null);
    setLeadIdToConvert(leadId);
    setIsQuoteBuilderOpen(true);
    setCurrentTab('admin-quotes');
  };

  const handleConvertQuoteToJob = (quoteId: string) => {
    const job = convertQuoteToJob(quoteId);
    setSelectedJobId(job.id);
    setCurrentTab(currentProfile.role === 'technician' ? 'technician-jobs' : 'admin-jobs');
  };

  const activeQuote = activeQuoteId ? quotes.find((q) => q.id === activeQuoteId) || null : null;

  // Session persistence restoration loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center text-[#f4efe6]">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7322] flex items-center justify-center font-bold text-[#0b0c10] text-lg shadow-xl mb-4 animate-pulse">
          LQ
        </div>
        <h2 className="text-base font-semibold text-[#f4efe6]">LeadToQuote</h2>
        <p className="text-xs text-[#a8a296] mt-1">Verifying secure session...</p>
      </div>
    );
  }

  // REQUIREMENT 7: Protect application routes so unauthenticated users cannot access the dashboard.
  // When unauthenticated, only public-landing is viewable; all dashboard routes redirect to AuthView.
  if (!user && currentTab !== 'public-landing') {
    return (
      <AuthView
        onNavigateToPublicLanding={() => setCurrentTab('public-landing')}
        onAuthenticated={() => {
          if (profile?.role === 'customer') setCurrentTab('customer-portal');
          else if (profile?.role === 'technician') setCurrentTab('technician-jobs');
          else setCurrentTab('admin-dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f4efe6] flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-[#f4efe6]">
      {/* Top Header with Role Switcher & Notifications */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setIsQuoteBuilderOpen(false);
          setCurrentTab(tab);
        }}
        openAiAssist={handleOpenAiAssist}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        {currentTab !== 'public-landing' && (
          <DesktopSidebar
            currentTab={currentTab}
            setCurrentTab={(tab) => {
              setIsQuoteBuilderOpen(false);
              setCurrentTab(tab);
            }}
            openAiAssist={handleOpenAiAssist}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* If in quote builder mode on quotes tab */}
            {isQuoteBuilderOpen && (currentTab === 'admin-quotes' || currentTab === 'customer-quotes') ? (
              <QuoteBuilder
                existingQuote={activeQuote}
                leadIdToConvert={leadIdToConvert}
                onClose={() => setIsQuoteBuilderOpen(false)}
                onSaved={(savedQuoteId) => {
                  setIsQuoteBuilderOpen(false);
                  setActiveQuoteId(savedQuoteId);
                }}
              />
            ) : (
              <>
                {/* Admin Views */}
                {currentTab === 'admin-dashboard' && (
                  <DashboardView
                    onNavigateTab={setCurrentTab}
                    onOpenAiAssist={handleOpenAiAssist}
                    onOpenQuoteBuilder={() => handleOpenQuoteBuilder()}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                    onSelectJob={(id) => setSelectedJobId(id)}
                    onSelectInvoice={(id) => setSelectedInvoiceId(id)}
                  />
                )}

                {currentTab === 'admin-leads' && (
                  <LeadsView
                    onOpenAiAssist={handleOpenAiAssist}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                    onCreateQuoteFromLead={handleCreateQuoteFromLead}
                  />
                )}

                {currentTab === 'admin-quotes' && (
                  <QuotesView
                    onOpenQuoteBuilder={handleOpenQuoteBuilder}
                    onConvertQuoteToJob={handleConvertQuoteToJob}
                  />
                )}

                {currentTab === 'admin-jobs' && (
                  <JobsView
                    onSelectJob={(id) => setSelectedJobId(id)}
                    onGenerateInvoice={(id) => setSelectedInvoiceId(id)}
                    onViewInvoice={(id) => setSelectedInvoiceId(id)}
                  />
                )}

                {currentTab === 'admin-invoices' && (
                  <InvoicesView onSelectInvoice={(id) => setSelectedInvoiceId(id)} />
                )}

                {currentTab === 'admin-customers' && <CustomersView />}

                {currentTab === 'admin-services' && <ServicesView />}

                {currentTab === 'admin-analytics' && <AnalyticsView />}

                {currentTab === 'admin-settings' && <SettingsView />}

                {/* Technician Views */}
                {(currentTab === 'technician-jobs' || currentTab === 'technician') && (
                  <TechnicianView onSelectJob={(id) => setSelectedJobId(id)} />
                )}

                {currentTab === 'technician-leads' && (
                  <LeadsView
                    onOpenAiAssist={handleOpenAiAssist}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                    onCreateQuoteFromLead={handleCreateQuoteFromLead}
                  />
                )}

                {/* Customer Portal Views */}
                {(currentTab === 'customer-portal' ||
                  currentTab === 'customer-requests' ||
                  currentTab === 'customer-quotes' ||
                  currentTab === 'customer-jobs' ||
                  currentTab === 'customer-invoices') && (
                  <CustomerPortalView
                    onOpenAiAssist={handleOpenAiAssist}
                    onViewQuote={(quoteId) => handleOpenQuoteBuilder(quoteId)}
                    onViewInvoice={(invoiceId) => setSelectedInvoiceId(invoiceId)}
                  />
                )}

                {/* Public Commercial Landing View */}
                {currentTab === 'public-landing' && (
                  <PublicLandingView
                    onOpenAiAssist={handleOpenAiAssist}
                    onNavigateToPortal={() => {
                      if (!user) {
                        setIsAuthModalOpen(true);
                      } else {
                        setCurrentTab('customer-portal');
                      }
                    }}
                    onNavigateToAdmin={() => {
                      if (!user) {
                        setIsAuthModalOpen(true);
                      } else {
                        setCurrentTab('admin-dashboard');
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <AiLeadAssistModal
        isOpen={isAiAssistOpen}
        onClose={() => setIsAiAssistOpen(false)}
        onLeadCreated={(newLeadId) => {
          setSelectedLeadId(newLeadId);
          setCurrentTab(currentProfile.role === 'customer' ? 'customer-portal' : 'admin-leads');
        }}
      />

      <LeadDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onCreateQuote={(leadId) => {
          setSelectedLeadId(null);
          handleCreateQuoteFromLead(leadId);
        }}
        onViewQuote={(quoteId) => {
          setSelectedLeadId(null);
          handleOpenQuoteBuilder(quoteId);
        }}
        onViewJob={(jobId) => {
          setSelectedLeadId(null);
          setSelectedJobId(jobId);
        }}
      />

      <JobDetailModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
        onGenerateInvoice={(invoiceId) => {
          setSelectedJobId(null);
          setSelectedInvoiceId(invoiceId);
        }}
        onViewInvoice={(invoiceId) => {
          setSelectedJobId(null);
          setSelectedInvoiceId(invoiceId);
        }}
      />

      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />

      {/* Auth & Onboarding Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          if (profile?.role === 'customer') setCurrentTab('customer-portal');
          else if (profile?.role === 'technician') setCurrentTab('technician-jobs');
          else setCurrentTab('admin-dashboard');
        }}
        onOwnerOnboardingRequested={() => setIsOnboardingOpen(true)}
      />

      <BusinessOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => setCurrentTab('admin-services')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppStoreProvider>
        <ToastProvider>
          <MainAppContent />
        </ToastProvider>
      </AppStoreProvider>
    </AuthProvider>
  );
}
