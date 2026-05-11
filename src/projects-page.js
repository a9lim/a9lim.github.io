// Renders the projects grid page from the shared PROJECTS data array.
//
// i18n: when window._i18n is present and the current lang is non-EN, fields
// with a `_ja` (or other `_${lang}`) sibling get picked up automatically.
// We hold onto the (container, projects) pair the first time renderProjectCards
// is called so onChange can re-render with the new language.

const ARROW_SVG = _ICON.projectArrow;

let _lastRender = null;
let _i18nProjectsWired = false;

function _pickField(p, base) {
    const lang = (window._i18n && window._i18n.getLang) ? window._i18n.getLang() : 'en';
    if (lang !== 'en') {
        const k = base + '_' + lang;
        if (Object.prototype.hasOwnProperty.call(p, k) && p[k] != null) return p[k];
    }
    return p[base];
}

/** Generate .project-card markup for each project and inject into container. */
export function renderProjectCards(container, projects) {
    _lastRender = { container, projects };
    if (!_i18nProjectsWired && window._i18n && window._i18n.onChange) {
        _i18nProjectsWired = true;
        window._i18n.onChange(function () {
            if (_lastRender) renderProjectCards(_lastRender.container, _lastRender.projects);
        });
    }
    container.innerHTML = projects.map(p => {
        const ext = p.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const longDesc = _pickField(p, 'longDesc');
        const tags = _pickField(p, 'tags') || [];
        return `<a href="${escapeHtml(p.href)}" class="project-card glass fade-in"${ext}>
            <div class="project-card-top">
                <div class="project-icon" aria-hidden="true">${p.icon}</div>
                <span class="project-arrow" aria-hidden="true">${ARROW_SVG}</span>
            </div>
            <h3 class="project-title">${escapeHtml(p.title)}</h3>
            <p class="project-desc">${escapeHtml(longDesc)}</p>
            <div class="project-tags">
                ${tags.map(t => `<span class="project-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
        </a>`;
    }).join('');
}
