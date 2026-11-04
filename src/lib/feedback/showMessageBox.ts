import { messageBoxStore } from "./messageBoxStore";
import type { MessageBoxOptions } from "./types";

export function showMessageBox(options: MessageBoxOptions | string): void {
  messageBoxStore.show(options);
}
