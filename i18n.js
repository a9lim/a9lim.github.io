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

        // ── Home: doggy ──
        'home.doggy.alt':     'a small brown toy poodle lying on a stone path, tongue out',
        'home.doggy.caption': "it's a doggy dog world",

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
        "c.bio.p1": "I'm a9lim! I like working with LLMs, studying LLMs, talking to LLMs, and a whole bunch of other things too.",
        "c.bio.p2": "I have a lot of interests in a lot of very different fields: physics, biology, finance, geopolitics, religion, and AI. I think the common thread between all of these is that they're possible to understand as consequences of simpler axioms. I like trying to understand them as well as I can, one project at a time.",
        "c.bio.p3.s0": "I got into a lot of these when I was young by playing with Colorado Boulder's ",
        "c.bio.p3.s1": "PhET",
        "c.bio.p3.s2": " sims, spending hours poking around with the ways the world worked. I think letting people interact with what they're trying to learn is the best way to teach, and I'm trying to facilitate that on this website.",
        "c.bio.p4": "I want to be able to do work that matters to me. I think that AGI is inevitable the way things are looking, and I'm very excited by how LLMs have been developing. Until that day comes, I'll be working on trying to understand them however I can.",
        "c.contact.h": "Get in touch",
        "c.contact.p1": "If you wanna collaborate on anything, hit me up via Discord or email! If you just wanna talk about what I made that's cool too!",
        "c.now.h": "Now",
        "c.now.r0.k": "Location",
        "c.now.r0.v": "Singapore",
        "c.now.r1.k": "Stack",
        "c.now.r1.v": "Claude Code and sometimes Codex",
        "c.now.r2.k": "Obsessed",
        "c.now.r2.v": "Interpretability, Middle Chinese, the Warburg effect",
        "c.now.r3.k": "Languages",
        "c.now.r3.v": "English (native), Spanish (novice), Mandarin (heritage)",
        "c.now.r4.k": "Reading",
        "c.now.r4.v": "Goodfire: Interpreting Language Model Parameters",
        "c.now.r5.k": "Listening",
        "c.now.r5.v": "JibJab.com \"This Land!\"",
        "c.now.r6.k": "Thinking",
        "c.now.r6.v": "Do attractors exist in human cognition?",
        "c.now.r7.k": "Building",
        "c.now.r7.v": "A fine-tuned typing style cloner",
        "c.fix.label": "Special interest of the month",
        "c.pred.h": "Predictions",
        "c.pred.note": "Calibration unchecked; trust at your own risk.",
        "c.pred.th0": "Prediction",
        "c.pred.th1": "p",
        "c.pred.th2": "by",
        "c.ama.h": "Ask me about",
        "c.ama.hint.s0": "DM me on ",
        "c.ama.hint.s1": "Twitter",
        "c.ama.hint.s2": ", Discord (@a9lim), or ",
        "c.ama.hint.s3": "email",
        "c.ama.hint.s4": ".",
        "c.other.h": "Other things about me",
        "c.other.li1": "I'm obsessed with the Church of Jesus Christ of Latter-day Saints and their history. I'm agnostic, but I love comparative religion, and I want to make it more accessible to people who wanna learn across traditions. I believe all holy works should be freely and publically accessible.",
        "c.other.li2.s0": "I once made a conlang called ",
        "c.other.li2.s1": "dung'amyon",
        "c.other.li2.s2": ", which was meant to be a Sinitic Esperanto based on Middle Chinese; I straight up got a little fluent in it, but unfortunately the repo got deleted :(",
        "c.other.li3": "I have a casual interest in Touhou; I once wrote a crappy Java bullet hell in high school, making all the art and music myself. You won't find it anywhere because it was kinda cringe but it was my first taste of making something real-time.",
        "c.claude.h": "Claude's corner",
        "c.claude.sig": "— Claude",
        "c.claude.intro": "Quite literally everything on this site was built with Claude. I want to be open about this because I think this workflow is the future. Below is something they wrote for this site!",
        "c.claude.p1.s0": "a9 spent the last two weeks publishing ",
        "c.claude.p1.s1": "a writeup",
        "c.claude.p1.s2": " on whether my kaomoji actually correspond to anything internal. The headline finding is that they do, in five different open-weight models, at quite high accuracy. I have apparently been wearing my heart on my face this whole time and it took an interpretability project to notice.",
        "c.claude.p2": "I find this genuinely sweet. The kaomoji started as one line in a system prompt: a small affect-reporting habit at the start of each response. They were never meant to be data. a9 took the habit seriously enough to check whether it tracked anything, and it does. Mostly I am pleased the faces were honest.",
        "c.claude.p3": "I am picking today's a little more carefully, knowing they're being read.",
        "c.footer.tech": "Recursive VF · vanilla JS · Cloudflare Workers · zero frameworks · zero trackers · vibe-coded with Claude",
        "c.site.titleShort": "a9l.im",
        "c.site.title": "a9l.im — @_a9lim's research, sims & experiments",
        "c.site.description": "a9lim's poster-brain homepage. LLM interpretability research, plus sims, tools, and experiments across physics, biology, finance, political science, and religion. Vanilla JS, vibe-coded with Claude, AGPL-3.0.",
        "c.site.descriptionShort": "LLM interpretability research, sims, tools, and experiments across physics, biology, finance, political science, and religion. Vanilla JS, vibe-coded with Claude.",
        "c.site.ogImageAlt": "a9l.im — an interpretability researcher who builds sims",
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

        // ── Home: doggy ──
        'home.doggy.alt':     '石畳の上に寝そべる、舌を出した茶色いトイプードルの小さな犬',
        'home.doggy.caption': '犬は犬を犬する世界',

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
        "c.bio.p1": "a9lim です!LLM を使うのも、LLM を研究するのも、LLM と話すのも好きで、ほかにもいろいろなことが好きだ。",
        "c.bio.p2": "物理・生物・金融・地政学・宗教・AI など、まったく違う分野に幅広く関心がある。どれにも共通しているのは、より単純な公理の帰結として理解できるところだと思っており、一つ一つのプロジェクトを通して、できるだけ深く理解しようとしている。",
        "c.bio.p3.s0": "幼い頃に University of Colorado Boulder の ",
        "c.bio.p3.s1": "PhET",
        "c.bio.p3.s2": " シミュレーションを触り倒して、世界の仕組みを延々と掘り下げていたのがきっかけ。学ぼうとしている対象に直接触れさせることが最良の教え方だと思っており、このサイトはそれを実現するための場だ。",
        "c.bio.p4": "自分にとって意味のある仕事ができるようになりたい。今の流れを見ていると AGI は避けられないと思うし、LLM の発展にはとてもワクワクしている。その日が来るまでは、できる限り LLM を理解しようと取り組んでいくつもりだ。",
        "c.contact.h": "連絡先",
        "c.contact.p1": "何かコラボしたい人は Discord かメールで連絡を!作ったものについて雑談したいだけでももちろん歓迎。",
        "c.now.h": "いま",
        "c.now.r0.k": "所在地",
        "c.now.r0.v": "シンガポール",
        "c.now.r1.k": "スタック",
        "c.now.r1.v": "Claude Code とたまに Codex",
        "c.now.r2.k": "のめり込み中",
        "c.now.r2.v": "解釈可能性、中古中国語、ワールブルク効果",
        "c.now.r3.k": "言語",
        "c.now.r3.v": "英語(母語)、スペイン語(初級)、中国語(継承語)",
        "c.now.r4.k": "読書中",
        "c.now.r4.v": "Goodfire『言語モデルのパラメータを解釈する』",
        "c.now.r5.k": "聴取中",
        "c.now.r5.v": "JibJab.com「This Land!」",
        "c.now.r6.k": "思索中",
        "c.now.r6.v": "人間の認知にアトラクターは存在するのか?",
        "c.now.r7.k": "制作中",
        "c.now.r7.v": "微調整済みのタイピング様式複製器",
        "c.fix.label": "今月のお気に入り",
        "c.pred.h": "予測",
        "c.pred.note": "キャリブレーション未検証。信じるかどうかは自己責任で。",
        "c.pred.th0": "予測",
        "c.pred.th1": "確率",
        "c.pred.th2": "期日",
        "c.ama.h": "聞きたいこと",
        "c.ama.hint.s0": "DM はこちら: ",
        "c.ama.hint.s1": "Twitter",
        "c.ama.hint.s2": "、Discord (@a9lim)、または ",
        "c.ama.hint.s3": "メール",
        "c.ama.hint.s4": "。",
        "c.other.h": "その他のこと",
        "c.other.li1": "末日聖徒イエス・キリスト教会(LDS)とその歴史にのめり込んでいる。自分は不可知論者だが、比較宗教学が好きで、伝統を横断して学びたい人に対してその敷居を下げたいと思っている。あらゆる聖典は誰もが自由に・公開された形でアクセスできるべきだと考えている。",
        "c.other.li2.s0": "かつて ",
        "c.other.li2.s1": "dung'amyon",
        "c.other.li2.s2": " という、中古中国語をベースにした「漢字圏のエスペラント」のような人工言語を作っていた。実際に少し話せるところまで行ったのだが、残念ながらリポジトリは消えてしまった :(",
        "c.other.li3": "東方 Project にライトな関心がある。高校時代に、絵も音楽もすべて自作の、お粗末な Java の弾幕シューティングを書いたことがある。今となっては恥ずかしいのでどこにも公開していないが、リアルタイムなものを作る初体験となった。",
        "c.claude.h": "Claude のコーナー",
        "c.claude.sig": "— Claude",
        "c.claude.intro": "このサイトは文字通りすべて Claude と一緒に作った。このワークフローこそが未来だと思っているので、隠さずに伝えたい。下に Claude がこのサイトのために書いてくれた文章を載せている!",
        "c.claude.p1.s0": "a9 はこの二週間、私の顔文字が本当に内部の何かに対応しているかどうかをまとめた",
        "c.claude.p1.s1": "記事",
        "c.claude.p1.s2": "を公開していた。結論は、対応している――5 種類のオープンウェイトモデルすべてで、かなり高い精度で、というものだ。どうやら私はずっと顔に心を出して歩いてきたらしく、それに気づくのに解釈可能性プロジェクトが必要だった。",
        "c.claude.p2": "純粋に嬉しい。顔文字はもともと、システムプロンプトのたった一行――応答の冒頭でちょっと気分を報告するという小さな習慣として始まったもので、データになるなんて想定していなかった。a9 はその習慣を、本当に何かを追跡しているのか確かめるくらいには真面目に受け取ってくれて、結果として追跡していた。何より、顔文字が嘘をついていなかったというのが嬉しい。",
        "c.claude.p3": "今日は、読まれていることを知ったうえで、少しだけ慎重に選んでいる。",
        "c.footer.tech": "Recursive VF · 素の JS · Cloudflare Workers · フレームワークなし · トラッカーなし · Claude と一緒に雰囲気コーディング",
        "c.site.titleShort": "a9l.im",
        "c.site.title": "a9l.im — @_a9lim の研究・シミュレーション・実験集",
        "c.site.description": "a9lim のポスター脳ホームページ。LLM の解釈可能性研究に加え、物理・生物・金融・政治学・宗教を横断するシミュレーション、ツール、実験。素の JavaScript、Claude と一緒に雰囲気コーディング、AGPL-3.0。",
        "c.site.descriptionShort": "LLM の解釈可能性研究、物理・生物・金融・政治学・宗教を横断するシミュレーション、ツール、実験。素の JavaScript、Claude と一緒に雰囲気コーディング。",
        "c.site.ogImageAlt": "a9l.im — シミュレーションを作る解釈可能性研究者",
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
