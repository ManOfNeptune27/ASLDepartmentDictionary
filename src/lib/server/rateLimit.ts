const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minute lockout

export function checkRateLimit(ip: string): { allowed: boolean; minutesLeft?: number } {
  const now = Date.now();
  const record = failedAttempts.get(ip);

  if (!record) return { allowed: true };

  // Reset if window has passed
  if (now - record.lastAttempt > WINDOW_MS) {
    failedAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((record.lastAttempt + LOCKOUT_MS - now) / 60000);
    if (minutesLeft > 0) {
      return { allowed: false, minutesLeft };
    } else {
      failedAttempts.delete(ip);
      return { allowed: true };
    }
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = failedAttempts.get(ip);

  if (!record) {
    failedAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    failedAttempts.set(ip, { count: record.count + 1, lastAttempt: now });
  }
}

export function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}