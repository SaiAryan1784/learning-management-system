/**
 * Accepting an invite used to name the account after the part of the email
 * before the @. Those placeholders must never be pre-filled as someone's real
 * first name — they are what the "Add real name" tag points at.
 */
const handleOf = (user, email) => String(email || user?.email || "").split("@")[0];

export function isPlaceholderName(user, email) {
  if (!user || user.firstName) return false;
  return (user.name || "") === handleOf(user, email);
}

/** First/last for the edit form. */
export function nameFieldsFor(user, email) {
  if (!user) return { firstName: "", lastName: "" };
  if (user.firstName || user.lastName) {
    return { firstName: user.firstName || "", lastName: user.lastName || "" };
  }
  const name = (user.name || "").trim();
  if (!name || isPlaceholderName(user, email)) return { firstName: "", lastName: "" };
  const cut = name.lastIndexOf(" ");
  return cut === -1
    ? { firstName: name, lastName: "" }
    : { firstName: name.slice(0, cut), lastName: name.slice(cut + 1) };
}
