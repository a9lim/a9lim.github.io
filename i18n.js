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
        'nav.projects':   'projects',
        'nav.blog':       'blog',
        'nav.about':      'about',
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

        // ── Home: hero ──
        'home.tag':         'a9lim website version 1.1.0',
        'home.currently':   'Currently:',

        // ── Home: bio dl ──
        'home.bio.loc.k':       'Loc',
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
        'about.contact.body':  "I'm looking for collaborators. If you wanna make something with me, hit me up via Discord or email! If you just wanna talk about what I made that's cool too!",
        'about.contact.resume': 'Resume (PDF)',
        'about.bio.h':         'About me',
        'about.bio.p1':        "I'm a9lim! I'm from Singapore but I got a bachelor's in math at UCSD. I don't really have a fixed home but I'll probably spend most of my time around East Asia or the West Coast.",
        'about.bio.p2':        "I have a lot of interests in a lot of very different fields: physics, biology, finance, geopolitics, religion, and AI. What interests me about all of these is that they're possible to understand as consequences of simpler axioms. I like trying to understand them as well as I can, one project at a time.",
        'about.bio.p3.pre':    'I got into a lot of these when I was young by playing with Colorado Boulder\'s ',
        'about.bio.p3.link':   'PhET',
        'about.bio.p3.post':   " sims, spending hours poking around with the ways the world worked. I think letting people interact with what they're trying to learn is the best way to teach, and my projects are my best shot at doing that.",
        'about.bio.p4':        'In high school I started building little by little. I spent weekends writing crappy Java programs that modeled whatever field piqued my interest at the time: a fluid simulator, an epidemiology sim with zombies, and even an Asteroids clone with length contraction and time dilation.',
        'about.vibe.h':        'Vibe-coding',
        'about.vibe.body':     "Quite literally everything on this site was built with Claude. I come up with fun ideas and iterate with Claude until I have a working-ish project. I want to be transparent about this because I think this kind of workflow is the future. I've learned a lot about JS and Python just from reading what Claude writes, and I think that anyone who really wants to can build anything they can dream of.",
        'about.other.h':       'Other things about me',
        'about.other.li1':     "I'm obsessed with the Church of Jesus Christ of Latter-day Saints and their history. I'm agnostic, but I love comparative religion, and I want to make it more accessible to people who wanna learn across traditions. I believe all holy works should be freely and publically accessible.",
        'about.other.li2.pre': 'I once made a conlang called ',
        'about.other.li2.name': "dung'amyon",
        'about.other.li2.post': ", which was meant to be a Sinitic Esperanto based on Middle Chinese; I straight up got a little fluent in it, but unfortunately the repo got deleted :(",
        'about.other.li3':     "I have a casual interest in Touhou; I once wrote a crappy Java bullet hell in high school, making all the art and music myself. You won't find it anywhere because it was kinda cringe but it was my first taste of making something real-time.",

        // ── Resume page ──
        'resume.dl.download':   'Download PDF',
        'resume.h.profile':     'Profile',
        'resume.profile.pre':   "I'm a Singaporean developer building simulations, tools, and more at ",
        'resume.profile.post':  ". Everything I make is vanilla JS that I write with Claude. I'm interested in freelance and collaboration, especially in DIY projects like research tools.",
        'resume.h.experience':  'Experience',
        'resume.job.indep.title.pre': 'Independent Developer — ',
        'resume.job.indep.b1':  'Built and maintain a portfolio of open-source interactive simulations and tools (see Selected Projects below) plus the shared design system and component library used across all of them. Implemented in rawdogged vanilla JavaScript.',
        'resume.job.indep.b2':  'Architected the SSR layer on Cloudflare Workers + Assets: per-route HTMLRewriter injection, edge-rendered markdown, structured data, and per-route security headers.',
        'resume.job.indep.b3':  'Maintains the entire stack solo in collaboration with Claude.',
        'resume.job.indep.dates': 'Feb 2026 – Present',
        'resume.job.sddm.title.pre':  'SDDM Theme Maintainer — ',
        'resume.job.sddm.dates': '2025 – Present',
        'resume.job.sddm.b1':   "Led rewrite and modernization of Catppuccin's SDDM display manager theme in QtQuick.",
        'resume.job.sddm.b2':   'Implemented dynamic accent color and per-user icon integration.',
        'resume.job.sddm.b3':   'Automated theme generation across the four Catppuccin flavors to streamline maintenance.',
        'resume.job.sddm.b4':   'Designed vector backgrounds and user iconography.',
        'resume.h.projects':    'Selected Projects',
        'resume.proj.saklas.tagline': 'PyPI · Python',
        'resume.proj.saklas.b1': 'Activation steering and trait monitoring for HuggingFace transformers — extracts contrastive steering vectors and adds them to hidden states at generation time, no fine-tuning required.',
        'resume.proj.saklas.b2.pre':  'Three interfaces: a terminal UI with live alpha knobs and probe sparklines, an HTTP server speaking both OpenAI ',
        'resume.proj.saklas.b2.mid':  ' and Ollama ',
        'resume.proj.saklas.b2.post': ' wire formats on the same port, and a Python API for scripted experiments.',
        'resume.proj.saklas.b3': 'Ships 21 pre-built probes scoring affect, epistemic stance, register, and alignment in-flight; tested on Qwen, Gemma, Ministral, gpt-oss, Llama, and GLM.',
        'resume.proj.saklas.b4.pre':  'Implements the contrastive-PCA reading procedure from ',
        'resume.proj.saklas.b4.linkText': 'Zou et al. (2023)',
        'resume.proj.saklas.b4.post': '; published to PyPI under AGPL-3.0 with CI, type checking, and llama.cpp GGUF interchange.',
        'resume.proj.geon.title.post':    ' — Relativistic Particle Physics',
        'resume.proj.geon.tagline':       'JavaScript · WebGPU',
        'resume.proj.geon.b1':  'Real-time N-body simulator running on WebGPU compute shaders, modeling 11 force types — Newtonian gravity, gravitomagnetism, Coulomb, Lorentz, Yukawa, Higgs and axion field couplings, Hubble expansion, 1PN general-relativistic corrections, spin-orbit, and radiation reaction.',
        'resume.proj.geon.b2':  'Barnes-Hut tree acceleration for O(N log N) scaling; Boris integrator preserving phase-space volume.',
        'resume.proj.geon.b3':  'Black-hole mode with Kerr-Newman event horizons, Hawking radiation, Schwinger pair-production discharge, and superradiant axion clouds. Nineteen curated presets demonstrate Keplerian orbits, Rutherford scattering, Higgs wells, gravitational-wave inspiral, and more.',
        'resume.proj.cyano.title.post':   ' — Cellular Metabolism',
        'resume.proj.cyano.tagline':      'JavaScript',
        'resume.proj.cyano.b1': 'Interactive biochemistry simulator covering twelve metabolic pathways — glycolysis, gluconeogenesis, PPP, Krebs, beta-oxidation, fatty acid synthesis, the Calvin cycle, the light reactions, fermentation, the urea cycle, and amino acid catabolism — connected through shared metabolite pools.',
        'resume.proj.cyano.b2': '14-complex electron transport chain with proton motive force, oxidative phosphorylation, uncoupling, leak, and reactive oxygen species generation; allosteric regulation gates every reaction (PFK, PDH, ICDH).',
        'resume.proj.cyano.b3': 'Six organism presets including a cancer-cell preset that demonstrates the Warburg effect.',
        'resume.proj.shoals.title.post':  ' — Options Trading',
        'resume.proj.shoals.tagline':     'JavaScript',
        'resume.proj.shoals.b1': 'Derivatives pricing simulator combining Heston stochastic volatility and Merton jump diffusion with a Vasicek mean-reverting interest rate. American options priced via 128-step Cox-Ross-Rubinstein binomial tree with term-structure volatility, moneyness skew, and discrete dividends.',
        'resume.proj.shoals.b2': '25-strike options chain with real-time Greeks, multi-leg strategy builder (spreads, straddles, condors, butterflies), payoff diagrams, and portfolio-level margin tracking.',
        'resume.proj.shoals.b3': 'Narrative event engine with 400+ curated scenarios — earnings, monetary policy, geopolitics, sector rotation, technical signals, black swans — chained via a Poisson scheduler with trait-aware likelihood weighting.',
        'resume.proj.gerry.title.post':   ' — Redistricting & Electoral Fairness',
        'resume.proj.gerry.tagline':      'JavaScript',
        'resume.proj.gerry.b1': 'Interactive gerrymandering simulator on a procedural hex-tile electorate. Players paint districts and evaluate them against six fairness metrics: efficiency gap, partisan symmetry, competitive-district count, Polsby-Popper compactness, contiguity, and majority-minority districts.',
        'resume.proj.gerry.b2': 'Automated modes include pack-and-crack and a simulated-annealing fair-draw optimizer; Monte Carlo election stress tests run thousands of simulated elections with turnout noise to evaluate map robustness.',
        'resume.proj.gerry.b3': 'Procedural maps generated via seeded Perlin noise with configurable urban clustering and minority density, reproducible by URL hash.',
        'resume.proj.scripture.title.post': ' — Sacred Text Reader',
        'resume.proj.scripture.tagline':    'JavaScript',
        'resume.proj.scripture.b1': 'Browser-based reader for sixteen sacred texts spanning Christian, Islamic, LDS, Confucian, Taoist, Shinto, Zoroastrian, Buddhist, Finnish, and Norse traditions — ~50 MB of static JSON, loaded on demand per chapter.',
        'resume.proj.scripture.b2': 'Full-text search across all sixteen works, TF-IDF concordance for related passage discovery, verse-linked notes, text-to-speech, and deep linking to any verse via URL.',
        'resume.proj.scripture.b3.pre':  'Edge-SSR’d verse content with per-chapter ',
        'resume.proj.scripture.b3.mid':  ' JSON-LD and per-verse ',
        'resume.proj.scripture.b3.post': ' structured data so the corpus is crawlable without JavaScript execution.',
        'resume.h.education':   'Education',
        'resume.edu.ucsd.line': 'B.S. in Mathematics · GPA 3.75 · GRE 335 (170Q, 165V)',
        'resume.edu.ucsd.dates': 'March 2026',
        'resume.edu.sas.line':  'Summa Cum Laude · GPA 4.50',
        'resume.edu.sas.dates': 'Class of 2023',
        'resume.h.skills':      'Skills',
        'resume.skill.ai.k':    'Building with agentic AI',
        'resume.skill.ai.v':    'Daily driver: Claude Code. Comfortable directing, reviewing, and integrating large volumes of AI-generated code at production scale.',
        'resume.skill.lang.k':  'Languages',
        'resume.skill.lang.v':  'JavaScript (vanilla, ES modules, Canvas, WebGL, GLSL), Python (NumPy, Matplotlib, ML tooling), Java, QtQuick / QML, LaTeX, HTML, CSS.',
        'resume.skill.web.k':   'Web & infrastructure',
        'resume.skill.web.v':   'Cloudflare Workers, Workers Assets, Analytics Engine, edge SSR via HTMLRewriter, structured data (JSON-LD, schema.org, OpenGraph), self-hosted typography, no-build pipelines.',
        'resume.skill.other.k': 'Other',
        'resume.skill.other.v': 'Technical writing, vector graphics, soldering, Spanish (novice), conlang construction.',
        'resume.h.open':        'Open to',
        'resume.open.pre':      'Anyone who wants to work with me on something, reach out at ',
        'resume.open.mid':      ' or ',
        'resume.open.post':     ' on Discord.',
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
        'nav.projects':   'プロジェクト',
        'nav.blog':       'ブログ',
        'nav.about':      'プロフィール',
        'nav.resume':     '履歴書',
        'nav.themeAria':  'テーマを切り替え',
        'nav.menuAria':   'メニューを開く',
        'nav.skip':       '本文へ移動',
        'nav.langToggle': '英語に切り替え (English)',
        'nav.langLabel':  'EN',
        'toast.translated.ja': '(◕‿◕) この文章は Claude が翻訳しました',

        // ── Home: hero ──
        'home.tag':         'a9lim ウェブサイト バージョン 1.1.0',
        'home.currently':   '現在:',

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
        'about.contact.body':  '共同制作者を募集中。一緒に何か作りたい人は Discord かメールで連絡を!作ったものについて雑談したいだけでももちろん歓迎。',
        'about.contact.resume': '履歴書 (PDF)',
        'about.bio.h':         '自己紹介',
        'about.bio.p1':        'a9lim です。出身はシンガポール、UCSD で数学の学士号を取得した。固定の拠点はないが、大半は東アジアか米国西海岸あたりにいると思う。',
        'about.bio.p2':        '物理・生物・金融・地政学・宗教・AI など、まったく違う分野に幅広く関心がある。どれもより単純な公理の帰結として理解できるところが好きで、一つ一つのプロジェクトを通して、できるだけ深く理解しようとしている。',
        'about.bio.p3.pre':    '幼い頃に University of Colorado Boulder の ',
        'about.bio.p3.link':   'PhET',
        'about.bio.p3.post':   ' シミュレーションを触り倒して、世界の仕組みを延々と掘り下げていたのがきっかけ。学ぼうとしている対象に直接触れさせることが最良の教え方だと思っており、自分のプロジェクトはその試みのひとつだ。',
        'about.bio.p4':        '高校の頃から少しずつ何かを作り始めた。週末ごとに、その時関心のあった分野を題材にしたお粗末な Java プログラムを書いていた:流体シミュレータ、ゾンビが出てくる感染症シミュレーション、ローレンツ収縮と時間の遅れまで実装した Asteroids クローンなど。',
        'about.vibe.h':        '雰囲気コーディング',
        'about.vibe.body':     'このサイトのほぼすべては Claude と一緒に作った。面白いアイデアを思いついて、それらしく動くものになるまで Claude と反復するスタイルだ。この種のワークフローこそが今後の標準だと考えているので、隠さず明示しておきたい。Claude の書くコードを読むだけでも JS と Python についてかなり学べたし、本気で何かを作りたい人なら、誰でも夢見たものを作れると思う。',
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
        'resume.profile.post':  ' でシミュレーション・ツール類などを制作している。すべて Claude と組んで書いた素の JavaScript。フリーランス案件・共同制作、特に研究ツールのような DIY 寄りの仕事を歓迎する。',
        'resume.h.experience':  '職歴',
        'resume.job.indep.title.pre': '個人開発者 — ',
        'resume.job.indep.b1':  'オープンソースのインタラクティブ・シミュレーション/ツール群と、そのすべてで共有されるデザインシステム・コンポーネントライブラリを構築・保守(下記「主要プロジェクト」参照)。素の JavaScript で実装。',
        'resume.job.indep.b2':  'Cloudflare Workers + Assets 上の SSR 層を設計:ルート単位の HTMLRewriter 注入、エッジでのマークダウン描画、構造化データ、ルートごとのセキュリティヘッダー。',
        'resume.job.indep.b3':  'Claude と組んで、スタック全体を一人で保守。',
        'resume.job.indep.dates': '2026 年 2 月 – 現在',
        'resume.job.sddm.title.pre':  'SDDM テーマメンテナ — ',
        'resume.job.sddm.dates': '2025 – 現在',
        'resume.job.sddm.b1':   'Catppuccin の SDDM ディスプレイマネージャテーマを QtQuick で書き直し、近代化を主導。',
        'resume.job.sddm.b2':   '動的アクセントカラーとユーザごとのアイコン統合を実装。',
        'resume.job.sddm.b3':   '4 つの Catppuccin フレーバーすべてに対するテーマ生成を自動化し、保守を効率化。',
        'resume.job.sddm.b4':   'ベクター背景とユーザ向けアイコン素材を設計。',
        'resume.h.projects':    '主要プロジェクト',
        'resume.proj.saklas.tagline': 'PyPI · Python',
        'resume.proj.saklas.b1': 'HuggingFace transformers のアクティベーション・ステアリング/特性監視ライブラリ。対照ステアリングベクトルを抽出し、生成時の隠れ状態に加算する。微調整不要。',
        'resume.proj.saklas.b2.pre':  '3 種類のインタフェースを用意:リアルタイムなアルファ操作とプローブスパークラインを備えた端末 UI、同じポートで OpenAI ',
        'resume.proj.saklas.b2.mid':  ' と Ollama ',
        'resume.proj.saklas.b2.post': ' の両方のワイヤ形式を喋る HTTP サーバ、スクリプト実験用の Python API。',
        'resume.proj.saklas.b3': '21 種類の事前構築済みプローブを同梱し、情動・認識的態度・口調・アラインメントを推論中にスコアリング。Qwen、Gemma、Ministral、gpt-oss、Llama、GLM で動作確認済み。',
        'resume.proj.saklas.b4.pre':  '対照 PCA による読み出し手順は ',
        'resume.proj.saklas.b4.linkText': 'Zou et al. (2023)',
        'resume.proj.saklas.b4.post': ' に基づく。AGPL-3.0 で PyPI に公開、CI・型チェック・llama.cpp の GGUF 入出力対応つき。',
        'resume.proj.geon.title.post':    ' — 相対論的粒子物理',
        'resume.proj.geon.tagline':       'JavaScript · WebGPU',
        'resume.proj.geon.b1':  'WebGPU 計算シェーダ上で動作するリアルタイム N 体シミュレータ。11 種類の力を実装:ニュートン重力、重力磁気、クーロン力、ローレンツ力、湯川相互作用、ヒッグス場・アクシオン場の結合、ハッブル膨張、1PN の一般相対論的補正、スピン軌道相互作用、放射反作用。',
        'resume.proj.geon.b2':  'Barnes-Hut 木構造による O(N log N) の加速。位相空間体積を保存する Boris 積分器。',
        'resume.proj.geon.b3':  'ブラックホールモードは Kerr-Newman 事象の地平面、ホーキング放射、シュウィンガー対生成放電、超放射によるアクシオン雲つき。19 種類のキュレーション済みプリセットでケプラー軌道、ラザフォード散乱、ヒッグスポテンシャル井戸、重力波合体直前段階などを再現。',
        'resume.proj.cyano.title.post':   ' — 細胞代謝',
        'resume.proj.cyano.tagline':      'JavaScript',
        'resume.proj.cyano.b1': '12 の代謝経路――解糖、糖新生、ペントースリン酸経路、クエン酸回路、β 酸化、脂肪酸合成、カルビン回路、明反応、発酵、尿素回路、アミノ酸異化――を共有代謝物プールでつないだインタラクティブな生化学シミュレータ。',
        'resume.proj.cyano.b2': 'プロトン駆動力・酸化的リン酸化・脱共役・漏れ・活性酸素種生成を伴う 14 複合体の電子伝達系を実装。すべての反応に対してアロステリック制御がゲートを構成(PFK、PDH、ICDH)。',
        'resume.proj.cyano.b3': 'ワールブルク効果を示すがん細胞プリセットを含む、6 種類の生物プリセット。',
        'resume.proj.shoals.title.post':  ' — オプション取引',
        'resume.proj.shoals.tagline':     'JavaScript',
        'resume.proj.shoals.b1': 'ヘストン確率ボラティリティとマートン・ジャンプ拡散、さらに平均回帰する Vasicek 金利モデルを組み合わせたデリバティブ価格付けシミュレータ。アメリカン・オプションは 128 ステップの Cox-Ross-Rubinstein 二項木で評価し、ボラティリティの期間構造・モネネス歪み・離散配当を反映。',
        'resume.proj.shoals.b2': '25 行使価格のオプション・チェーンとリアルタイムなグリーク、複数脚戦略ビルダー(スプレッド・ストラドル・コンドル・バタフライ)、ペイオフ図、ポートフォリオ単位の証拠金管理を実装。',
        'resume.proj.shoals.b3': '400 以上のキュレーション済みシナリオ――決算、金融政策、地政学、セクターローテーション、テクニカルシグナル、ブラックスワン――をポアソン・スケジューラと特性ベースの尤度重み付けで連鎖させる、ナラティブ・イベントエンジン。',
        'resume.proj.gerry.title.post':   ' — ゲリマンダーと選挙公平性',
        'resume.proj.gerry.tagline':      'JavaScript',
        'resume.proj.gerry.b1': '手続き的に生成された六角タイル選挙区上のインタラクティブなゲリマンダー・シミュレータ。プレイヤーが選挙区を塗り分け、効率ギャップ・党派対称性・競争的選挙区数・Polsby-Popper コンパクトネス・連結性・少数派多数選挙区の 6 つの公平性指標で評価する。',
        'resume.proj.gerry.b2': '自動モードとして「pack-and-crack」と焼きなまし法による公正区割り最適化器を実装。モンテカルロ選挙ストレステストは投票率ノイズ付きで数千回の模擬選挙を回し、選挙区案のロバスト性を評価する。',
        'resume.proj.gerry.b3': '都市集中度と少数派密度を設定可能な、シード付き Perlin ノイズによる手続き的マップ生成。URL ハッシュにより再現可能。',
        'resume.proj.scripture.title.post': ' — 聖典リーダー',
        'resume.proj.scripture.tagline':    'JavaScript',
        'resume.proj.scripture.b1': 'キリスト教・イスラム教・LDS・儒教・道教・神道・ゾロアスター教・仏教・フィンランド・北欧の 16 聖典をカバーするブラウザ向けリーダー。約 50 MB の静的 JSON を章単位でオンデマンド読み込みする。',
        'resume.proj.scripture.b2': '16 作品全体に対する全文検索、関連箇所発見のための TF-IDF コンコーダンス、節単位のメモ、読み上げ、任意の節への URL ディープリンクを実装。',
        'resume.proj.scripture.b3.pre':  'JavaScript を実行しなくてもクローラがコーパスを巡回できるよう、エッジで SSR された節本文に章単位の ',
        'resume.proj.scripture.b3.mid':  ' JSON-LD と節単位の ',
        'resume.proj.scripture.b3.post': ' 構造化データを付与。',
        'resume.h.education':   '学歴',
        'resume.edu.ucsd.line': '数学学士 · GPA 3.75 · GRE 335 (170Q, 165V)',
        'resume.edu.ucsd.dates': '2026 年 3 月',
        'resume.edu.sas.line':  'Summa Cum Laude · GPA 4.50',
        'resume.edu.sas.dates': '2023 年卒',
        'resume.h.skills':      'スキル',
        'resume.skill.ai.k':    'エージェント AI を用いた開発',
        'resume.skill.ai.v':    '日常使い:Claude Code。プロダクション規模で AI 生成コードを大量に方向付け・レビュー・統合することに慣れている。',
        'resume.skill.lang.k':  '言語',
        'resume.skill.lang.v':  'JavaScript(素の・ES モジュール・Canvas・WebGL・GLSL)、Python(NumPy、Matplotlib、ML ツール群)、Java、QtQuick / QML、LaTeX、HTML、CSS。',
        'resume.skill.web.k':   'Web・インフラ',
        'resume.skill.web.v':   'Cloudflare Workers、Workers Assets、Analytics Engine、HTMLRewriter によるエッジ SSR、構造化データ(JSON-LD、schema.org、OpenGraph)、自己ホスト型タイポグラフィ、ビルドレス・パイプライン。',
        'resume.skill.other.k': 'その他',
        'resume.skill.other.v': 'テクニカルライティング、ベクターグラフィクス、はんだ付け、スペイン語(初級)、人工言語構築。',
        'resume.h.open':        '受付中',
        'resume.open.pre':      '一緒に何か作りたい方は、',
        'resume.open.mid':      ' または Discord の ',
        'resume.open.post':     ' まで連絡を。',
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
