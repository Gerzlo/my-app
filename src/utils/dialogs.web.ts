// Сообщения и подтверждения в браузере.

export function confirmAction(
  title: string,
  message: string,
  _confirmText: string,
  onConfirm: () => void
) {
  if (window.confirm(`${title}\n\n${message}`)) onConfirm();
}

export function showMessage(title: string, message: string) {
  window.alert(`${title}\n\n${message}`);
}
