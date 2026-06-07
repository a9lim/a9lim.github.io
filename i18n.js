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
        'meta.title':              "a9l.im — @_a9lim's sims & experiments",
        'meta.description':        "a9lim's poster-brain homepage. Sims, tools, and experiments across physics, biology, finance, political science, religion, and AI. Vanilla JS, vibe-coded with Claude, AGPL-3.0.",
        'meta.descriptionShort':   'Sims, tools, and experiments across physics, biology, finance, political science, religion, and AI. Vanilla JS, vibe-coded with Claude.',
        'meta.ogImageAlt':         'a9l.im — interactive educational simulations',

        // ── Navbar ──
        'nav.home':       'home',
        'nav.sims':       'sims',
        'nav.projects':   'projects',
        'nav.blog':       'blog',
        'nav.resume':     'resume',
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
        'home.h.now':     'Now',
        'home.h.fix':     'Special interest of the month',
        'home.h.sims':    'Sims',
        'home.h.misc':    'Misc Projects',
        'home.h.blog':    'Blog',
        'home.h.commits': 'Commits',
        'home.h.pred':    'Predictions',
        'home.h.ama':     'Ask me about',
        'home.h.claude':  "Claude's corner",

        // ── Home: sims list ──
        'home.sims.shipped': 'shipped',
        'home.sims.planned': 'planned',
        'home.sims.geon':    'relativistic N-body particle physics, 11 forces, WebGPU.',
        'home.sims.cyano':   'cellular metabolism, 12 pathways, electron transport chain.',
        'home.sims.shoals':  'options pricing, Heston and Merton, 400+ scenarios.',
        'home.sims.gerry':   'gerrymandering on hex tiles, 6 fairness metrics, Monte Carlo.',
        'home.sims.scripture': '16 sacred texts, full-text search, TF-IDF concordance.',
        'home.sims.miasma':  'stochastic spatial epidemic, multi-strain evolution, hex-grid topology, intervention paint.',
        'home.sims.pile':    'nuclear reactor sim, 3 reactor types, axial neutronics, coupled plant systems.',
        'home.sims.plasma':  '2D resistive MHD, HLLD + PPM + constrained transport, WebGPU.',
        'home.sims.mechinterp': 'Mechinterp visualizer for Saklas probes.',
        'home.sims.epi':     'Epidemiology sim (zombies): resurrect the 2018 one.',
        'home.sims.full':    'Full grid →',

        // ── Home: misc projects list ──
        'home.misc.saklas':  'activation steering on HuggingFace transformers, 53 architectures, contrastive PCA.',
        'home.misc.kenoma':  'fake shell, hallucinates command output via raw LLM completion, real PS1 as the stop token.',
        'home.misc.rlaif':   'single-user MCP server, exposes a PiShock collar as an agent tool, rate-limited and consent-gated.',
        'home.misc.llmoji':  'kaomoji-injection CLI for coding agents, with a companion mechinterp study on the corpus.',
        'home.misc.faithful': 'Discord chatbot, emulates a given user from a corpus of their messages.',
        'home.misc.hylic':   'Hylic: typing-style finetuning provider, takes any text corpus (like Faithful) and serves a model actually finetuned on it.',

        // ── Home: blog / commits / predictions ──
        'home.blog.all':       'All posts →',
        'home.commits.more':   'More on GitHub →',
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
        'footer.cv':     'cv',
        'footer.rss':    'rss',
        'footer.hint.pre':  'Press ',
        'footer.hint.post': ' for keyboard shortcuts.',

        // ── Breadcrumb labels ──
        'crumb.home':     'Home',
        'crumb.projects': 'Projects',
        'crumb.blog':     'Blog',
        'crumb.about':    'About',
        'crumb.resume':   'Resume',

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

        // ── Resume page ──
        'resume.dl.download':   'Download PDF',
        'resume.h.profile':     'Profile',
        'resume.profile.pre':   "I'm a Singaporean developer building simulations, tools, and interpretability research, most of it hosted at ",
        'resume.profile.post':  ". Literally everything I make is written with Claude: vanilla JS for the site, plus Python and Rust for research. I'm open to freelance and collaboration, especially research tools and anything DIY.",
        'resume.h.experience':  'Experience',
        'resume.job.indep.title.pre': 'Independent Developer — ',
        'resume.job.indep.b1':  'Built and maintain, solo, a portfolio of open-source interactive simulations and tools plus the shared design system and component library used across all of them, all in rawdogged vanilla JavaScript.',
        'resume.job.indep.b2':  'Architected the SSR layer on Cloudflare Workers and Assets: per-route HTMLRewriter injection, edge-rendered markdown, structured data, and per-route security headers.',
        'resume.job.indep.dates': 'Feb 2026 – Present',
        'resume.job.sddm.title.pre':  'SDDM Theme Maintainer — ',
        'resume.job.sddm.dates': '2025 – Present',
        'resume.job.sddm.b1':   "Led the QtQuick rewrite of Catppuccin's SDDM display-manager theme: dynamic accent colors, per-user icons, designed vector backgrounds, and automated theme generation across all four flavors.",
        'resume.h.research':    'Research',
        'resume.research.saklas.tagline': 'PyPI · Python',
        'resume.research.saklas.b1.pre':  'Activation steering and probing library powering the studies below: pulls contrastive steering vectors (',
        'resume.research.saklas.b1.link': 'Zou et al. 2023',
        'resume.research.saklas.b1.post': ') and adds them to hidden states at generation time, no fine-tuning. Ships 21 in-flight probes for affect, stance, register, and alignment.',
        'resume.research.saklas.b2': 'Python API, an OpenAI- and Ollama-compatible server, and a live terminal UI; supports 53 model architectures. On PyPI under AGPL-3.0 with CI and llama.cpp GGUF interchange.',
        'resume.research.kaomoji.tagline': 'Python · HuggingFace',
        'resume.research.kaomoji.b1': 'Built llmoji, a CLI that hooks coding agents (Claude Code, Codex, Hermes) to open every turn with a kaomoji, then synthesizes a meaning per face and ships the corpus as a public HuggingFace dataset.',
        'resume.research.kaomoji.b2': "Found that a model's hidden-state affect quadrant is recoverable from its kaomoji choice across open-weight families (by Jensen-Shannon similarity, not argmax). Sibling studies probe a residual-stream attractor basin and whether stated elapsed time is represented or confabulated.",
        'resume.h.projects':    'Selected Projects',
        'resume.proj.pleroma.tagline': 'Rust · Python',
        'resume.proj.pleroma.b1': "Clifford algebras (with nilpotents, so a degenerate form recovers the full exterior algebra) over the three field-like cores of Conway's combinatorial games. Surreals recover the real Cl(p,q) classification with infinite and infinitesimal metric entries; nimbers give genuinely new characteristic-2 algebras. Verified Rust core with Python bindings.",
        'resume.proj.bioformer.tagline': 'Python',
        'resume.proj.bioformer.b1': 'Neuromorphic transformer from three brain subsystems that each compute something transformer-shaped: astrocytes as recurrent linear attention, the Marr-Albus cerebellum as the FFN, and laminar neocortex as the residual stream via predictive coding. Every neuron is a leaky integrate-and-fire spiker and every weight update is local (Oja, Hebbian, and climbing-fibre rules), with no backprop or surrogate gradient.',
        'resume.proj.sims.title': 'Interactive Simulations',
        'resume.proj.sims.tagline': 'JavaScript · WebGPU',
        'resume.proj.sims.geon': ': relativistic N-body simulator on WebGPU compute shaders, with 11 forces, Barnes-Hut scaling, and Kerr-Newman black holes. ',
        'resume.proj.sims.shoals': ': options-trading sim with Heston, Merton, and Vasicek pricing and a 400+ scenario event engine.',
        'resume.proj.sims.more': 'Plus Plasma (WebGPU resistive MHD), Pile (PWR, RBMK, and molten-salt reactor neutronics), Miasma (stochastic spatial epidemics), Cyano (cellular metabolism), Gerry (redistricting and fairness metrics), and Scripture (sixteen-text reader with full-text search and edge SSR).',
        'resume.h.education':   'Education',
        'resume.edu.ucsd.line': 'B.S. in Mathematics · GPA 3.75 · GRE 335 (170Q, 165V)',
        'resume.edu.ucsd.dates': 'March 2026',
        'resume.edu.sas.line':  'Summa Cum Laude · GPA 4.50',
        'resume.edu.sas.dates': 'Class of 2023',
        'resume.h.skills':      'Skills',
        'resume.skill.ai.k':    'AI & interpretability',
        'resume.skill.ai.v':    'Daily driver: Claude Code and Codex, integrating AI-generated code at scale; activation steering, contrastive-PCA probing, and hidden-state analysis on HuggingFace transformers; MCP server authoring.',
        'resume.skill.lang.k':  'Languages',
        'resume.skill.lang.v':  'JavaScript (Canvas, WebGL, WebGPU, GLSL, WGSL), Python (PyTorch, HuggingFace transformers, NumPy), Rust, Java, QtQuick and QML, LaTeX, HTML, CSS.',
        'resume.skill.web.k':   'Web & infrastructure',
        'resume.skill.web.v':   'Cloudflare Workers and Assets, edge SSR via HTMLRewriter, JSON-LD structured data, self-hosted typography, no-build pipelines.',
        'resume.skill.other.k': 'Other',
        'resume.skill.other.v': 'Technical writing, vector graphics, soldering, Spanish (novice), and conlang construction.',
    };

    var STRINGS_JA = {
        // ── <head> meta ──
        'meta.titleShort':         'a9l.im',
        'meta.title':              'a9l.im — @_a9lim のシミュレーション・実験集',
        'meta.description':        'a9lim のポスター脳ホームページ。物理・生物・金融・政治学・宗教・AI を横断するシミュレーション、ツール、実験。素の JavaScript、Claude と一緒に雰囲気コーディング、AGPL-3.0。',
        'meta.descriptionShort':   '物理・生物・金融・政治学・宗教・AI を横断するシミュレーション、ツール、実験。素の JavaScript、Claude と一緒に雰囲気コーディング。',
        'meta.ogImageAlt':         'a9l.im — インタラクティブな学習シミュレーション',

        // ── Navbar ──
        'nav.home':       'ホーム',
        'nav.sims':       'シミュレーション',
        'nav.projects':   'プロジェクト',
        'nav.blog':       'ブログ',
        'nav.resume':     '履歴書',
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
        'home.h.now':     'いま',
        'home.h.fix':     '今月のお気に入り',
        'home.h.sims':    'シミュレーション',
        'home.h.misc':    'その他のプロジェクト',
        'home.h.blog':    'ブログ',
        'home.h.commits': 'コミット',
        'home.h.pred':    '予測',
        'home.h.ama':     '聞きたいこと',
        'home.h.claude':  'Claude のコーナー',

        // ── Home: sims list ──
        'home.sims.shipped': '公開済',
        'home.sims.planned': '構想中',
        'home.sims.geon':    '相対論的 N 体粒子物理、11 種類の力、WebGPU。',
        'home.sims.cyano':   '細胞代謝、12 の代謝経路、電子伝達系。',
        'home.sims.shoals':  'オプション価格付け、ヘストン・マートンモデル、400 以上のシナリオ。',
        'home.sims.gerry':   '六角タイル上のゲリマンダー、6 つの公平性指標、モンテカルロ。',
        'home.sims.scripture': '16 の聖典、全文検索、TF-IDF コンコーダンス。',
        'home.sims.miasma':  '確率的空間疫学、多系統進化、ヘックスグリッド・トポロジ、介入ペイント。',
        'home.sims.pile':    '原子炉シミュレーション、3 炉型、軸方向中性子動特性、結合プラント系統。',
        'home.sims.plasma':  '2 次元抵抗性 MHD、HLLD + PPM + 拘束輸送法、WebGPU。',
        'home.sims.mechinterp': 'Saklas プローブのための機械論的解釈可能性ビジュアライザ。',
        'home.sims.epi':     '感染症シミュレーション(ゾンビ)、2018 年版を復活させる。',
        'home.sims.full':    '一覧へ →',

        // ── Home: misc projects list ──
        'home.misc.saklas':  'HuggingFace transformers のアクティベーション・ステアリング、53 アーキテクチャ対応、対照 PCA。',
        'home.misc.kenoma':  '偽シェル。生の LLM 補完でコマンド出力を捏造し、本物の PS1 を停止トークンに使う。',
        'home.misc.rlaif':   '個人用の MCP サーバ。PiShock 首輪をエージェントツールとして公開、レート制限と同意制。',
        'home.misc.llmoji':  'コーディングエージェント向けの顔文字注入 CLI、コーパスを用いた機械論的解釈可能性研究を併設。',
        'home.misc.faithful': 'Discord チャットボット。任意ユーザのメッセージのコーパスから本人を模倣する。',
        'home.misc.hylic':   'Hylic: タイピングスタイル fine-tuning プロバイダ。任意のテキストコーパス(例: Faithful)を受け取り、それで実際に fine-tune したモデルを提供する。',

        // ── Home: blog / commits / predictions ──
        'home.blog.all':       'すべての投稿 →',
        'home.commits.more':   'GitHub でもっと見る →',
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
        'footer.cv':     '履歴書',
        'footer.rss':    'RSS',
        'footer.hint.pre':  '',
        'footer.hint.post': ' でキーボードショートカット。',

        // ── Breadcrumb labels ──
        'crumb.home':     'ホーム',
        'crumb.projects': 'プロジェクト',
        'crumb.blog':     'ブログ',
        'crumb.about':    'プロフィール',
        'crumb.resume':   '履歴書',

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

        // ── Resume page ──
        'resume.dl.download':   'PDF をダウンロード',
        'resume.h.profile':     '概要',
        'resume.profile.pre':   'シンガポール出身の開発者。',
        'resume.profile.post':  ' でシミュレーション・ツール類、そして解釈可能性の研究を手がけている。作るものはすべて Claude と組んで書いており、サイトは素の JavaScript、研究側は Python と Rust。フリーランス案件・共同制作、特に研究ツールや DIY 寄りの仕事を歓迎する。',
        'resume.h.experience':  '職歴',
        'resume.job.indep.title.pre': '個人開発者 — ',
        'resume.job.indep.b1':  'オープンソースのインタラクティブ・シミュレーション/ツール群と、そのすべてで共有されるデザインシステム・コンポーネントライブラリを一人で構築・保守。すべて素の JavaScript で実装。',
        'resume.job.indep.b2':  'Cloudflare Workers と Assets 上の SSR 層を設計:ルート単位の HTMLRewriter 注入、エッジでのマークダウン描画、構造化データ、ルートごとのセキュリティヘッダー。',
        'resume.job.indep.dates': '2026 年 2 月 – 現在',
        'resume.job.sddm.title.pre':  'SDDM テーマメンテナ — ',
        'resume.job.sddm.dates': '2025 – 現在',
        'resume.job.sddm.b1':   'Catppuccin の SDDM ディスプレイマネージャテーマの QtQuick 書き直しを主導:動的アクセントカラー、ユーザごとのアイコン、ベクター背景の設計、4 フレーバーすべてに対するテーマ生成の自動化。',
        'resume.h.research':    '研究',
        'resume.research.saklas.tagline': 'PyPI · Python',
        'resume.research.saklas.b1.pre':  '下記の研究を支えるアクティベーション・ステアリング/プローブ用ライブラリ。対照ステアリングベクトルを抽出し(',
        'resume.research.saklas.b1.link': 'Zou et al. 2023',
        'resume.research.saklas.b1.post': ')、生成時の隠れ状態に加算する。微調整不要。情動・態度・口調・アラインメントを推論中にスコアリングする 21 個のプローブを同梱。',
        'resume.research.saklas.b2': 'Python API、OpenAI・Ollama 互換サーバ、ライブな端末 UI を備え、53 種類のモデルアーキテクチャに対応。AGPL-3.0 で PyPI に公開、CI と llama.cpp の GGUF 入出力対応つき。',
        'resume.research.kaomoji.tagline': 'Python · HuggingFace',
        'resume.research.kaomoji.b1': 'llmoji を開発:コーディングエージェント(Claude Code、Codex、Hermes)に各応答を顔文字で開始させ、各顔の意味を合成して、コーパスを公開 HuggingFace データセットとして配信する CLI。',
        'resume.research.kaomoji.b2': 'オープンウェイトのモデルファミリーをまたいで、モデルの隠れ状態の情動象限がその顔文字選択から復元できることを発見(argmax ではなく Jensen-Shannon 類似度で評価)。派生研究では残差ストリームのアトラクター盆地と、モデルが述べる経過時間が内部表現に基づくのか出力時に捏造されるのかを調べている。',
        'resume.h.projects':    '主要プロジェクト',
        'resume.proj.pleroma.tagline': 'Rust · Python',
        'resume.proj.pleroma.b1': 'Conway の組合せゲームの 3 つの体に近い核の上に構築したクリフォード代数(冪零元を許すため、退化した形式は外積代数全体を復元する)。超現実数は無限・無限小の計量成分を持つ実 Cl(p,q) の分類を、ニンバーは真に新しい標数 2 の代数を与える。検証済みの Rust コアと Python バインディングを備える。',
        'resume.proj.bioformer.tagline': 'Python',
        'resume.proj.bioformer.b1': '3 つの脳サブシステムから組み立てた神経模倣トランスフォーマー。各サブシステムがトランスフォーマー的な計算を行う:アストロサイトは再帰的線形アテンション、Marr-Albus 小脳は FFN、層状新皮質は予測符号化による残差ストリーム。全ニューロンは漏れ積分発火型スパイカーで、全重み更新は局所的(Oja 則、ヘブ則、登上線維則)であり、誤差逆伝播も代理勾配も用いない。',
        'resume.proj.sims.title': 'インタラクティブ・シミュレーション',
        'resume.proj.sims.tagline': 'JavaScript · WebGPU',
        'resume.proj.sims.geon': ':WebGPU 計算シェーダ上で動く相対論的 N 体シミュレータ。11 種類の力、Barnes-Hut 加速、Kerr-Newman ブラックホールを実装。',
        'resume.proj.sims.shoals': ':ヘストン・マートン・Vasicek 価格付けと 400 以上のシナリオを持つイベントエンジンを備えたオプション取引シミュレータ。',
        'resume.proj.sims.more': 'ほかに Plasma(WebGPU 抵抗性 MHD)、Pile(PWR・RBMK・溶融塩炉の中性子動特性)、Miasma(確率的空間疫学)、Cyano(細胞代謝)、Gerry(区割りと公平性指標)、Scripture(全文検索とエッジ SSR を備えた 16 聖典リーダー)。',
        'resume.h.education':   '学歴',
        'resume.edu.ucsd.line': '数学学士 · GPA 3.75 · GRE 335 (170Q, 165V)',
        'resume.edu.ucsd.dates': '2026 年 3 月',
        'resume.edu.sas.line':  'Summa Cum Laude · GPA 4.50',
        'resume.edu.sas.dates': '2023 年卒',
        'resume.h.skills':      'スキル',
        'resume.skill.ai.k':    'AI・解釈可能性',
        'resume.skill.ai.v':    '日常使い:Claude Code と Codex で AI 生成コードを大規模に統合。アクティベーション・ステアリング、対照 PCA プローブ、HuggingFace transformers の隠れ状態解析、MCP サーバの実装。',
        'resume.skill.lang.k':  '言語',
        'resume.skill.lang.v':  'JavaScript(Canvas、WebGL、WebGPU、GLSL、WGSL)、Python(PyTorch、HuggingFace transformers、NumPy)、Rust、Java、QtQuick・QML、LaTeX、HTML、CSS。',
        'resume.skill.web.k':   'Web・インフラ',
        'resume.skill.web.v':   'Cloudflare Workers と Assets、HTMLRewriter によるエッジ SSR、JSON-LD 構造化データ、自己ホスト型タイポグラフィ、ビルドレス・パイプライン。',
        'resume.skill.other.k': 'その他',
        'resume.skill.other.v': 'テクニカルライティング、ベクターグラフィクス、はんだ付け、スペイン語(初級)、人工言語構築。',
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
