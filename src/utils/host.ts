export function isStaffHost(): boolean {
  return window.location.hostname.startsWith('admin.');
}
