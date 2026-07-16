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
    const t = (key, fallback) => (window._i18n && window._i18n.t)
        ? window._i18n.t(key)
        : fallback;
    const plannedLabel = t('projects.planned', 'planned');

    const cardHtml = (p) => {
        const title = _pickField(p, 'title');
        const longDesc = _pickField(p, 'longDesc');
        const tags = _pickField(p, 'tags') || [];
        const tagsHtml = tags.map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`).join('');
        const packages = p.packages || [];
        const packagesHtml = packages.length ? `<div class="project-packages" aria-label="Available package registries">
            ${packages.map(pkg => `<a class="project-package" href="${escapeHtml(pkg.href)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(pkg.name)} on ${escapeHtml(pkg.registry)}">
                <code class="project-package-install">${escapeHtml(pkg.install)}</code>
            </a>`).join('')}
        </div>` : '';
        const footerHtml = `<div class="project-card-footer">
            ${packagesHtml}
            <div class="project-tags">${tagsHtml}</div>
        </div>`;

        // Planned entries are non-clickable: a subdued <article> card with a
        // "planned" tag and no arrow/link, sorted to the end of the grid.
        if (p.planned) {
            return `<article class="project-card project-card-planned glass">
                <div class="project-card-main">
                    <div class="project-card-top">
                        <span class="project-emoji" aria-hidden="true">${escapeHtml(p.emoji)}</span>
                        <h3 class="project-title">${escapeHtml(title)}</h3>
                        <span class="project-planned-tag">${escapeHtml(plannedLabel)}</span>
                    </div>
                    <p class="project-desc">${escapeHtml(longDesc)}</p>
                </div>
                ${footerHtml}
            </article>`;
        }

        const ext = p.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<article class="project-card glass fade-in">
            <a href="${escapeHtml(p.href)}" class="project-card-main"${ext}>
                <div class="project-card-top">
                    <span class="project-emoji" aria-hidden="true">${escapeHtml(p.emoji)}</span>
                    <h3 class="project-title">${escapeHtml(title)}</h3>
                    <span class="project-arrow" aria-hidden="true">${ARROW_SVG}</span>
                </div>
                <p class="project-desc">${escapeHtml(longDesc)}</p>
            </a>
            ${footerHtml}
        </article>`;
    };

    // Each grid splits into a flagged "Major" group and a "Minor" group, each
    // under a full-width .section-label heading. Source order is preserved
    // within each group. Labels only show when both groups are populated.
    const major = projects.filter(p => p.major);
    const minor = projects.filter(p => !p.major);
    const label = (text) => `<h2 class="section-label">${escapeHtml(text)}</h2>`;

    container.innerHTML = (major.length && minor.length)
        ? label(t('projects.major', 'Major')) + major.map(cardHtml).join('')
            + label(t('projects.minor', 'Minor')) + minor.map(cardHtml).join('')
        : projects.map(cardHtml).join('');
}
