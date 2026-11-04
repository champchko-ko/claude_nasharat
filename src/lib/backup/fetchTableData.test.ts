import { describe, it, expect } from "vitest";
import { fetchTableData } from "./fetchTableData";

type Row = Record<string, unknown>;

function makeQuery(
  rows: Row[],
  options: { head: boolean; headCount?: number; failAtOrAfter?: number },
) {
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
    then: (
      resolve: (value: { data: Row[] | null; count?: number | null; error: unknown }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => {
      try {
        if (options.head) {
          return resolve({ data: null, count: options.headCount ?? rows.length, error: null });
        }
        if (options.failAtOrAfter !== undefined && start >= options.failAtOrAfter) {
          return resolve({ data: null, error: { message: "simulated PostgREST failure" } });
        }
        return resolve({ data: rows.slice(start, end + 1), error: null });
      } catch (error) {
        return reject?.(error);
      }
    },
  };

  return query;
}

function makeAdmin(rows: Row[], options: { headCount?: number; failAtOrAfter?: number } = {}) {
  return {
    from: () => ({
      select: (_columns: string, selectOptions?: { head?: boolean }) =>
        makeQuery(rows, { head: Boolean(selectOptions?.head), ...options }),
    }),
  } as never;
}

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({ id: `row-${index}` }));
}

describe("fetchTableData", () => {
  it("pages through more rows than PostgREST returns in one response", async () => {
    const rows = makeRows(2500);

    const result = await fetchTableData(makeAdmin(rows), "departments");

    expect(result).toHaveLength(2500);
    expect(result[0]).toEqual({ id: "row-0" });
    expect(result[2499]).toEqual({ id: "row-2499" });
  });

  it("terminates on an exact multiple of the page size", async () => {
    const result = await fetchTableData(makeAdmin(makeRows(1000)), "departments");
    expect(result).toHaveLength(1000);
  });

  it("throws when any page fails instead of returning a short table", async () => {
    await expect(
      fetchTableData(makeAdmin(makeRows(2500), { failAtOrAfter: 1000 }), "departments"),
    ).rejects.toThrow(/simulated PostgREST failure/);
  });

  it("throws when the paged rows do not reconcile with the exact count", async () => {
    await expect(
      fetchTableData(makeAdmin(makeRows(2500), { headCount: 2600 }), "departments"),
    ).rejects.toThrow(/read 2500 rows but the table holds 2600/);
  });

  it("refuses a table that is not part of the backup contract", async () => {
    await expect(fetchTableData(makeAdmin([]), "auth_users")).rejects.toThrow(
      /not part of the backup contract/,
    );
  });
});
