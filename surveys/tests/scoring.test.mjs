import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
    adjustedReliability,
    buildBattery,
    chooseNormCell,
    normalizeDepthPercent,
    scoreIRT,
    scorePersonalityKey,
} from '../src/scoring.js';

const root = new URL('../data/', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const [ipip, pvq, neo300, bfas, hexaco, omib, rotation] = await Promise.all([
    json('items/ipip.json'),
    json('items/pvq21.json'),
    json('keys/neo300.json'),
    json('keys/bfas.json'),
    json('keys/hexaco.json'),
    json('irt/omib.json'),
    json('irt/rotation.json'),
]);

const data = {
    ipip,
    ipipById: new Map(ipip.items.map(item => [item.id, item])),
    pvq,
    keys: { neo300, bfas, hexaco },
    omib,
    rotation,
};

test('short-form reliability is lower and full-form reliability is preserved', () => {
    assert.ok(adjustedReliability(0.8, 2, 10) < adjustedReliability(0.8, 5, 10));
    assert.equal(adjustedReliability(0.8, 10, 10), 0.8);
});

test('norm selection prefers the most specific available demographic cell', () => {
    const norms = {
        cells: [
            { id: 'overall', dimensions: {}, n: 10000 },
            { id: 'age', dimensions: { age: '21-40' }, n: 5000 },
            { id: 'age-gender', dimensions: { age: '21-40', gender: 'female' }, n: 2000 },
        ],
    };
    assert.equal(chooseNormCell(norms, { age: '21-40', gender: 'female' }).id, 'age-gender');
    assert.equal(chooseNormCell(norms, { age: '61-95' }).id, 'overall');
});

test('battery assembly is deterministic and percentage depth is monotone', () => {
    const base = { keys: ['neo300', 'bfas'], values: true, omib: true, rotation: true, demographics: {} };
    const quick = buildBattery(data, { ...base, depthPercent: 20 }, 'seed');
    const custom = buildBattery(data, { ...base, depthPercent: 37 }, 'seed');
    const full = buildBattery(data, { ...base, depthPercent: 100 }, 'seed');
    assert.deepEqual(custom, buildBattery(data, { ...base, depthPercent: 37 }, 'seed'));
    assert.ok(quick.items.length < custom.items.length);
    assert.ok(custom.items.length < full.items.length);
    assert.equal(custom.depthPercent, 37);
    assert.equal(new Set(full.items.map(item => item.id)).size, full.items.length);
    assert.equal(normalizeDepthPercent(5), 20);
    assert.equal(normalizeDepthPercent(101), 100);
});

test('NEO-300 depth samples one nested key without short-form profiles', () => {
    const base = { keys: ['neo300'], values: false, omib: false, rotation: false };
    const countIPIP = battery => battery.items.filter(item => item.type === 'ipip').length;
    assert.deepEqual(Object.keys(data.keys).sort(), ['bfas', 'hexaco', 'neo300']);
    assert.equal(countIPIP(buildBattery(data, { ...base, depthPercent: 20 }, 'seed')), 60);
    assert.equal(countIPIP(buildBattery(data, { ...base, depthPercent: 37 }, 'seed')), 120);
    assert.equal(countIPIP(buildBattery(data, { ...base, depthPercent: 100 }, 'seed')), 300);
});

test('personality scoring returns intervals and visibly widens sparse coverage', () => {
    const key = {
        id: 'tiny', name: 'Tiny',
        scales: [{ id: 'S', name: 'Scale', alpha: 0.8, full_item_count: 4 }],
        domains: [{ id: 'D', name: 'Domain', facets: ['S'] }],
        items: [1, 2, 3, 4].map(index => ({ item_id: `i${index}`, scale: 'S', direction: 1 })),
    };
    const sparse = scorePersonalityKey(key, { i1: 4 });
    const full = scorePersonalityKey(key, { i1: 4, i2: 4, i3: 4, i4: 4 });
    const sparseWidth = sparse.scales[0].interval[1] - sparse.scales[0].interval[0];
    const fullWidth = full.scales[0].interval[1] - full.scales[0].interval[0];
    assert.ok(sparseWidth > fullWidth);
    assert.equal(sparse.scales[0].coverage, 0.25);
});

test('2PL scoring returns finite posterior and percentile intervals', () => {
    const items = [
        { id: 'a', a: 1.2, b: -0.5 },
        { id: 'b', a: 1.5, b: 0.5 },
        { id: 'c', a: 0.9, b: 1.2 },
    ];
    const result = scoreIRT(items, { a: 1, b: 1, c: 0 });
    assert.ok(result.interval.every(Number.isFinite));
    assert.ok(result.percentileInterval[0] < result.percentileInterval[1]);
    assert.equal(result.administered, 3);
});
