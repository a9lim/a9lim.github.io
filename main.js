/* ===================================================================
   main.js — SPA routing, shader background, theme, animations
   =================================================================== */

(function () {
  'use strict';

  // ─── DOM Cache ───
  const $ = {
    navbar:      document.getElementById('navbar'),
    themeToggle: document.getElementById('theme-toggle'),
    menuToggle:  document.getElementById('menu-toggle'),
    mobileNav:   document.getElementById('mobile-nav'),
    shaderBg:    document.getElementById('shader-bg'),
    blogListing: document.getElementById('blog-listing'),
    blogPost:    document.getElementById('blog-post'),
    blogListCt:  document.getElementById('blog-list-container'),
    blogContent: document.getElementById('blog-post-content'),
  };

  const navLinks = document.querySelectorAll('.nav-link');
  const pages    = document.querySelectorAll('.page-section');

  // ─── Blog caches ───
  let postsCache = null;   // cached posts.json
  const mdCache = {};      // slug → markdown source

  // ═══════════════════════════════════
  //  SPA Hash Router
  // ═══════════════════════════════════
  function parseHash() {
    const raw = location.hash.replace('#', '');
    const parts = raw.split('/');
    const page = ['home', 'projects', 'blog', 'about'].includes(parts[0]) ? parts[0] : 'home';
    const slug = page === 'blog' && parts[1] ? parts[1] : null;
    return { page, slug };
  }

  function navigateTo(page, slug) {
    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));

    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0 });
    }

    navLinks.forEach(l => {
      if (l.dataset.page === page) l.classList.add('active');
    });

    // Close mobile nav if open
    $.mobileNav.classList.remove('open');
    $.menuToggle.setAttribute('aria-expanded', 'false');

    // Blog sub-routing
    if (page === 'blog') {
      if (slug) {
        showBlogPost(slug);
      } else {
        showBlogListing();
      }
    } else {
      triggerFadeIns(target);
    }
  }

  function onHashChange() {
    const { page, slug } = parseHash();
    navigateTo(page, slug);
  }

  window.addEventListener('hashchange', onHashChange);

  // Handle clicks on nav links and CTA buttons
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (link) {
      e.preventDefault();
      const page = link.dataset.page;
      location.hash = page;
    }
  });

  // ═══════════════════════════════════
  //  Blog Helpers
  // ═══════════════════════════════════
  function escapeHtmlBasic(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // ─── Blog Listing ───
  async function showBlogListing() {
    $.blogListing.style.display = '';
    $.blogPost.style.display = 'none';

    if (!postsCache) {
      $.blogListCt.innerHTML = '<p class="blog-loading">Loading&hellip;</p>';
      try {
        const res = await fetch('posts.json');
        postsCache = await res.json();
      } catch (e) {
        $.blogListCt.innerHTML = '<div class="blog-empty"><p>Could not load posts.</p></div>';
        triggerFadeIns(document.getElementById('page-blog'));
        return;
      }
    }

    if (!postsCache.length) {
      $.blogListCt.innerHTML = '<div class="blog-empty"><p>No posts yet.</p></div>';
      triggerFadeIns(document.getElementById('page-blog'));
      return;
    }

    $.blogListCt.innerHTML = postsCache.map(function (p) {
      return '<a href="#blog/' + escapeHtmlBasic(p.slug) + '" class="blog-entry">'
        + '<span class="blog-date">' + formatDate(p.date) + '</span>'
        + '<span class="blog-title">' + escapeHtmlBasic(p.title) + '</span>'
        + (p.tag ? '<span class="blog-tag">' + escapeHtmlBasic(p.tag) + '</span>' : '')
        + '</a>';
    }).join('');

    triggerFadeIns(document.getElementById('page-blog'));
  }

  // ─── Blog Post ───
  async function showBlogPost(slug) {
    $.blogListing.style.display = 'none';
    $.blogPost.style.display = '';
    $.blogContent.innerHTML = '<p class="blog-loading">Loading&hellip;</p>';
    triggerFadeIns(document.getElementById('page-blog'));

    // Fetch markdown
    if (!mdCache[slug]) {
      try {
        const res = await fetch('posts/' + encodeURIComponent(slug) + '.md');
        if (!res.ok) throw new Error(res.status);
        mdCache[slug] = await res.text();
      } catch (e) {
        $.blogContent.innerHTML = '<p class="blog-empty">Post not found.</p>';
        triggerFadeIns(document.getElementById('page-blog'));
        return;
      }
    }

    // Find post metadata
    if (!postsCache) {
      try {
        const res = await fetch('posts.json');
        postsCache = await res.json();
      } catch (e) { /* continue without metadata */ }
    }

    var meta = postsCache ? postsCache.find(function (p) { return p.slug === slug; }) : null;

    var header = '<div class="blog-post-header">';
    if (meta) {
      header += '<span class="blog-post-date">' + formatDate(meta.date)
        + (meta.tag ? ' &middot; ' + escapeHtmlBasic(meta.tag) : '') + '</span>';
      header += '<h1 class="blog-post-title">' + escapeHtmlBasic(meta.title) + '</h1>';
    }
    header += '</div>';

    $.blogContent.innerHTML = header + '<div class="blog-content">' + parseMarkdown(mdCache[slug]) + '</div>';
    triggerFadeIns(document.getElementById('page-blog'));
  }

  // ═══════════════════════════════════
  //  Theme Toggle
  // ═══════════════════════════════════
  function getTheme() {
    return document.documentElement.dataset.theme || 'light';
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
  }

  $.themeToggle.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  // Restore saved theme
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  } catch (e) { /* ignore */ }

  // ═══════════════════════════════════
  //  Mobile Menu
  // ═══════════════════════════════════
  $.menuToggle.addEventListener('click', () => {
    const open = $.mobileNav.classList.toggle('open');
    $.menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // ═══════════════════════════════════
  //  Entrance Fade-In Animations
  // ═══════════════════════════════════
  function triggerFadeIns(container) {
    const els = container.querySelectorAll('.fade-in');
    els.forEach(el => el.classList.remove('visible'));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.forEach(el => el.classList.add('visible'));
      });
    });
  }

  // ═══════════════════════════════════
  //  Navbar Scroll Shadow
  // ═══════════════════════════════════
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        $.navbar.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  });

  // ═══════════════════════════════════
  //  WebGL Shader Background
  // ═══════════════════════════════════
  function initShader() {
    const canvas = $.shaderBg;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const vert = `
      attribute vec2 pos;
      void main() { gl_Position = vec4(pos, 0.0, 1.0); }
    `;

    const frag = `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;
      uniform vec3  u_accent;
      uniform float u_dark;

      // Simplex-ish noise
      vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
      vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;
        float t = u_time * 0.04;

        // Layered noise
        float n1 = snoise(uv * 1.8 + vec2(t * 0.7, t * 0.3)) * 0.5 + 0.5;
        float n2 = snoise(uv * 3.5 + vec2(-t * 0.5, t * 0.8)) * 0.5 + 0.5;
        float n3 = snoise(uv * 0.8 + vec2(t * 0.2, -t * 0.4)) * 0.5 + 0.5;

        float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        // Warm accent hue blended with canvas
        vec3 warm   = u_accent * 0.3;
        vec3 cool   = vec3(0.2, 0.15, 0.1);
        vec3 color  = mix(cool, warm, noise);

        // Radial vignette to focus center
        float vig = 1.0 - length(uv - 0.5) * 1.1;
        vig = smoothstep(0.0, 0.7, vig);

        float alpha = noise * vig * mix(0.12, 0.08, u_dark);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    function compileShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(vert, gl.VERTEX_SHADER);
    const fs = compileShader(frag, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime   = gl.getUniformLocation(prog, 'u_time');
    const uRes    = gl.getUniformLocation(prog, 'u_res');
    const uAccent = gl.getUniformLocation(prog, 'u_accent');
    const uDark   = gl.getUniformLocation(prog, 'u_dark');

    // Parse accent color
    const accent = _PALETTE.accent;
    const ar = parseInt(accent.slice(1, 3), 16) / 255;
    const ag = parseInt(accent.slice(3, 5), 16) / 255;
    const ab = parseInt(accent.slice(5, 7), 16) / 255;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr * 0.5);
      const h = Math.floor(window.innerHeight * dpr * 0.5);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        gl.viewport(0, 0, w, h);
      }
    }

    let raf;
    const start = performance.now();

    function frame() {
      resize();
      const t = (performance.now() - start) / 1000;
      const isDark = getTheme() === 'dark' ? 1.0 : 0.0;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform3f(uAccent, ar, ag, ab);
      gl.uniform1f(uDark, isDark);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(frame);
    }

    frame();

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(frame);
      }
    });
  }

  // ═══════════════════════════════════
  //  Init
  // ═══════════════════════════════════
  onHashChange();
  initShader();

})();
