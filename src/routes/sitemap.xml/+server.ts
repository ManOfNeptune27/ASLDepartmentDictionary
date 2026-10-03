import { db, initDb } from '$lib/db';
import { SIGN_CONTENT_MIN_FILLED_FIELDS } from '$lib/signContent';

const siteUrl = 'https://asldepartmentdictionary.org';

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
  await initDb();
  const result = await db.execute({
    sql: `SELECT id FROM signs
          WHERE (
            CASE WHEN NULLIF(NULLIF(TRIM(gloss), ''), 'N/A') IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NULLIF(NULLIF(TRIM(handshape), ''), 'N/A') IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NULLIF(NULLIF(TRIM(location), ''), 'N/A') IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NULLIF(NULLIF(TRIM(movement), ''), 'N/A') IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NULLIF(NULLIF(TRIM(palm_orientation), ''), 'N/A') IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NULLIF(NULLIF(TRIM(non_manual_signals), ''), 'N/A') IS NOT NULL THEN 1 ELSE 0 END
          ) >= ?
          ORDER BY id`,
    args: [SIGN_CONTENT_MIN_FILLED_FIELDS],
  });

  const paths = ['/', '/about', '/contact', '/terms', '/privacy'];
  const urls = [
    ...paths.map((path) => `${siteUrl}${path}`),
    ...result.rows.map((row) => `${siteUrl}/sign/${Number(row.id)}`),
  ];
  const body = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
