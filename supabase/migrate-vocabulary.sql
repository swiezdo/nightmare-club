-- Migration: Rename stages → rounds, rounds → waves
-- Run this in the Supabase SQL Editor

BEGIN;

-- Step 1: Rename tables (order matters due to FK references)
-- First rename 'rounds' to 'waves' (child table)
ALTER TABLE rounds RENAME TO waves;
-- Then rename 'stages' to 'rounds' (parent table)
ALTER TABLE stages RENAME TO rounds;

-- Step 2: Rename columns
ALTER TABLE rounds RENAME COLUMN stage_number TO round_number;
ALTER TABLE waves RENAME COLUMN stage_id TO round_id;
ALTER TABLE waves RENAME COLUMN round_number TO wave_number;

-- Step 3: Update check constraint on waves to allow 1-4 (was 1-3)
ALTER TABLE waves DROP CONSTRAINT IF EXISTS rounds_round_number_check;
ALTER TABLE waves ADD CONSTRAINT waves_wave_number_check CHECK (wave_number BETWEEN 1 AND 4);

-- Step 4: Rename unique constraints for clarity (optional but clean)
-- The FK and unique constraints auto-follow the table rename

COMMIT;
