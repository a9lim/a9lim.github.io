const DATA_ROOT = '/surveys/data';

async function json(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
    return response.json();
}

export async function loadSurveyData() {
    const [ipip, pvq, neo300, bfas, hexaco, omib, rotation, manifest] = await Promise.all([
        json(`${DATA_ROOT}/items/ipip.json`),
        json(`${DATA_ROOT}/items/pvq21.json`),
        json(`${DATA_ROOT}/keys/neo300.json`),
        json(`${DATA_ROOT}/keys/bfas.json`),
        json(`${DATA_ROOT}/keys/hexaco.json`),
        json(`${DATA_ROOT}/irt/omib.json`),
        json(`${DATA_ROOT}/irt/rotation.json`),
        json(`${DATA_ROOT}/manifest.json`),
    ]);
    return {
        ipip,
        ipipById: new Map(ipip.items.map(item => [item.id, item])),
        pvq,
        keys: { neo300, bfas, hexaco },
        omib,
        rotation,
        manifest,
    };
}

const normCache = new Map();

export async function loadNorms(keyId) {
    if (keyId !== 'neo300') return null;
    if (!normCache.has(keyId)) {
        normCache.set(keyId, json(`${DATA_ROOT}/norms/ipip-neo/${keyId}.json`));
    }
    return normCache.get(keyId);
}
