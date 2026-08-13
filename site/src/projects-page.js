// Renders the projects grid page from the shared PROJECTS data array.
//
// i18n: when window._i18n is present and the current lang is non-EN, fields
// with a `_ja` (or other `_${lang}`) sibling get picked up automatically.
// We hold onto the render spec the first time renderProjectCards is called so
// onChange can re-render with the new language.
//
// Tag filtering: `?tag={slug}` on /sims or /projects narrows the grid. Slugs
// are generated at build time from the English label (tools/build.mjs), so a
// filtered link keeps meaning across a language switch; the visible chip text
// comes from the localized `tags` array at the same index.

const ARROW_SVG = _ICON.projectArrow;

// Every grid rendered (sims + projects) is tracked so an i18n language
// change re-renders all of them, not just the most recent.
let _renders = [];
let _i18nProjectsWired = false;
const _activeTag = {};   // page name -> active tag slug, or absent for "all"

function _pickField(p, base) {
    const lang = (window._i18n && window._i18n.getLang) ? window._i18n.getLang() : 'en';
    if (lang !== 'en') {
        const k = base + '_' + lang;
        if (Object.prototype.hasOwnProperty.call(p, k) && p[k] != null) return p[k];
    }
    return p[base];
}

/**
 * Listing URL for a filter chip. Built from the live URL so an active
 * `?lang=ja` survives the click — dropping it would leave a shared link that
 * renders in a different language than the one the sharer was reading.
 */
function filterHref(page, slug) {
    const url = new URL(window.location.href);
    url.pathname = '/' + page;
    if (slug) url.searchParams.set('tag', slug);
    else url.searchParams.delete('tag');
    return url.pathname + url.search;
}

/** slug -> { label, count } across a grid's projects, most-used first. */
function tagIndex(projects) {
    const map = new Map();
    for (const p of projects) {
        const slugs = p.tagSlugs || [];
        const labels = _pickField(p, 'tags') || [];
        slugs.forEach((slug, i) => {
            const seen = map.get(slug);
            if (seen) { seen.count++; return; }
            map.set(slug, { label: labels[i] == null ? slug : labels[i], count: 1 });
        });
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label));
}

/**
 * Set the active tag for a page's grids and re-render them. main.js renders
 * unfiltered at boot and the router calls this once the URL is parsed, so the
 * no-change case must stay cheap.
 */
export function setProjectFilter(page, slug) {
    const next = slug || null;
    if ((_activeTag[page] || null) === next) return;
    if (next) _activeTag[page] = next;
    else delete _activeTag[page];
    _renders.filter(r => r.page === page).forEach(renderSpec);
}

/** Generate .project-card markup for each project and inject into container. */
export function renderProjectCards(spec) {
    if (!_renders.some(r => r.container === spec.container)) _renders.push(spec);
    if (!_i18nProjectsWired && window._i18n && window._i18n.onChange) {
        _i18nProjectsWired = true;
        window._i18n.onChange(function () { _renders.forEach(renderSpec); });
    }
    renderSpec(spec);
}

function renderSpec(spec) {
    const { page, container, filterEl, projects } = spec;
    spec.rendered = true;
    const t = (key, fallback) => (window._i18n && window._i18n.t)
        ? window._i18n.t(key)
        : fallback;
    const plannedLabel = t('projects.planned', 'planned');
    const active = _activeTag[page] || null;
    const index = tagIndex(projects);

    if (filterEl) {
        const chip = (href, label, isActive, count) =>
            `<a class="tag-chip${isActive ? ' active' : ''}" href="${escapeHtml(href)}" data-page="${escapeHtml(page)}"`
            + `${isActive ? ' aria-current="true"' : ''}>${escapeHtml(label)}`
            + `${count == null ? '' : `<span class="tag-chip-count">${count}</span>`}</a>`;
        filterEl.innerHTML = chip(filterHref(page, null), t('projects.allTags', 'all'), !active, null)
            + index.map(([slug, e]) => chip(filterHref(page, slug), e.label, slug === active, e.count)).join('');
    }

    // An unknown slug (stale link, hand-typed) filters to nothing rather than
    // silently showing everything — the chip row above is the way back.
    const shown = active ? projects.filter(p => (p.tagSlugs || []).includes(active)) : projects;

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
    const major = shown.filter(p => p.major);
    const minor = shown.filter(p => !p.major);
    const label = (text) => `<h2 class="section-label">${escapeHtml(text)}</h2>`;

    container.innerHTML = !shown.length
        ? `<p class="tag-empty">${escapeHtml(t('projects.tagEmpty', 'Nothing here with that tag.'))}</p>`
        : (major.length && minor.length)
            ? label(t('projects.major', 'Major')) + major.map(cardHtml).join('')
                + label(t('projects.minor', 'Minor')) + minor.map(cardHtml).join('')
            : shown.map(cardHtml).join('');
}
