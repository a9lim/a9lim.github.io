#!/usr/bin/env node

const ZONE_ID = 'ab5c019fe4911d06986d3acb1d0cf164';
const HOSTNAME = 'a9l.im';
const token = process.env.CLOUDFLARE_CACHE_PURGE_TOKEN;

if (!token) throw new Error('CLOUDFLARE_CACHE_PURGE_TOKEN is required');

const response = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hosts: [HOSTNAME] }),
  }
);

let result;
try {
  result = await response.json();
} catch {
  throw new Error(`Cloudflare cache purge returned non-JSON HTTP ${response.status}`);
}

if (!response.ok || result.success !== true) {
  const details = (result.errors || [])
    .map(error => `${error.code || 'unknown'}: ${error.message || 'unknown error'}`)
    .join('; ');
  throw new Error(`Cloudflare cache purge failed (HTTP ${response.status}): ${details || 'unknown error'}`);
}

console.log(`cache purged: ${HOSTNAME}`);
