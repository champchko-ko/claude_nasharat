-- 0044: `public-assets` no longer accepts SVG (finding H-18).
--
-- SVG is an active document format: it can carry <script>, external
-- references and embedded HTML. Because `public-assets` is world readable,
-- any calendar manager or school manager could store script-capable content
-- under a public URL and have it served from the Supabase origin.
--
-- The application now rejects SVG before upload (bucket + MIME + magic
-- bytes), but the bucket list is the last line of defence: a direct Storage
-- API call bypasses the app entirely. Forward-only: existing objects are left
-- in place; they are not deleted by a migration. `npm run storage:sweep`
-- reports public-assets objects that no row references.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'public-assets';

-- The other two buckets already exclude SVG; restate them so the intended
-- list is visible next to the change and a future edit cannot reintroduce it
-- by copy/paste.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'circular-attachments';

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'maintenance-photos';
