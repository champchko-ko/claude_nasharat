import { messageBoxStore } from "./messageBoxStore";

export function confirmMessageBox(): void {
  messageBoxStore.confirm();
}
