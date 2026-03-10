import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Removing generic OSM placeholders from database...");
    const placeholderUrl = "https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&q=80&w=1000";

    const { error } = await supabase
        .from('bunkers')
        .update({ image_url: null })
        .eq('image_url', placeholderUrl);

    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Successfully wiped generic images.");
    }
}
run();
