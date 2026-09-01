import crypto from "crypto";

/**
 * Cryptographically hashes a plaintext password using scrypt with a unique random salt.
 * Format: scrypt:<salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  if (!password) throw new Error("Password cannot be empty");
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a candidate plaintext password against a stored scrypt hash in constant time.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash) return false;

  try {
    const parts = storedHash.split(":");
    if (parts.length === 3 && parts[0] === "scrypt") {
      const salt = parts[1];
      const expectedKeyHex = parts[2];
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const expectedKey = Buffer.from(expectedKeyHex, "hex");
      if (derivedKey.length !== expectedKey.length) return false;
      return crypto.timingSafeEqual(derivedKey, expectedKey);
    }

    // Direct string match fallback if non-scrypt
    return password === storedHash;
  } catch (e) {
    return false;
  }
}

/**
 * Generates cryptographically secure session and refresh tokens.
 */
export function generateAuthTokens(userId: number | string, email: string) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const access = `qm_access_${userId}_${timestamp}_${randomBytes}`;
  const refresh = `qm_refresh_${userId}_${timestamp}_${crypto.randomBytes(32).toString("hex")}`;
  return { access, refresh };
}

/**
 * Sanitizes a user object before returning to client or admin dashboard.
 * Strips password hashes and internal security credentials.
 */
export function sanitizeUser(user: any) {
  if (!user) return null;
  const clone = { ...user };
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.__password;
  return clone;
}
