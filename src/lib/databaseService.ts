import { supabase, isSupabaseConfigured } from './supabase';
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
} from '../types/database';

export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface DatabaseState {
  business: Business | null;
  profiles: Profile[];
  customers: Customer[];
  services: ServiceItem[];
  leads: Lead[];
  quotes: Quote[];
  jobs: Job[];
  invoices: Invoice[];
  notifications: Notification[];
}

export const databaseService = {
  isLive: (): boolean => isSupabaseConfigured() && supabase !== null,

  async fetchAllData(): Promise<{ success: boolean; data?: DatabaseState; error?: string }> {
    if (!this.isLive() || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      // 1. Fetch business
      const { data: businesses, error: bErr } = await supabase
        .from('businesses')
        .select('*')
        .limit(1);

      if (bErr && bErr.code !== '42P01') {
        console.warn('Error querying businesses:', bErr.message);
      }

      // 2. Fetch profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*');

      // 3. Fetch customers
      const { data: customers, error: cErr } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      // 4. Fetch services
      const { data: services, error: sErr } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      // 5. Fetch leads
      const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // 6. Fetch quotes with quote_items
      const { data: quotes, error: qErr } = await supabase
        .from('quotes')
        .select('*, quote_items(*)')
        .order('created_at', { ascending: false });

      // 7. Fetch jobs with job_updates
      const { data: jobs, error: jErr } = await supabase
        .from('jobs')
        .select('*, job_updates(*)')
        .order('created_at', { ascending: false });

      // 8. Fetch invoices with invoice_items
      const { data: invoices, error: iErr } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .order('created_at', { ascending: false });

      // 9. Fetch notifications
      const { data: notifications, error: nErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Normalize quotes items
      const normalizedQuotes: Quote[] = (quotes || []).map((q: any) => ({
        ...q,
        items: q.quote_items || [],
      }));

      // Normalize jobs updates
      const normalizedJobs: Job[] = (jobs || []).map((j: any) => ({
        ...j,
        updates: j.job_updates || [],
      }));

      // Normalize invoices items
      const normalizedInvoices: Invoice[] = (invoices || []).map((inv: any) => ({
        ...inv,
        items: inv.invoice_items || [],
      }));

      return {
        success: true,
        data: {
          business: businesses && businesses[0] ? businesses[0] : null,
          profiles: profiles || [],
          customers: customers || [],
          services: services || [],
          leads: leads || [],
          quotes: normalizedQuotes,
          jobs: normalizedJobs,
          invoices: normalizedInvoices,
          notifications: notifications || [],
        },
      };
    } catch (err: any) {
      console.error('Supabase fetchAllData error:', err);
      return { success: false, error: err.message || 'Database error occurred' };
    }
  },

  // LEADS
  async insertLead(lead: Partial<Lead>): Promise<{ success: boolean; data?: Lead; error?: string }> {
    if (!this.isLive() || !supabase) {
      return { success: false, error: 'Database offline' };
    }
    try {
      const payload: any = {
        id: lead.id || generateUuid(),
        business_id: lead.business_id,
        customer_id: lead.customer_id,
        service_id: lead.service_id || null,
        title: lead.title,
        description: lead.description || '',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        source: lead.source || 'website',
        location: lead.location || null,
        preferred_date: lead.preferred_date || null,
        ai_extracted: lead.ai_extracted || null,
        ai_summary: lead.ai_summary || null,
        assigned_to: lead.assigned_to || null,
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as Lead };
    } catch (err: any) {
      console.error('insertLead failed:', err);
      return { success: false, error: err.message };
    }
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      delete cleanUpdates.customer;
      delete cleanUpdates.service;
      delete cleanUpdates.assignee;

      const { error } = await supabase.from('leads').update(cleanUpdates).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('updateLead failed:', err);
      return { success: false, error: err.message };
    }
  },

  async deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('deleteLead failed:', err);
      return { success: false, error: err.message };
    }
  },

  // CUSTOMERS
  async insertCustomer(customer: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const payload = {
        id: customer.id || generateUuid(),
        business_id: customer.business_id,
        profile_id: customer.profile_id || null,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone || null,
        address: customer.address || null,
        city: customer.city || null,
        notes: customer.notes || null,
      };
      const { data, error } = await supabase.from('customers').insert(payload).select().single();
      if (error) throw error;
      return { success: true, data: data as Customer };
    } catch (err: any) {
      console.error('insertCustomer failed:', err);
      return { success: false, error: err.message };
    }
  },

  // QUOTES
  async insertQuote(quote: Partial<Quote>, items: Partial<QuoteItem>[] = []): Promise<{ success: boolean; data?: Quote; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const quoteId = quote.id || generateUuid();
      const quotePayload: any = {
        id: quoteId,
        business_id: quote.business_id,
        lead_id: quote.lead_id || null,
        customer_id: quote.customer_id,
        quote_number: quote.quote_number,
        status: quote.status || 'draft',
        subtotal: quote.subtotal || 0,
        discount: quote.discount || 0,
        tax: quote.tax || 0,
        total: quote.total || 0,
        valid_until: quote.valid_until || null,
        notes: quote.notes || null,
        created_by: quote.created_by || null,
        approved_at: quote.approved_at || null,
      };

      const { data: savedQuote, error: qErr } = await supabase
        .from('quotes')
        .insert(quotePayload)
        .select()
        .single();

      if (qErr) throw qErr;

      // Insert items
      if (items.length > 0) {
        const itemPayloads = items.map((it) => ({
          id: it.id || generateUuid(),
          quote_id: quoteId,
          description: it.description,
          quantity: it.quantity || 1,
          unit_price: it.unit_price || 0,
          total: (it.quantity || 1) * (it.unit_price || 0),
        }));

        const { error: itemsErr } = await supabase.from('quote_items').insert(itemPayloads);
        if (itemsErr) console.warn('Warning inserting quote_items:', itemsErr);
      }

      return { success: true, data: { ...savedQuote, items: items as QuoteItem[] } };
    } catch (err: any) {
      console.error('insertQuote failed:', err);
      return { success: false, error: err.message };
    }
  },

  async updateQuote(id: string, updates: Partial<Quote>): Promise<{ success: boolean; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      delete cleanUpdates.items;
      delete cleanUpdates.customer;
      delete cleanUpdates.lead;

      const { error } = await supabase.from('quotes').update(cleanUpdates).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('updateQuote failed:', err);
      return { success: false, error: err.message };
    }
  },

  // JOBS
  async insertJob(job: Partial<Job>, initialUpdate?: Partial<JobUpdate>): Promise<{ success: boolean; data?: Job; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const jobId = job.id || generateUuid();
      const jobPayload: any = {
        id: jobId,
        business_id: job.business_id,
        quote_id: job.quote_id || null,
        customer_id: job.customer_id,
        lead_id: job.lead_id || null,
        job_number: job.job_number,
        assigned_to: job.assigned_to || null,
        status: job.status || 'scheduled',
        scheduled_date: job.scheduled_date || null,
        scheduled_start: job.scheduled_start || null,
        scheduled_end: job.scheduled_end || null,
        location: job.location || null,
        description: job.description || null,
        started_at: job.started_at || null,
        completed_at: job.completed_at || null,
      };

      const { data: savedJob, error: jErr } = await supabase
        .from('jobs')
        .insert(jobPayload)
        .select()
        .single();

      if (jErr) throw jErr;

      let updates: JobUpdate[] = [];
      if (initialUpdate) {
        const updatePayload = {
          id: initialUpdate.id || generateUuid(),
          job_id: jobId,
          user_id: initialUpdate.user_id,
          status: initialUpdate.status || 'scheduled',
          note: initialUpdate.note || 'Work order created',
          photo_url: initialUpdate.photo_url || null,
        };
        const { data: savedUp, error: uErr } = await supabase
          .from('job_updates')
          .insert(updatePayload)
          .select()
          .single();
        if (savedUp && !uErr) {
          updates = [savedUp as JobUpdate];
        }
      }

      return { success: true, data: { ...savedJob, updates } };
    } catch (err: any) {
      console.error('insertJob failed:', err);
      return { success: false, error: err.message };
    }
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<{ success: boolean; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      delete cleanUpdates.updates;
      delete cleanUpdates.customer;
      delete cleanUpdates.tech;

      const { error } = await supabase.from('jobs').update(cleanUpdates).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('updateJob failed:', err);
      return { success: false, error: err.message };
    }
  },

  async insertJobUpdate(update: Partial<JobUpdate>): Promise<{ success: boolean; data?: JobUpdate; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const payload = {
        id: update.id || generateUuid(),
        job_id: update.job_id,
        user_id: update.user_id,
        status: update.status,
        note: update.note,
        photo_url: update.photo_url || null,
      };
      const { data, error } = await supabase.from('job_updates').insert(payload).select().single();
      if (error) throw error;
      return { success: true, data: data as JobUpdate };
    } catch (err: any) {
      console.error('insertJobUpdate failed:', err);
      return { success: false, error: err.message };
    }
  },

  // INVOICES
  async insertInvoice(invoice: Partial<Invoice>, items: Partial<InvoiceItem>[] = []): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const invoiceId = invoice.id || generateUuid();
      const payload: any = {
        id: invoiceId,
        business_id: invoice.business_id,
        job_id: invoice.job_id || null,
        customer_id: invoice.customer_id,
        invoice_number: invoice.invoice_number,
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0,
        status: invoice.status || 'pending',
        due_date: invoice.due_date || null,
        issued_at: invoice.issued_at || new Date().toISOString(),
        paid_at: invoice.paid_at || null,
        notes: invoice.notes || null,
      };

      const { data: savedInvoice, error: iErr } = await supabase
        .from('invoices')
        .insert(payload)
        .select()
        .single();

      if (iErr) throw iErr;

      if (items.length > 0) {
        const itemPayloads = items.map((it) => ({
          id: it.id || generateUuid(),
          invoice_id: invoiceId,
          description: it.description,
          quantity: it.quantity || 1,
          unit_price: it.unit_price || 0,
          total: (it.quantity || 1) * (it.unit_price || 0),
        }));
        await supabase.from('invoice_items').insert(itemPayloads);
      }

      return { success: true, data: { ...savedInvoice, items: items as InvoiceItem[] } };
    } catch (err: any) {
      console.error('insertInvoice failed:', err);
      return { success: false, error: err.message };
    }
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<{ success: boolean; error?: string }> {
    if (!this.isLive() || !supabase) return { success: false, error: 'Database offline' };
    try {
      const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      delete cleanUpdates.items;
      delete cleanUpdates.customer;
      delete cleanUpdates.job;

      const { error } = await supabase.from('invoices').update(cleanUpdates).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('updateInvoice failed:', err);
      return { success: false, error: err.message };
    }
  },
};
