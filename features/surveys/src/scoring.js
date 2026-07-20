export const MIN_DEPTH_PERCENT = 20;

export function normalizeDepthPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return MIN_DEPTH_PERCENT;
    return Math.round(clamp(numeric, MIN_DEPTH_PERCENT, 100));
}

export function adjustedReliability(alpha, administered, fullCount) {
    if (!Number.isFinite(alpha) || alpha <= 0 || !administered || !fullCount) return null;
    const fraction = Math.min(1, administered / fullCount);
    return (fraction * alpha) / (1 + (fraction - 1) * alpha);
}

function demographicsForNorms(demographics) {
    const normalized = { ...demographics };
    delete normalized.gender;
    delete normalized.sex_assigned_at_birth;
    if (['female', 'male'].includes(demographics.sex_assigned_at_birth)) {
        normalized.sex = demographics.sex_assigned_at_birth;
    }
    return normalized;
}

export function chooseNormCell(norms, demographics = {}) {
    if (!norms?.cells?.length) return null;
    const normalized = demographicsForNorms(demographics);
    const candidates = norms.cells.filter(cell => Object.entries(cell.dimensions).every(([key, value]) => normalized[key] === value));
    return candidates.sort((a, b) => Object.keys(b.dimensions).length - Object.keys(a.dimensions).length || b.n - a.n)[0]
        || norms.cells.find(cell => cell.id === 'overall') || null;
}

export function percentileFromNorm(score, stat, quantiles) {
    if (!stat?.q?.length || stat.q.length !== quantiles.length) return null;
    if (score <= stat.q[0]) return Math.max(0.5, quantiles[0] * Math.max(0, score) / Math.max(1, stat.q[0]));
    for (let index = 1; index < stat.q.length; index++) {
        if (score <= stat.q[index]) {
            const lowScore = stat.q[index - 1];
            const highScore = stat.q[index];
            const fraction = highScore === lowScore ? 0.5 : (score - lowScore) / (highScore - lowScore);
            return quantiles[index - 1] + fraction * (quantiles[index] - quantiles[index - 1]);
        }
    }
    const last = quantiles.at(-1);
    return Math.min(99.5, last + (100 - last) * 0.5);
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function sampleSD(values) {
    if (values.length < 2) return 0;
    const avg = mean(values);
    return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1));
}

function clamp(value, low, high) {
    return Math.min(high, Math.max(low, value));
}

export function scorePersonalityKey(key, responses, norms = null, demographics = {}) {
    const cell = chooseNormCell(norms, demographics);
    const byScale = new Map(key.scales.map(scale => [scale.id, []]));
    for (const entry of key.items) {
        const raw = Number(responses[entry.item_id]);
        if (!Number.isFinite(raw) || raw < 1 || raw > 5) continue;
        byScale.get(entry.scale)?.push(entry.direction === 1 ? raw : 6 - raw);
    }
    const scales = key.scales.map(scale => {
        const values = byScale.get(scale.id) || [];
        if (!values.length) return { ...scale, coverage: 0, available: false };
        const avg = mean(values);
        const coverage = values.length / scale.full_item_count;
        const estimatedRaw = avg * scale.full_item_count;
        const reliability = adjustedReliability(scale.alpha, values.length, scale.full_item_count);
        const stat = cell?.scales?.[scale.id] || null;
        let center;
        let interval;
        let metric;
        if (stat && norms) {
            const sem = stat.sd * Math.sqrt(1 - reliability);
            center = percentileFromNorm(estimatedRaw, stat, norms.quantiles);
            interval = [
                percentileFromNorm(estimatedRaw - 1.96 * sem, stat, norms.quantiles),
                percentileFromNorm(estimatedRaw + 1.96 * sem, stat, norms.quantiles),
            ];
            metric = 'percentile';
        } else {
            center = ((avg - 1) / 4) * 100;
            const worstCaseSD = 2;
            const halfWidth = (1.96 * worstCaseSD * Math.sqrt(1 - (reliability || 0))) / 4 * 100;
            interval = [clamp(center - halfWidth, 0, 100), clamp(center + halfWidth, 0, 100)];
            metric = 'response-scale';
        }
        return {
            ...scale,
            available: true,
            administered: values.length,
            coverage,
            reliability,
            estimatedRaw,
            mean: avg,
            center,
            interval: interval.map(value => clamp(value, 0, 100)),
            metric,
        };
    });
    const domains = key.domains.map(domain => {
        const facets = scales.filter(scale => domain.facets.includes(scale.id) && scale.available);
        if (!facets.length) return { ...domain, available: false };
        const center = mean(facets.map(scale => scale.center));
        return {
            ...domain,
            available: true,
            center,
            interval: [mean(facets.map(scale => scale.interval[0])), mean(facets.map(scale => scale.interval[1]))],
            coverage: mean(facets.map(scale => scale.coverage)),
            metric: facets.some(scale => scale.metric !== 'percentile') ? 'response-scale' : 'percentile',
        };
    });
    return { key: key.id, name: key.name, normCell: cell, scales, domains };
}

export function scorePVQ(pvq, responses) {
    const answered = pvq.items.map(item => Number(responses[item.id])).filter(value => Number.isFinite(value));
    if (!answered.length) return null;
    const personMean = mean(answered);
    const grouped = new Map();
    for (const item of pvq.items) {
        const value = Number(responses[item.id]);
        if (!Number.isFinite(value)) continue;
        if (!grouped.has(item.scale)) grouped.set(item.scale, []);
        grouped.get(item.scale).push(value);
    }
    const scales = [...grouped.entries()].map(([id, values]) => {
        const centered = mean(values) - personMean;
        const empiricalSE = sampleSD(values) / Math.sqrt(values.length);
        const conservativeSE = 1.1 / Math.sqrt(values.length);
        const halfWidth = 1.96 * Math.max(empiricalSE, conservativeSE);
        return { id, name: id.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' '), center: centered, interval: [centered - halfWidth, centered + halfWidth], n: values.length };
    });
    const value = id => scales.find(scale => scale.id === id)?.center || 0;
    const openness = mean([value('self-direction'), value('stimulation'), value('hedonism')]);
    const conservation = mean([value('security'), value('conformity'), value('tradition')]);
    const transcendence = mean([value('universalism'), value('benevolence')]);
    const enhancement = mean([value('achievement'), value('power')]);
    const axisHalfWidth = mean(scales.map(scale => (scale.interval[1] - scale.interval[0]) / 2));
    return {
        personMean,
        scales,
        axes: [
            { id: 'openness-conservation', name: 'Openness to change vs conservation', center: openness - conservation, interval: [openness - conservation - axisHalfWidth, openness - conservation + axisHalfWidth] },
            { id: 'transcendence-enhancement', name: 'Self-transcendence vs self-enhancement', center: transcendence - enhancement, interval: [transcendence - enhancement - axisHalfWidth, transcendence - enhancement + axisHalfWidth] },
        ],
    };
}

function logSumExp(values) {
    const max = Math.max(...values);
    return max + Math.log(values.reduce((sum, value) => sum + Math.exp(value - max), 0));
}

function erf(value) {
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    return sign * (1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x));
}

export function normalPercentile(theta) {
    return 50 * (1 + erf(theta / Math.SQRT2));
}

export function scoreIRT(items, responses) {
    const administered = items.filter(item => responses[item.id] === 0 || responses[item.id] === 1);
    if (!administered.length) return null;
    const grid = Array.from({ length: 161 }, (_, index) => -4 + index * 0.05);
    const logs = grid.map(theta => {
        let logp = -0.5 * theta * theta;
        for (const item of administered) {
            const p = clamp(1 / (1 + Math.exp(-item.a * (theta - item.b))), 1e-9, 1 - 1e-9);
            logp += responses[item.id] ? Math.log(p) : Math.log(1 - p);
        }
        return logp;
    });
    const normalizer = logSumExp(logs);
    const weights = logs.map(value => Math.exp(value - normalizer));
    const theta = grid.reduce((sum, value, index) => sum + value * weights[index], 0);
    const variance = grid.reduce((sum, value, index) => sum + (value - theta) ** 2 * weights[index], 0);
    const sd = Math.sqrt(variance);
    return {
        theta,
        posteriorSD: sd,
        interval: [theta - 1.96 * sd, theta + 1.96 * sd],
        percentile: normalPercentile(theta),
        percentileInterval: [normalPercentile(theta - 1.96 * sd), normalPercentile(theta + 1.96 * sd)],
        administered: administered.length,
        correct: administered.reduce((sum, item) => sum + responses[item.id], 0),
    };
}

function seededShuffle(values, seedText) {
    let seed = [...seedText].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
    const random = () => {
        seed += 0x6D2B79F5;
        let value = seed;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index--) {
        const swap = Math.floor(random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
}

export function buildBattery(data, config, seed) {
    const depthPercent = normalizeDepthPercent(config.depthPercent);
    const fraction = depthPercent / 100;
    const ipipIds = new Set();
    for (const keyId of config.keys) {
        const key = data.keys[keyId];
        if (!key) continue;
        for (const scale of key.scales) {
            const entries = key.items.filter(item => item.scale === scale.id).sort((a, b) => (a.priority_rank || 999) - (b.priority_rank || 999));
            const count = Math.max(1, Math.ceil(entries.length * fraction));
            entries.slice(0, count).forEach(entry => ipipIds.add(entry.item_id));
        }
    }
    const personality = seededShuffle([...ipipIds].map(id => ({ type: 'ipip', id })), `${seed}:personality`);
    const values = config.values
        ? data.pvq.items.filter(item => {
            const sameScale = data.pvq.items.filter(other => other.scale === item.scale);
            const wanted = Math.max(1, Math.ceil(sameScale.length * fraction));
            return sameScale.indexOf(item) < wanted;
        }).map(item => ({ type: 'pvq', id: item.id }))
        : [];
    const omib = config.omib
        ? [...data.omib.items].sort((a, b) => a.priority_rank - b.priority_rank).slice(0, Math.max(1, Math.ceil(data.omib.items.length * fraction))).map(item => ({ type: 'omib', id: item.id }))
        : [];
    const rotation = config.rotation
        ? [...data.rotation.items].sort((a, b) => a.priority_rank - b.priority_rank).slice(0, Math.max(1, Math.ceil(data.rotation.items.length * fraction))).map(item => ({ type: 'rotation', id: item.id }))
        : [];
    const attention = personality.length >= 20 ? [
        { type: 'attention', id: 'attention-accuracy-1', expected: 4, text: 'For this quality check, choose Moderately accurate.' },
        ...(personality.length >= 80 ? [{ type: 'attention', id: 'attention-accuracy-2', expected: 2, text: 'For this quality check, choose Moderately inaccurate.' }] : []),
    ] : [];
    if (attention.length) personality.splice(Math.floor(personality.length * 0.38), 0, attention[0]);
    if (attention[1]) personality.splice(Math.floor(personality.length * 0.76), 0, attention[1]);
    const items = [...personality, ...values, ...omib, ...rotation];
    const estimatedMinutes = Math.max(2, Math.ceil((personality.length * 9 + values.length * 11 + omib.length * 45 + rotation.length * 16) / 60));
    return { depthPercent, items, counts: { personality: personality.length, values: values.length, omib: omib.length, rotation: rotation.length }, estimatedMinutes };
}

export function qualityFlags(sitting, battery) {
    const elapsedSeconds = Math.max(1, (Date.parse(sitting.completed_at || new Date().toISOString()) - Date.parse(sitting.started_at)) / 1000);
    const likert = battery.items.filter(item => ['ipip', 'pvq'].includes(item.type)).map(item => Number(sitting.responses[item.id])).filter(Number.isFinite);
    let longestRun = 0;
    let currentRun = 0;
    let previous = null;
    for (const value of likert) {
        currentRun = value === previous ? currentRun + 1 : 1;
        previous = value;
        longestRun = Math.max(longestRun, currentRun);
    }
    const attentionItems = battery.items.filter(item => item.type === 'attention');
    const attentionPassed = attentionItems.filter(item => Number(sitting.responses[item.id]) === item.expected).length;
    return {
        elapsed_seconds: Math.round(elapsedSeconds),
        seconds_per_item: Math.round(elapsedSeconds / Math.max(1, battery.items.length) * 10) / 10,
        implausibly_fast: elapsedSeconds / Math.max(1, battery.items.length) < 1.5,
        longest_same_response_run: longestRun,
        straight_lining: longestRun >= Math.max(12, Math.floor(likert.length * 0.3)),
        attention_checks_passed: attentionPassed,
        attention_checks_total: attentionItems.length,
        attention_check_failure: attentionPassed < attentionItems.length,
        self_reported_honest: sitting.honest !== false,
        taken_before: Boolean(sitting.taken_before),
    };
}
