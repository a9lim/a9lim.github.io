import { secure } from './http.js';

const RATE_WINDOW_MS = 5 * 60 * 1000;
const rateWindow = new Map();
const SURVEY_KEYS = new Set(['neo300', 'bfas', 'hexaco']);
const DEMOGRAPHICS = {
  age: new Set(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']),
  sex_assigned_at_birth: new Set(['female', 'male', 'x-or-another']),
  gender: new Set(['woman', 'man', 'nonbinary', 'another-gender']),
  country: new Set(['Afghanist', 'Albania', 'Australia', 'Canada', 'China', 'Finland', 'France', 'Germany', 'Hong Kong', 'India', 'Ireland', 'Malaysia', 'Mexico', 'Netherlan', 'New Zeala', 'Norway', 'Philippin', 'Romania', 'Singapore', 'South Afr', 'South Kor', 'Sweden', 'UK', 'USA']),
  education: new Set(['secondary-or-less', 'some-college', 'bachelors', 'postgraduate']),
};

export function apiJSON(body, status = 200, extra = {}) {
  return secure(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  }), {
    'Cache-Control': 'no-store',
    'Cloudflare-CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    ...extra,
  });
}

function rateLimited(request) {
  const now = Date.now();
  if (rateWindow.size > 5000) rateWindow.clear();
  for (const [key, expires] of rateWindow) {
    if (expires <= now) rateWindow.delete(key);
  }
  const key = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for');
  if (!key) return false;
  if ((rateWindow.get(key) || 0) > now) return true;
  rateWindow.set(key, now + RATE_WINDOW_MS);
  return false;
}

function validatedPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.schema_version !== 1 || value.consent_version !== '2026-07-19' || value.license !== 'CC0-1.0') return null;
  if (typeof value.submission_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value.submission_id)) return null;

  const battery = value.battery;
  if (!battery || typeof battery !== 'object' || !Array.isArray(battery.keys)) return null;
  if (!Number.isInteger(battery.depth_percent) || battery.depth_percent < 20 || battery.depth_percent > 100) return null;
  if (battery.keys.length > 3 || !battery.keys.every(key => SURVEY_KEYS.has(key))) return null;
  for (const field of ['values', 'omib', 'rotation']) {
    if (typeof battery[field] !== 'boolean') return null;
  }

  const demographics = {};
  if (value.demographics != null) {
    if (typeof value.demographics !== 'object' || Array.isArray(value.demographics)) return null;
    for (const [key, entry] of Object.entries(value.demographics)) {
      if (!DEMOGRAPHICS[key]?.has(entry)) return null;
      demographics[key] = entry;
    }
  }

  if (!value.responses || typeof value.responses !== 'object' || Array.isArray(value.responses)) return null;
  const responseEntries = Object.entries(value.responses);
  if (!responseEntries.length || responseEntries.length > 750) return null;
  const responses = {};
  for (const [key, entry] of responseEntries) {
    if (!/^(ipip-[0-9a-f]{12}|pvq-[0-9]{2}|omib-[0-9]{3}|rotation-[a-z0-9-]+|attention-accuracy-[12])$/i.test(key)) return null;
    const valid = (Number.isInteger(entry) && entry >= 1 && entry <= 6)
      || entry === 'same' || entry === 'different'
      || (typeof entry === 'string' && /^[01]{20}$/.test(entry));
    if (!valid) return null;
    responses[key] = entry;
  }

  const flags = value.quality_flags;
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) return null;
  const numericFlags = ['elapsed_seconds', 'seconds_per_item', 'longest_same_response_run', 'attention_checks_passed', 'attention_checks_total'];
  const booleanFlags = ['implausibly_fast', 'straight_lining', 'attention_check_failure', 'self_reported_honest', 'taken_before'];
  const quality = {};
  for (const key of numericFlags) {
    if (!Number.isFinite(flags[key]) || flags[key] < 0 || flags[key] > 1e7) return null;
    quality[key] = flags[key];
  }
  for (const key of booleanFlags) {
    if (typeof flags[key] !== 'boolean') return null;
    quality[key] = flags[key];
  }

  return {
    submissionId: value.submission_id,
    schemaVersion: value.schema_version,
    submittedMonth: new Date().toISOString().slice(0, 7),
    demographics,
    battery: {
      depth_percent: battery.depth_percent,
      keys: [...new Set(battery.keys)],
      values: battery.values,
      omib: battery.omib,
      rotation: battery.rotation,
    },
    responses,
    quality,
    consentVersion: value.consent_version,
    license: value.license,
  };
}

export async function contributeSurvey(request, env, origin) {
  if (!env.SURVEYS_DB) return apiJSON({ error: 'The contribution pool is not configured.' }, 503);
  if (request.headers.get('Origin') !== origin) return apiJSON({ error: 'Same-origin requests only.' }, 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return apiJSON({ error: 'Content-Type must be application/json.' }, 415);
  }
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 256 * 1024) return apiJSON({ error: 'Contribution is too large.' }, 413);
  let raw;
  try {
    raw = await request.text();
    if (raw.length > 256 * 1024) return apiJSON({ error: 'Contribution is too large.' }, 413);
  } catch {
    return apiJSON({ error: 'Could not read contribution.' }, 400);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return apiJSON({ error: 'Invalid JSON.' }, 400);
  }
  const value = validatedPayload(parsed);
  if (!value) return apiJSON({ error: 'Contribution does not match survey schema v1.' }, 422);
  if (rateLimited(request)) return apiJSON({ error: 'Please wait before contributing again.' }, 429, { 'Retry-After': '300' });
  try {
    await env.SURVEYS_DB.prepare(`
      INSERT INTO survey_contributions
        (submission_id, schema_version, submitted_month, demographics_json, battery_json,
         responses_json, quality_flags_json, consent_version, data_license)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      value.submissionId,
      value.schemaVersion,
      value.submittedMonth,
      JSON.stringify(value.demographics),
      JSON.stringify(value.battery),
      JSON.stringify(value.responses),
      JSON.stringify(value.quality),
      value.consentVersion,
      value.license,
    ).run();
  } catch (error) {
    if (String(error?.message || error).includes('UNIQUE')) return apiJSON({ error: 'This sitting was already contributed.' }, 409);
    return apiJSON({ error: 'The contribution could not be stored.' }, 500);
  }
  return apiJSON({ ok: true, submission_id: value.submissionId }, 201);
}
