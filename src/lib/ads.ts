export const NEVER_ADS = [
	'/dictionary',
	'/sign',
	'/login',
	'/logout',
	'/admin',
	'/contact',
	'/privacy',
	'/terms',
];

// Minimum amount of visible prose required before an ad can appear.
export const MIN_TEXT_CHARS = 1500;

export function isAdPath(pathname: string): boolean {
	return !NEVER_ADS.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

export function measureContentText(root: HTMLElement): number {
	const text = Array.from(root.querySelectorAll('p, li, dd, blockquote'))
		.filter((element) => {
			if (
				element.closest('nav, header, footer, button, form, .ad-slot') ||
				(element.parentElement?.tagName === 'LI' &&
					element.parentElement.querySelector(':scope > a') === element)
			) {
				return false;
			}

			const parent = element.parentElement;
			return !parent || parent.querySelector(':scope > a')?.textContent?.trim() !== element.textContent?.trim();
		})
		.map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
		.filter(Boolean)
		.join(' ');

	return text.length;
}
