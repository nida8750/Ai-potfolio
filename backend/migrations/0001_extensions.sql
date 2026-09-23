-- Phase 2: PostgreSQL extensions for the Nida AI backend.
-- Apply in the Supabase SQL editor (or CLI) after frontend migrations 0001–0003
-- when those already exist. Safe to re-run.

create extension if not exists pgcrypto;
create extension if not exists vector;
