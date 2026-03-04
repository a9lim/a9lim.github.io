// Renders the projects grid page from the shared PROJECTS data array.

const ARROW_SVG = '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>';

/** Generate .project-card markup for each project and inject into container. */
export function renderProjectCards(container, projects) {
    container.innerHTML = projects.map(p => {
        const ext = p.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(p.href)}" class="project-card glass fade-in"${ext}>
            <div class="project-card-top">
                <div class="project-icon">${p.icon}</div>
                <span class="project-arrow">${ARROW_SVG}</span>
            </div>
            <h3 class="project-title">${escapeHtml(p.title)}</h3>
            <p class="project-desc">${escapeHtml(p.longDesc)}</p>
            <div class="project-tags">
                ${p.tags.map(t => `<span class="project-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
        </a>`;
    }).join('');
}
