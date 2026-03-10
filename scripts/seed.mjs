import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config'; // requires dotenv install

// Make sure to set these in a local .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Add NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY to .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
    try {
        const dataPath = path.join(process.cwd(), 'src/data/bunkers-real.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const bunkers = JSON.parse(rawData);

        // Supabase expects a slightly flatter structure usually (e.g. lat/lng as columns vs JSON), 
        // but Postgres jsonb handles the nested coordinates well enough.
        // Let's flatten lat/lng for easier querying later if needed:
        const formattedBunkers = bunkers.map(b => ({
            id: b.id,
            title: b.title,
            location: b.location,
            lat: b.coordinates.lat,
            lng: b.coordinates.lng,
            description: b.description,
            status: b.status,
            depth: b.depth,
            capacity: b.capacity,
            image_url: b.image
        }));

        console.log(`Attempting to upload ${formattedBunkers.length} rows to 'bunkers' table...`);

        const { error } = await supabase
            .from('bunkers')
            .upsert(formattedBunkers, { onConflict: 'id' });

        if (error) {
            throw error;
        }

        console.log("Seeding complete!");

    } catch (e) {
        console.error("Failed to seed database: ", e);
    }
}

seedDatabase();
