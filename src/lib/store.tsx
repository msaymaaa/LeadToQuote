import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Business,
  Profile,
  Customer,
  ServiceItem,
  Lead,
  Quote,
  QuoteItem,
  Job,
  JobUpdate,
  Invoice,
  InvoiceItem,
  Notification,
  UserRole,
  AiLeadExtracted,
} from '../types/database';
import {
  INITIAL_BUSINESS,
  INITIAL_PROFILES,
  INITIAL_SERVICES,
  INITIAL_CUSTOMERS,
  INITIAL_LEADS,
  INITIAL_QUOTES,
  INITIAL_JOBS,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATIONS,
} from './mockData';
import { databaseService, generateUuid } from './databaseService';

interface AppStoreContextType {
  business: Business;
  profiles: Profile[];
  currentProfile: Profile;
  switchProfile: (profileId: string) => void;
  syncAuthProfile: (authProfile: Profile | null) => void;
  customers: Customer[];
  services: ServiceItem[];
  leads: Lead[];
  quotes: Quote[];
  jobs: Job[];
  invoices: Invoice[];
  notifications: Notification[];
  unreadNotificationCount: number;
  isLiveSupabase: boolean;
  dbLoading: boolean;
  dbError: string | null;

  // Actions
  refreshFromDatabase: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  createCustomerRequest: (request: {
    customerId: string;
    serviceId?: string;
    title: string;
    description: string;
    location?: string;
    preferredDate?: string;
    priority?: Lead['priority'];
  }) => Lead;

  createQuote: (quote: Omit<Quote, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  sendQuote: (id: string) => void;
  approveQuote: (id: string) => void;
  requestQuoteChange: (id: string, note?: string) => void;
  declineQuote: (id: string, reason?: string) => void;

  convertQuoteToJob: (quoteId: string, assignedTo?: string, scheduledDate?: string, scheduledTime?: string) => Job;
  createJob: (job: Omit<Job, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  addJobUpdate: (jobId: string, status: string, note: string, photoUrl?: string) => void;

  createInvoice: (invoice: Omit<Invoice, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Invoice;
  generateInvoiceFromJob: (jobId: string) => Invoice | null;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  markInvoicePaid: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Customer;
  addService: (service: Omit<ServiceItem, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => ServiceItem;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  runAiLeadAssist: (inquiryText: string, options?: { simulateFailure?: boolean; simulateInvalid?: boolean }) => Promise<AiLeadExtracted>;
  generateAiLeadSummary: (leadId: string) => Promise<{ success: boolean; summary?: string; error?: string }>;
  saveAiLeadSummary: (leadId: string, summary: string) => void;
  generateAiQuoteDescription: (notes: string, serviceContext?: string) => Promise<{ success: boolean; description?: string; error?: string }>;
  getAiBusinessInsight: () => Promise<{ success: boolean; insight: string; isEmpty?: boolean; error?: string }>;
  resetToDefaults: () => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const STORAGE_KEY = 'leadtoquote_store_v1';

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLive = databaseService.isLive();
  const [dbLoading, setDbLoading] = useState<boolean>(isLive);
  const [dbError, setDbError] = useState<string | null>(null);

  // Initial State from Local Storage or fallback
  const [business, setBusiness] = useState<Business>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_business`);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_profiles`);
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_current_user`);
    return saved || 'p-david-owner';
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_services`);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_leads`);
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_quotes`);
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_jobs`);
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Fetch all data from live Supabase on mount
  const refreshFromDatabase = useCallback(async () => {
    if (!databaseService.isLive()) return;
    setDbLoading(true);
    setDbError(null);
    try {
      const res = await databaseService.fetchAllData();
      if (res.success && res.data) {
        const d = res.data;
        if (d.business) setBusiness(d.business);
        if (d.profiles.length > 0) setProfiles(d.profiles);
        if (d.customers.length > 0) setCustomers(d.customers);
        if (d.services.length > 0) setServices(d.services);
        if (d.leads.length > 0) setLeads(d.leads);
        if (d.quotes.length > 0) setQuotes(d.quotes);
        if (d.jobs.length > 0) setJobs(d.jobs);
        if (d.invoices.length > 0) setInvoices(d.invoices);
        if (d.notifications.length > 0) setNotifications(d.notifications);
      } else if (res.error) {
        setDbError(res.error);
      }
    } catch (e: any) {
      console.warn('refreshFromDatabase error:', e);
      setDbError(e.message || 'Database fetch error');
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLive) {
      refreshFromDatabase();
    }
  }, [isLive, refreshFromDatabase]);

  // Sync to local storage for instantaneous offline resilience
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_business`, JSON.stringify(business));
    localStorage.setItem(`${STORAGE_KEY}_profiles`, JSON.stringify(profiles));
    localStorage.setItem(`${STORAGE_KEY}_current_user`, currentProfileId);
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_KEY}_services`, JSON.stringify(services));
    localStorage.setItem(`${STORAGE_KEY}_leads`, JSON.stringify(leads));
    localStorage.setItem(`${STORAGE_KEY}_quotes`, JSON.stringify(quotes));
    localStorage.setItem(`${STORAGE_KEY}_jobs`, JSON.stringify(jobs));
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [business, profiles, currentProfileId, customers, services, leads, quotes, jobs, invoices, notifications]);

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0];

  const switchProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
  };

  const syncAuthProfile = useCallback((authProfile: Profile | null) => {
    if (!authProfile) return;
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === authProfile.id);
      if (exists) {
        return prev.map((p) => (p.id === authProfile.id ? { ...p, ...authProfile } : p));
      }
      return [authProfile, ...prev];
    });
    setCurrentProfileId(authProfile.id);
  }, []);

  const notifyUser = useCallback((userId: string, type: Notification['type'], title: string, message: string, relatedType?: Notification['related_type'], relatedId?: string) => {
    const newNotif: Notification = {
      id: generateUuid(),
      user_id: userId,
      type,
      title,
      message,
      related_type: relatedType,
      related_id: relatedId,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // LEADS
  const addLead = useCallback(
    (leadInput: Omit<Lead, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      const newLead: Lead = {
        ...leadInput,
        id: generateUuid(),
        business_id: business.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setLeads((prev) => [newLead, ...prev]);

      // Database sync
      if (databaseService.isLive()) {
        databaseService.insertLead(newLead).catch((err) => {
          console.error('Failed to sync lead to Supabase:', err);
        });
      }

      // Notify business owner
      const owner = profiles.find((p) => p.role === 'owner');
      if (owner) {
        notifyUser(
          owner.id,
          'lead',
          'New Service Inquiry Received',
          `${leadInput.title} (${leadInput.priority.toUpperCase()} priority)`,
          'lead',
          newLead.id
        );
      }
      return newLead;
    },
    [business.id, profiles, notifyUser]
  );

  const createCustomerRequest = useCallback(
    (req: {
      customerId: string;
      serviceId?: string;
      title: string;
      description: string;
      location?: string;
      preferredDate?: string;
      priority?: Lead['priority'];
    }) => {
      const newLead: Lead = {
        id: generateUuid(),
        business_id: business.id,
        customer_id: req.customerId,
        service_id: req.serviceId,
        title: req.title,
        description: req.description,
        status: 'new',
        priority: req.priority || 'medium',
        source: 'website',
        location: req.location,
        preferred_date: req.preferredDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setLeads((prev) => [newLead, ...prev]);

      if (databaseService.isLive()) {
        databaseService.insertLead(newLead).catch((err) => {
          console.error('Failed to sync customer request to Supabase:', err);
        });
      }

      // Notify owner of incoming customer inquiry
      const owner = profiles.find((p) => p.role === 'owner');
      if (owner) {
        notifyUser(
          owner.id,
          'lead',
          'Customer Service Request Submitted',
          `Client requested service: "${req.title}". Preferred date: ${req.preferredDate || 'Flexible'}`,
          'lead',
          newLead.id
        );
      }

      return newLead;
    },
    [business.id, profiles, notifyUser]
  );

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      )
    );

    if (databaseService.isLive()) {
      databaseService.updateLead(id, updates).catch((err) => {
        console.error('Failed to update lead in Supabase:', err);
      });
    }
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads((prev) => prev.filter((item) => item.id !== id));

    if (databaseService.isLive()) {
      databaseService.deleteLead(id).catch((err) => {
        console.error('Failed to delete lead in Supabase:', err);
      });
    }
  }, []);

  // QUOTES
  const createQuote = useCallback(
    (quoteInput: Omit<Quote, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      const quoteId = generateUuid();
      const quoteItems: QuoteItem[] = (quoteInput.items || []).map((it) => {
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
        const price = Math.max(0, Number(it.unit_price) || 0);
        return {
          ...it,
          id: it.id || generateUuid(),
          quote_id: quoteId,
          description: it.description?.trim() || 'Service Item',
          quantity: qty,
          unit_price: price,
          total: parseFloat((qty * price).toFixed(2)),
          created_at: new Date().toISOString(),
        };
      });

      const calculatedSubtotal = quoteItems.reduce((sum, it) => sum + it.total, 0);
      const safeDiscount = Math.max(0, Math.min(Number(quoteInput.discount) || 0, calculatedSubtotal));
      const taxable = Math.max(0, calculatedSubtotal - safeDiscount);
      const safeTax = Math.max(0, Number(quoteInput.tax) || 0);
      const calculatedTotal = parseFloat((taxable + safeTax).toFixed(2));

      const newQuote: Quote = {
        ...quoteInput,
        id: quoteId,
        business_id: business.id,
        subtotal: calculatedSubtotal,
        discount: safeDiscount,
        tax: safeTax,
        total: calculatedTotal,
        items: quoteItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setQuotes((prev) => [newQuote, ...prev]);

      // If tied to a lead, update lead status to 'quoted'
      if (quoteInput.lead_id) {
        updateLead(quoteInput.lead_id, { status: 'quoted' });
      }

      if (databaseService.isLive()) {
        databaseService.insertQuote(newQuote, quoteItems).catch((err) => {
          console.error('Failed to sync quote to Supabase:', err);
        });
      }

      return newQuote;
    },
    [business.id, updateLead]
  );

  const updateQuote = useCallback((id: string, updates: Partial<Quote>) => {
    setQuotes((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      )
    );

    if (databaseService.isLive()) {
      databaseService.updateQuote(id, updates).catch((err) => {
        console.error('Failed to update quote in Supabase:', err);
      });
    }
  }, []);

  const sendQuote = useCallback(
    (id: string) => {
      setQuotes((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const cust = customers.find((c) => c.id === item.customer_id);
            if (cust && cust.profile_id) {
              notifyUser(
                cust.profile_id,
                'quote',
                'Quotation Ready for Review',
                `${business.name} sent quote ${item.quote_number} for $${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
                'quote',
                item.id
              );
            }
            return { ...item, status: 'sent', updated_at: new Date().toISOString() };
          }
          return item;
        })
      );

      if (databaseService.isLive()) {
        databaseService.updateQuote(id, { status: 'sent' }).catch(console.error);
      }
    },
    [customers, business.name, notifyUser]
  );

  const approveQuote = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setQuotes((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = {
              ...item,
              status: 'approved' as const,
              approved_at: now,
              updated_at: now,
            };
            // Notify owner
            const owner = profiles.find((p) => p.role === 'owner');
            if (owner) {
              notifyUser(
                owner.id,
                'quote',
                'Quotation Approved by Client',
                `Quote ${item.quote_number} ($${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}) was approved. Ready to schedule job!`,
                'quote',
                item.id
              );
            }
            if (item.lead_id) {
              updateLead(item.lead_id, { status: 'converted' });
            }
            return updated;
          }
          return item;
        })
      );

      if (databaseService.isLive()) {
        databaseService.updateQuote(id, { status: 'approved', approved_at: now }).catch(console.error);
      }
    },
    [profiles, notifyUser, updateLead]
  );

  const requestQuoteChange = useCallback(
    (id: string, note?: string) => {
      setQuotes((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = {
              ...item,
              status: 'change_requested' as const,
              notes: note ? `${item.notes || ''}\n[Client Change Request]: ${note}` : item.notes,
              updated_at: new Date().toISOString(),
            };
            const owner = profiles.find((p) => p.role === 'owner');
            if (owner) {
              notifyUser(
                owner.id,
                'quote',
                'Client Requested Adjustments on Quote',
                `Client requested changes on quote ${item.quote_number}: "${note || 'Review line items'}"`,
                'quote',
                item.id
              );
            }
            return updated;
          }
          return item;
        })
      );

      if (databaseService.isLive()) {
        databaseService.updateQuote(id, { status: 'change_requested' }).catch(console.error);
      }
    },
    [profiles, notifyUser]
  );

  const declineQuote = useCallback(
    (id: string, reason?: string) => {
      setQuotes((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = {
              ...item,
              status: 'declined' as const,
              notes: reason ? `${item.notes || ''}\n[Declined Reason]: ${reason}` : item.notes,
              updated_at: new Date().toISOString(),
            };
            const owner = profiles.find((p) => p.role === 'owner');
            if (owner) {
              notifyUser(
                owner.id,
                'quote',
                'Quote Declined by Client',
                `Quote ${item.quote_number} marked declined. Reason: "${reason || 'Budget / deferred'}"`,
                'quote',
                item.id
              );
            }
            return updated;
          }
          return item;
        })
      );

      if (databaseService.isLive()) {
        databaseService.updateQuote(id, { status: 'declined' }).catch(console.error);
      }
    },
    [profiles, notifyUser]
  );

  // JOBS
  const convertQuoteToJob = useCallback(
    (quoteId: string, assignedTo?: string, scheduledDate?: string, scheduledTime?: string) => {
      const quote = quotes.find((q) => q.id === quoteId);
      if (!quote) throw new Error('Quote not found');

      const tech = assignedTo || profiles.find((p) => p.role === 'technician')?.id || profiles[0].id;
      const cust = customers.find((c) => c.id === quote.customer_id);

      const jobNumber = `JOB-2026-${String(jobs.length + 101).padStart(3, '0')}`;
      const jobId = generateUuid();
      const initialUpdate: JobUpdate = {
        id: generateUuid(),
        job_id: jobId,
        user_id: currentProfile.id,
        status: 'scheduled',
        note: `Work order created from approved quote ${quote.quote_number}.`,
        created_at: new Date().toISOString(),
      };

      const newJob: Job = {
        id: jobId,
        business_id: business.id,
        quote_id: quote.id,
        customer_id: quote.customer_id,
        lead_id: quote.lead_id,
        job_number: jobNumber,
        assigned_to: tech,
        status: 'scheduled',
        scheduled_date: scheduledDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        scheduled_start: scheduledTime || '08:30',
        scheduled_end: '14:30',
        location: cust?.address || 'Site Address TBD',
        description: `Work order for Quote ${quote.quote_number}: ${quote.items?.map((i) => i.description).slice(0, 2).join('; ') || 'Approved trade services'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updates: [initialUpdate],
      };

      setJobs((prev) => [newJob, ...prev]);

      if (databaseService.isLive()) {
        databaseService.insertJob(newJob, initialUpdate).catch((err) => {
          console.error('Failed to sync job to Supabase:', err);
        });
      }

      // Notify assigned technician
      notifyUser(
        tech,
        'job',
        'New Work Order Assigned',
        `You have been dispatched for ${newJob.job_number} on ${newJob.scheduled_date} at ${newJob.location}.`,
        'job',
        newJob.id
      );

      // Notify customer
      if (cust && cust.profile_id) {
        notifyUser(
          cust.profile_id,
          'job',
          'Service Scheduled',
          `Your service job ${newJob.job_number} is scheduled for ${newJob.scheduled_date} at ${newJob.scheduled_start}.`,
          'job',
          newJob.id
        );
      }

      return newJob;
    },
    [quotes, jobs.length, business.id, profiles, customers, currentProfile.id, notifyUser]
  );

  const createJob = useCallback(
    (jobInput: Omit<Job, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      const newJob: Job = {
        ...jobInput,
        id: generateUuid(),
        business_id: business.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);

      if (databaseService.isLive()) {
        databaseService.insertJob(newJob).catch(console.error);
      }
      return newJob;
    },
    [business.id]
  );

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      )
    );

    if (databaseService.isLive()) {
      databaseService.updateJob(id, updates).catch(console.error);
    }
  }, []);

  const addJobUpdate = useCallback(
    (jobId: string, status: string, note: string, photoUrl?: string) => {
      const newUpdate: JobUpdate = {
        id: generateUuid(),
        job_id: jobId,
        user_id: currentProfile.id,
        status,
        note,
        photo_url: photoUrl,
        created_at: new Date().toISOString(),
      };

      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === jobId) {
            const updatesList = j.updates ? [newUpdate, ...j.updates] : [newUpdate];
            let newStatus = j.status;
            let startedAt = j.started_at;
            let completedAt = j.completed_at;

            if (status === 'in_progress' && !j.started_at) {
              startedAt = new Date().toISOString();
              newStatus = 'in_progress';
            } else if (status === 'completed') {
              completedAt = new Date().toISOString();
              newStatus = 'completed';
            } else if (['on_hold', 'verified', 'cancelled'].includes(status)) {
              newStatus = status as Job['status'];
            }

            const cust = customers.find((c) => c.id === j.customer_id);
            if (cust && cust.profile_id) {
              notifyUser(
                cust.profile_id,
                'job',
                `Job Status: ${newStatus.toUpperCase()}`,
                `Update from technician: "${note}"`,
                'job',
                j.id
              );
            }

            return {
              ...j,
              status: newStatus,
              started_at: startedAt,
              completed_at: completedAt,
              updates: updatesList,
              updated_at: new Date().toISOString(),
            };
          }
          return j;
        })
      );

      if (databaseService.isLive()) {
        databaseService.insertJobUpdate(newUpdate).catch(console.error);
        databaseService.updateJob(jobId, { status: status as Job['status'] }).catch(console.error);
      }
    },
    [currentProfile.id, customers, notifyUser]
  );

  // INVOICES
  const createInvoice = useCallback(
    (invoiceInput: Omit<Invoice, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      const invId = generateUuid();
      const invoiceItems: InvoiceItem[] = (invoiceInput.items || []).map((it) => {
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
        const price = Math.max(0, Number(it.unit_price) || 0);
        return {
          ...it,
          id: it.id || generateUuid(),
          invoice_id: invId,
          description: it.description?.trim() || 'Invoice Item',
          quantity: qty,
          unit_price: price,
          total: parseFloat((qty * price).toFixed(2)),
          created_at: new Date().toISOString(),
        };
      });

      const calculatedSubtotal = invoiceItems.reduce((sum, it) => sum + it.total, 0);
      const safeDiscount = Math.max(0, Math.min(Number(invoiceInput.discount) || 0, calculatedSubtotal));
      const taxable = Math.max(0, calculatedSubtotal - safeDiscount);
      const safeTax = Math.max(0, Number(invoiceInput.tax) || 0);
      const calculatedTotal = parseFloat((taxable + safeTax).toFixed(2));

      const newInvoice: Invoice = {
        ...invoiceInput,
        id: invId,
        business_id: business.id,
        subtotal: calculatedSubtotal,
        discount: safeDiscount,
        tax: safeTax,
        total: calculatedTotal,
        items: invoiceItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setInvoices((prev) => [newInvoice, ...prev]);

      if (databaseService.isLive()) {
        databaseService.insertInvoice(newInvoice, invoiceItems).catch(console.error);
      }

      const cust = customers.find((c) => c.id === invoiceInput.customer_id);
      if (cust && cust.profile_id) {
        notifyUser(
          cust.profile_id,
          'invoice',
          'Invoice Issued',
          `Invoice ${newInvoice.invoice_number} for $${newInvoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} is pending payment.`,
          'invoice',
          newInvoice.id
        );
      }

      return newInvoice;
    },
    [business.id, customers, notifyUser]
  );

  const generateInvoiceFromJob = useCallback(
    (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return null;

      const quote = job.quote_id ? quotes.find((q) => q.id === job.quote_id) : null;
      const invoiceNumber = `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`;
      const invId = generateUuid();

      const items: InvoiceItem[] =
        quote?.items && quote.items.length > 0
          ? quote.items.map((qi) => ({
              id: generateUuid(),
              invoice_id: invId,
              description: qi.description,
              quantity: qi.quantity,
              unit_price: qi.unit_price,
              total: qi.total,
              created_at: new Date().toISOString(),
            }))
          : [
              {
                id: generateUuid(),
                invoice_id: invId,
                description: `Completed services for ${job.job_number} - ${job.description || 'Field Trade Service'}`,
                quantity: 1,
                unit_price: 1850.0,
                total: 1850.0,
                created_at: new Date().toISOString(),
              },
            ];

      const subtotal = items.reduce((sum, i) => sum + i.total, 0);
      const discount = quote?.discount || 0;
      const taxRate = 0.0825;
      const taxable = Math.max(0, subtotal - discount);
      const tax = parseFloat((taxable * taxRate).toFixed(2));
      const total = parseFloat((taxable + tax).toFixed(2));

      const dueDate = new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];

      // Important: Status is explicitly 'pending' as required
      const newInvoice: Invoice = {
        id: invId,
        business_id: business.id,
        job_id: job.id,
        customer_id: job.customer_id,
        invoice_number: invoiceNumber,
        subtotal,
        discount,
        tax,
        total,
        status: 'pending',
        due_date: dueDate,
        issued_at: new Date().toISOString(),
        notes: `Generated upon verified completion of ${job.job_number}. Net 14 payment terms.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items,
      };

      setInvoices((prev) => [newInvoice, ...prev]);

      if (databaseService.isLive()) {
        databaseService.insertInvoice(newInvoice, items).catch((err) => {
          console.error('Failed to sync invoice to Supabase:', err);
        });
      }

      const cust = customers.find((c) => c.id === job.customer_id);
      if (cust && cust.profile_id) {
        notifyUser(
          cust.profile_id,
          'invoice',
          'New Invoice Pending Settlement',
          `Invoice ${newInvoice.invoice_number} is pending. Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
          'invoice',
          newInvoice.id
        );
      }

      return newInvoice;
    },
    [jobs, quotes, invoices.length, business.id, customers, notifyUser]
  );

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      )
    );

    if (databaseService.isLive()) {
      databaseService.updateInvoice(id, updates).catch(console.error);
    }
  }, []);

  const markInvoicePaid = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setInvoices((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = {
              ...item,
              status: 'paid' as const,
              paid_at: now,
              updated_at: now,
            };
            const owner = profiles.find((p) => p.role === 'owner');
            if (owner) {
              notifyUser(
                owner.id,
                'invoice',
                'Invoice Payment Received',
                `Invoice ${item.invoice_number} ($${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}) marked paid!`,
                'invoice',
                item.id
              );
            }
            return updated;
          }
          return item;
        })
      );

      if (databaseService.isLive()) {
        databaseService.updateInvoice(id, { status: 'paid', paid_at: now }).catch(console.error);
      }
    },
    [profiles, notifyUser]
  );

  // CUSTOMER / SERVICE
  const addCustomer = useCallback(
    (custInput: Omit<Customer, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      const newCust: Customer = {
        ...custInput,
        id: generateUuid(),
        business_id: business.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCustomers((prev) => [newCust, ...prev]);

      if (databaseService.isLive()) {
        databaseService.insertCustomer(newCust).catch(console.error);
      }
      return newCust;
    },
    [business.id]
  );

  const addService = useCallback(
    (srvInput: Omit<ServiceItem, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      const newSrv: ServiceItem = {
        ...srvInput,
        id: generateUuid(),
        business_id: business.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setServices((prev) => [newSrv, ...prev]);
      return newSrv;
    },
    [business.id]
  );

  // NOTIFICATIONS
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const unreadNotificationCount = notifications.filter(
    (n) => n.user_id === currentProfile.id && !n.is_read
  ).length;

// Safe fetch helper verifying Content-Type before parsing JSON (Prevents "Unexpected token <")
async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit,
  fallbackMsg: string
): Promise<{ ok: boolean; status: number; json: T }> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (netErr: any) {
    throw new Error(
      `Network error connecting to AI service. ${fallbackMsg}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    const rawText = await res.text().catch(() => '');
    const isHtml =
      rawText.includes('<!DOCTYPE') ||
      rawText.includes('<html') ||
      contentType.toLowerCase().includes('text/html');

    const errorDetail = isHtml
      ? 'The server returned an unexpected HTML document instead of JSON. The backend API service may be unavailable or unhandled.'
      : `The server returned an unexpected content-type (${contentType || 'none'}, HTTP ${res.status}).`;

    throw new Error(`${errorDetail} ${fallbackMsg}`);
  }

  try {
    const parsed = await res.json();
    return { ok: res.ok, status: res.status, json: parsed as T };
  } catch (parseErr: any) {
    throw new Error(`Failed to parse server response as JSON. ${fallbackMsg}`);
  }
}

  // AI LEAD ASSIST (Phase 4, Sections 2, 5, 6)
  const runAiLeadAssist = async (
    inquiryText: string,
    options?: { simulateFailure?: boolean; simulateInvalid?: boolean }
  ): Promise<AiLeadExtracted> => {
    const catalogPayload = services.map((s) => ({ id: s.id, name: s.name }));
    const fallbackMsg = 'AI assistance is temporarily unavailable. You can still create the lead manually.';

    const { ok, status, json: data } = await safeFetchJson<any>(
      '/api/ai/lead-assist',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryText,
          catalogServices: catalogPayload,
          simulateFailure: options?.simulateFailure,
          simulateInvalid: options?.simulateInvalid,
        }),
      },
      fallbackMsg
    );

    if (!ok || !data?.success || !data?.data) {
      const errorMsg = data?.error || fallbackMsg;
      const error: any = new Error(errorMsg);
      error.rawText = data?.rawText || inquiryText;
      error.status = status;
      throw error;
    }
    return data.data;
  };

  // AI LEAD SUMMARY (Phase 4, Section 7)
  const generateAiLeadSummary = async (
    leadId: string
  ): Promise<{ success: boolean; summary?: string; error?: string }> => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return { success: false, error: 'Lead not found in records.' };

    const srv = services.find((s) => s.id === targetLead.service_id);
    try {
      const { ok, json: data } = await safeFetchJson<any>(
        '/api/ai/lead-summary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userRole: currentProfile.role,
            lead: {
              title: targetLead.title,
              service_name: srv?.name,
              description: targetLead.description,
              quantity: targetLead.ai_extracted?.quantity || 1,
              location: targetLead.location,
              preferred_date: targetLead.preferred_date,
              priority: targetLead.priority,
            },
          }),
        },
        'Failed to generate AI summary.'
      );

      if (!ok || !data?.success) {
        return { success: false, error: data?.error || 'Failed to generate AI summary' };
      }
      return { success: true, summary: data.summary };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error generating summary' };
    }
  };

  const saveAiLeadSummary = (leadId: string, summary: string) => {
    updateLead(leadId, { ai_summary: summary });
  };

  // AI QUOTE DESCRIPTION (Phase 4, Section 8)
  const generateAiQuoteDescription = async (
    notes: string,
    serviceContext?: string
  ): Promise<{ success: boolean; description?: string; error?: string }> => {
    try {
      const { ok, json: data } = await safeFetchJson<any>(
        '/api/ai/quote-description',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userRole: currentProfile.role,
            notes,
            serviceContext,
          }),
        },
        'Failed to generate quote description.'
      );

      if (!ok || !data?.success) {
        return { success: false, error: data?.error || 'Failed to generate quote description' };
      }
      return { success: true, description: data.description };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error generating description' };
    }
  };

  // AI BUSINESS INSIGHT (Phase 4, Section 12)
  const getAiBusinessInsight = async (): Promise<{
    success: boolean;
    insight: string;
    isEmpty?: boolean;
    error?: string;
  }> => {
    const metrics = {
      leadsCount: leads.length,
      newLeadsCount: leads.filter((l) => l.status === 'new').length,
      quotesCount: quotes.length,
      quotesSentCount: quotes.filter((q) => q.status === 'sent').length,
      quotesApprovedCount: quotes.filter((q) => q.status === 'approved').length,
      jobsActiveCount: jobs.filter((j) => j.status === 'in_progress' || j.status === 'scheduled').length,
      unpaidInvoicesCount: invoices.filter((i) => i.status === 'issued' || i.status === 'pending').length,
      unpaidTotal: invoices
        .filter((i) => i.status === 'issued' || i.status === 'pending')
        .reduce((sum, i) => sum + i.total, 0),
      settledTotal: invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    };

    try {
      const { ok, json: data } = await safeFetchJson<any>(
        '/api/ai/business-insight',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userRole: currentProfile?.role || 'owner',
            metrics,
          }),
        },
        'Operational insight temporarily unavailable.'
      );

      if (!ok || !data?.success) {
        return {
          success: false,
          insight: 'Operational insight temporarily unavailable.',
          error: data?.error,
        };
      }

      return {
        success: true,
        insight: data.insight,
        isEmpty: Boolean(data.isEmpty),
      };
    } catch (err: any) {
      return {
        success: false,
        insight: 'Operational insight temporarily unavailable.',
        error: err.message,
      };
    }
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setBusiness(INITIAL_BUSINESS);
    setProfiles(INITIAL_PROFILES);
    setCurrentProfileId('p-david-owner');
    setCustomers(INITIAL_CUSTOMERS);
    setServices(INITIAL_SERVICES);
    setLeads(INITIAL_LEADS);
    setQuotes(INITIAL_QUOTES);
    setJobs(INITIAL_JOBS);
    setInvoices(INITIAL_INVOICES);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  return (
    <AppStoreContext.Provider
      value={{
        business,
        profiles,
        currentProfile,
        switchProfile,
        syncAuthProfile,
        customers,
        services,
        leads,
        quotes,
        jobs,
        invoices,
        notifications,
        unreadNotificationCount,
        isLiveSupabase: isLive,
        dbLoading,
        dbError,
        refreshFromDatabase,
        addLead,
        updateLead,
        deleteLead,
        createCustomerRequest,
        createQuote,
        updateQuote,
        sendQuote,
        approveQuote,
        requestQuoteChange,
        declineQuote,
        convertQuoteToJob,
        createJob,
        updateJob,
        addJobUpdate,
        createInvoice,
        generateInvoiceFromJob,
        updateInvoice,
        markInvoicePaid,
        addCustomer,
        addService,
        markNotificationRead,
        markAllNotificationsRead,
        runAiLeadAssist,
        generateAiLeadSummary,
        saveAiLeadSummary,
        generateAiQuoteDescription,
        getAiBusinessInsight,
        resetToDefaults,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};
