const STORE_KEY = 'a9lim.surveys.sittings.v1';
const DRAFT_KEY = 'a9lim.surveys.draft.v1';
const SCHEMA_VERSION = 1;

function parseStored(key, fallback) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed == null ? fallback : parsed;
    } catch (_) {
        return fallback;
    }
}

export function getSittings() {
    const value = parseStored(STORE_KEY, []);
    return Array.isArray(value) ? value.filter(isSitting) : [];
}

export function saveSitting(sitting) {
    const sittings = getSittings();
    const index = sittings.findIndex(item => item.id === sitting.id);
    if (index >= 0) sittings[index] = sitting;
    else sittings.unshift(sitting);
    localStorage.setItem(STORE_KEY, JSON.stringify(sittings));
    clearDraft();
    return sittings;
}

export function saveDraft(draft) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, schema_version: SCHEMA_VERSION }));
}

export function getDraft() {
    const draft = parseStored(DRAFT_KEY, null);
    return draft && draft.schema_version === SCHEMA_VERSION ? draft : null;
}

export function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

export function deleteSitting(id) {
    const next = getSittings().filter(item => item.id !== id);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    return next;
}

export function exportPayload() {
    return {
        type: 'a9lim-surveys-export',
        schema_version: SCHEMA_VERSION,
        exported_at: new Date().toISOString(),
        sittings: getSittings(),
    };
}

export function importPayload(payload) {
    if (!payload || payload.type !== 'a9lim-surveys-export' || payload.schema_version !== SCHEMA_VERSION || !Array.isArray(payload.sittings)) {
        throw new Error('This is not a compatible surveys export.');
    }
    if (!payload.sittings.every(isSitting)) throw new Error('The export contains an invalid sitting.');
    const merged = new Map(getSittings().map(item => [item.id, item]));
    for (const sitting of payload.sittings) merged.set(sitting.id, sitting);
    const sittings = [...merged.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    localStorage.setItem(STORE_KEY, JSON.stringify(sittings));
    return sittings;
}

export function downloadJSON(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function isSitting(value) {
    return Boolean(value && value.schema_version === SCHEMA_VERSION && typeof value.id === 'string'
        && typeof value.timestamp === 'string' && typeof value.started_at === 'string'
        && value.responses && typeof value.responses === 'object' && !Array.isArray(value.responses)
        && value.config && typeof value.config === 'object' && Array.isArray(value.config.keys)
        && value.battery && Array.isArray(value.battery.items));
}

export { SCHEMA_VERSION };
