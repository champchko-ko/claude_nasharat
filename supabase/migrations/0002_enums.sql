-- 0002: Enumerated domains (build_plan.md §5). Statuses are closed sets by design.

create type public.circular_status as enum (
  'draft', 'published', 'in_progress', 'completed', 'overdue', 'archived', 'cancelled'
);

create type public.circular_response_type as enum ('acknowledgement', 'approval', 'task');

create type public.circular_response_status as enum (
  'pending', 'acknowledged', 'approved', 'rejected', 'completed', 'not_applicable'
);

create type public.circular_priority as enum ('low', 'normal', 'high', 'urgent');

create type public.maintenance_priority as enum ('emergency', 'urgent', 'medium', 'deferrable');

create type public.maintenance_status as enum (
  'submitted', 'triaged', 'assigned', 'in_progress', 'waiting_for_parts',
  'resolved', 'closed', 'reopened', 'rejected'
);

create type public.calendar_visibility as enum ('public', 'internal');

create type public.calendar_status as enum ('draft', 'published', 'cancelled', 'archived');
