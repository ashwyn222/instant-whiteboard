import { create } from 'zustand';

interface BaseRequest {
  title: string;
  description?: string;
}

interface PromptRequest extends BaseRequest {
  kind: 'prompt';
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: string | null) => void;
}

interface ConfirmRequest extends BaseRequest {
  kind: 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  resolve: (value: boolean) => void;
}

interface AlertRequest extends BaseRequest {
  kind: 'alert';
  message?: string;
  confirmLabel?: string;
  resolve: () => void;
}

export type DialogRequest = PromptRequest | ConfirmRequest | AlertRequest;

interface DialogState {
  request: DialogRequest | null;
  open: (request: DialogRequest) => void;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
}));

export function dialogPrompt(
  options: Omit<PromptRequest, 'kind' | 'resolve'>,
): Promise<string | null> {
  return new Promise((resolve) => {
    useDialogStore.getState().open({
      ...options,
      kind: 'prompt',
      resolve: (value) => {
        useDialogStore.getState().close();
        resolve(value);
      },
    });
  });
}

export function dialogConfirm(
  options: Omit<ConfirmRequest, 'kind' | 'resolve'>,
): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.getState().open({
      ...options,
      kind: 'confirm',
      resolve: (value) => {
        useDialogStore.getState().close();
        resolve(value);
      },
    });
  });
}

export function dialogAlert(
  options: Omit<AlertRequest, 'kind' | 'resolve'>,
): Promise<void> {
  return new Promise((resolve) => {
    useDialogStore.getState().open({
      ...options,
      kind: 'alert',
      resolve: () => {
        useDialogStore.getState().close();
        resolve();
      },
    });
  });
}
