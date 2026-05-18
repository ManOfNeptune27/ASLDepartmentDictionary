import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { AwsClient } from 'aws4fetch';
import { isTeacherAuthenticated } from '$lib/server/auth';
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL
} from '$env/static/private';

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: 's3',
  region: 'auto',
});

export const GET = async ({ cookies, url }: RequestEvent) => {
  if (!isTeacherAuthenticated(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filename = url.searchParams.get('filename');
  if (!filename) {
    return json({ error: 'Filename required' }, { status: 400 });
  }

  const key = `${Date.now()}-${filename.replace(/\s+/g, '_')}`;
  const uploadUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

  const signed = await r2.sign(
    new Request(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/gif' }
    }),
    { aws: { signQuery: true } }
  );

  return json({
    uploadUrl: signed.url,
    publicUrl: `${R2_PUBLIC_URL}/${key}`
  });
};