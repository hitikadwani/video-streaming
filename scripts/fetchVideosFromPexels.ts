import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { PexelsVideo, VideoMetadata } from '../server/src/types';

dotenv.config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const RAW_VIDEOS_DIR = path.join(__dirname, '../public/videos/raw');
const THUMBNAILS_DIR = path.join(__dirname, '../public/thumbnails');
const MAX_VIDEOS = 10; // Limit total videos to download

// Ensure directories exist
if (!fs.existsSync(RAW_VIDEOS_DIR)) {
  fs.mkdirSync(RAW_VIDEOS_DIR, { recursive: true });
}
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

// Download file helper
function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function fetchVideos(): Promise<void> {
  try {
    console.log('🎬 Fetching videos from Pexels API...\n');
    console.log(`📦 Download limit: ${MAX_VIDEOS} videos\n`);

    // Fetch videos from different categories
    const queries = ['nature', 'city', 'technology', 'people', 'animals'];
    const allVideos: PexelsVideo[] = [];
    const metadata: VideoMetadata[] = [];

    for (const query of queries) {
      console.log(`Searching for: ${query}`);
      
      const response = await axios.get<{ videos: PexelsVideo[] }>('https://api.pexels.com/videos/search', {
        params: {
          query: query,
          per_page: 2, // 2 videos per category = 10 total
          orientation: 'landscape'
        },
        headers: {
          Authorization: PEXELS_API_KEY
        }
      });

      allVideos.push(...response.data.videos);
    }

    // Limit to MAX_VIDEOS
    const videosToDownload = allVideos.slice(0, MAX_VIDEOS);
    console.log(`\n📊 Found ${allVideos.length} videos, downloading ${videosToDownload.length}\n`);

    // Download each video
    for (let i = 0; i < videosToDownload.length; i++) {
      const video = videosToDownload[i];
      
      // Find HD quality video file
      const hdVideo = video.video_files.find(f => 
        f.quality === 'hd' && f.width <= 1920
      ) || video.video_files[0];

      const videoFilename = `video_${video.id}.mp4`;
      const videoPath = path.join(RAW_VIDEOS_DIR, videoFilename);
      
      const thumbnailFilename = `thumbnail_${video.id}.jpg`;
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

      console.log(`[${i + 1}/${videosToDownload.length}] Downloading: ${video.user.name}'s video`);

      // Download video
      await downloadFile(hdVideo.link, videoPath);
      
      // Download thumbnail
      await downloadFile(video.image, thumbnailPath);

      // Store metadata
      metadata.push({
        pexels_id: video.id,
        title: `${video.user.name} - Video ${video.id}`,
        description: `Video by ${video.user.name} on Pexels`,
        duration: video.duration,
        width: hdVideo.width,
        height: hdVideo.height,
        thumbnail: `/thumbnails/${thumbnailFilename}`,
        video_file: videoFilename,
        tags: []
      });
    }

    // Save metadata to JSON
    const metadataPath = path.join(__dirname, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`\n✅ Successfully downloaded ${metadata.length} videos!`);
    console.log(`📝 Metadata saved to: ${metadataPath}`);
    console.log(`\nNext step: Run npm run convert-hls\n`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    } else {
      console.error('❌ Error:', error);
    }
  }
}

fetchVideos();