-- ========================================================
-- SQL Script to update Supabase schema for PARS 2026
-- Adding support for Room, Date, Shift, and Section CRUD
-- ========================================================

-- 1. Create Room Table
CREATE TABLE IF NOT EXISTS public.rooms (
    name TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Event Date Table
CREATE TABLE IF NOT EXISTS public.schedule_dates (
    date_val TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Shift (Buổi) Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Virtual Section Table
CREATE TABLE IF NOT EXISTS public.virtual_sections (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    room_name TEXT NOT NULL,
    track_name TEXT NOT NULL,
    buoi_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Seed Default Data (Fallback defaults)
INSERT INTO public.rooms (name) VALUES 
('Hội trường 1'),
('Hội trường 2'),
('Hội trường 3'),
('Hội trường 4')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.schedule_dates (date_val) VALUES 
('2026-12-11'),
('2026-12-12')
ON CONFLICT (date_val) DO NOTHING;

INSERT INTO public.shifts (id, name, start_time, end_time) VALUES 
('sang', 'Buổi Sáng', '08:00', '12:00'),
('chieu', 'Buổi Chiều', '13:00', '18:00')
ON CONFLICT (id) DO NOTHING;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent clashes
DROP POLICY IF EXISTS "Allow public read rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public read schedule_dates" ON public.schedule_dates;
DROP POLICY IF EXISTS "Allow authenticated manage schedule_dates" ON public.schedule_dates;
DROP POLICY IF EXISTS "Allow public read shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow authenticated manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow public read virtual_sections" ON public.virtual_sections;
DROP POLICY IF EXISTS "Allow authenticated manage virtual_sections" ON public.virtual_sections;

-- 7. Create Access Control Policies
-- Public Read Access
CREATE POLICY "Allow public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public read schedule_dates" ON public.schedule_dates FOR SELECT USING (true);
CREATE POLICY "Allow public read shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Allow public read virtual_sections" ON public.virtual_sections FOR SELECT USING (true);

-- Authenticated Read/Write Access (BTC, Admin, CTV)
CREATE POLICY "Allow authenticated manage rooms" ON public.rooms TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage schedule_dates" ON public.schedule_dates TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage shifts" ON public.shifts TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage virtual_sections" ON public.virtual_sections TO authenticated USING (true) WITH CHECK (true);

-- 8. Enable Realtime updates for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_dates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_sections;
