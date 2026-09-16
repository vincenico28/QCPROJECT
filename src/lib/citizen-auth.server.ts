import crypto from "node:crypto";

/**
 * Hash a plain text password using PBKDF2 with SHA-512.
 * Returns format: <salt>:<derived_hash_hex>
 */
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, "sha512").toString("hex");
  return `${actualSalt}:${hash}`;
}

/**
 * Verify a plain text password against a stored PBKDF2 hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

/**
 * Deterministic standard password hash for existing profiles (Admin123).
 * Salt: a1b2c3d4e5f60718293a4b5c6d7e8f90
 */
export const DEFAULT_INITIAL_PASSWORD_HASH = hashPassword("Admin123", "a1b2c3d4e5f60718293a4b5c6d7e8f90");

// In-memory fallback credential cache for when Supabase table migration is pending
const fallbackCredentialStore = new Map<string, string>([
  ["escalavincenico28@gmail.com", DEFAULT_INITIAL_PASSWORD_HASH],
  ["juan.delacruz@gmail.com", DEFAULT_INITIAL_PASSWORD_HASH],
]);

export function getFallbackPasswordHash(email: string): string | undefined {
  return fallbackCredentialStore.get(email.trim().toLowerCase());
}

export function setFallbackPasswordHash(email: string, hash: string): void {
  fallbackCredentialStore.set(email.trim().toLowerCase(), hash);
}
