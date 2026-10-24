// Light/dark toggle. Sets data-theme on <html> and persists to localStorage.

export function getTheme() {
    return document.documentElement.dataset.theme || 'light';
}

export function initTheme($) {
    _colophon.initTheme('theme');
    $.themeToggle.addEventListener('click', () => {
        _colophon.toggleTheme('theme');
        if (typeof _haptics !== 'undefined') _haptics.trigger('light');
    });
}
