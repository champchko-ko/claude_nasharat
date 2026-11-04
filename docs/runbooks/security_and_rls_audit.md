# Security & Row-Level Security (RLS) Independent Audit

## 1. Multi-Tenant School Isolation

- **Invariant**: Every operational table includes `school_id uuid not null references public.schools(id)`.
- **Policy Enforcement**: RLS policies enforce `school_id = (select school_id from public.profiles where id = auth.uid())` or equivalent security functions (`public.has_permission(...)`).
- **Denial Test**: Cross-school queries from authenticated users return 0 rows or error.

## 2. Departmental Isolation & Respondent Privacy

- **Circular Responses**:
  - Department heads see only their own department's responses.
  - School Administrators see aggregated/grouped department counts.
  - Staff members without `circular.view_responses` cannot query `public.circular_responses`.
- **Maintenance Tickets**:
  - Non-administrative staff only view tickets they reported (`reporter_id = auth.uid()`).
  - Maintenance operators only view tickets currently assigned to them (`assigned_operator_id = auth.uid()`).
  - Dispatchers/admins with `maintenance.assign` can view all school tickets.

## 3. Storage Bucket Security Matrix

- **`circular-attachments`**:
  - Read: Allowed only to users belonging to the school and targeted departments.
  - Write: Allowed only to users with `circular.create`.
  - Max file size: 10 MB (PDF, JPG, PNG, WebP).
- **`maintenance-photos`**:
  - Read: Allowed only to ticket reporter, assigned operator, and school admins.
  - Write: Allowed during ticket creation and completion evidence.
  - Max file size: 10 MB.
- **`public-assets`**:
  - Read: Public (`anon, authenticated`).
  - Write: Restricted to school administrator / calendar manager.
  - Max file size: 5 MB.

## 4. Input Validation & Injection Resistance

- **SQL Injection**: Prevented via parameterized Postgrest/Supabase query builders; raw string concatenation is prohibited.
- **CSV Formula Injection**: Prevented via `escapeCsvCell.ts` which prepends `'` to cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`.
- **Arabic Text Encoding**: Guaranteed via UTF-8 Byte Order Mark (`\uFEFF`) in `buildCsvDocument.ts`.
- **XSS & Content Security**: React/Next.js automatically escapes JSX interpolations; unsafe `dangerouslySetInnerHTML` is not used.
