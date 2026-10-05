
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_office_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_can_see_request(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_can_see_student(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_personnel(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_office_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_can_see_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_can_see_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_personnel(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_student_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._notify(uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._recompute_request(uuid) FROM PUBLIC, anon, authenticated;
