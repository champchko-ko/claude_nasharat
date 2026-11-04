import { describe, it, expect } from "vitest";
import { computeRestoreDiff } from "./computeRestoreDiff";
import { buildBackupManifest } from "./buildBackupManifest";
import type { DatabaseBackupPayload } from "./types";

type Row = Record<string, unknown>;

function makeQuery(rows: Row[]) {
  let start = 0;
  let end = rows.length - 1;

  const query = {
    select: () => query,
    eq: () => query,
    in: () => query,
    order: () => query,
    returns: () => query,
    range: (from: number, to: number) => {
      start = from;
      end = to;
      return query;
    },
    then: (resolve: (value: { data: Row[]; error: unknown }) => unknown) =>
      resolve({ data: rows.slice(start, end + 1), error: null }),
  };

  return query;
}

function makeAdmin(existing: Record<string, Row[]>) {
  return {
    from: (table: string) => ({
      select: () => makeQuery(existing[table] ?? []),
    }),
  } as never;
}

function makePayload(
  tables: DatabaseBackupPayload["tables"],
  scope: "platform" | "school" = "platform",
): DatabaseBackupPayload {
  return {
    metadata: buildBackupManifest({
      exportedBy: "user-1",
      scope,
      schoolId: scope === "school" ? "school-1" : null,
      schoolName: null,
      tables,
    }),
    tables,
  };
}

describe("computeRestoreDiff", () => {
  it("separates new rows from overwrites and counts untouched rows", async () => {
    const payload = makePayload({
      departments: [
        { id: "d1", name_en: "Existing" },
        { id: "d2", name_en: "New" },
      ],
      circulars: [{ id: "c1", title: "New circular" }],
    });

    const diff = await computeRestoreDiff(
      makeAdmin({
        departments: [{ id: "d1" }, { id: "d3" }],
        circulars: [],
      }),
      payload,
    );

    expect(diff.perTable.departments).toEqual({ added: 1, overwritten: 1, untouched: 1 });
    expect(diff.perTable.circulars).toEqual({ added: 1, overwritten: 0, untouched: 0 });
    expect(diff).toMatchObject({ added: 2, overwritten: 1, untouched: 1 });
  });

  it("uses the composite key of link tables", async () => {
    const payload = makePayload({
      role_permissions: [
        { role_id: "r1", permission_key: "circular.view" },
        { role_id: "r1", permission_key: "circular.create" },
      ],
    });

    const diff = await computeRestoreDiff(
      makeAdmin({
        role_permissions: [{ role_id: "r1", permission_key: "circular.view" }],
      }),
      payload,
    );

    expect(diff.perTable.role_permissions).toEqual({
      added: 1,
      overwritten: 1,
      untouched: 0,
    });
  });
});
