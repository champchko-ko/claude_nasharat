import type { MessageBoxOptions, MessageBoxState } from "./types";

let currentState: MessageBoxState = {
  isOpen: false,
  message: "",
  type: "info",
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const messageBoxStore = {
  getState(): MessageBoxState {
    return currentState;
  },

  show(options: MessageBoxOptions | string): void {
    const opts: MessageBoxOptions = typeof options === "string" ? { message: options } : options;

    currentState = {
      isOpen: true,
      message: opts.message,
      title: opts.title,
      type: opts.type ?? "info",
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
      showCancel: opts.showCancel,
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
    };
    notify();
  },

  confirm(): void {
    const callback = currentState.onConfirm;
    currentState = {
      ...currentState,
      isOpen: false,
      onConfirm: undefined,
      onCancel: undefined,
    };
    notify();
    callback?.();
  },

  cancel(): void {
    const callback = currentState.onCancel;
    currentState = {
      ...currentState,
      isOpen: false,
      onConfirm: undefined,
      onCancel: undefined,
    };
    notify();
    callback?.();
  },

  close(): void {
    if (currentState.showCancel) {
      this.cancel();
    } else {
      this.confirm();
    }
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
