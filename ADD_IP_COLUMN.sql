-- Add IP address column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ip_address text;
