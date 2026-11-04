import { messageBoxStore } from "./messageBoxStore";
import type { MessageBoxOptions } from "./types";

export function showConfirmBox(options: string | MessageBoxOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const opts = typeof options === "string" ? { message: options } : options;
    messageBoxStore.show({
      ...opts,
      type: opts.type ?? "warning",
      showCancel: true,
      onConfirm: () => {
        opts.onConfirm?.();
        resolve(true);
      },
      onCancel: () => {
        opts.onCancel?.();
        resolve(false);
      },
    });
  });
}
