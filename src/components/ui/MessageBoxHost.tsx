"use client";

import { useEffect } from "react";
import { initMessageBoxBridge } from "@/lib/feedback/initMessageBoxBridge";
import { AppMessageBox } from "./AppMessageBox";

export function MessageBoxHost() {
  useEffect(() => {
    initMessageBoxBridge();
  }, []);

  return <AppMessageBox />;
}
