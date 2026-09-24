/**
 * Where a pending invite stands. The API sends inviteExpiresAt on pending rows:
 * a date while the code works, null once it is gone (expired, or locked after
 * wrong guesses). An older API sends nothing — unknown, so never "expired".
 */
export function inviteState(staff, now = Date.now()) {
  if (staff?.inviteStatus !== "pending") return null;
  if (staff.inviteExpiresAt === undefined) return { expired: false, expiresAt: null };
  if (staff.inviteExpiresAt === null) return { expired: true, expiresAt: null };
  const expiresAt = new Date(staff.inviteExpiresAt);
  return { expired: expiresAt.getTime() <= now, expiresAt };
}
