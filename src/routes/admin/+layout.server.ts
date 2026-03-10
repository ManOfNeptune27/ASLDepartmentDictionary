import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isTeacherAuthenticated } from '$lib/server/auth';

export const load: LayoutServerLoad = ({ cookies, url }) => {
  if (!isTeacherAuthenticated(cookies)) {
    const next = `${url.pathname}${url.search}`;
    redirect(303, `/login?next=${encodeURIComponent(next)}`);
  }

  return {};
};
