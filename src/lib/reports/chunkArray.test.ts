import { describe, it, expect } from "vitest";
import { chunkArray } from "./chunkArray";

describe("chunkArray", () => {
  it("returns empty array when input is empty", () => {
    expect(chunkArray([])).toEqual([]);
  });

  it("returns single chunk when items length is less than chunk size", () => {
    const items = [1, 2, 3];
    expect(chunkArray(items, 10)).toEqual([[1, 2, 3]]);
  });

  it("splits items into exact chunks of specified size", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(chunkArray(items, 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("handles remainder properly when length is not cleanly divisible", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect(chunkArray(items, 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });

  it("defaults to chunkSize = 100", () => {
    const items = Array.from({ length: 250 }, (_, i) => i);
    const chunks = chunkArray(items);
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(100);
    expect(chunks[1].length).toBe(100);
    expect(chunks[2].length).toBe(50);
  });

  it("throws if chunkSize is <= 0", () => {
    expect(() => chunkArray([1, 2], 0)).toThrow("chunkSize must be greater than 0");
    expect(() => chunkArray([1, 2], -5)).toThrow("chunkSize must be greater than 0");
  });
});
