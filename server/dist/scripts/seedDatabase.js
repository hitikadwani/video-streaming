"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("../server/src/config/database"));
const queries_1 = require("../server/src/db/queries");
dotenv_1.default.config();
const metadataPath = path_1.default.join(__dirname, 'metadata.json');
// Predefined tags for categorization
const tagCategories = {
    'nature': ['Nature', 'Outdoors', 'Landscape'],
    'city': ['Urban', 'City', 'Architecture'],
    'technology': ['Technology', 'Digital', 'Innovation'],
    'people': ['People', 'Lifestyle', 'Culture'],
    'animals': ['Animals', 'Wildlife', 'Pets']
};
async function seedDatabase() {
    try {
        console.log('🌱 Seeding database...\n');
        // Load metadata
        if (!fs_1.default.existsSync(metadataPath)) {
            console.error('❌ metadata.json not found!');
            console.log('Run fetchVideosFromPexels.ts and convertToHLS.ts first');
            process.exit(1);
        }
        const metadata = JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf8'));
        // Create tags
        const tagMap = {};
        console.log('Creating tags...');
        for (const [category, tags] of Object.entries(tagCategories)) {
            for (const tagName of tags) {
                const slug = tagName.toLowerCase().replace(/\s+/g, '-');
                const tag = await queries_1.tagQueries.create(tagName, slug);
                tagMap[tagName] = tag;
                console.log(`✓ Created tag: ${tagName}`);
            }
        }
        // Create videos and associate tags
        console.log('\nCreating videos...');
        for (let i = 0; i < metadata.length; i++) {
            const videoData = metadata[i];
            const video = await queries_1.videoQueries.create({
                title: videoData.title,
                description: videoData.description,
                thumbnail_url: videoData.thumbnail,
                manifest_url: videoData.manifest_url,
                duration: videoData.duration,
                external_provider: 'pexels',
                external_id: videoData.pexels_id.toString(),
                width: videoData.width,
                height: videoData.height
            });
            // Assign tags based on video index (distribute across categories)
            const categoryKeys = Object.keys(tagCategories);
            const categoryIndex = i % categoryKeys.length;
            const category = categoryKeys[categoryIndex];
            const tagsForVideo = tagCategories[category];
            // Associate tags
            for (const tagName of tagsForVideo) {
                await queries_1.videoQueries.addTag(video.id, tagMap[tagName].id);
            }
            console.log(`✓ Created video: ${video.title} (tags: ${tagsForVideo.join(', ')})`);
        }
        console.log(`\n✅ Database seeded successfully!`);
        console.log(`📊 Created ${metadata.length} videos and ${Object.keys(tagMap).length} tags\n`);
        await database_1.default.end();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
seedDatabase();
//# sourceMappingURL=seedDatabase.js.map