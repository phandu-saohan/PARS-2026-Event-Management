-- ============================================================
-- PARS 2026 - ADD CONTACTS TABLE FOR EXCEL UPLOAD PRESERVATION
-- ============================================================

-- Create the contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY, -- Format: CON-XXXX or UUID string
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    group_name TEXT DEFAULT 'Mặc định',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for contacts
CREATE POLICY "Allow authenticated manage contacts" ON public.contacts 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public insert contacts" ON public.contacts 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public read contacts" ON public.contacts 
    FOR SELECT 
    USING (true);

-- Enable real-time updates for contacts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
