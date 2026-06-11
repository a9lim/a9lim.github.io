// Renders the projects grid page from the shared PROJECTS data array.
//
// i18n: when window._i18n is present and the current lang is non-EN, fields
// with a `_ja` (or other `_${lang}`) sibling get picked up automatically.
// We hold onto the (container, projects) pair the first time renderProjectCards
// is called so onChange can re-render with the new language.

const ARROW_SVG = _ICON.projectArrow;

// Every grid rendered (sims + projects) is tracked so an i18n language
// change re-renders all of them, not just the most recent.
let _renders = [];
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
    if (!_renders.some(r => r.container === container)) {
        _renders.push({ container, projects });
    }
    if (!_i18nProjectsWired && window._i18n && window._i18n.onChange) {
        _i18nProjectsWired = true;
        window._i18n.onChange(function () {
            _renders.forEach(r => renderProjectCards(r.container, r.projects));
        });
    }
    const plannedLabel = (window._i18n && window._i18n.t)
        ? window._i18n.t('projects.planned')
        : 'planned';
    container.innerHTML = projects.map(p => {
        const title = _pickField(p, 'title');
        const longDesc = _pickField(p, 'longDesc');
        const tags = _pickField(p, 'tags') || [];
        const tagsHtml = tags.map(t => `<span class="project-tag">${escapeHtml(t)}</span>`).join('');

        // Planned entries are non-clickable: a subdued <div> card with a
        // "planned" tag and no arrow/link, sorted to the end of the grid.
        if (p.planned) {
            return `<div class="project-card project-card-planned glass">
                <div class="project-card-top">
                    <div class="project-icon" aria-hidden="true">${p.icon}</div>
                    <span class="project-planned-tag">${escapeHtml(plannedLabel)}</span>
                </div>
                <h3 class="project-title">${escapeHtml(title)}</h3>
                <p class="project-desc">${escapeHtml(longDesc)}</p>
                <div class="project-tags">${tagsHtml}</div>
            </div>`;
        }

        const ext = p.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(p.href)}" class="project-card glass fade-in"${ext}>
            <div class="project-card-top">
                <div class="project-icon" aria-hidden="true">${p.icon}</div>
                <span class="project-arrow" aria-hidden="true">${ARROW_SVG}</span>
            </div>
            <h3 class="project-title">${escapeHtml(title)}</h3>
            <p class="project-desc">${escapeHtml(longDesc)}</p>
            <div class="project-tags">
                ${tagsHtml}
            </div>
        </a>`;
    }).join('');
}
