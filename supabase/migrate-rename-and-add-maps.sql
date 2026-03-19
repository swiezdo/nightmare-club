-- Migration: Rename maps to boss-name format and add River Village
-- Run this in the Supabase SQL Editor to update an existing database.

-- Rename existing maps to boss-name format
UPDATE maps SET name = 'The Spider (Hidden Temple)' WHERE slug = 'hidden-temple';
UPDATE maps SET name = 'The Kitsune (Frozen Valley)' WHERE slug = 'frozen-valley';
UPDATE maps SET name = 'The Oni (Broken Castle)' WHERE slug = 'broken-castle';

-- Add new map
INSERT INTO maps (name, slug, locations) VALUES
  ('The Snake (River Village)', 'river-village', '{"Beach","Rice Paddies","Village"}')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, locations = EXCLUDED.locations;
