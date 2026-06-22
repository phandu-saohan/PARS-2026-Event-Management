-- 1. Create campaigns table
CREATE TABLE IF NOT EXISTS public.sending_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
    template_id TEXT,
    subject TEXT,
    body TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sending', 'paused', 'completed')),
    total_recipients INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    recipients JSONB DEFAULT '[]'::jsonb,
    logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.sending_campaigns ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated manage sending_campaigns" ON public.sending_campaigns;
CREATE POLICY "Allow authenticated manage sending_campaigns" ON public.sending_campaigns 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 4. Enable Supabase Realtime synchronization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'sending_campaigns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sending_campaigns;
    END IF;
END $$;
