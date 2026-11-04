// Reports (and optionally deletes) storage objects that no database row
// references. Findings H-16/H-18: deleting a row used to leave the object
// behind, and replacing a logo or calendar image never removed the old file.
//
// Dry run by default. Pass --delete to remove the orphans. Local stack only:
// the credentials come from `supabase status`, and a non-loopback host is
// refused, exactly like the RLS battery.
//
//   npm run storage:sweep
//   npm run storage:sweep -- --delete
import { createClient } from "@supabase/supabase-js";
import { readLocalSupabaseEnv } from "./readLocalSupabaseEnv.mjs";
import { assertLocalSupabaseUrl } from "./assertLocalSupabaseUrl.mjs";

const REFERENCES = [
  ["circular-attachments", "circular_attachments", "path"],
  ["maintenance-photos", "maintenance_attachments", "path"],
  ["public-assets", "schools", "logo_path"],
  ["public-assets", "calendar_events", "image_path"],
  ["public-assets", "school_achievements", "image_path"],
];

const PAGE = 100;
const DELETE_CHUNK = 100;
const PRINT_LIMIT = 20;

// `list()` returns one level at a time and marks folders with a null id, so a
// recursive walk is required to see every object.
async function listAllObjects(admin, bucket, prefix = "") {
  const files = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: PAGE,
      offset,
    });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const path = `${prefix}${entry.name}`;
      if (entry.id === null || entry.id === undefined) {
        files.push(...(await listAllObjects(admin, bucket, `${path}/`)));
      } else {
        files.push(path);
      }
    }

    if (data.length < PAGE) break;
    offset += data.length;
  }

  return files;
}

async function collectReferences(admin) {
  const referenced = new Map();

  for (const [bucket, table, column] of REFERENCES) {
    const { data, error } = await admin.from(table).select(column).not(column, "is", null);
    if (error) throw new Error(`read ${table}.${column}: ${error.message}`);

    const paths = referenced.get(bucket) ?? new Set();
    for (const row of data ?? []) paths.add(row[column]);
    referenced.set(bucket, paths);
  }

  return referenced;
}

async function sweepBucket(admin, bucket, referenced, shouldDelete) {
  const objects = await listAllObjects(admin, bucket);
  const orphans = objects.filter((path) => !referenced.has(path));

  console.log(
    `${bucket}: ${objects.length} object(s), ${objects.length - orphans.length} referenced, ${orphans.length} orphaned`,
  );
  for (const path of orphans.slice(0, PRINT_LIMIT)) console.log(`  - ${path}`);
  if (orphans.length > PRINT_LIMIT) console.log(`  … and ${orphans.length - PRINT_LIMIT} more`);

  if (shouldDelete && orphans.length > 0) {
    for (let i = 0; i < orphans.length; i += DELETE_CHUNK) {
      const chunk = orphans.slice(i, i + DELETE_CHUNK);
      const { error } = await admin.storage.from(bucket).remove(chunk);
      if (error) throw new Error(`delete ${bucket}: ${error.message}`);
    }
    console.log(`  deleted ${orphans.length} orphaned object(s)`);
  }

  return orphans.length;
}

async function main() {
  const shouldDelete = process.argv.includes("--delete");
  const env = readLocalSupabaseEnv();
  const url = assertLocalSupabaseUrl(env.API_URL ?? env.SUPABASE_URL);
  const serviceKey = env.SERVICE_ROLE_KEY ?? "";

  if (!serviceKey) {
    throw new Error("The local stack did not report a service-role key. Refusing to run.");
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const referenced = await collectReferences(admin);

  console.log(`Storage sweep against ${url} (local) — ${shouldDelete ? "delete" : "dry run"}`);

  let totalOrphans = 0;
  for (const [bucket, paths] of referenced) {
    totalOrphans += await sweepBucket(admin, bucket, paths, shouldDelete);
  }

  if (totalOrphans === 0) {
    console.log("No orphaned objects found.");
  } else if (!shouldDelete) {
    console.log(`\n${totalOrphans} orphan(s) found. Re-run with --delete to remove them.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
