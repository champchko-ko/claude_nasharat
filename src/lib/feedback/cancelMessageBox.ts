import { messageBoxStore } from "./messageBoxStore";

export function cancelMessageBox(): void {
  messageBoxStore.cancel();
}
