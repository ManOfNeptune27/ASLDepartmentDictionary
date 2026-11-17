import { db } from '$lib/db';

export const REPORT_DESCRIPTION_MIN = 10;
export const REPORT_DESCRIPTION_MAX = 2000;
export const REPORT_WINDOW_LIMIT = 5;
const REPORT_WINDOW_MS = 15 * 60 * 1000;

export const REPORT_STATUSES = ['open', 'reviewed', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_SUBMITTED_MESSAGE =
  'Report submitted. The department will review it. This sign was not changed.';

export function reportDescription(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export function reportDescriptionError(description: string) {
  if (description.length < REPORT_DESCRIPTION_MIN) {
    return `Describe the problem in at least ${REPORT_DESCRIPTION_MIN} characters.`;
  }
  if (description.length > REPORT_DESCRIPTION_MAX) {
    return `Keep the description under ${REPORT_DESCRIPTION_MAX} characters.`;
  }
  return '';
}

export function isHoneypotFilled(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() !== '';
}

export function isReportStatus(value: string): value is ReportStatus {
  return REPORT_STATUSES.some((status) => status === value);
}

export async function countRecentReports(signId: number, now = Date.now()) {
  const since = new Date(now - REPORT_WINDOW_MS).toISOString();
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS total
          FROM sign_reports
          WHERE sign_id = ? AND created_at >= ?`,
    args: [signId, since],
  });
  return Number(result.rows[0]?.total ?? 0);
}

export async function countOpenReports() {
  const result = await db.execute(
    `SELECT COUNT(*) AS total FROM sign_reports WHERE status = 'open'`,
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function insertSignReport(signId: number, signWord: string, description: string) {
  await db.execute({
    sql: `INSERT INTO sign_reports (sign_id, sign_word, description, status, created_at)
          VALUES (?, ?, ?, 'open', ?)`,
    args: [signId, signWord, description, new Date().toISOString()],
  });
}

export type SignReportRow = {
  id: number;
  signId: number;
  signWord: string;
  currentWord: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string;
  reviewerUsername: string;
  signStillExists: boolean;
};

function text(value: unknown) {
  return String(value ?? '').trim();
}

export async function listSignReports(status: ReportStatus | 'all') {
  const result = await db.execute({
    sql: `SELECT r.id, r.sign_id, r.sign_word, r.description, r.status, r.created_at,
                 r.reviewed_at, r.reviewer_username, s.word AS current_word
          FROM sign_reports r
          LEFT JOIN signs s ON s.id = r.sign_id
          WHERE (? = 'all' OR r.status = ?)
          ORDER BY r.created_at DESC, r.id DESC
          LIMIT 200`,
    args: [status, status],
  });

  return result.rows.map((row) => {
    const storedStatus = text(row.status);
    return {
      id: Number(row.id),
      signId: Number(row.sign_id),
      signWord: text(row.sign_word),
      currentWord: text(row.current_word),
      description: text(row.description),
      status: isReportStatus(storedStatus) ? storedStatus : 'open',
      createdAt: text(row.created_at),
      reviewedAt: text(row.reviewed_at),
      reviewerUsername: text(row.reviewer_username),
      signStillExists: row.current_word != null && text(row.current_word) !== '',
    } satisfies SignReportRow;
  });
}

export async function updateSignReportStatus(
  reportId: number,
  status: ReportStatus,
  reviewerUsername: string,
) {
  const reviewed = status === 'open' ? null : new Date().toISOString();
  const reviewer = status === 'open' ? null : reviewerUsername;
  const result = await db.execute({
    sql: `UPDATE sign_reports
          SET status = ?, reviewed_at = ?, reviewer_username = ?
          WHERE id = ?`,
    args: [status, reviewed, reviewer, reportId],
  });
  return Number(result.rowsAffected ?? 0) > 0;
}
