export const THEME_STORAGE_KEY = 'nightmare-club-theme';

export type Theme = 'dark' | 'light';

export function clampSpawnPoint(value: string): string {
	return value.slice(0, 15);
}

export function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	root.classList.remove('dark', 'light');
	root.classList.add(theme);
	root.dataset.theme = theme;
}

export function readStoredTheme(): Theme {
	if (typeof localStorage === 'undefined') {
		return 'dark';
	}

	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return stored === 'light' ? 'light' : 'dark';
}

export function persistTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
}
