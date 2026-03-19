-- =============================================================
-- DA40 Preflight Platform — Complete Schema  v1
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID        PRIMARY KEY,
    email        TEXT        UNIQUE NOT NULL,
    full_name    TEXT        NOT NULL DEFAULT '',
    role         TEXT        NOT NULL DEFAULT 'student'
                             CHECK (role IN ('instructor','student')),
    school_name  TEXT,
    license_num  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Flight info
    flight_type      TEXT,
    flight_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
    aircraft_reg     TEXT,
    status           TEXT        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft','submitted','reviewed')),

    -- W&B Inputs (POH Table 6.4.3)
    empty_mass_kg    NUMERIC(7,2),
    empty_arm_m      NUMERIC(5,3),
    front_seats_kg   NUMERIC(6,2) DEFAULT 0,
    rear_seats_kg    NUMERIC(6,2) DEFAULT 0,
    baggage_kg       NUMERIC(6,2) DEFAULT 0,
    fuel_mass_kg     NUMERIC(6,2) DEFAULT 0,

    -- W&B Results
    total_mass_r5    NUMERIC(7,2),   -- empty fuel total
    total_mom_r5     NUMERIC(9,2),
    cg_r5            NUMERIC(5,3),
    total_mass_r7    NUMERIC(7,2),   -- full fuel total
    total_mom_r7     NUMERIC(9,2),
    cg_r7            NUMERIC(5,3),
    wb_status        TEXT            CHECK (wb_status IN ('ok','out_of_limits','check_range')),

    -- Performance Inputs
    pressure_alt_ft  NUMERIC(6,0),
    oat_c            NUMERIC(5,1),
    wind_kts         NUMERIC(5,1),
    runway_surface   TEXT,

    -- Performance Results
    to_roll_m        NUMERIC(7,1),
    to_50ft_m        NUMERIC(7,1),
    ldg_roll_m       NUMERIC(7,1),
    ldg_50ft_m       NUMERIC(7,1),
    roc_fpm          NUMERIC(6,0),
    density_alt_ft   NUMERIC(6,0),

    -- Fuel Planning
    power_pct        NUMERIC(4,1),
    fuel_flow_lhr    NUMERIC(5,2),
    flight_time_hr   NUMERIC(5,2),
    trip_fuel_l      NUMERIC(7,2),
    trip_fuel_kg     NUMERIC(7,2),

    -- Instructor Review
    instructor_notes TEXT,
    reviewed_by      UUID            REFERENCES public.profiles(id),
    reviewed_at      TIMESTAMPTZ
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS public.app_schema_migrations (
    version     TEXT        PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.app_schema_migrations (version)
VALUES ('2026-03-18-v1') ON CONFLICT DO NOTHING;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sub_user   ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_date   ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_prof_role  ON public.profiles(role);

-- ── Grants ────────────────────────────────────────────────────
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO anon;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ── RLS enable (policies in 02_ensure_schema.sql) ────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ── Functions ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, school_name, license_num)
    VALUES (
        NEW.id, NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), split_part(NEW.email,'@',1)),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'student'),
        NULLIF(NEW.raw_user_meta_data->>'school_name',''),
        NULLIF(NEW.raw_user_meta_data->>'license_num','')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END; $$;
