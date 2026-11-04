import { messageBoxStore } from "./messageBoxStore";

export function closeMessageBox(): void {
  messageBoxStore.close();
}
