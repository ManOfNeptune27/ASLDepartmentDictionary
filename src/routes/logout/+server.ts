import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearTeacherAuthCookie } from '$lib/server/auth';

export const GET: RequestHandler = ({ cookies }) => {
  clearTeacherAuthCookie(cookies);
  redirect(303, '/login');
};
