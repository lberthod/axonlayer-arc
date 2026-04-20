import { reactive } from 'vue';

/**
 * Tiny in-memory toast bus. Components push notifications via `pushToast`,
 * the global `<ToastHost />` renders them and auto-dismisses after `ttl`.
 */
export const toastState = reactive({
  toasts: []
});

let nextId = 1;

export function pushToast({ message, type = 'info', ttl = 4000, requestId = null } = {}) {
  if (!message) return;
  const id = nextId++;
  toastState.toasts.push({ id, message, type, requestId });
  setTimeout(() => dismissToast(id), ttl);
  return id;
}

export function dismissToast(id) {
  const idx = toastState.toasts.findIndex((t) => t.id === id);
  if (idx >= 0) toastState.toasts.splice(idx, 1);
}

export function toastError(err, fallback = 'Something went wrong') {
  // Works with our ApiError shape and plain Error.
  const message = err?.message || fallback;
  const requestId = err?.requestId || null;
  pushToast({ message, type: 'error', ttl: 6000, requestId });
}

export function toastSuccess(message) {
  pushToast({ message, type: 'success' });
}

export function toastInfo(message) {
  pushToast({ message, type: 'info' });
}
