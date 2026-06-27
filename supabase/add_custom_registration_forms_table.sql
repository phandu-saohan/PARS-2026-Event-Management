-- Create custom_registration_forms table
CREATE TABLE IF NOT EXISTS public.custom_registration_forms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    header_title TEXT,
    header_subtitle TEXT,
    header_logo_url TEXT,
    header_banner_url TEXT,
    footer_text TEXT,
    fields JSONB NOT NULL,
    required_fields JSONB NOT NULL,
    packages JSONB NOT NULL,
    payment_qr_enabled BOOLEAN DEFAULT FALSE,
    bank_code TEXT,
    bank_account_no TEXT,
    bank_account_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.custom_registration_forms ENABLE ROW LEVEL SECURITY;

-- Check and create policy for public select
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_registration_forms' AND policyname = 'Allow public read custom forms'
    ) THEN
        CREATE POLICY "Allow public read custom forms" ON public.custom_registration_forms
            FOR SELECT USING (true);
    END IF;
END
$$;

-- Check and create policy for authenticated users all access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_registration_forms' AND policyname = 'Allow authenticated manage custom forms'
    ) THEN
        CREATE POLICY "Allow authenticated manage custom forms" ON public.custom_registration_forms
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END
$$;
