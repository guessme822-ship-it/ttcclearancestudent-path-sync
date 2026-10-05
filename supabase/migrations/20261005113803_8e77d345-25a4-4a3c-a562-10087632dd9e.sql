
CREATE TYPE public.app_role AS ENUM ('admin','staff','student');
CREATE TYPE public.request_status AS ENUM ('in_progress','completed','rejected','cancelled');
CREATE TYPE public.item_status AS ENUM ('not_started','pending','approved','rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  middle_name text,
  contact_number text,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.students (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_number text NOT NULL UNIQUE,
  program text NOT NULL,
  year_level int NOT NULL CHECK (year_level BETWEEN 1 AND 6),
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offices TO authenticated;
GRANT ALL ON public.offices TO service_role;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.office_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_staff TO authenticated;
GRANT ALL ON public.office_staff TO service_role;
ALTER TABLE public.office_staff ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  school_year text NOT NULL DEFAULT '2026-2027',
  semester text NOT NULL DEFAULT '1st Semester',
  allow_academic_edit boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clearance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(user_id) ON DELETE CASCADE,
  reference_no text NOT NULL UNIQUE,
  school_year text NOT NULL,
  semester text NOT NULL,
  status public.request_status NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clearance_requests TO authenticated;
GRANT ALL ON public.clearance_requests TO service_role;
ALTER TABLE public.clearance_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.clearance_requests(student_id);

CREATE TABLE public.clearance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.clearance_requests(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE RESTRICT,
  sort_order int NOT NULL DEFAULT 0,
  status public.item_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, office_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clearance_items TO authenticated;
GRANT ALL ON public.clearance_items TO service_role;
ALTER TABLE public.clearance_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.clearance_items(office_id, status);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  kind text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.notifications(user_id, created_at DESC);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  request_id uuid REFERENCES public.clearance_requests(id) ON DELETE SET NULL,
  office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  previous_status text,
  new_status text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.activity_logs(created_at DESC);

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.staff_office_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT office_id FROM public.office_staff WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.staff_can_see_request(_user_id uuid, _request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clearance_items ci JOIN public.office_staff os ON os.office_id = ci.office_id
    WHERE ci.request_id = _request_id AND os.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.staff_can_see_student(_user_id uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clearance_requests cr
    JOIN public.clearance_items ci ON ci.request_id = cr.id
    JOIN public.office_staff os ON os.office_id = ci.office_id
    WHERE cr.student_id = _student AND os.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_personnel(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;

-- Policies: profiles
CREATE POLICY "profiles read" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_personnel(id)
  OR public.staff_can_see_student(auth.uid(), id));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles admin all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR role IN ('admin','staff'));
CREATE POLICY "roles admin" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- students
CREATE POLICY "students read" ON public.students FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.staff_can_see_student(auth.uid(), user_id));
CREATE POLICY "students update own" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "students admin" ON public.students FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- offices / office_staff / settings
CREATE POLICY "offices read" ON public.offices FOR SELECT TO authenticated USING (true);
CREATE POLICY "offices admin" ON public.offices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "office_staff read" ON public.office_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_staff admin" ON public.office_staff FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "settings read" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings admin" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- requests / items (writes only via functions, admin may delete)
CREATE POLICY "requests read" ON public.clearance_requests FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.staff_can_see_request(auth.uid(), id));
CREATE POLICY "requests admin delete" ON public.clearance_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "items read" ON public.clearance_items FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.clearance_requests r WHERE r.id = request_id AND r.student_id = auth.uid())
  OR public.staff_can_see_request(auth.uid(), request_id));

-- notifications
CREATE POLICY "notif own read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif own update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif own delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- activity logs
CREATE POLICY "logs read" ON public.activity_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR actor_id = auth.uid()
  OR (request_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.clearance_requests r WHERE r.id = request_id AND r.student_id = auth.uid()))
  OR (request_id IS NOT NULL AND public.staff_can_see_request(auth.uid(), request_id)));

-- Guard sensitive columns for non-admins
CREATE OR REPLACE FUNCTION public.guard_profile_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.is_active := OLD.is_active; NEW.is_demo := OLD.is_demo; NEW.email := OLD.email; NEW.id := OLD.id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_profile BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

CREATE OR REPLACE FUNCTION public.guard_student_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allow boolean;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.student_number := OLD.student_number; NEW.user_id := OLD.user_id;
    SELECT allow_academic_edit INTO allow FROM public.settings WHERE id = 1;
    IF NOT coalesce(allow,false) THEN
      NEW.program := OLD.program; NEW.year_level := OLD.year_level; NEW.section := OLD.section;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_student BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.guard_student_update();

-- New user -> profile, role, student record
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb); r public.app_role;
BEGIN
  r := coalesce(nullif(m->>'role','')::public.app_role, 'student');
  -- Self-registration can only produce students; elevated roles come from admin tools (app_metadata)
  IF coalesce(NEW.raw_app_meta_data->>'created_by_admin','false') <> 'true' THEN r := 'student'; END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, middle_name, contact_number, is_demo)
  VALUES (NEW.id, NEW.email, coalesce(m->>'first_name',''), coalesce(m->>'last_name',''), m->>'middle_name', m->>'contact_number',
    coalesce((NEW.raw_app_meta_data->>'is_demo')::boolean, false));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r);
  IF r = 'student' AND coalesce(m->>'student_number','') <> '' THEN
    INSERT INTO public.students (user_id, student_number, program, year_level, section)
    VALUES (NEW.id, m->>'student_number', coalesce(m->>'program','Unassigned'), coalesce((m->>'year_level')::int,1), m->>'section');
  END IF;
  IF r = 'staff' AND coalesce(m->>'office_id','') <> '' THEN
    INSERT INTO public.office_staff (office_id, user_id) VALUES ((m->>'office_id')::uuid, NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Internal helpers
CREATE OR REPLACE FUNCTION public._notify(_user uuid, _title text, _body text, _link text, _kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, title, body, link, kind) VALUES (_user, _title, _body, _link, _kind)
$$;
REVOKE EXECUTE ON FUNCTION public._notify(uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_activity(_action text, _details text DEFAULT NULL, _office uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  INSERT INTO public.activity_logs (actor_id, action, details, office_id) VALUES (auth.uid(), left(_action,200), left(_details,1000), _office);
END $$;

-- Student submits clearance
CREATE OR REPLACE FUNCTION public.submit_clearance() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); s record; req uuid; ref text; sy text; sem text; o record; n int := 0; nm text;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'student') THEN RAISE EXCEPTION 'Only students can request clearance'; END IF;
  IF NOT (SELECT is_active FROM public.profiles WHERE id = uid) THEN RAISE EXCEPTION 'Your account is inactive'; END IF;
  SELECT * INTO s FROM public.students WHERE user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your student record is incomplete. Please contact the registrar.'; END IF;
  IF EXISTS (SELECT 1 FROM public.clearance_requests WHERE student_id = uid AND status IN ('in_progress','rejected')) THEN
    RAISE EXCEPTION 'You already have an active clearance request'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.offices WHERE is_active) THEN RAISE EXCEPTION 'No clearance offices are configured yet'; END IF;
  SELECT school_year, semester INTO sy, sem FROM public.settings WHERE id = 1;
  ref := 'TCC-' || to_char(now(),'YYYY') || '-' || upper(substr(md5(gen_random_uuid()::text),1,6));
  INSERT INTO public.clearance_requests (student_id, reference_no, school_year, semester) VALUES (uid, ref, sy, sem) RETURNING id INTO req;
  SELECT trim(first_name || ' ' || last_name) INTO nm FROM public.profiles WHERE id = uid;
  FOR o IN SELECT * FROM public.offices WHERE is_active ORDER BY sort_order, name LOOP
    n := n + 1;
    INSERT INTO public.clearance_items (request_id, office_id, sort_order) VALUES (req, o.id, n);
    PERFORM public._notify(os.user_id, 'New clearance request', nm || ' (' || s.student_number || ') needs ' || o.name || ' review.', '/staff/requests/' || req, 'info')
      FROM public.office_staff os WHERE os.office_id = o.id;
  END LOOP;
  PERFORM public._notify(uid, 'Clearance request submitted', 'Reference ' || ref || ' was sent to ' || n || ' offices.', '/student/status', 'success');
  INSERT INTO public.activity_logs (actor_id, action, request_id, new_status, details)
    VALUES (uid, 'Student submitted clearance request', req, 'in_progress', ref);
  RETURN req;
END $$;

-- Recompute overall status
CREATE OR REPLACE FUNCTION public._recompute_request(_req uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total int; approved int; rejected int; old public.request_status; newst public.request_status; r record;
BEGIN
  SELECT * INTO r FROM public.clearance_requests WHERE id = _req;
  old := r.status;
  SELECT count(*), count(*) FILTER (WHERE status='approved'), count(*) FILTER (WHERE status='rejected')
    INTO total, approved, rejected FROM public.clearance_items WHERE request_id = _req;
  IF total > 0 AND approved = total THEN newst := 'completed';
  ELSIF rejected > 0 THEN newst := 'rejected';
  ELSE newst := 'in_progress'; END IF;
  UPDATE public.clearance_requests SET status = newst, updated_at = now(),
    completed_at = CASE WHEN newst='completed' THEN coalesce(completed_at, now()) ELSE NULL END WHERE id = _req;
  IF newst = 'completed' AND old <> 'completed' THEN
    PERFORM public._notify(r.student_id, 'Clearance completed!', 'All offices approved clearance ' || r.reference_no || '.', '/student/status', 'success');
    INSERT INTO public.activity_logs (actor_id, action, request_id, previous_status, new_status, details)
      VALUES (auth.uid(), 'Clearance completed', _req, old::text, 'completed', r.reference_no);
    PERFORM public._notify(ur.user_id, 'Clearance completed', 'Clearance ' || r.reference_no || ' is fully approved.', '/admin/requests', 'info')
      FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public._recompute_request(uuid) FROM PUBLIC, anon, authenticated;

-- Staff/admin review
CREATE OR REPLACE FUNCTION public.review_clearance_item(_item uuid, _decision text, _remarks text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); it record; req record; off record; oldst text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT (SELECT is_active FROM public.profiles WHERE id = uid) THEN RAISE EXCEPTION 'Your account is inactive'; END IF;
  IF _decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT * INTO it FROM public.clearance_items WHERE id = _item FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Clearance item not found'; END IF;
  IF NOT (public.has_role(uid,'admin') OR (public.has_role(uid,'staff') AND public.staff_office_id(uid) = it.office_id)) THEN
    RAISE EXCEPTION 'You are not authorized to review this office'; END IF;
  IF it.status <> 'pending' THEN RAISE EXCEPTION 'This item has already been reviewed'; END IF;
  IF _decision = 'rejected' AND length(trim(coalesce(_remarks,''))) < 5 THEN RAISE EXCEPTION 'Please give a rejection reason (at least 5 characters)'; END IF;
  SELECT * INTO req FROM public.clearance_requests WHERE id = it.request_id;
  IF req.status = 'cancelled' THEN RAISE EXCEPTION 'This request was cancelled'; END IF;
  SELECT * INTO off FROM public.offices WHERE id = it.office_id;
  oldst := it.status::text;
  UPDATE public.clearance_items SET status = _decision::public.item_status, reviewed_by = uid, reviewed_at = now(),
    remarks = nullif(left(trim(coalesce(_remarks,'')),1000),''), updated_at = now() WHERE id = _item;
  INSERT INTO public.activity_logs (actor_id, action, request_id, office_id, previous_status, new_status, details)
    VALUES (uid, off.name || CASE WHEN _decision='approved' THEN ' approved clearance' ELSE ' rejected clearance' END,
      req.id, off.id, oldst, _decision, nullif(trim(coalesce(_remarks,'')),''));
  IF _decision = 'approved' THEN
    PERFORM public._notify(req.student_id, off.name || ' approved your clearance', coalesce(nullif(trim(_remarks),''), 'No further action needed for this office.'), '/student/status', 'success');
  ELSE
    PERFORM public._notify(req.student_id, off.name || ' rejected your clearance — action required', _remarks, '/student/status', 'error');
  END IF;
  PERFORM public._recompute_request(req.id);
END $$;

-- Student resubmits a rejected item after addressing it
CREATE OR REPLACE FUNCTION public.resubmit_clearance_item(_item uuid, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); it record; req record; off record;
BEGIN
  SELECT * INTO it FROM public.clearance_items WHERE id = _item FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  SELECT * INTO req FROM public.clearance_requests WHERE id = it.request_id;
  IF req.student_id <> uid THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF it.status <> 'rejected' THEN RAISE EXCEPTION 'Only rejected items can be resubmitted'; END IF;
  SELECT * INTO off FROM public.offices WHERE id = it.office_id;
  UPDATE public.clearance_items SET status = 'pending', updated_at = now() WHERE id = _item;
  INSERT INTO public.activity_logs (actor_id, action, request_id, office_id, previous_status, new_status, details)
    VALUES (uid, 'Student resubmitted to ' || off.name, req.id, off.id, 'rejected', 'pending', nullif(left(trim(coalesce(_note,'')),500),''));
  PERFORM public._notify(os.user_id, 'Clearance resubmitted', 'A student resubmitted to ' || off.name || coalesce(': ' || nullif(trim(_note),''), '.'), '/staff/requests/' || req.id, 'info')
    FROM public.office_staff os WHERE os.office_id = off.id;
  PERFORM public._recompute_request(req.id);
END $$;

-- Student cancels active request
CREATE OR REPLACE FUNCTION public.cancel_clearance(_req uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.clearance_requests WHERE id = _req FOR UPDATE;
  IF NOT FOUND OR (r.student_id <> auth.uid() AND NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF r.status = 'completed' THEN RAISE EXCEPTION 'Completed clearances cannot be cancelled'; END IF;
  UPDATE public.clearance_requests SET status = 'cancelled', updated_at = now() WHERE id = _req;
  INSERT INTO public.activity_logs (actor_id, action, request_id, previous_status, new_status, details)
    VALUES (auth.uid(), 'Clearance request cancelled', _req, r.status::text, 'cancelled', r.reference_no);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_clearance() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.review_clearance_item(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resubmit_clearance_item(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_clearance(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_activity(text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_clearance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_clearance_item(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_clearance_item(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_clearance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity(text,text,uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

INSERT INTO public.settings (id) VALUES (1);
INSERT INTO public.offices (name, description, sort_order) VALUES
 ('Registrar', 'Verifies academic records, grades, and enrollment documents.', 1),
 ('Cashier', 'Confirms tuition, miscellaneous fees, and outstanding balances are settled.', 2),
 ('Library', 'Checks for unreturned books and unpaid library fines.', 3),
 ('Guidance Office', 'Confirms the exit interview and any pending counseling requirements.', 4),
 ('Department Office', 'Program head confirms departmental requirements and borrowed equipment.', 5);
