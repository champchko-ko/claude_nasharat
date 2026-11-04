export type MessageBoxType = "success" | "error" | "info" | "warning";

export interface MessageBoxOptions {
  message: string;
  title?: string;
  type?: MessageBoxType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface MessageBoxState extends MessageBoxOptions {
  isOpen: boolean;
  type: MessageBoxType;
}
