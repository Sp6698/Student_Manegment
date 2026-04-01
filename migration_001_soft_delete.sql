-- ============================================================
-- Migration 001: Soft Delete Support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add deleted_at to users (soft delete)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add deleted_at to marks (soft delete)
ALTER TABLE marks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Index for fast filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marks_deleted_at ON marks(deleted_at) WHERE deleted_at IS NULL;

-- Update existing queries to filter deleted records via views (optional but clean)
-- These views make it easy to always query non-deleted records

CREATE OR REPLACE VIEW active_users AS
  SELECT * FROM users WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_marks AS
  SELECT * FROM marks WHERE deleted_at IS NULL;
