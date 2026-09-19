import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/db';
import { env } from '$env/dynamic/private';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const scryptOptions = { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

function deriveKey(password: string, salt: Buffer, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, scryptOptions, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey as Buffer);
      }
    });
  });
}

export const AUTH_COOKIE_NAME = 'teacher_session';
export const AUTH_USER_COOKIE = 'teacher_user';

function authCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: !dev,
    maxAge: 60 * 60 * 8
  };
}

export async function verifyTeacherCredentials(username: string, password: string) {
  const result = await db.execute({
    sql: `SELECT id, password FROM teachers WHERE username = ?`,
    args: [username]
  });
  const row = result.rows[0];
  if (!row) return false;

  const storedPassword = String(row.password);
  let valid = false;

  if (storedPassword.startsWith('scrypt$')) {
    const [, saltBase64, hashBase64] = storedPassword.split('$');
    if (saltBase64 && hashBase64) {
      const salt = Buffer.from(saltBase64, 'base64');
      const expectedHash = Buffer.from(hashBase64, 'base64');
      const actualHash = await deriveKey(password, salt, expectedHash.length);
      valid = expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
    }
  } else if (storedPassword === password) {
    valid = true;
    await db.execute({
      sql: `UPDATE teachers SET password = ? WHERE id = ?`,
      args: [await hashPassword(password), row.id]
    });
  }

  return valid;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function isTeacherAuthenticated(cookies: Cookies) {
  return cookies.get(AUTH_COOKIE_NAME) === 'authenticated';
}

export function getLoggedInUser(cookies: Cookies) {
  return cookies.get(AUTH_USER_COOKIE) ?? null;
}

export function isLoggedInUserAdmin(cookies: Cookies) {
  const username = getLoggedInUser(cookies);
  return username === env.ADMIN_USER;
}

export function setTeacherAuthCookie(cookies: Cookies, username: string) {
  cookies.set(AUTH_COOKIE_NAME, 'authenticated', authCookieOptions());
  cookies.set(AUTH_USER_COOKIE, username, authCookieOptions());
}

export function clearTeacherAuthCookie(cookies: Cookies) {
  cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
  cookies.delete(AUTH_USER_COOKIE, { path: '/' });
}

export async function addTeacher(username: string, password: string) {
  await db.execute({
    sql: `INSERT INTO teachers (username, password, created_at) VALUES (?, ?, ?)`,
    args: [username, await hashPassword(password), new Date().toISOString()]
  });
}

export async function deleteTeacher(username: string) {
  await db.execute({
    sql: `DELETE FROM teachers WHERE username = ?`,
    args: [username]
  });
}

export async function listTeachers() {
  const result = await db.execute(`SELECT id, username, created_at FROM teachers ORDER BY created_at ASC`);
  return result.rows.map((row) => ({
    id: Number(row.id),
    username: String(row.username),
    createdAt: String(row.created_at)
  }));
}