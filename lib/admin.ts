// Single-purpose admin gate for /admin/* routes. No role system exists yet
// (User has no isAdmin flag) — this is deliberately the simplest thing that
// works for a one-admin app. Set ADMIN_EMAILS (comma-separated) to extend.
const DEFAULT_ADMIN_EMAILS = ["jhyeon5113@gmail.com"];

function adminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (!fromEnv) return DEFAULT_ADMIN_EMAILS;
  return fromEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
