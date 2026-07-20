// Populates the homepage "command-center" slab from home-data.json, which
// tools/build.mjs generates from content/home/*.md plus the lastDeploy marker.
// Everything rendered here goes through createElement/textContent — no
// innerHTML.
//
// i18n: when window._i18n is present, content fields with a parallel `_ja`
// sibling (now_ja, hyperfixation_ja, predictions_ja, askMeAbout_ja) are
// swapped in for ja. On language change we re-render everything hydrated from
// home-data.json.

let _homeInited = false;
let _homeRendered = false;
let _homeCache = { data: null, posts: null };

function pickLang(obj, base) {
    if (!obj) return null;
    const lang = (window._i18n && window._i18n.getLang) ? window._i18n.getLang() : 'en';
    if (lang !== 'en') {
        const k = base + '_' + lang;
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
    }
    return obj[base];
}

function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
        for (const k in attrs) {
            if (k === 'class') n.className = attrs[k];
            else if (k === 'text') n.textContent = attrs[k];
            else if (k === 'html') { /* disallowed — use children */ }
            else if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
        }
    }
    if (children) {
        for (const c of children) {
            if (c == null) continue;
            n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        }
    }
    return n;
}

function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
}

function relTime(iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (s < 60)       return s + 's ago';
    if (s < 3600)     return Math.floor(s / 60) + 'm ago';
    if (s < 86400)    return Math.floor(s / 3600) + 'h ago';
    if (s < 2592000)  return Math.floor(s / 86400) + 'd ago';
    if (s < 31536000) return Math.floor(s / 2592000) + 'mo ago';
    return Math.floor(s / 31536000) + 'y ago';
}

function renderNow(pairs) {
    const root = document.getElementById('home-now');
    if (!root || !Array.isArray(pairs)) return;
    clear(root);
    for (const [k, v] of pairs) {
        root.appendChild(el('dt', { class: 'home-now-k', text: k }));
        root.appendChild(el('dd', { class: 'home-now-v', text: v }));
    }
}

function renderHyperfix(fix) {
    if (!fix) return;
    const label = document.getElementById('home-fix-label');
    const title = document.getElementById('home-fix-title');
    const body  = document.getElementById('home-fix-body');
    const link  = document.getElementById('home-fix-link');
    if (label && fix.label) label.textContent = fix.label;
    if (title) title.textContent = fix.title || '';
    if (body)  body.textContent  = fix.body  || '';
    if (link) {
        if (fix.link) {
            link.href = fix.link;
            link.textContent = fix.linkLabel || fix.link;
            link.style.display = '';
        } else {
            link.style.display = 'none';
        }
    }
}

function renderPredictions(rows) {
    const root = document.querySelector('#home-pred tbody');
    if (!root || !Array.isArray(rows)) return;
    clear(root);
    for (const [label, p, by] of rows) {
        const tr = el('tr');
        tr.appendChild(el('td', { class: 'home-pred-l', text: label }));
        tr.appendChild(el('td', { class: 'home-pred-p', text: p }));
        tr.appendChild(el('td', { class: 'home-pred-b', text: by }));
        root.appendChild(tr);
    }
}

function renderChips(tags) {
    const root = document.getElementById('home-chips');
    if (!root || !Array.isArray(tags)) return;
    clear(root);
    for (const t of tags) {
        root.appendChild(el('span', { class: 'home-chip', text: t }));
    }
}

function renderPosts(posts) {
    const root = document.getElementById('home-posts');
    if (!root || !Array.isArray(posts)) return;
    clear(root);
    const recent = posts.slice(0, 3);
    for (const p of recent) {
        const li = el('li', { class: 'home-post' });
        const link = el('a', { href: '/blog/' + p.slug, 'data-page': 'blog', class: 'home-post-link' });
        link.appendChild(el('time', { class: 'home-post-d', datetime: p.date, text: p.date }));
        link.appendChild(document.createTextNode(' '));
        const title = pickLang(p, 'title') || p.title;
        link.appendChild(el('span', { class: 'home-post-t', text: title }));
        li.appendChild(link);
        const excerpt = pickLang(p, 'excerpt') || p.excerpt;
        if (excerpt) li.appendChild(el('p', { class: 'home-post-x', text: excerpt }));
        root.appendChild(li);
    }
}

function renderColophon(lastDeploy) {
    // Deploy hash + relative time is appended to the shared site footer.
    const root = document.getElementById('footer-deploy');
    if (!root || !lastDeploy) return;
    clear(root);
    root.appendChild(document.createTextNode(' · deploy '));
    const a = el('a', {
        href: 'https://github.com/a9lim/a9lim.github.io/commit/' + lastDeploy.hash,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'footer-deploy-hash',
        text: lastDeploy.hash,
    });
    root.appendChild(a);
    root.appendChild(document.createTextNode(' · ' + relTime(lastDeploy.iso)));
}

async function fetchJSON(url) {
    try {
        const r = await fetch(url, { cache: 'no-cache' });
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
}

function renderFromCache() {
    const { data, posts } = _homeCache;
    if (data) {
        renderNow(pickLang(data, 'now'));
        renderHyperfix(pickLang(data, 'hyperfixation'));
        renderPredictions(pickLang(data, 'predictions'));
        renderChips(pickLang(data, 'askMeAbout'));
        renderColophon(data.lastDeploy);
    }
    if (posts) renderPosts(posts);
}

async function loadAndRender() {
    if (_homeRendered) return;
    _homeRendered = true;

    const [data, posts] = await Promise.all([
        fetchJSON('/home-data.json'),
        fetchJSON('/posts.json'),
    ]);

    _homeCache = { data, posts };
    renderFromCache();

    // Re-render hydrated content when the language flips. Static markup in
    // index.html is handled by _i18n.applyDOM() automatically; this rerender
    // covers the JSON-sourced fields (Now, Hyperfix, Predictions, AMA chips)
    // and the post titles whose i18n siblings live in posts.json.
    if (window._i18n && window._i18n.onChange) {
        window._i18n.onChange(function () { renderFromCache(); });
    }
}

// ── Keyboard cheatsheet overlay (triggered by `?`) ─────────────────────
function initCheatsheet() {
    const SHORTCUTS = [
        ['g h', 'home'],
        ['g p', 'projects'],
        ['g b', 'blog'],
        ['g s', 'scripture'],
        ['t',   'toggle theme'],
        ['?',   'this cheatsheet'],
        ['esc', 'close overlay'],
    ];

    let overlay = null;
    let prevFocus = null;
    let gPending = false;
    let gTimer = null;

    function build() {
        const wrap = el('div', { class: 'home-cheat', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Keyboard shortcuts' });
        const panel = el('div', { class: 'home-cheat-panel' });
        panel.appendChild(el('h2', { class: 'home-cheat-h', text: 'Keyboard' }));
        const dl = el('dl', { class: 'home-cheat-dl' });
        for (const [k, v] of SHORTCUTS) {
            dl.appendChild(el('dt', { class: 'home-cheat-k' }, [el('kbd', { text: k })]));
            dl.appendChild(el('dd', { class: 'home-cheat-v', text: v }));
        }
        panel.appendChild(dl);
        panel.appendChild(el('p', { class: 'home-cheat-hint', text: 'press esc to close' }));
        wrap.appendChild(panel);
        wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
        return wrap;
    }

    function open() {
        if (overlay) return;
        prevFocus = document.activeElement;
        overlay = build();
        document.body.appendChild(overlay);
        overlay.querySelector('.home-cheat-panel').focus();
    }

    function close() {
        if (!overlay) return;
        overlay.remove();
        overlay = null;
        if (prevFocus && prevFocus.focus) prevFocus.focus();
    }

    function go(path) {
        if (location.pathname === path) return;
        history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    document.addEventListener('keydown', (e) => {
        const t = e.target;
        const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if (typing) return;

        if (e.key === 'Escape' && overlay) { close(); return; }
        if (e.key === '?' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); overlay ? close() : open(); return; }

        // Theme toggle
        if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const btn = document.getElementById('theme-toggle');
            if (btn) { e.preventDefault(); btn.click(); }
            return;
        }

        // `g <letter>` sequences
        if (gPending) {
            gPending = false; if (gTimer) clearTimeout(gTimer);
            const map = { h: '/', p: '/projects', b: '/blog', s: '/scripture/' };
            const target = map[e.key.toLowerCase()];
            if (target) { e.preventDefault(); go(target); }
            return;
        }
        if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            gPending = true;
            gTimer = setTimeout(() => { gPending = false; }, 900);
        }
    });
}

export function initHome() {
    if (_homeInited) return;
    _homeInited = true;
    initCheatsheet();
    // Defer to idle so it doesn't compete with first paint.
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(loadAndRender, { timeout: 600 });
    } else {
        setTimeout(loadAndRender, 100);
    }
}
