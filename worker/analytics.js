// Privacy-friendly server-side page-view logging. No cookies or client script.
export function logView(ctx, views, request, pathname) {
  ctx.waitUntil(
    Promise.resolve().then(() => {
      const cf = request.cf || {};
      views.writeDataPoint({
        blobs: [
          pathname,
          cf.country || '',
          request.headers.get('referer') || '',
          request.headers.get('user-agent') || '',
          cf.city || '',
        ],
        doubles: [cf.asn || 0],
        indexes: [pathname],
      });
    }),
  );
}
