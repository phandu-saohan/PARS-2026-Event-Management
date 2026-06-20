-- SQL Script to add doctor_proof_url column to attendees table
ALTER TABLE public.attendees ADD COLUMN IF NOT EXISTS doctor_proof_url TEXT;
