/**
 * Same SPA deployment answers on two domains once you point both
 * tramitesccf.online (public) and admin.tramitesccf.online (staff) at the
 * same Vercel project — see tramites-frontend/README.md "Staff subdomain".
 * This is a cosmetic/UX split, not a security boundary: staff routes are
 * already protected by real auth (RequireStaff/RequireAdmin), so this only
 * decides what a visitor lands on, not what they're allowed to reach.
 */
export function isStaffHost(): boolean {
  return window.location.hostname.startsWith('admin.');
}
