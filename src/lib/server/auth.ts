import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/db';
import { env } from '$env/dynamic/private';

export const AUTH_COOKIE_NAME = 'teacher_session';
export const AUTH_USER_COOKIE = 'teacher_user';

function authCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: true,
    maxAge: 60 * 60 * 8
  };
}

export async function verifyTeacherCredentials(username: string, password: string) {
  const result = await db.execute({
    sql: `SELECT id FROM teachers WHERE username = ? AND password = ?`,
    args: [username, password]
  });
  return result.rows.length > 0;
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
    args: [username, password, new Date().toISOString()]
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