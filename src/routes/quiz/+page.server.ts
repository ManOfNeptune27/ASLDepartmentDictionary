import { initDb } from '$lib/db';
import { listSigns, listUnitsByBook } from '$lib/server/signs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	await initDb();

	const selectedBook = url.searchParams.get('book') ?? '';
	const selectedUnit = url.searchParams.get('unit') ?? '';
	const selectedMode = url.searchParams.get('mode') ?? '';
	const selectedLength = url.searchParams.get('length') ?? '';
	const quizStarted = Boolean(selectedBook && selectedUnit && selectedMode && selectedLength);
	const lengthFraction = selectedLength === 'short' ? 0.25 : selectedLength === 'medium' ? 0.5 : 1;

	let quizSigns: Awaited<ReturnType<typeof listSigns>>['signs'] = [];
	let choiceSigns: Awaited<ReturnType<typeof listSigns>>['signs'] = [];
	if (quizStarted) {
		const signs = (
			await listSigns({
				book: selectedBook,
				unit: selectedUnit,
				page: 1,
				pageSize: 60,
			})
		).signs;
		choiceSigns = signs;
		quizSigns = signs.sort(() => Math.random() - 0.5).slice(0, Math.max(1, Math.ceil(signs.length * lengthFraction)));
	}

	return {
		unitsByBook: await listUnitsByBook(),
		selectedBook,
		selectedUnit,
		selectedMode,
		selectedLength,
		quizStarted,
		quizSigns,
		choiceSigns,
	};
};
