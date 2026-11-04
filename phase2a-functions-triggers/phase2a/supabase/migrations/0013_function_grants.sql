-- 0013: Who may call what.
-- Functions are executable by PUBLIC by default; close that, then open exactly
-- what each caller needs. Trigger functions need no grant.

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

grant execute on all functions in schema public to authenticated;

-- Anonymous visitors only need to know whether the school is active, so that
-- public-content policies can be evaluated.
grant execute on function public.is_public_school_active() to anon;

-- Server-side tooling (service role) keeps full access.
grant execute on all functions in schema public to service_role;

-- Future functions in this schema are private until granted explicitly.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
