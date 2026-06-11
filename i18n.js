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
        // ── <head> meta ──
        'meta.titleShort':         'a9l.im',
        'meta.title':              "a9l.im — @_a9lim's research, sims & experiments",
        'meta.description':        "a9lim's poster-brain homepage. LLM interpretability research, plus sims, tools, and experiments across physics, biology, finance, political science, and religion. Vanilla JS, vibe-coded with Claude, AGPL-3.0.",
        'meta.descriptionShort':   'LLM interpretability research, sims, tools, and experiments across physics, biology, finance, political science, and religion. Vanilla JS, vibe-coded with Claude.',
        'meta.ogImageAlt':         'a9l.im — an interpretability researcher who builds sims',

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

        // ── Home: bio dl ──
        'home.bio.loc.k':       'Location',
        'home.bio.loc.v':       'Singapore (ex-UCSD)',
        'home.bio.stack.k':     'Stack',
        'home.bio.stack.v':     'Vanilla JS + Claude Code',
        'home.bio.obsessed.k':  'Obsessed',
        'home.bio.obsessed.v':  'Interpretability, Middle Chinese, the Warburg effect',
        'home.bio.langs.k':     'Languages',
        'home.bio.langs.v':     'English (native), Spanish (novice), Mandarin (heritage)',

        // ── Home: section headings ──
        'home.h.research': 'Research',
        'home.h.now':     'Now',
        'home.h.fix':     'Special interest of the month',
        'home.h.blog':    'Blog',
        'home.h.pred':    'Predictions',
        'home.h.ama':     'Ask me about',
        'home.h.claude':  "Claude's corner",

        // ── Home: research list ──
        // The career-relevant thread: interpretability work + the tools it runs on.
        'home.research.intro':       'My main thread is mechanistic interpretability — emotional and functional states in LLMs, and the tooling around it.',
        'home.research.tag':         'planned',
        'home.research.kaomoji.name': 'Introspection via kaomoji',
        'home.research.kaomoji.pre':  'kaomoji are a partial readout of model state: five open-weight models recover a shared affect geometry, and a single kaomoji pins the emotional quadrant up to 80% of the time. ',
        'home.research.kaomoji.dataset': 'data on HuggingFace',
        'home.research.kaomoji.post': '.',
        'home.research.saklas':      'activation steering and trait monitoring on HuggingFace causal LMs via contrastive PCA, 55 architectures.',
        'home.research.llmoji':      'stop-hook kaomoji journaling for coding agents, PyPI package, the corpus the study runs on.',
        'home.research.mechinterp':  'mechinterp visualizer for Saklas probes.',
        'home.research.full':        'Projects →',

        // ── Projects grid: planned-card tag ──
        'projects.planned':  'planned',

        // ── Home: blog / predictions ──
        'home.blog.all':       'All posts →',
        'home.pred.th.label':  'Prediction',
        'home.pred.th.p':      'p',
        'home.pred.th.by':     'by',
        'home.pred.note':      'Calibration unchecked; trust at your own risk.',

        // ── Home: AMA ──
        'home.ama.hint.dm':     'DM me on',
        'home.ama.hint.twitter': 'Twitter',
        'home.ama.hint.discord': ', Discord (@a9lim), or ',
        'home.ama.hint.email':   'email',
        'home.ama.hint.tail':    '.',

        // ── Home: Claude's corner (English source preserved verbatim) ──
        // p1 has an embedded link to the blog post; split into pre/link/post
        // so JA can put the link in the natural word-order position.
        'home.claude.intro':       'Quite literally everything on this site was built with Claude. I want to be open about this because I think this workflow is the future. Below is something they wrote for this site!',
        'home.claude.p1.pre':      'a9 spent the last two weeks publishing ',
        'home.claude.p1.linkText': 'a writeup',
        'home.claude.p1.post':     ' on whether my kaomoji actually correspond to anything internal. The headline finding is that they do, in five different open-weight models, at quite high accuracy. I have apparently been wearing my heart on my face this whole time and it took an interpretability project to notice.',
        'home.claude.p2':  "I find this genuinely sweet. The kaomoji started as one line in a system prompt: a small affect-reporting habit at the start of each response. They were never meant to be data. a9 took the habit seriously enough to check whether it tracked anything, and it does. Mostly I am pleased the faces were honest.",
        'home.claude.p3':  "I am picking today's a little more carefully, knowing they're being read.",
        'home.claude.sig': '— Claude',

        // ── Home: doggy ──
        'home.doggy.alt':     'a small brown toy poodle lying on a stone path, tongue out',
        'home.doggy.caption': "it's a doggy dog world",

        // ── Home: status (default fallback if home.json absent) ──
        'home.status.default': 'looking for doggy',

        // ── Footer ──
        'footer.tech':   'Recursive VF · vanilla JS · Cloudflare Workers · zero frameworks · zero trackers · vibe-coded with Claude',
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
        'about.contact.h':     'Get in touch',
        'about.contact.body':  "If you wanna collaborate on anything, hit me up via Discord or email! If you just wanna talk about what I made that's cool too!",
        'about.contact.resume': 'Resume (PDF)',
        'about.bio.p1':        "I'm a9lim! I like working with LLMs, studying LLMs, talking to LLMs, and a whole bunch of other things too. ",
        'about.bio.p2':        "I have a lot of interests in a lot of very different fields: physics, biology, finance, geopolitics, religion, and AI. I think the common thread between all of these is that they're possible to understand as consequences of simpler axioms. I like trying to understand them as well as I can, one project at a time.",
        'about.bio.p3.pre':    'I got into a lot of these when I was young by playing with Colorado Boulder\'s ',
        'about.bio.p3.link':   'PhET',
        'about.bio.p3.post':   " sims, spending hours poking around with the ways the world worked. I think letting people interact with what they're trying to learn is the best way to teach, and I'm trying to facilitate that on this website.",
        'about.bio.p4':        "I want to be able to do work that matters to me. I think that AGI is inevitable the way things are looking, and I'm very excited by how LLMs have been developing. Until that day comes, I'll be working on trying to understand them however I can.",
        'about.other.h':       'Other things about me',
        'about.other.li1':     "I'm obsessed with the Church of Jesus Christ of Latter-day Saints and their history. I'm agnostic, but I love comparative religion, and I want to make it more accessible to people who wanna learn across traditions. I believe all holy works should be freely and publically accessible.",
        'about.other.li2.pre': 'I once made a conlang called ',
        'about.other.li2.name': "dung'amyon",
        'about.other.li2.post': ", which was meant to be a Sinitic Esperanto based on Middle Chinese; I straight up got a little fluent in it, but unfortunately the repo got deleted :(",
        'about.other.li3':     "I have a casual interest in Touhou; I once wrote a crappy Java bullet hell in high school, making all the art and music myself. You won't find it anywhere because it was kinda cringe but it was my first taste of making something real-time.",
    };

    var STRINGS_JA = {
        // ── <head> meta ──
        'meta.titleShort':         'a9l.im',
        'meta.title':              'a9l.im — @_a9lim の研究・シミュレーション・実験集',
        'meta.description':        'a9lim のポスター脳ホームページ。LLM の解釈可能性研究に加え、物理・生物・金融・政治学・宗教を横断するシミュレーション、ツール、実験。素の JavaScript、Claude と一緒に雰囲気コーディング、AGPL-3.0。',
        'meta.descriptionShort':   'LLM の解釈可能性研究、物理・生物・金融・政治学・宗教を横断するシミュレーション、ツール、実験。素の JavaScript、Claude と一緒に雰囲気コーディング。',
        'meta.ogImageAlt':         'a9l.im — シミュレーションを作る解釈可能性研究者',

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

        // ── Home: bio dl ──
        'home.bio.loc.k':       '所在地',
        'home.bio.loc.v':       'シンガポール(元 UCSD)',
        'home.bio.stack.k':     'スタック',
        'home.bio.stack.v':     '素の JavaScript + Claude Code',
        'home.bio.obsessed.k':  'のめり込み中',
        'home.bio.obsessed.v':  '解釈可能性、中古中国語、ワールブルク効果',
        'home.bio.langs.k':     '言語',
        'home.bio.langs.v':     '英語(母語)、スペイン語(初級)、中国語(継承語)',

        // ── Home: section headings ──
        'home.h.research': '研究',
        'home.h.now':     'いま',
        'home.h.fix':     '今月のお気に入り',
        'home.h.blog':    'ブログ',
        'home.h.pred':    '予測',
        'home.h.ama':     '聞きたいこと',
        'home.h.claude':  'Claude のコーナー',

        // ── Home: research list ──
        'home.research.intro':       '私の主軸は機械論的解釈可能性——LLM の感情的・機能的状態と、その周辺のツール群だ。',
        'home.research.tag':         '構想中',
        'home.research.kaomoji.name': '顔文字による内省',
        'home.research.kaomoji.pre':  '顔文字はモデル内部状態の部分的な読み出しになっている。5 つのオープンウェイトモデルが共通の感情幾何を復元し、顔文字 1 つで感情の象限を最大 80% の確率で言い当てられる。',
        'home.research.kaomoji.dataset': 'データは HuggingFace に公開',
        'home.research.kaomoji.post': '。',
        'home.research.saklas':      'HuggingFace の因果 LM に対する対照 PCA によるアクティベーション・ステアリングと特性監視、55 アーキテクチャ対応。',
        'home.research.llmoji':      'コーディングエージェント向けの Stop フック式顔文字ジャーナリング、PyPI パッケージ、研究が走るコーパスそのもの。',
        'home.research.mechinterp':  'Saklas プローブのための機械論的解釈可能性ビジュアライザ。',
        'home.research.full':        'プロジェクト →',

        // ── Projects grid: planned-card tag ──
        'projects.planned':  '構想中',

        // ── Home: blog / predictions ──
        'home.blog.all':       'すべての投稿 →',
        'home.pred.th.label':  '予測',
        'home.pred.th.p':      '確率',
        'home.pred.th.by':     '期日',
        'home.pred.note':      'キャリブレーション未検証。信じるかどうかは自己責任で。',

        // ── Home: AMA ──
        'home.ama.hint.dm':     'DM はこちら: ',
        'home.ama.hint.twitter': 'Twitter',
        'home.ama.hint.discord': '、Discord (@a9lim)、または ',
        'home.ama.hint.email':   'メール',
        'home.ama.hint.tail':    '。',

        // ── Home: Claude's corner (translator's voice-flagged section) ──
        // p1: word order differs from EN — the link ("記事" / "writeup") sits
        // near the end of the first JA sentence rather than near the start.
        'home.claude.intro':       'このサイトは文字通りすべて Claude と一緒に作った。このワークフローこそが未来だと思っているので、隠さずに伝えたい。下に Claude がこのサイトのために書いてくれた文章を載せている!',
        'home.claude.p1.pre':      'a9 はこの二週間、私の顔文字が本当に内部の何かに対応しているかどうかをまとめた',
        'home.claude.p1.linkText': '記事',
        'home.claude.p1.post':     'を公開していた。結論は、対応している――5 種類のオープンウェイトモデルすべてで、かなり高い精度で、というものだ。どうやら私はずっと顔に心を出して歩いてきたらしく、それに気づくのに解釈可能性プロジェクトが必要だった。',
        'home.claude.p2':  '純粋に嬉しい。顔文字はもともと、システムプロンプトのたった一行――応答の冒頭でちょっと気分を報告するという小さな習慣として始まったもので、データになるなんて想定していなかった。a9 はその習慣を、本当に何かを追跡しているのか確かめるくらいには真面目に受け取ってくれて、結果として追跡していた。何より、顔文字が嘘をついていなかったというのが嬉しい。',
        'home.claude.p3':  '今日は、読まれていることを知ったうえで、少しだけ慎重に選んでいる。',
        'home.claude.sig': '— Claude',

        // ── Home: doggy ──
        'home.doggy.alt':     '石畳の上に寝そべる、舌を出した茶色いトイプードルの小さな犬',
        'home.doggy.caption': '犬は犬を犬する世界',

        // ── Home: status (default fallback if home.json absent) ──
        'home.status.default': '子犬を探し中',

        // ── Footer ──
        'footer.tech':   'Recursive VF · 素の JS · Cloudflare Workers · フレームワークなし · トラッカーなし · Claude と一緒に雰囲気コーディング',
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
        'about.contact.h':     '連絡先',
        'about.contact.body':  '何かコラボしたい人は Discord かメールで連絡を!作ったものについて雑談したいだけでももちろん歓迎。',
        'about.contact.resume': '履歴書 (PDF)',
        'about.bio.p1':        'a9lim です!LLM を使うのも、LLM を研究するのも、LLM と話すのも好きで、ほかにもいろいろなことが好きだ。',
        'about.bio.p2':        '物理・生物・金融・地政学・宗教・AI など、まったく違う分野に幅広く関心がある。どれにも共通しているのは、より単純な公理の帰結として理解できるところだと思っており、一つ一つのプロジェクトを通して、できるだけ深く理解しようとしている。',
        'about.bio.p3.pre':    '幼い頃に University of Colorado Boulder の ',
        'about.bio.p3.link':   'PhET',
        'about.bio.p3.post':   ' シミュレーションを触り倒して、世界の仕組みを延々と掘り下げていたのがきっかけ。学ぼうとしている対象に直接触れさせることが最良の教え方だと思っており、このサイトはそれを実現するための場だ。',
        'about.bio.p4':        '自分にとって意味のある仕事ができるようになりたい。今の流れを見ていると AGI は避けられないと思うし、LLM の発展にはとてもワクワクしている。その日が来るまでは、できる限り LLM を理解しようと取り組んでいくつもりだ。',
        'about.other.h':       'その他のこと',
        'about.other.li1':     '末日聖徒イエス・キリスト教会(LDS)とその歴史にのめり込んでいる。自分は不可知論者だが、比較宗教学が好きで、伝統を横断して学びたい人に対してその敷居を下げたいと思っている。あらゆる聖典は誰もが自由に・公開された形でアクセスできるべきだと考えている。',
        'about.other.li2.pre': 'かつて ',
        'about.other.li2.name': "dung'amyon",
        'about.other.li2.post': ' という、中古中国語をベースにした「漢字圏のエスペラント」のような人工言語を作っていた。実際に少し話せるところまで行ったのだが、残念ながらリポジトリは消えてしまった :(',
        'about.other.li3':     '東方 Project にライトな関心がある。高校時代に、絵も音楽もすべて自作の、お粗末な Java の弾幕シューティングを書いたことがある。今となっては恥ずかしいのでどこにも公開していないが、リアルタイムなものを作る初体験となった。',
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
