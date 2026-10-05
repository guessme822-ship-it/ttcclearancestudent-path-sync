
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, middle_name, contact_number)
  VALUES (NEW.id, NEW.email, left(coalesce(m->>'first_name',''),80), left(coalesce(m->>'last_name',''),80), left(m->>'middle_name',80), left(m->>'contact_number',30));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  IF coalesce(m->>'student_number','') <> '' AND coalesce(m->>'role','student') = 'student' THEN
    INSERT INTO public.students (user_id, student_number, program, year_level, section)
    VALUES (NEW.id, left(m->>'student_number',30), left(coalesce(m->>'program','Unassigned'),120),
      LEAST(GREATEST(coalesce(nullif(m->>'year_level','')::int,1),1),6), left(m->>'section',20))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
