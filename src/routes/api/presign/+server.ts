import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isTeacherAuthenticated } from '$lib/server/auth';
import { createGifUploadUrl } from '$lib/r2';

export const POST = async ({ request, cookies }: RequestEvent) => {
  if (!isTeacherAuthenticated(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { filename?: string; size?: number } | null;
  const filename = body?.filename?.trim() ?? '';

  if (!filename) {
    return json({ error: 'No file provided' }, { status: 400 });
  }

  if (!filename.toLowerCase().endsWith('.gif')) {
    return json({ error: 'Only .gif files are accepted' }, { status: 400 });
  }

  try {
    const { uploadUrl, publicUrl } = await createGifUploadUrl(filename);
    return json({ uploadUrl, publicUrl, size: body?.size ?? 0 });
  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Failed to upload GIF' }, { status: 500 });
  }
};