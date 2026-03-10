const query = `[out:json];(node["military"="bunker"]["name"](33.1,125.0,38.6,131.0););out center;`;
const overpassUrl = 'https://lz4.overpass-api.de/api/interpreter';
fetch(overpassUrl, {
    method: 'POST',
    body: "data=" + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
}).then(r=>r.text()).then(console.log);
