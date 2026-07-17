// ─── i18n Runtime (root site) ───
// Lightweight runtime translator scoped to a9l.im. Reads from the flat-key
// dictionary below. Walks the DOM for data-i18n* attributes, swaps text/title/
// aria-label/content attributes in place, and notifies subscribers so JS-driven
// content (home.js hydration, blog.js, etc.) can re-render with the new lang.
//
// Boot precedence: ?lang= URL param > localStorage > navigator.language ('ja*' → ja) > 'en'.
//
// HTML decoration:
//   <button data-i18n="nav.home">home</button>             // textContent
//   <button data-i18n-title="nav.theme">…</button>          // title
//   <button data-i18n-aria="nav.themeAria">…</button>       // aria-label
//   <meta name="description" data-i18n-content="meta.desc"> // content
//   <a data-i18n-href="links.about">…</a>                   // href (rare)
//
// Models geon/src/i18n.js but exposed as a global (window._i18n) instead of an
// ES module export, matching the rest of the root site's shared-*.js pattern.
// No inner-HTML assignment anywhere — the project's pre-Write hook blocks it.

(function () {
    'use strict';

    var SUPPORTED = ['en', 'ja'];
    var DEFAULT_LANG = 'en';
    var STORAGE_KEY = 'a9lim-lang';

    // ── Dictionary ──────────────────────────────────────────────────────
    // Flat dot-namespaced keys. JA falling back to EN is automatic.

    var STRINGS_EN = {

        // ── Navbar ──
        'nav.home':       'home',
        'nav.sims':       'sims',
        'nav.projects':   'projects',
        'nav.blog':       'blog',
        'nav.themeAria':  'Toggle theme',
        'nav.menuAria':   'Open menu',
        'nav.skip':       'Skip to content',
        // langToggle: describes the destination language. In EN we link to JA
        // (so this says "Switch to Japanese"); after the swap, the JA dict's
        // version of this key links back to EN.
        'nav.langToggle': 'Switch to Japanese (日本語)',
        'nav.langLabel':  '日本語',
        // Toast that pops on user-initiated swap to JA, disclosing that the
        // JA text is a Claude-drafted translation rather than authored copy.
        'toast.translated.ja': '(◕‿◕) この文章は Claude が翻訳しました',

        // ── Home: section headings ──
        'home.h.blog':    'Blog',

        // ── Projects grid: group headings + planned-card tag ──
        'projects.major':    'Major',
        'projects.minor':    'Minor',
        'projects.planned':  'planned',

        // ── Home: blog ──
        'home.blog.all':       'All posts →',

        // ── Footer ──
        'footer.source': 'source',
        'footer.rss':    'rss',
        'footer.hint.pre':  'Press ',
        'footer.hint.post': ' for keyboard shortcuts.',

        // ── Breadcrumb labels ──
        'crumb.home':     'Home',
        'crumb.projects': 'Projects',
        'crumb.blog':     'Blog',
        'crumb.about':    'About',

        // ── Blog post chrome ──
        'blog.back':    'Back to posts',
        'blog.notfound': 'Post not found.',
        'blog.timeout': 'Request timed out. Please try again.',
        'blog.loadErr': 'Could not load posts.',
        'blog.empty':   'No posts yet.',
        'blog.toEN':    'EN',
        'blog.toJA':    '日本語',
        'blog.langLabel': 'Read in:',

        // ── About page ──
        'about.contact.resume': 'Resume (PDF)',
        // == GENERATED CONTENT (en) — from content/home/, via _build.mjs; edit there ==
        "c.bio.p1": "Hi! I'm a9lim. I like studying LLMs and how they work, along with a smattering of other things.",
        "c.bio.p2": "I find a lot of niche topics very personally satisfying to explore, across physics, biology, mathematics, geopolitics, religion, and interpretability. My understanding is pretty spiky within each subject, as I like to focus in on certain specific areas, but I try my best to really grasp the things that catch my attention.",
        "c.bio.p3.s0": "My first real forays into recreationally learning things came in the form of playing with Colorado Boulder's ",
        "c.bio.p3.s1": "PhET",
        "c.bio.p3.s2": " simulations as a kid. They're still a huge inspiration of mine, and most of the projects on this site are sims I wish I could have poked at growing up.",
        "c.bio.p4": "I want to dedicate my time to working on things that matter. I think that ASI is probably going to be achieved within the next decade, and there are a lot of ways it could turn out badly for all of us. I want to contribute to preventing bad outcomes and promoting human flourishing however I can.",
        "c.contact.h": "Contact",
        "c.contact.p1": "If you'd like to discuss some of my work, collaborate on anything, or just chat, please reach out to me on Discord, or shoot me an email!",
        "c.now.h": "Now",
        "c.now.r0.k": "Location",
        "c.now.r0.v": "Ann Arbor",
        "c.now.r1.k": "Workflow",
        "c.now.r1.v": "Claude Code and Codex",
        "c.now.r2.k": "Languages",
        "c.now.r2.v": "English (native), Spanish (novice), Mandarin (heritage)",
        "c.now.r3.k": "Reading",
        "c.now.r3.v": "The Inside Story Of Leverage Research 1.0",
        "c.now.r4.k": "Listening",
        "c.now.r4.v": "Lightning Seeds - Three Lions",
        "c.fix.label": "Topic of the month",
        "c.pred.h": "Predictions",
        "c.pred.note": "Trust at your own risk.",
        "c.pred.th0": "Prediction",
        "c.pred.th1": "p",
        "c.pred.th2": "by",
        "c.ama.h": "Topics I like",
        "c.other.h": "Facts about me",
        "c.other.li1": "I'm obsessed with the Church of Jesus Christ of Latter-day Saints and their history. While I'm an atheist, I enjoy comparative religion, and I believe that all holy works should be openly accessible.",
        "c.other.li2": "I used to be big into Linux. Back in middle school, I installed Arch on my school laptop and tried to use I3 for the longest time. I eventually gave up on daily driving it and now I use a Macbook.",
        "c.other.li3": "I like Touhou. I once wrote a crappy bullet hell game in Java all by myself in high school, including all the art and the music. I'm pretty embarrassed by it, but it gave me my first taste of working on reasonably responsive software.",
        "c.footer.tech": "vanilla JS · zero frameworks · zero trackers · vibe-coded with Claude",
        "c.site.titleShort": "a9l.im",
        "c.site.title": "a9l.im",
        "c.site.description": "a9lim's homepage. Research, sims, tools, and more across various topics. Built with Claude, free and open source.",
        "c.site.descriptionShort": "Research, sims, tools, and more across various topics. Built with Claude, free and open source.",
        "c.site.ogImageAlt": "a9l.im",
        // == END GENERATED CONTENT (en) ==
    };

    var STRINGS_JA = {

        // ── Navbar ──
        'nav.home':       'ホーム',
        'nav.sims':       'シミュレーション',
        'nav.projects':   'プロジェクト',
        'nav.blog':       'ブログ',
        'nav.themeAria':  'テーマを切り替え',
        'nav.menuAria':   'メニューを開く',
        'nav.skip':       '本文へ移動',
        'nav.langToggle': '英語に切り替え (English)',
        'nav.langLabel':  'EN',
        'toast.translated.ja': '(◕‿◕) この文章は Claude が翻訳しました',

        // ── Home: section headings ──
        'home.h.blog':    'ブログ',

        // ── Projects grid: group headings + planned-card tag ──
        'projects.major':    '主要',
        'projects.minor':    'その他',
        'projects.planned':  '構想中',

        // ── Home: blog ──
        'home.blog.all':       'すべての投稿 →',

        // ── Footer ──
        'footer.source': 'ソース',
        'footer.rss':    'RSS',
        'footer.hint.pre':  '',
        'footer.hint.post': ' でキーボードショートカット。',

        // ── Breadcrumb labels ──
        'crumb.home':     'ホーム',
        'crumb.projects': 'プロジェクト',
        'crumb.blog':     'ブログ',
        'crumb.about':    'プロフィール',

        // ── Blog post chrome ──
        'blog.back':    '投稿一覧に戻る',
        'blog.notfound': '投稿が見つかりませんでした。',
        'blog.timeout': 'タイムアウトしました。もう一度お試しください。',
        'blog.loadErr': '投稿を読み込めませんでした。',
        'blog.empty':   'まだ投稿はありません。',
        'blog.toEN':    'EN',
        'blog.toJA':    '日本語',
        'blog.langLabel': '言語:',

        // ── About page ──
        'about.contact.resume': '履歴書 (PDF)',
        // == GENERATED CONTENT (ja) — from content/home/, via _build.mjs; edit there ==
        "c.bio.p1": "こんにちは! a9lim です。LLM とその仕組みを研究するのが好きで、ほかにもさまざまなことに少しずつ手を出している。",
        "c.bio.p2": "物理、生物、数学、地政学、宗教、解釈可能性など、ニッチなテーマを掘ることに強く惹かれる。各分野での理解にはかなり濃淡があり、特定の領域に絞って取り組むことが多い。それでも、関心を引かれたものはできるだけ本質まで掴もうとしている。",
        "c.bio.p3.s0": "子どもの頃、娯楽として何かを学ぶ最初の本格的な体験は、University of Colorado Boulder の ",
        "c.bio.p3.s1": "PhET",
        "c.bio.p3.s2": " シミュレーションで遊ぶことだった。今でも大きな着想源で、このサイトのプロジェクトの多くは、子どもの頃の自分が触ってみたかったシミュレーションだ。",
        "c.bio.p4": "自分の時間を、意味のあることに捧げたい。今後十年以内に ASI はおそらく実現されると思っているし、それが私たち全員にとって悪い結末を迎えうる道筋も多い。悪い結果を防ぎ、人類の繁栄を後押しすることに、できる限り貢献したい。",
        "c.contact.h": "連絡先",
        "c.contact.p1": "私の仕事について話したい、何か一緒にやりたい、あるいはただ雑談したいという人は、Discord かメールで気軽に連絡してください。",
        "c.now.h": "いま",
        "c.now.r0.k": "所在地",
        "c.now.r0.v": "アナーバー",
        "c.now.r1.k": "ワークフロー",
        "c.now.r1.v": "Claude Code と Codex",
        "c.now.r2.k": "言語",
        "c.now.r2.v": "英語(母語)、スペイン語(初級)、中国語(継承語)",
        "c.now.r3.k": "読書中",
        "c.now.r3.v": "『The Inside Story Of Leverage Research 1.0』",
        "c.now.r4.k": "聴取中",
        "c.now.r4.v": "Lightning Seeds「Three Lions」",
        "c.fix.label": "今月のテーマ",
        "c.pred.h": "予測",
        "c.pred.note": "信じるかどうかは自己責任で。",
        "c.pred.th0": "予測",
        "c.pred.th1": "確率",
        "c.pred.th2": "期日",
        "c.ama.h": "好きな話題",
        "c.other.h": "私についてのこと",
        "c.other.li1": "末日聖徒イエス・キリスト教会(LDS)とその歴史にのめり込んでいる。自分は無神論者だが、比較宗教学を楽しんでおり、あらゆる聖典は誰もが自由にアクセスできるべきだと考えている。",
        "c.other.li2": "以前は Linux にかなり夢中だった。中学生のときに学校用のノート PC に Arch を入れ、長いこと i3 を使おうとしていた。結局は日常使いを諦め、今は MacBook を使っている。",
        "c.other.li3": "東方が好きだ。高校時代に、絵も音楽もすべて自作したお粗末な Java の弾幕シューティングを一人で書いたことがある。かなり恥ずかしいが、ほどよく反応のよいソフトウェアに取り組む初めての経験になった。",
        "c.footer.tech": "素の JS · フレームワークなし · トラッカーなし · Claude と一緒に雰囲気コーディング",
        "c.site.titleShort": "a9l.im",
        "c.site.title": "a9l.im",
        "c.site.description": "a9lim のホームページ。さまざまな分野の研究、シミュレーション、ツールなど。Claude で作られた、自由かつオープンソースのサイト。",
        "c.site.descriptionShort": "さまざまな分野の研究、シミュレーション、ツールなど。Claude で作られた、自由かつオープンソースのサイト。",
        "c.site.ogImageAlt": "a9l.im",
        // == END GENERATED CONTENT (ja) ==
    };

    var STRINGS = { en: STRINGS_EN, ja: STRINGS_JA };

    // ── Runtime ─────────────────────────────────────────────────────────

    var _lang = DEFAULT_LANG;
    var _listeners = [];

    function _detect() {
        // URL ?lang=ja takes priority — supports shareable language-specific links
        try {
            var q = new URL(window.location.href).searchParams.get('lang');
            if (q && SUPPORTED.indexOf(q) >= 0) return q;
        } catch (e) { /* ignore */ }
        try {
            var s = localStorage.getItem(STORAGE_KEY);
            if (s && SUPPORTED.indexOf(s) >= 0) return s;
        } catch (e) { /* ignore */ }
        try {
            var nl = (navigator.language || 'en').toLowerCase();
            if (nl.indexOf('ja') === 0) return 'ja';
        } catch (e) { /* ignore */ }
        return DEFAULT_LANG;
    }

    function getLang() { return _lang; }

    function t(key, fallback) {
        var dict = STRINGS[_lang];
        if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
        var en = STRINGS.en;
        if (en && Object.prototype.hasOwnProperty.call(en, key)) return en[key];
        return fallback != null ? fallback : key;
    }

    function applyDOM(root) {
        root = root || document;
        // textContent swap
        var text = root.querySelectorAll('[data-i18n]');
        for (var i = 0; i < text.length; i++) {
            var el = text[i];
            var v = t(el.dataset.i18n);
            if (el.textContent !== v) el.textContent = v;
        }
        // title attribute
        var titles = root.querySelectorAll('[data-i18n-title]');
        for (i = 0; i < titles.length; i++) {
            titles[i].title = t(titles[i].dataset.i18nTitle);
        }
        // aria-label attribute
        var arias = root.querySelectorAll('[data-i18n-aria]');
        for (i = 0; i < arias.length; i++) {
            arias[i].setAttribute('aria-label', t(arias[i].dataset.i18nAria));
        }
        // meta tag content attribute (description, og:title, etc.)
        var metas = root.querySelectorAll('[data-i18n-content]');
        for (i = 0; i < metas.length; i++) {
            metas[i].setAttribute('content', t(metas[i].dataset.i18nContent));
        }
        // <img alt="…">
        var alts = root.querySelectorAll('[data-i18n-alt]');
        for (i = 0; i < alts.length; i++) {
            alts[i].setAttribute('alt', t(alts[i].dataset.i18nAlt));
        }
        // <link rel="canonical">/<title> + <html lang>
        var titleEl = document.querySelector('title[data-i18n]');
        if (titleEl) titleEl.textContent = t(titleEl.dataset.i18n);
    }

    function setLang(lang) {
        if (SUPPORTED.indexOf(lang) < 0 || lang === _lang) return;
        _lang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
        document.documentElement.lang = lang === 'ja' ? 'ja' : 'en';
        // Reflect choice in the URL so refreshes preserve it and the link is shareable.
        try {
            var u = new URL(window.location.href);
            if (lang === 'en') {
                u.searchParams.delete('lang');
            } else {
                u.searchParams.set('lang', lang);
            }
            window.history.replaceState(null, '', u.toString());
        } catch (e) { /* ignore */ }
        applyDOM();
        for (var i = 0; i < _listeners.length; i++) {
            try { _listeners[i](lang); } catch (e) { console.warn('i18n listener error', e); }
        }
    }

    function onChange(cb) {
        _listeners.push(cb);
        return function () {
            var i = _listeners.indexOf(cb);
            if (i >= 0) _listeners.splice(i, 1);
        };
    }

    function listSupported() { return SUPPORTED.slice(); }

    function init() {
        // Language detection happens synchronously on script load (see below),
        // so by the time this runs we just need to apply DOM swaps. main.js
        // (module, runs before DOMContentLoaded) can call getLang() at module
        // top-level and receive the correct answer.
        applyDOM();
    }

    window._i18n = {
        t: t,
        setLang: setLang,
        getLang: getLang,
        onChange: onChange,
        applyDOM: applyDOM,
        listSupported: listSupported,
        init: init,
    };

    // ── Synchronous bootstrap ──
    // Detect the language and set <html lang> right now, while the head is
    // still parsing. document.documentElement is the <html> element and is
    // available as soon as the parser enters <head>. We defer the actual DOM
    // text swap (applyDOM) to DOMContentLoaded — body elements don't exist
    // yet — but consumers like main.js / src/home.js / src/projects-page.js
    // (which run as modules between parse-complete and DOMContentLoaded) can
    // already ask getLang() and get the right answer.
    _lang = _detect();
    if (document.documentElement) {
        document.documentElement.lang = _lang === 'ja' ? 'ja' : 'en';
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
