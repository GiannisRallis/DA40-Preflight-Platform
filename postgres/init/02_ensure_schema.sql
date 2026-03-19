-- =============================================================
-- 02_ensure_schema.sql — Ensures RLS policies are created
-- Runs AFTER GoTrue initializes (which creates auth.uid() function)
-- Idempotent: safe to run on every deployment/update
-- =============================================================

-- ── Row Level Security Policies ──────────────────────────────
-- CRITICAL: These MUST exist for authenticated users to access their data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'auth' AND p.proname = 'uid'
    ) THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION public.is_instructor(user_id UUID)
            RETURNS BOOLEAN
            LANGUAGE sql
            STABLE
            SECURITY DEFINER
            SET search_path = public
            AS ''SELECT EXISTS (
                SELECT 1
                FROM public.profiles p
                WHERE p.id = user_id AND p.role = ''''instructor''''
            )''
        ';
        EXECUTE 'REVOKE ALL ON FUNCTION public.is_instructor(UUID) FROM PUBLIC';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_instructor(UUID) TO anon, authenticated, service_role';

        EXECUTE 'DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "profiles_instructor_select" ON public.profiles';

        EXECUTE 'CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT USING (auth.uid() = id)';
        EXECUTE 'CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)';
        EXECUTE 'CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id)';
        EXECUTE 'CREATE POLICY "profiles_instructor_select" ON public.profiles
            FOR SELECT USING (public.is_instructor(auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "submissions_student_all" ON public.submissions';
        EXECUTE 'DROP POLICY IF EXISTS "submissions_instructor_select" ON public.submissions';
        EXECUTE 'DROP POLICY IF EXISTS "submissions_instructor_update" ON public.submissions';

        EXECUTE 'CREATE POLICY "submissions_student_all" ON public.submissions FOR ALL USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "submissions_instructor_select" ON public.submissions
            FOR SELECT USING (public.is_instructor(auth.uid()))';
        EXECUTE 'CREATE POLICY "submissions_instructor_update" ON public.submissions
            FOR UPDATE USING (public.is_instructor(auth.uid()))';
    END IF;
END $$;

-- ── Trigger + Backfill when auth.users exists ────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
            FROM information_schema.tables
         WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
        EXECUTE 'CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';

        EXECUTE '
            INSERT INTO public.profiles (id, email, full_name, role, school_name, license_num)
            SELECT
                u.id,
                u.email,
                COALESCE(u.raw_user_meta_data->>''full_name'', split_part(u.email, ''@'', 1)),
                COALESCE(NULLIF(u.raw_user_meta_data->>''role'', ''''), ''student''),
                NULLIF(u.raw_user_meta_data->>''school_name'', ''''),
                NULLIF(u.raw_user_meta_data->>''license_num'', '''')
            FROM auth.users u
            ON CONFLICT (id) DO NOTHING
        ';
    END IF;
END $$;
