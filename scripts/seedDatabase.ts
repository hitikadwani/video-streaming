import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pool from '../server/src/config/database';
import { videoQueries, tagQueries } from '../server/src/db/queries';
import { VideoMetadata } from '../server/src/types';

dotenv.config();

const metadataPath = path.join(__dirname, 'metadata.json');

// Predefined tags for categorization
const tagCategories: Record<string, string[]> = {
  'nature': ['Nature', 'Outdoors', 'Landscape'],
  'city': ['Urban', 'City', 'Architecture'],
  'technology': ['Technology', 'Digital', 'Innovation'],
  'people': ['People', 'Lifestyle', 'Culture'],
  'animals': ['Animals', 'Wildlife', 'Pets']
};

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding database...\n');

    // Load metadata
    if (!fs.existsSync(metadataPath)) {
      console.error('❌ metadata.json not found!');
      console.log('Run fetchVideosFromPexels.ts and convertToHLS.ts first');
      process.exit(1);
    }

    const metadata: VideoMetadata[] = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // Create tags
    const tagMap: Record<string, any> = {};
    console.log('Creating tags...');
    
    for (const [category, tags] of Object.entries(tagCategories)) {
      for (const tagName of tags) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        const tag = await tagQueries.create(tagName, slug);
        tagMap[tagName] = tag;
        console.log(`✓ Created tag: ${tagName}`);
      }
    }

    // Create videos and associate tags
    console.log('\nCreating videos...');
    
    for (let i = 0; i < metadata.length; i++) {
      const videoData = metadata[i];
      
      const video = await videoQueries.create({
        title: videoData.title,
        description: videoData.description,
        thumbnail_url: videoData.thumbnail,
        manifest_url: videoData.manifest_url!,
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
        await videoQueries.addTag(video.id, tagMap[tagName].id);
      }

      console.log(`✓ Created video: ${video.title} (tags: ${tagsForVideo.join(', ')})`);
    }

    console.log(`\n✅ Database seeded successfully!`);
    console.log(`📊 Created ${metadata.length} videos and ${Object.keys(tagMap).length} tags\n`);

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();