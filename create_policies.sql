DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines 
             WHERE routine_schema='auth' AND routine_name='uid') THEN
    RAISE NOTICE 'auth.uid() exists! Creating RLS policies...';
    
    DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
    CREATE POLICY "profiles_own_select" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
    RAISE NOTICE 'Created profiles_own_select policy';
    
    DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
    CREATE POLICY "profiles_own_update" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "profiles_instructor_select" ON public.profiles;
    CREATE POLICY "profiles_instructor_select" ON public.profiles
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'instructor')
        );
    
    DROP POLICY IF EXISTS "submissions_student_all" ON public.submissions;
    CREATE POLICY "submissions_student_all" ON public.submissions
        FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "submissions_instructor_select" ON public.submissions;
    CREATE POLICY "submissions_instructor_select" ON public.submissions
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'instructor')
        );
    
    DROP POLICY IF EXISTS "submissions_instructor_update" ON public.submissions;
    CREATE POLICY "submissions_instructor_update" ON public.submissions
        FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'instructor')
        );
    
    RAISE NOTICE 'All RLS policies created successfully!';
  ELSE
    RAISE NOTICE 'auth.uid() does NOT exist - skipping RLS policies';
  END IF;
END $$;
