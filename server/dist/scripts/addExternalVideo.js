"use strict";
/**
 * Add a video that uses an external HLS manifest URL (no download/FFmpeg).
 * Example: Unified Streaming demo, or any .m3u8 URL.
 *
 * Usage: tsx scripts/addExternalVideo.ts
 *
 * Edit the EXTERNAL_VIDEOS array below and run the script.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("../server/src/config/database"));
const queries_1 = require("../server/src/db/queries");
dotenv_1.default.config();
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
async function ensureTag(name) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const existing = await queries_1.tagQueries.findByName(name);
    if (existing)
        return existing.id;
    const tag = await queries_1.tagQueries.create(name, slug);
    return tag.id;
}
async function addExternalVideos() {
    try {
        console.log('Adding external HLS videos...\n');
        for (const v of EXTERNAL_VIDEOS) {
            const video = await queries_1.videoQueries.create({
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
                await queries_1.videoQueries.addTag(video.id, tagId);
            }
            console.log(`✓ Added: ${video.title} (id: ${video.id})`);
        }
        console.log('\nDone.');
        await database_1.default.end();
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
addExternalVideos();
//# sourceMappingURL=addExternalVideo.js.map