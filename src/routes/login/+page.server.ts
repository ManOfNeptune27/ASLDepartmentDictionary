import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isTeacherAuthenticated, setTeacherAuthCookie, verifyTeacherCredentials } from '$lib/server/auth';

function toText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export const load: PageServerLoad = ({ cookies, url }) => {
  const next = url.searchParams.get('next') || '/admin';

  if (isTeacherAuthenticated(cookies)) {
    redirect(303, next);
  }

  return { next };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = toText(formData.get('username'));
    const password = toText(formData.get('password'));
    const next = toText(formData.get('next')) || '/admin';

    if (!username || !password) {
      return fail(400, {
        error: 'Username and password are required.',
        values: { username, next }
      });
    }

    if (!verifyTeacherCredentials(username, password)) {
      return fail(401, {
        error: 'Invalid login. Please check your teacher credentials.',
        values: { username, next }
      });
    }

    setTeacherAuthCookie(cookies);
    redirect(303, next);
  }
};
