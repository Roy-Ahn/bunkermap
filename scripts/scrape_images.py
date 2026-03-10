# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "supabase",
#     "python-dotenv",
#     "duckduckgo-search",
#     "httpx",
# ]
# ///

import asyncio
import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from duckduckgo_search import DDGS
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

async def find_image_for_bunker(bunker: Dict[str, Any]) -> Optional[str]:
    """Search for an image for a specific bunker."""
    title = bunker.get('title', '')
    location = bunker.get('location', '')
    query = f"{title} bunker {location}"
    
    def fetch_images():
        with DDGS() as ddgs:
            return ddgs.images(
                query,
                region='wt-wt',
                safesearch='moderate',
                size='Large',
                color='color',
                type_image='photo',
                max_results=3
            )
            
    try:
        # Poka-Yoke: Wrap the call with error handling so one failure doesn't crash the script
        results = await asyncio.to_thread(fetch_images)
        
        if results and len(results) > 0:
            for result in results:
                image_url = result.get('image')
                if image_url:
                    return image_url
            
        logger.warning(f"No images found for: {query}")
        return None
    except Exception as e:
        logger.error(f"Error searching image for '{query}': {e}")
        return None

async def process_bunker(sem: asyncio.Semaphore, supabase: Client, bunker: Dict[str, Any]) -> None:
    """Process a single bunker, finding an image and updating the database."""
    async with sem:
        bunker_id = bunker.get('id')
        title = bunker.get('title')
        
        logger.info(f"Processing: {title} ({bunker_id})")
        
        image_url = await find_image_for_bunker(bunker)
        
        if image_url:
            logger.info(f"Found image for {title}: {image_url}")
            try:
                # Update in Supabase
                response = supabase.table("bunkers").update({"image_url": image_url}).eq("id", bunker_id).execute()
                if hasattr(response, 'data') and len(response.data) > 0:
                    logger.info(f"✅ Successfully updated {title} in database.")
                elif getattr(response, 'error', None):
                    logger.error(f"❌ Failed to update {title} in database: {response.error}")
                else:
                    logger.info(f"✅ Executed update for {title}.")
            except Exception as e:
                logger.error(f"❌ Database error updating {title}: {e}")
        else:
            logger.info(f"⚠️ Could not find an image for {title}.")
            
        # Add a small delay to avoid hitting DDG rate limits aggressively
        await asyncio.sleep(2)

async def main() -> None:
    """Main execution function."""
    logger.info("🚀 Starting Bunker Image Scraper...")
    
    # Load environment variables
    # Go up one directory to find .env.local if running from scripts/
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        # Try local directory
        load_dotenv(".env.local")
        
    url: str | None = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key: str | None = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        logger.error("❌ Supabase URL or Key not found. Ensure .env.local is configured.")
        return

    logger.info("☁️  Connecting to Supabase...")
    supabase: Client = create_client(url, key)

    try:
        # Fetch bunkers without images
        logger.info("🔍 Querying for bunkers missing images...")
        response = supabase.table("bunkers").select("id, title, location").is_("image_url", "null").execute()
        
        # Handle different response formats depending on supabase-py version
        data = response.data if hasattr(response, 'data') else response
        
        if not data or len(data) == 0:
            logger.info("🎉 Database complete! No bunkers missing images.")
            return
            
        bunkers_to_update = data
        logger.info(f"🎯 Found {len(bunkers_to_update)} bunkers requiring images.")
        
        # Concurrency limit to avoid being blocked by search engine
        semaphore = asyncio.Semaphore(2)
        
        tasks = [
            process_bunker(semaphore, supabase, bunker)
            for bunker in bunkers_to_update
        ]
        
        await asyncio.gather(*tasks)
            
        logger.info("✅ All scraping tasks completed.")
            
    except Exception as e:
        logger.error(f"❌ Fatal error during execution: {e}")

if __name__ == "__main__":
    asyncio.run(main())
