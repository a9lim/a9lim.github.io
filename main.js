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
  //  Scroll tracking (shared across shader + stripe)
  // ═══════════════════════════════════
  let scrollNorm = 0; // 0–1, how far down the page
  function updateScrollNorm() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollNorm = window.scrollY / maxScroll;
  }

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
      uniform vec3  u_canvasLight;
      uniform vec3  u_canvasDark;
      uniform float u_dark;
      uniform float u_scroll;

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
        float t = u_time * 0.18;
        float sc = u_scroll * 0.5;

        // Layered noise — scroll offsets create reactive movement
        float n1 = snoise(uv * 1.8 + vec2(t * 0.7 + sc, t * 0.3)) * 0.5 + 0.5;
        float n2 = snoise(uv * 3.5 + vec2(-t * 0.5, t * 0.8 + sc * 0.7)) * 0.5 + 0.5;
        float n3 = snoise(uv * 0.8 + vec2(t * 0.2 + sc * 0.3, -t * 0.4)) * 0.5 + 0.5;

        float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        // Splotchy accent layer — morphs in place, scroll pushes upward
        float warpX = snoise(uv * 3.0 + vec2(t * 0.8, t * -0.5)) * 0.4;
        float warpY = snoise(uv * 2.5 + vec2(t * -0.6, t * 0.9)) * 0.4;
        vec2 splotchUV = uv * 2.4 + vec2(warpX, warpY - sc * 3.0);
        float splotch = snoise(splotchUV);
        splotch = smoothstep(-0.2, 0.7, splotch);

        // Canvas-tinted base that blends into the page background
        vec3 canvasBg = mix(u_canvasLight, u_canvasDark, u_dark);

        // Color mixing — splotch uses pure accent, subtle blend
        vec3 base = mix(canvasBg, u_accent * 0.3, noise * 0.15);
        vec3 color = mix(base, u_accent, splotch * 0.3);

        // Radial vignette
        float vig = 1.0 - length(uv - 0.5) * 0.85;
        vig = smoothstep(0.0, 0.8, vig);

        float alpha = noise * vig * mix(0.18, 0.12, u_dark)
                     + splotch * vig * 0.08;
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

    const uTime        = gl.getUniformLocation(prog, 'u_time');
    const uRes         = gl.getUniformLocation(prog, 'u_res');
    const uAccent      = gl.getUniformLocation(prog, 'u_accent');
    const uCanvasLight = gl.getUniformLocation(prog, 'u_canvasLight');
    const uCanvasDark  = gl.getUniformLocation(prog, 'u_canvasDark');
    const uDark        = gl.getUniformLocation(prog, 'u_dark');
    const uScroll      = gl.getUniformLocation(prog, 'u_scroll');

    // Parse palette colors
    const [ar, ag, ab] = _parseHex(_PALETTE.accent);
    const [clr, clg, clb] = _parseHex(_PALETTE.light.canvas);
    const [cdr, cdg, cdb] = _parseHex(_PALETTE.dark.canvas);

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
      gl.uniform3f(uCanvasLight, clr, clg, clb);
      gl.uniform3f(uCanvasDark, cdr, cdg, cdb);
      gl.uniform1f(uDark, isDark);
      gl.uniform1f(uScroll, scrollNorm);
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
  //  Scroll-triggered Reveal + Stripe
  // ═══════════════════════════════════
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.scroll-reveal');

    if (revealEls.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(el => observer.observe(el));
    }

    // Scroll-driven rectangular stripe band
    const stripeBand = document.querySelector('.stripe-band');
    const stripeSection = document.querySelector('.stripe-section');
    let stripeTicking = false;

    // ── Paginated carousel (3 cards per page) ──
    const carouselTrack = document.querySelector('.carousel-track');
    const dotsContainer = document.querySelector('.carousel-dots');
    const cards = document.querySelectorAll('.carousel-card');

    if (carouselTrack && dotsContainer && cards.length) {
      const CARDS_PER_PAGE = 3;
      const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
      let currentPage = 0;
      const isMobile = () => window.innerWidth <= 900;

      // Create page dots (one per page)
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Page ' + (i + 1));
        dot.addEventListener('click', () => goToPage(i));
        dotsContainer.appendChild(dot);
      }
      const dots = dotsContainer.querySelectorAll('.carousel-dot');

      function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('active', i === currentPage));
      }

      function goToPage(n) {
        currentPage = Math.max(0, Math.min(totalPages - 1, n));
        if (isMobile()) {
          const target = cards[currentPage * CARDS_PER_PAGE];
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          if (currentPage === 0) {
            carouselTrack.style.transform = 'translateX(0)';
          } else {
            const offset = cards[currentPage * CARDS_PER_PAGE].offsetLeft - cards[0].offsetLeft;
            carouselTrack.style.transform = 'translateX(-' + offset + 'px)';
          }
        }
        updateDots();
      }

      // Wheel: debounced page advance (desktop only)
      let wheelCooldown = false;
      carouselTrack.addEventListener('wheel', (e) => {
        if (isMobile()) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          if (wheelCooldown) return;
          wheelCooldown = true;
          goToPage(currentPage + (e.deltaY > 0 ? 1 : -1));
          setTimeout(() => { wheelCooldown = false; }, 600);
        }
      }, { passive: false });

      // Touch swipe (desktop mode — mobile uses native scroll)
      let touchStartX = 0, touchCurrentX = 0, touchDragging = false, baseOffset = 0;

      carouselTrack.addEventListener('touchstart', (e) => {
        if (isMobile()) return;
        touchStartX = e.touches[0].clientX;
        touchCurrentX = touchStartX;
        touchDragging = true;
        carouselTrack.style.transition = 'none';
        baseOffset = currentPage === 0 ? 0
          : cards[currentPage * CARDS_PER_PAGE].offsetLeft - cards[0].offsetLeft;
      }, { passive: true });

      carouselTrack.addEventListener('touchmove', (e) => {
        if (!touchDragging || isMobile()) return;
        e.preventDefault();
        touchCurrentX = e.touches[0].clientX;
        const delta = touchCurrentX - touchStartX;
        carouselTrack.style.transform = 'translateX(' + (-baseOffset + delta) + 'px)';
      }, { passive: false });

      carouselTrack.addEventListener('touchend', () => {
        if (!touchDragging || isMobile()) return;
        touchDragging = false;
        carouselTrack.style.transition = '';
        const delta = touchCurrentX - touchStartX;
        if (delta < -50) goToPage(currentPage + 1);
        else if (delta > 50) goToPage(currentPage - 1);
        else goToPage(currentPage);
      });

      // Mobile: native scroll → update dots
      let dotTicking = false;
      carouselTrack.addEventListener('scroll', () => {
        if (!isMobile()) return;
        if (!dotTicking) {
          dotTicking = true;
          requestAnimationFrame(() => {
            const scrollLeft = carouselTrack.scrollLeft;
            const cardW = cards[0].offsetWidth + 24;
            const cardIdx = Math.round(scrollLeft / cardW);
            currentPage = Math.min(totalPages - 1, Math.floor(cardIdx / CARDS_PER_PAGE));
            updateDots();
            dotTicking = false;
          });
        }
      }, { passive: true });

      // 3D tilt + shimmer tracking (non-touch devices only)
      if (!('ontouchstart' in window)) {
        cards.forEach(card => {
          card.addEventListener('mousemove', (e) => {
            if (isMobile()) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = (0.5 - y) * 12;
            const ry = (x - 0.5) * 12;
            card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.03)';
            card.style.setProperty('--mouse-x', (x * 100) + '%');
            card.style.setProperty('--mouse-y', (y * 100) + '%');
          });
          card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.4s var(--ease-spring), box-shadow 0.3s var(--ease-out)';
            card.style.transform = '';
          });
          card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.15s var(--ease-out), box-shadow 0.3s var(--ease-out)';
          });
        });
      }

      // Recalculate on resize
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (isMobile()) {
            carouselTrack.style.transform = '';
            carouselTrack.style.transition = '';
          } else {
            goToPage(currentPage);
          }
        }, 150);
      });

      // Force all cards visible (scroll-reveal can't detect overflow:hidden cards)
      // Also eagerly load all images (lazy loading fails inside overflow:hidden)
      cards.forEach(card => {
        card.classList.add('visible');
        const img = card.querySelector('img');
        if (img) {
          img.loading = 'eager';
          if (!img.complete) img.src = img.src;
        }
      });
    }

    // ── Project card 3D tilt + shimmer (non-touch devices only) ──
    const projectCards = document.querySelectorAll('.project-card');
    if (projectCards.length && !('ontouchstart' in window)) {
      projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          const rx = (0.5 - y) * 12;
          const ry = (x - 0.5) * 12;
          card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.03)';
          card.style.setProperty('--mouse-x', (x * 100) + '%');
          card.style.setProperty('--mouse-y', (y * 100) + '%');
        });
        card.addEventListener('mouseleave', () => {
          card.style.transition = 'transform 0.4s var(--ease-spring), box-shadow 0.3s var(--ease-out)';
          card.style.transform = '';
        });
        card.addEventListener('mouseenter', () => {
          card.style.transition = 'transform 0.15s var(--ease-out), box-shadow 0.3s var(--ease-out)';
        });
      });
    }

    function onScroll() {
      updateScrollNorm();
      if (stripeBand && stripeSection && !stripeTicking) {
        stripeTicking = true;
        requestAnimationFrame(() => {
          const rect = stripeSection.getBoundingClientRect();
          const vh = window.innerHeight;
          const progress = 1 - (rect.top / vh);
          // Slide in from -120% to 0% as the section enters view
          const tx = Math.max(-120, Math.min(10, (progress - 0.15) * 180 - 120));
          stripeBand.style.transform = `translateX(${tx}%) rotate(-3deg)`;
          stripeTicking = false;
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ═══════════════════════════════════
  //  World Map SVG (About Page)
  // ═══════════════════════════════════
  function initWorldMap() {
    const container = document.getElementById('world-map-container');
    if (!container) return;

    const NS = 'http://www.w3.org/2000/svg';

    // Singapore: 1.35°N, 103.82°E  |  San Diego: 32.72°N, -117.16°W
    const SG = { lat: 1.35, lon: 103.82 };
    const SD = { lat: 32.72, lon: -117.16 };

    // Load the SVG map
    fetch('world-map.svg')
      .then(r => r.text())
      .then(svgText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return;

        const vb = svg.getAttribute('viewBox');
        const [vbX, vbY, vbW, vbH] = vb.split(/\s+/).map(Number);

        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.style.width = '100%';
        svg.style.height = '100%';
        container.appendChild(svg);

        // Project lat/lon to SVG viewBox coordinates
        // Calibrated from 18 country centroids in world-map.svg
        function project(lat, lon) {
          const x = 2.3638 * lon + 411.0;
          const y = -2.8979 * lat + 530.0;
          return [x, y];
        }

        // ── Separate overlay SVG (above the fade gradient) ──
        const overlaySvg = document.createElementNS(NS, 'svg');
        overlaySvg.setAttribute('viewBox', vb);
        overlaySvg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        overlaySvg.setAttribute('class', 'map-overlay-svg');
        container.parentElement.appendChild(overlaySvg);

        // Direct arc between the two cities (quadratic bezier)
        const [sdX, sdY] = project(SD.lat, SD.lon);
        const [sgX, sgY] = project(SG.lat, SG.lon);
        // Control point: midpoint shifted upward for a clean arc
        const cpX = (sdX + sgX) / 2;
        const cpY = Math.min(sdY, sgY) - vbH * 0.15;
        const fullArcD = `M${sgX},${sgY} Q${cpX},${cpY} ${sdX},${sdY}`;

        // Arc element (single thin line, no glow)
        const arcLine = document.createElementNS(NS, 'path');
        arcLine.setAttribute('class', 'map-arc');
        overlaySvg.appendChild(arcLine);

        // City dots
        const dotR = vbW * 0.004;
        const glowR = vbW * 0.014;

        [SD, SG].forEach(city => {
          const [cx, cy] = project(city.lat, city.lon);
          const glow = document.createElementNS(NS, 'circle');
          glow.setAttribute('cx', cx);
          glow.setAttribute('cy', cy);
          glow.setAttribute('r', glowR);
          glow.setAttribute('class', 'map-dot-glow');
          overlaySvg.appendChild(glow);

          const dot = document.createElementNS(NS, 'circle');
          dot.setAttribute('cx', cx);
          dot.setAttribute('cy', cy);
          dot.setAttribute('r', dotR);
          dot.setAttribute('class', 'map-dot');
          overlaySvg.appendChild(dot);
        });

        const glows = overlaySvg.querySelectorAll('.map-dot-glow');

        // ── Animation state ──
        let arcDrawn = false;
        let animFrame = null;

        function drawFullArc() {
          arcLine.setAttribute('d', fullArcD);
          arcLine.style.strokeDasharray = 'none';
          arcDrawn = true;
        }

        // Measure path length for progressive draw
        function setupArcDash() {
          arcLine.setAttribute('d', fullArcD);
          const len = arcLine.getTotalLength();
          arcLine.style.strokeDasharray = len;
          arcLine.style.strokeDashoffset = len;
          return len;
        }

        let arcLen = 0;
        let animProgress = 0;
        function animate() {
          // Progressive arc draw via dash offset
          if (!arcDrawn) {
            if (!arcLen) arcLen = setupArcDash();
            animProgress = Math.min(1, animProgress + 0.025);
            const offset = arcLen * (1 - animProgress);
            arcLine.style.strokeDashoffset = offset;
            if (animProgress >= 1) arcDrawn = true;
          }

          // Pulse glow dots
          const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.003);
          const r = glowR * (0.8 + pulse * 0.5);
          const op = 0.15 + pulse * 0.2;
          glows.forEach(g => {
            g.setAttribute('r', r);
            g.setAttribute('opacity', op);
          });

          animFrame = requestAnimationFrame(animate);
        }

        // Start when scrolled into view
        let started = false;
        const mapSection = document.querySelector('.map-section');
        const mapObs = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !started) {
              started = true;
              animate();
              // Fallback: ensure arc completes even if rAF gets throttled
              setTimeout(() => { if (!arcDrawn) drawFullArc(); }, 2500);
              mapObs.disconnect();
            }
          });
        }, { threshold: 0.1 });

        if (mapSection) mapObs.observe(mapSection);

        // Pause/resume on visibility change
        document.addEventListener('visibilitychange', () => {
          if (!started) return;
          if (document.hidden) {
            if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
          } else {
            if (!arcDrawn) drawFullArc(); // ensure arc is complete when returning
            if (!animFrame) animFrame = requestAnimationFrame(animate);
          }
        });
      })
      .catch(() => { /* SVG load failed — silent fallback */ });
  }

  // ═══════════════════════════════════
  //  Init
  // ═══════════════════════════════════
  onHashChange();
  initShader();
  initScrollReveal();
  initWorldMap();

})();
