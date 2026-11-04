import { describe, expect, it } from "vitest";
import { showConfirmBox } from "./showConfirmBox";
import { messageBoxStore } from "./messageBoxStore";

describe("showConfirmBox", () => {
  it("resolves to true when confirm is triggered", async () => {
    const promise = showConfirmBox({
      message: "Are you sure?",
      type: "warning",
    });

    const state = messageBoxStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.showCancel).toBe(true);
    expect(state.message).toBe("Are you sure?");

    messageBoxStore.confirm();
    const result = await promise;
    expect(result).toBe(true);
  });

  it("resolves to false when cancel is triggered", async () => {
    const promise = showConfirmBox({
      message: "Are you sure?",
      type: "warning",
    });

    messageBoxStore.cancel();
    const result = await promise;
    expect(result).toBe(false);
  });
});
