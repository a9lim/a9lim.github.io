export default {
  async fetch(request, env) {
    const { pathname, origin } = new URL(request.url);

    // Scripture sub-SPA
    if (pathname.startsWith('/scripture')) {
      return env.ASSETS.fetch(new URL('/scripture/index.html', origin));
    }

    // Root SPA routes
    if (pathname === '/projects' || pathname === '/blog' || pathname.startsWith('/blog/') || pathname === '/about') {
      return env.ASSETS.fetch(new URL('/index.html', origin));
    }

    // Everything else: 404
    const page = await env.ASSETS.fetch(new URL('/404.html', origin));
    return new Response(page.body, { status: 404, headers: page.headers });
  }
};
