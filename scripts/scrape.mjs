/**
 * Phase 2: Kaizen Mass Scrape
 * Traverses Wikipedia Categories to discover every known bunker article,
 * then fetches their coordinates and images to populate our Supabase database.
 * 
 * Kaizen principles applied:
 *  - Poka-Yoke: Records without coordinates are silently discarded at source
 *  - Rate limiting: 300ms delay between every API call (polite scraping)
 *  - Incremental: Saves to JSON first so seeding can be retried without re-scraping
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'BunkerFinderApp/1.0 (local-dev)' };

// Rate limiter
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Recursively fetches article titles from a category AND its subcategories
async function fetchAllArticlesInCategory(categoryTitle, visited = new Set(), depth = 0) {
    if (depth > 3 || visited.has(categoryTitle)) return [];
    visited.add(categoryTitle);

    console.log(`${'  '.repeat(depth)}📂 ${categoryTitle}`);

    const articles = [];
    let cmcontinue = null;

    do {
        const params = new URLSearchParams({
            action: 'query',
            list: 'categorymembers',
            cmtitle: categoryTitle,
            cmlimit: '500',
            cmtype: 'page|subcat',  // get both articles and subcategories
            format: 'json',
            origin: '*',
            ...(cmcontinue && { cmcontinue })
        });

        const res = await fetch(`${WIKI_API_URL}?${params}`, { headers: HEADERS });
        const data = await res.json();
        await sleep(300);

        if (!data.query?.categorymembers) break;

        for (const member of data.query.categorymembers) {
            if (member.ns === 0) {
                // It's an article
                articles.push(member.title);
            } else if (member.ns === 14) {
                // It's a subcategory — recurse into it
                const subArticles = await fetchAllArticlesInCategory(member.title, visited, depth + 1);
                articles.push(...subArticles);
            }
        }

        cmcontinue = data.continue?.cmcontinue || null;
    } while (cmcontinue);

    return articles;
}

// Fetch coordinates, description, and high-res image for a Wikipedia article
async function fetchPageDetails(title) {
    const params = new URLSearchParams({
        action: 'query',
        prop: 'coordinates|extracts|pageimages',
        piprop: 'original', // Get the original, high-res image
        exintro: '1',
        exchars: '400',
        titles: title,
        format: 'json',
        origin: '*'
    });

    try {
        const res = await fetch(`${WIKI_API_URL}?${params}`, { headers: HEADERS });
        const data = await res.json();

        const pages = data.query?.pages;
        if (!pages) return null;

        const page = Object.values(pages)[0];

        // POKA-YOKE: Discard any entries without coordinates — they are not geo-locatable
        if (!page?.coordinates?.length) return null;

        const { lat, lon } = page.coordinates[0];
        const description = page.extract?.replace(/(<([^>]+)>)/gi, '').trim() || 'Intel unavailable.';

        return {
            id: page.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40),
            title: page.title,
            location: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
            lat,
            lng: lon,
            description,
            status: 'VERIFIED',
            depth: 'CLASSIFIED',
            capacity: 'UNKNOWN',
            image_url: page.original?.source || null
        };
    } catch {
        return null;
    }
}

async function run() {
    const ROOT_CATEGORIES = [
        'Category:Bunkers',
        'Category:Underground_military_facilities',
        'Category:Fallout_shelters',
        'Category:Cold_War_bunkers',
        'Category:World_War_II_bunkers',
        'Category:Military_bunkers_in_the_United_Kingdom',
        'Category:Military_bunkers_in_the_United_States',
        'Category:Military_bunkers_in_Germany',
        'Category:Military_bunkers_in_France',
        'Category:Military_bunkers_in_Russia',
        'Category:Military_bunkers_in_Switzerland',
        'Category:Military_bunkers_in_Japan',
    ];

    console.log('🔍 Phase 2 Mass Scrape — Discovering all bunker articles...\n');

    const visited = new Set();
    const allTitles = new Set();

    for (const cat of ROOT_CATEGORIES) {
        const titles = await fetchAllArticlesInCategory(cat, visited, 0);
        titles.forEach(t => allTitles.add(t));
    }

    console.log(`\n✅ Discovered ${allTitles.size} unique article candidates.\n`);

    const results = [];
    let processed = 0;

    for (const title of allTitles) {
        processed++;
        process.stdout.write(`\r⏳ Scanning ${processed}/${allTitles.size}: ${title.substring(0, 50).padEnd(50)}`);

        const details = await fetchPageDetails(title);
        if (details) results.push(details);

        await sleep(300);
    }

    console.log(`\n\n🏆 ${results.length} geo-located bunkers found.`);

    const jsonPath = path.join(process.cwd(), 'src/data/bunkers-extended.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`💾 Saved to ${jsonPath}`);

    // Seed into Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
        console.log('\n☁️  Upserting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('bunkers').upsert(results, { onConflict: 'id' });
        if (error) {
            console.error('❌ Supabase error:', error.message);
        } else {
            console.log(`✅ Successfully upserted ${results.length} records to Supabase!`);
        }
    } else {
        console.log('\n⚠️  No Supabase credentials found — JSON saved locally only.');
    }
}

run();
