import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

export const AUTH_COOKIE_NAME = 'teacher_session';

function authCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: false,
    maxAge: 60 * 60 * 8
  };
}

export function verifyTeacherCredentials(username: string, password: string) {
  const configuredUsername = env.TEACHER_LOGIN_USER ?? 'teacher';
  const configuredPassword = env.TEACHER_LOGIN_PASSWORD ?? 'asl-teacher';

  return username === configuredUsername && password === configuredPassword;
}

export function isTeacherAuthenticated(cookies: Cookies) {
  return cookies.get(AUTH_COOKIE_NAME) === 'authenticated';
}

export function setTeacherAuthCookie(cookies: Cookies) {
  cookies.set(AUTH_COOKIE_NAME, 'authenticated', authCookieOptions());
}

export function clearTeacherAuthCookie(cookies: Cookies) {
  cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}
