import { SITE_URL } from '$lib/site';

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);
}

export async function GET() {
  const paths = [
    '/',
    '/dictionary',
    '/about',
    '/how-name-signs-work',
    '/fingerspelling-basics',
    '/privacy',
    '/terms',
    '/contact',
  ];
  const urls = [
    ...paths.map((path) => `${SITE_URL}${path}`),
  ];
  const body = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
