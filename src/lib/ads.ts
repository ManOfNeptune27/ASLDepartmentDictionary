const adEligiblePaths = new Set([
  '/',
  '/about',
  '/how-name-signs-work',
  '/fingerspelling-basics',
]);

export function isAdEligible(pathname: string): boolean {
  return adEligiblePaths.has(pathname);
}
