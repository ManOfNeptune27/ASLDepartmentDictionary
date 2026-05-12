import { AwsClient } from 'aws4fetch';
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

export async function uploadGif(file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`;

  const buffer = await file.arrayBuffer();

  await r2.fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/gif' },
    body: buffer,
  });

  return `${R2_PUBLIC_URL}/${filename}`;
}