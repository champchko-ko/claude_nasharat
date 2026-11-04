"use client";

import { useSyncExternalStore } from "react";
import { messageBoxStore } from "./messageBoxStore";
import type { MessageBoxState } from "./types";

const emptyServerState: MessageBoxState = {
  isOpen: false,
  message: "",
  type: "info",
};

export function useMessageBoxState(): MessageBoxState {
  return useSyncExternalStore(
    messageBoxStore.subscribe,
    messageBoxStore.getState,
    () => emptyServerState,
  );
}
