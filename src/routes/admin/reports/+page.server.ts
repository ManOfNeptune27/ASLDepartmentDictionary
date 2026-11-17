import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { initDb } from '$lib/db';
import { getLoggedInUser, isTeacherAuthenticated } from '$lib/server/auth';
import {
  isReportStatus,
  listSignReports,
  updateSignReportStatus,
  type ReportStatus,
} from '$lib/server/signReports';

const FILTERS = ['open', 'reviewed', 'dismissed', 'all'] as const;
type ReportFilter = (typeof FILTERS)[number];

function reportFilter(value: string | null): ReportFilter {
  return FILTERS.find((status) => status === value) ?? 'open';
}

export const load: PageServerLoad = async ({ url }) => {
  await initDb();
  const status = reportFilter(url.searchParams.get('status'));
  const reports = await listSignReports(status);
  return { status, reports };
};

export const actions: Actions = {
  updateStatus: async ({ request, cookies }) => {
    if (!isTeacherAuthenticated(cookies)) {
      return fail(401, { reportUpdateError: 'You must be logged in.' });
    }

    const formData = await request.formData();
    const idValue = formData.get('id');
    const statusValue = formData.get('status');
    const reportId = typeof idValue === 'string' && /^\d+$/.test(idValue) ? Number(idValue) : null;
    const status = typeof statusValue === 'string' ? statusValue : '';

    if (!reportId || !isReportStatus(status)) {
      return fail(400, { reportUpdateError: 'Choose a valid report to update.' });
    }

    await initDb();
    const reviewer = getLoggedInUser(cookies) ?? 'teacher';
    const updated = await updateSignReportStatus(reportId, status, reviewer);
    if (!updated) {
      return fail(404, { reportUpdateError: 'That report could not be found.' });
    }

    const labels: Record<ReportStatus, string> = {
      open: 'reopened',
      reviewed: 'marked reviewed',
      dismissed: 'dismissed',
    };
    return {
      reportUpdateMessage: `Report ${labels[status]}. The published sign was not changed.`,
    };
  },
};
