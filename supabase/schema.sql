-- ================================================================
-- LeadToQuote - Production PostgreSQL Schema for Supabase
-- SaaS platform for trade contractors & service businesses
-- Includes Foreign Keys, Indexes, Triggers, and Row Level Security (RLS)
-- ================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Businesses
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- references auth.users(id) in Supabase
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'staff', 'technician', 'customer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'converted', 'lost')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source VARCHAR(50) NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'manual', 'referral', 'phone', 'other')),
    location TEXT,
    preferred_date VARCHAR(100),
    ai_extracted JSONB DEFAULT NULL,
    ai_summary TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Quotes
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'change_requested', 'declined', 'expired')),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0.00),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0.00),
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0.00),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0.00),
    valid_until DATE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Quote Items
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0.00),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0.00),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    job_number VARCHAR(50) NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'on_hold', 'completed', 'verified', 'cancelled')),
    scheduled_date DATE,
    scheduled_start TIME,
    scheduled_end TIME,
    location TEXT,
    description TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Job Updates
CREATE TABLE IF NOT EXISTS public.job_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0.00),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0.00),
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0.00),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0.00),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'pending', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    issued_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Invoice Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0.00),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0.00),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_type VARCHAR(50),
    related_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON public.profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_business_id ON public.quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON public.jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON public.jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current user profile
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Businesses policies
CREATE POLICY "Owners and staff can view their business"
  ON public.businesses FOR SELECT
  USING (id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can update their business"
  ON public.businesses FOR UPDATE
  USING (id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Allow business creation during owner onboarding"
  ON public.businesses FOR INSERT
  WITH CHECK (true);

-- 2. Profiles policies
CREATE POLICY "Users can view profiles in their business or own profile"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Allow profile insertion on user signup"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- 3. Customers policies
CREATE POLICY "Business members can view customers"
  ON public.customers FOR SELECT
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff and owners can manage customers"
  ON public.customers FOR ALL
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

CREATE POLICY "Customers can view their own customer record"
  ON public.customers FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Allow customer record creation on lead inquiry"
  ON public.customers FOR INSERT
  WITH CHECK (true);

-- 4. Services policies
CREATE POLICY "Public and members can view services"
  ON public.services FOR SELECT
  USING (is_active = true OR business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owners and staff can manage services"
  ON public.services FOR ALL
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

-- 5. Leads policies
CREATE POLICY "Business members can view leads"
  ON public.leads FOR SELECT
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff', 'technician')));

CREATE POLICY "Customers can view their own leads"
  ON public.leads FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()));

CREATE POLICY "Anyone can submit a public lead inquiry"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff and owners can manage leads"
  ON public.leads FOR ALL
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

-- 6. Quotes policies
CREATE POLICY "Business members can view quotes"
  ON public.quotes FOR SELECT
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff', 'technician')));

CREATE POLICY "Customers can view quotes sent to them"
  ON public.quotes FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()) AND status != 'draft');

CREATE POLICY "Customers can approve or decline quotes"
  ON public.quotes FOR UPDATE
  USING (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()));

CREATE POLICY "Staff and owners can manage quotes"
  ON public.quotes FOR ALL
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

-- 7. Quote Items policies
CREATE POLICY "View quote items"
  ON public.quote_items FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM public.quotes
      WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
      OR (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()) AND status != 'draft')
    )
  );

CREATE POLICY "Manage quote items"
  ON public.quote_items FOR ALL
  USING (quote_id IN (SELECT id FROM public.quotes WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff'))));

-- 8. Jobs policies
CREATE POLICY "Business members can view jobs"
  ON public.jobs FOR SELECT
  USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff'))
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Customers can view their jobs"
  ON public.jobs FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()));

CREATE POLICY "Technicians can update assigned jobs"
  ON public.jobs FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "Owners and staff can manage jobs"
  ON public.jobs FOR ALL
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

-- 9. Job Updates policies
CREATE POLICY "View job updates"
  ON public.job_updates FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.jobs
      WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
      OR customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid())
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Create job updates"
  ON public.job_updates FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND job_id IN (
      SELECT id FROM public.jobs
      WHERE assigned_to = auth.uid()
      OR business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff'))
    )
  );

-- 10. Invoices policies
CREATE POLICY "Business members can view invoices"
  ON public.invoices FOR SELECT
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

CREATE POLICY "Customers can view their invoices"
  ON public.invoices FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()) AND status != 'draft');

CREATE POLICY "Owners and staff can manage invoices"
  ON public.invoices FOR ALL
  USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff')));

-- 11. Invoice Items policies
CREATE POLICY "View invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())
      OR (customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid()) AND status != 'draft')
    )
  );

CREATE POLICY "Owners and staff can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'staff'))
    )
  );

-- 12. Notifications policies
CREATE POLICY "Users can manage their notifications"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid());

-- ================================================================
-- TRIGGERS & AUTOMATION
-- ================================================================

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_businesses_updated_at ON public.businesses;
CREATE TRIGGER tr_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_customers_updated_at ON public.customers;
CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_services_updated_at ON public.services;
CREATE TRIGGER tr_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_leads_updated_at ON public.leads;
CREATE TRIGGER tr_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_quotes_updated_at ON public.quotes;
CREATE TRIGGER tr_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_jobs_updated_at ON public.jobs;
CREATE TRIGGER tr_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_invoices_updated_at ON public.invoices;
CREATE TRIGGER tr_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Safe Auth Signup Trigger: Auto-creates public.profiles record when new auth.users signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(50);
    user_name VARCHAR(255);
    user_phone VARCHAR(50);
    user_business_id UUID;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';
    
    IF NEW.raw_user_meta_data->>'business_id' IS NOT NULL THEN
        user_business_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
    ELSE
        user_business_id := NULL;
    END IF;

    INSERT INTO public.profiles (id, business_id, full_name, email, phone, role, avatar_url)
    VALUES (
        NEW.id,
        user_business_id,
        user_name,
        NEW.email,
        user_phone,
        user_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Security: Prevent self-escalation of roles or tenant reassignment on public.profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent normal users from altering their own role or business_id
    IF NEW.role <> OLD.role AND auth.role() = 'authenticated' THEN
        -- Check if the current authenticated caller is an owner of this business
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'owner' AND business_id = OLD.business_id
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot change their own role or escalate privileges.';
        END IF;
    END IF;

    IF NEW.business_id IS DISTINCT FROM OLD.business_id AND auth.role() = 'authenticated' THEN
        RAISE EXCEPTION 'Unauthorized: Users cannot reassign business tenant ID.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER tr_prevent_profile_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.prevent_profile_role_escalation();


