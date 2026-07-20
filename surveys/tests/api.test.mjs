import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../../_worker.js';

const payload = {
    schema_version: 1,
    submission_id: '6b812c60-4a67-49d1-8e34-524c0ff16283',
    month: '2026-07',
    demographics: { age: '21-40', country: 'USA' },
    battery: { depth_percent: 37, keys: ['neo300'], values: true, omib: true, rotation: true },
    responses: { 'ipip-008e50816285': 4, 'omib-001': '11110000000000000000', 'rotation-2-3-3-2-0y0': 'same' },
    quality_flags: {
        elapsed_seconds: 300,
        seconds_per_item: 5,
        implausibly_fast: false,
        longest_same_response_run: 3,
        straight_lining: false,
        attention_checks_passed: 1,
        attention_checks_total: 1,
        attention_check_failure: false,
        self_reported_honest: true,
        taken_before: false,
    },
    consent_version: '2026-07-19',
    license: 'CC0-1.0',
};

function database(calls) {
    return {
        prepare(sql) {
            return {
                bind(...values) {
                    return { async run() { calls.push({ sql, values }); } };
                },
            };
        },
    };
}

function request(body, options = {}) {
    return new Request('https://a9l.im/api/surveys', {
        method: options.method || 'POST',
        headers: {
            Origin: options.origin || 'https://a9l.im',
            'Content-Type': options.contentType || 'application/json',
            'CF-Connecting-IP': options.ip || crypto.randomUUID(),
        },
        body: options.method === 'GET' ? undefined : JSON.stringify(body),
    });
}

test('survey endpoint accepts a schema-valid same-origin contribution', async () => {
    const calls = [];
    const response = await worker.fetch(request(payload), { SURVEYS_DB: database(calls) }, {});
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].values[0], payload.submission_id);
    assert.equal(calls[0].values[2].length, 7);
    assert.equal(calls[0].values[8], 'CC0-1.0');
});

test('survey endpoint rejects cross-origin and malformed requests', async () => {
    const env = { SURVEYS_DB: database([]) };
    assert.equal((await worker.fetch(request(payload, { origin: 'https://example.com' }), env, {})).status, 403);
    assert.equal((await worker.fetch(request({ ...payload, license: 'CC-BY-4.0' }), env, {})).status, 422);
    assert.equal((await worker.fetch(request({ ...payload, battery: { ...payload.battery, depth_percent: 19 } }), env, {})).status, 422);
    assert.equal((await worker.fetch(request({ ...payload, battery: { ...payload.battery, keys: ['mini'] } }), env, {})).status, 422);
    assert.equal((await worker.fetch(request(payload, { method: 'GET' }), env, {})).status, 405);
});

test('survey endpoint fails closed when D1 is not configured', async () => {
    const response = await worker.fetch(request(payload), {}, {});
    assert.equal(response.status, 503);
});
