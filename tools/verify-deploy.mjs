#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ORIGIN = (process.env.DEPLOY_ORIGIN || 'https://a9l.im').replace(/\/$/, '');
const ATTEMPTS = 8;
const RETRY_MS = 1_000;

const expected = JSON.parse(await readFile(resolve(ROOT, 'dist/home-data.json'), 'utf8'));
if (!expected.generatedAt) throw new Error('dist/home-data.json has no generatedAt deploy marker');

let actual = null;
let lastError = null;

for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  try {
    const response = await fetch(`${ORIGIN}/home-data.json`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    actual = await response.json();
    if (actual.generatedAt === expected.generatedAt) {
      console.log(`deploy verified: ${ORIGIN} is serving ${expected.generatedAt}`);
      process.exit(0);
    }
    lastError = new Error(`still serving ${actual.generatedAt || 'an unmarked build'}`);
  } catch (error) {
    lastError = error;
  }

  if (attempt < ATTEMPTS) await new Promise((resolveRetry) => setTimeout(resolveRetry, RETRY_MS));
}

throw new Error(
  `deployment did not become current after ${ATTEMPTS} checks: expected ${expected.generatedAt}; ` +
  `${lastError?.message || 'unknown response'}`
);
