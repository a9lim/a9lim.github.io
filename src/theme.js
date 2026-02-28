// ─── Theme Toggle ───

export function getTheme() {
    return document.documentElement.dataset.theme || 'light';
}

export function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
}

export function initTheme($) {
    $.themeToggle.addEventListener('click', () => {
        setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') setTheme(saved);
    } catch (e) { /* ignore */ }
}
