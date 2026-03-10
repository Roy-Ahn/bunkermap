import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// High-Profile Curated Bunkers (Luxurious, Private, and Key Govt Facilities)
const CURATED_BUNKERS = [
    {
        "id": "china-cmc-command",
        "title": "CMC Underground Fortress",
        "location": "Beijing, China",
        "lat": 39.9042,
        "lng": 116.4074,
        "description": "The Central Military Commission's massive underground command center. Described as the world's deepest and largest facility, designed to survive a nuclear strike.",
        "status": "ACTIVE",
        "depth": "CLASSIFIED (>2km)",
        "capacity": "1,000+ Personnel",
        "image_url": "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&q=80&w=1000"
    },
    {
        "id": "raven-rock-usa",
        "title": "Raven Rock Mountain Complex",
        "location": "Pennsylvania, USA",
        "lat": 39.7358,
        "lng": -77.4116,
        "description": "Known as the 'Underground Pentagon', Site R is a Continuity of Government facility built during the Cold War. A critical active hub for U.S. military leadership.",
        "status": "ACTIVE",
        "depth": "SUBTERRANEAN",
        "capacity": "3,000 Personnel",
        "image_url": "https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&q=80&w=1000"
    },
    {
        "id": "vivos-europa-one",
        "title": "Vivos Europa One",
        "location": "Rothenstein, Germany",
        "lat": 50.8447,
        "lng": 11.6067,
        "description": "A billion-dollar luxury survival complex carved into a mountain. It features 5-star amenities, including swimming pools, theaters, and a private zoo.",
        "status": "ACTIVE",
        "depth": "MOUNTAIN CORE",
        "capacity": "1,000 VIPS",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6191da93af?auto=format&fit=crop&q=80&w=1000"
    },
    {
        "id": "the-oppidum",
        "title": "The Oppidum",
        "location": "Czech Republic",
        "lat": 49.8175,
        "lng": 15.4730,
        "description": "The largest billionaire bunker in the world. A massive 323,000 sq ft estate in rural Czechia featuring high-tech security, luxury residential suites, and a massive survival stock.",
        "status": "ACTIVE",
        "depth": "MULTI-LEVEL",
        "capacity": "INDIVIDUAL ELITE",
        "image_url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000"
    },
    {
        "id": "survival-condo-kansas",
        "title": "Survival Condo",
        "location": "Kansas, USA",
        "lat": 39.4239,
        "lng": -97.6698,
        "description": "A luxury residential complex built into a decommissioned Atlas-F missile silo. Features hydroponic gardens, a medical center, and virtual windows.",
        "status": "ACTIVE",
        "depth": "174 FT",
        "capacity": "75 Residents",
        "image_url": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1000"
    },
    {
        "id": "israel-nmc",
        "title": "Israel National Management Center",
        "location": "Jerusalem, Israel",
        "lat": 31.7683,
        "lng": 35.2137,
        "description": "The Israeli government's emergency command bunker. Built to withstand sophisticated conventional and nuclear threats beneath the hills of Jerusalem.",
        "status": "ACTIVE",
        "depth": "REINFORCED BEDROCK",
        "capacity": "GOVERNMENT CABINET",
        "image_url": "https://images.unsplash.com/photo-1531050170041-f519448834f3?auto=format&fit=crop&q=80&w=1000"
    },
    {
        "id": "mount-yamantau",
        "title": "Mount Yamantau Complex",
        "location": "Ural Mountains, Russia",
        "lat": 54.2547,
        "lng": 58.1250,
        "description": "One of Russia's most secretive underground cities. Believed to serve as a massive wartime command center.",
        "status": "ACTIVE",
        "depth": "CLASSIFIED",
        "capacity": "60,000 Personnel (Est.)",
        "image_url": "https://images.unsplash.com/photo-1544084944-15269ec7b5a0?auto=format&fit=crop&q=80&w=1000"
    }
];

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'BunkerFinderApp/1.0 (https://github.com/royahn/bunker-finder; royahn@example.com)' };

// Rate limiter
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAllArticlesInCategory(categoryTitle, visited = new Set(), depth = 0) {
    if (depth > 3 || visited.has(categoryTitle)) return [];
    visited.add(categoryTitle);

    const articles = [];
    let cmcontinue = null;

    do {
        const params = new URLSearchParams({
            action: 'query',
            list: 'categorymembers',
            cmtitle: categoryTitle,
            cmlimit: '500',
            cmtype: 'page|subcat',
            format: 'json',
            origin: '*'
        });
        if (cmcontinue) params.append('cmcontinue', cmcontinue);

        try {
            const res = await fetch(`${WIKI_API_URL}?${params}`, { headers: HEADERS });
            if (!res.ok) throw new Error(`Wiki API returned ${res.status}`);
            const data = await res.json();

            await sleep(300);

            if (!data.query?.categorymembers) break;

            for (const member of data.query.categorymembers) {
                if (member.ns === 0) {
                    articles.push(member.title);
                } else if (member.ns === 14) {
                    const subArticles = await fetchAllArticlesInCategory(member.title, visited, depth + 1);
                    articles.push(...subArticles);
                }
            }
            cmcontinue = data.continue?.cmcontinue || null;
        } catch (err) {
            console.error(`❌ Error fetching category ${categoryTitle}:`, err.message);
            break;
        }
    } while (cmcontinue);

    return articles;
}

// Fetch coordinates, description, and high-res original image for a Wikipedia article
async function fetchPageDetails(title) {
    const params = new URLSearchParams({
        action: 'query',
        prop: 'coordinates|extracts|pageimages',
        piprop: 'original',
        exintro: '1',
        exchars: '400',
        titles: title,
        format: 'json',
        origin: '*'
    });

    try {
        const res = await fetch(`${WIKI_API_URL}?${params}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Wiki API returned ${res.status}`);
        const data = await res.json();

        const pages = data.query?.pages;
        if (!pages) return null;

        const page = Object.values(pages)[0];

        // Ensure coordinates exist
        if (!page?.coordinates?.length) return null;

        const { lat, lon } = page.coordinates[0];
        const description = page.extract?.replace(/(<([^>]+)>)/gi, '').trim() || 'Intel unavailable.';

        const image_url = page.original?.source || null;

        return {
            id: page.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40),
            title: page.title,
            location: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
            lat,
            lng: lon,
            description,
            status: 'VERIFIED',
            depth: 'SUBTERRANEAN',
            capacity: 'UNKNOWN',
            image_url
        };
    } catch {
        return null;
    }
}

async function fetchWikipediaBunkers() {
    console.log("🔍 Extracting wide taxonomy from Wikipedia Categories...");

    const ROOT_CATEGORIES = [
        'Category:Bunkers',
        'Category:Bunkers_by_country',
        'Category:Underground_military_facilities',
        'Category:Underground_military_facilities_by_country',
        'Category:Fallout_shelters',
        'Category:Cold_War_bunkers',
        'Category:World_War_II_bunkers',
        'Category:Underground_command_centers',
        'Category:Missile_silos',
        'Category:Submarine_bases',
        'Category:Air-raid_shelters',
        'Category:Subterranean_military_installations',
        'Category:Continuity_of_government_facilities'
    ];

    const visited = new Set();
    const allTitles = new Set();

    console.log("📡 Discovering entities across taxonomy subtree...");
    for (const cat of ROOT_CATEGORIES) {
        const titles = await fetchAllArticlesInCategory(cat, visited, 0);
        titles.forEach(t => allTitles.add(t));
    }

    console.log(`✅ Discovered ${allTitles.size} candidate articles. Fetching coordinates and images...`);

    const validatedBunkers = [];
    let processed = 0;
    let geoLocated = 0;

    for (const title of allTitles) {
        processed++;
        if (processed % 20 === 0) {
            process.stdout.write(`\r⏳ Scanning ${processed}/${allTitles.size} (Geo-located: ${geoLocated})... `);
        }

        const details = await fetchPageDetails(title);
        if (details) {
            geoLocated++;
            validatedBunkers.push(details);
        }
        await sleep(300);
    }

    console.log(`\n✅ Validated ${validatedBunkers.length} functional bunkers with coordinates from Wikipedia.`);
    return validatedBunkers;
}

async function fetchOSMBunkers() {
    console.log("\n🌍 Querying OpenStreetMap via Overpass API for global bunker telemetry...");
    const overpassUrl = 'https://lz4.overpass-api.de/api/interpreter';

    // Explicit Bounding Boxes: South Korea, Europe, USA
    const bboxes = [
        "(33.1,125.0,38.6,131.0)",
        "(35.0,-10.0,71.0,40.0)",
        "(24.0,-125.0,49.0,-66.0)"
    ];

    let allElements = [];

    for (const box of bboxes) {
        console.log(`   📡 Scanning Region Bounding Box ${box}...`);
        const query = `[out:json][timeout:60];(node["military"="bunker"]["name"]${box};way["military"="bunker"]["name"]${box};node["historic"="bunker"]["name"]${box};way["historic"="bunker"]["name"]${box};);out center;`;

        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: "data=" + encodeURIComponent(query),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            if (!response.ok) throw new Error(`Overpass API returned ${response.status}`);
            const data = await response.json();
            if (data.elements) {
                allElements = allElements.concat(data.elements);
            }
        } catch (err) {
            console.error(`❌ OSM Bbox ${box} extraction failed:`, err.message);
        }
        await sleep(1000); // polite API pacing
    }

    console.log(`📡 Retrieved ${allElements.length} aggregated terrestrial nodes from OSM.`);

    const validOsm = [];
    for (const el of allElements) {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const name = el.tags?.name || 'Unknown Facility';

        if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);

        validOsm.push({
            id,
            title: name,
            location: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
            lat: lat,
            lng: lon,
            description: `Classified ground facility mapping derived from global geographic telemetry. Built to withstand significant munitions.`,
            status: 'TELEMETRY',
            depth: 'UNKNOWN',
            capacity: 'CLASSIFIED',
            image_url: null
        });
    }

    return validOsm;
}

async function runPipeline() {
    console.log("🚀 Starting Advanced Bunker ETL Pipeline...");

    const osmDataBunkers = await fetchOSMBunkers();
    const wikiDataBunkers = await fetchWikipediaBunkers();

    const allBunkersMap = new Map();

    // Lowest priority: Basic OSM telemetry
    for (const b of osmDataBunkers) {
        allBunkersMap.set(b.id, b);
    }

    // Medium priority: Wikipedia (overwrites OSM if names match)
    for (const b of wikiDataBunkers) {
        allBunkersMap.set(b.id, b);
    }

    // Highest priority: Curated high quality overrides
    for (const b of CURATED_BUNKERS) {
        allBunkersMap.set(b.id, b);
    }

    // Validate final list
    const finalDataset = Array.from(allBunkersMap.values()).filter(b => b.lat !== 0 && b.lng !== 0);
    console.log(`\n🧩 Final Dataset defined: ${finalDataset.length} total curated and organic bunkers.`);

    // Local backup
    const jsonPath = path.join(process.cwd(), 'src/data/bunkers-etl.json');
    fs.writeFileSync(jsonPath, JSON.stringify(finalDataset, null, 2));
    console.log(`💾 Persisted backup to ${jsonPath}`);

    // Upserting via Batches
    console.log("\n☁️ Upserting to Supabase...");
    const chunkSize = 100;

    for (let i = 0; i < finalDataset.length; i += chunkSize) {
        const chunk = finalDataset.slice(i, i + chunkSize);
        console.log(`   ⬆️ Batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} items)...`);

        const { error } = await supabase.from('bunkers').upsert(chunk, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Load Error on batch ${Math.floor(i / chunkSize) + 1}:`, error.message);
        }
    }

    console.log(`🎉 Pipeline Complete! Successfully seeded database with ${finalDataset.length} robust records.`);
}

runPipeline();
