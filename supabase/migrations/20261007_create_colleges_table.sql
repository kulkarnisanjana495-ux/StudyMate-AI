-- StudyMate AI: Engineering Colleges Table and Safe Profile Reference Migration
-- Compatible with AISHE / Government of India Higher Education Data

-- 1. Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    aishe_code TEXT NOT NULL UNIQUE,
    college_type TEXT NOT NULL DEFAULT 'Engineering Institution',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast partial, state, and city searches
CREATE INDEX IF NOT EXISTS idx_colleges_name_search ON public.colleges USING gin (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_colleges_state ON public.colleges (state);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON public.colleges (city);
CREATE INDEX IF NOT EXISTS idx_colleges_aishe_code ON public.colleges (aishe_code);

-- Enable Row Level Security (RLS) for public read access
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to colleges directory"
    ON public.colleges
    FOR SELECT
    USING (true);

-- 2. Safely add college_id to public.profiles without breaking existing users
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS college_id TEXT REFERENCES public.colleges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles (college_id);
