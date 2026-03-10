const overpassUrl = 'https://lz4.overpass-api.de/api/interpreter';
const query = `[out:json][timeout:90];(node["military"="bunker"]["name"](33.1,125.0,38.6,131.0););out center;`;
fetch(overpassUrl, {
    method: 'POST',
    body: "data=" + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
}).then(r=>r.json()).then(console.log).catch(console.error);
