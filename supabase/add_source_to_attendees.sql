-- Add source column to attendees table if not exists
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
