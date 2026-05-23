import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isTeacherAuthenticated } from '$lib/server/auth';
import { uploadGifBuffer } from '$lib/r2';

export const POST = async ({ request, cookies }: RequestEvent) => {
  if (!isTeacherAuthenticated(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith('.gif')) {
    return json({ error: 'Only .gif files are accepted' }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const gifUrl = await uploadGifBuffer(buffer, file.name);
    return json({ publicUrl: gifUrl, size: file.size });
  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Failed to upload GIF' }, { status: 500 });
  }
};