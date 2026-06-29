-- Add open_count and click_count to sending_campaigns
ALTER TABLE public.sending_campaigns 
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
