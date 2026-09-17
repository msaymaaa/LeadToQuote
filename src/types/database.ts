export type UserRole = 'owner' | 'admin' | 'technician' | 'customer' | 'staff';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadSource = 'website' | 'manual' | 'referral' | 'phone' | 'other';

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'change_requested' | 'declined' | 'expired';

export type JobStatus = 'scheduled' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'verified' | 'cancelled';

export type InvoiceStatus = 'draft' | 'issued' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  business_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  profile_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: string;
  business_id: string;
  name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiLeadExtracted {
  service: string;
  issue?: string;
  quantity?: number | string;
  preferred_date?: string;
  location_type?: string;
  urgency?: LeadPriority;
  summary?: string;
  matched_service_id?: string | null;
  raw_inquiry?: string;
  user_edited?: boolean;
  extracted_at?: string;
  // Legacy / auxiliary fields
  additional_services?: string[];
  property_context?: string;
  concise_summary?: string;
  confidence?: number;
  priority_suggested?: LeadPriority;
}

export interface Lead {
  id: string;
  business_id: string;
  customer_id: string;
  service_id?: string;
  title: string;
  description: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  location?: string;
  preferred_date?: string;
  ai_extracted?: AiLeadExtracted | null;
  ai_summary?: string;
  assigned_to?: string; // profile_id
  created_at: string;
  updated_at: string;
  // Joins
  customer?: Customer;
  service?: ServiceItem;
  assignee?: Profile;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Quote {
  id: string;
  business_id: string;
  lead_id?: string;
  customer_id: string;
  quote_number: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  valid_until?: string;
  notes?: string;
  created_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Joins
  customer?: Customer;
  items?: QuoteItem[];
  lead?: Lead;
}

export interface JobUpdate {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  note: string;
  photo_url?: string;
  created_at: string;
  user?: Profile;
}

export interface Job {
  id: string;
  business_id: string;
  quote_id?: string;
  customer_id: string;
  lead_id?: string;
  job_number: string;
  assigned_to?: string; // profile_id
  status: JobStatus;
  scheduled_date?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  location?: string;
  description?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joins
  customer?: Customer;
  technician?: Profile;
  updates?: JobUpdate[];
  quote?: Quote;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  job_id?: string;
  customer_id: string;
  invoice_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  due_date?: string;
  issued_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins
  customer?: Customer;
  items?: InvoiceItem[];
  job?: Job;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'lead' | 'quote' | 'job' | 'invoice' | 'system';
  title: string;
  message: string;
  related_type?: 'lead' | 'quote' | 'job' | 'invoice';
  related_id?: string;
  is_read: boolean;
  created_at: string;
}
