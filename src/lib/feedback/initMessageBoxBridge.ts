import { toast } from "sonner";
import { showMessageBox } from "./showMessageBox";
import { extractMessageText } from "./extractMessageText";

let initialized = false;

export function initMessageBoxBridge(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  toast.success = (message: unknown) => {
    showMessageBox({ message: extractMessageText(message), type: "success" });
    return "msgbox-toast";
  };

  toast.error = (message: unknown) => {
    showMessageBox({ message: extractMessageText(message), type: "error" });
    return "msgbox-toast";
  };

  toast.info = (message: unknown) => {
    showMessageBox({ message: extractMessageText(message), type: "info" });
    return "msgbox-toast";
  };

  toast.warning = (message: unknown) => {
    showMessageBox({ message: extractMessageText(message), type: "warning" });
    return "msgbox-toast";
  };

  window.alert = (message?: unknown) => {
    showMessageBox({ message: extractMessageText(message), type: "info" });
  };
}
