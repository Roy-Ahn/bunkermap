const query = `[out:json][timeout:90];(node["military"="bunker"]["name"](33.1,125.0,38.6,131.0);way["military"="bunker"]["name"](33.1,125.0,38.6,131.0);node["historic"="bunker"]["name"](33.1,125.0,38.6,131.0);node["military"="bunker"]["name"](35.0,-10.0,71.0,40.0);way["military"="bunker"]["name"](35.0,-10.0,71.0,40.0);node["historic"="bunker"]["name"](35.0,-10.0,71.0,40.0);node["military"="bunker"]["name"](24.0,-125.0,49.0,-66.0);way["military"="bunker"]["name"](24.0,-125.0,49.0,-66.0);node["historic"="bunker"]["name"](24.0,-125.0,49.0,-66.0););out center;`;
const overpassUrl = 'https://lz4.overpass-api.de/api/interpreter';
fetch(overpassUrl, {
    method: 'POST',
    body: "data=" + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
}).then(r=>r.json()).then(data => console.log('Elements inside JSON:', data.elements ? data.elements.length : 'undefined', "\nFull response shape:", Object.keys(data))).catch(console.error);
