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

function gifKey(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? filename;
  const safeFilename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safeFilename || 'upload.gif'}`;
}

function encodedObjectUrl(key: string): string {
  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${encodeURIComponent(key)}`;
}

export async function uploadGif(file: File): Promise<string> {
  const key = gifKey(file.name);
  const url = encodedObjectUrl(key);

  const buffer = await file.arrayBuffer();

  await r2.fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/gif' },
    body: buffer,
  });

  return `${R2_PUBLIC_URL}/${encodeURIComponent(key)}`;
}

export async function deleteGif(gifUrl: string): Promise<void> {
  const filename = gifUrl.split('/').pop();
  if (!filename) return;

  const key = decodeURIComponent(filename);
  const url = encodedObjectUrl(key);

  await r2.fetch(url, { method: 'DELETE' });
}

export async function uploadGifBuffer(buffer: ArrayBuffer, filename: string): Promise<string> {
  const key = gifKey(filename);
  const url = encodedObjectUrl(key);

  await r2.fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/gif' },
    body: buffer,
  });

  return `${R2_PUBLIC_URL}/${encodeURIComponent(key)}`;
}

export async function createGifUploadUrl(filename: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const key = gifKey(filename);
  const url = encodedObjectUrl(key);
  const signedRequest = await r2.sign(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/gif' },
    aws: { signQuery: true },
  });

  return { uploadUrl: signedRequest.url, publicUrl: `${R2_PUBLIC_URL}/${encodeURIComponent(key)}` };
}