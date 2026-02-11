/**
 * Add a video that uses an external HLS manifest URL (no download/FFmpeg).
 * Example: Unified Streaming demo, or any .m3u8 URL.
 *
 * Usage: tsx scripts/addExternalVideo.ts
 *
 * Edit the EXTERNAL_VIDEOS array below and run the script.
 */

import dotenv from 'dotenv';
import pool from '../server/src/config/database';
import { videoQueries, tagQueries } from '../server/src/db/queries';

dotenv.config();

const EXTERNAL_VIDEOS = [
  {
    title: 'Tears of Steel (Unified Streaming Demo)',
    description: 'Short sci-fi film – HLS demo from Unified Streaming.',
    thumbnail_url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/thumbnail.jpg',
    manifest_url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    duration: 734, // ~12 min in seconds
    width: 1920,
    height: 1080,
    tagNames: ['Technology'], // must match existing tag names in DB
  }
];

async function ensureTag(name: string): Promise<number> {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const existing = await tagQueries.findByName(name);
  if (existing) return existing.id;
  const tag = await tagQueries.create(name, slug);
  return tag.id;
}

async function addExternalVideos(): Promise<void> {
  try {
    console.log('Adding external HLS videos...\n');

    for (const v of EXTERNAL_VIDEOS) {
      const video = await videoQueries.create({
        title: v.title,
        description: v.description,
        thumbnail_url: v.thumbnail_url ?? null,
        manifest_url: v.manifest_url,
        duration: v.duration,
        external_provider: 'external',
        external_id: undefined,
        width: v.width ?? null,
        height: v.height ?? null,
      });

      for (const tagName of v.tagNames) {
        const tagId = await ensureTag(tagName);
        await videoQueries.addTag(video.id, tagId);
      }

      console.log(`✓ Added: ${video.title} (id: ${video.id})`);
    }

    console.log('\nDone.');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addExternalVideos();
