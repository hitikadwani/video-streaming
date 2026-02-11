"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
dotenv_1.default.config();
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const RAW_VIDEOS_DIR = path_1.default.join(__dirname, '../public/videos/raw');
const THUMBNAILS_DIR = path_1.default.join(__dirname, '../public/thumbnails');
const MAX_VIDEOS = 10; // Limit total videos to download
// Ensure directories exist
if (!fs_1.default.existsSync(RAW_VIDEOS_DIR)) {
    fs_1.default.mkdirSync(RAW_VIDEOS_DIR, { recursive: true });
}
if (!fs_1.default.existsSync(THUMBNAILS_DIR)) {
    fs_1.default.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}
// Download file helper
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs_1.default.createWriteStream(filepath);
        https_1.default.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✓ Downloaded: ${path_1.default.basename(filepath)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs_1.default.unlink(filepath, () => { });
            reject(err);
        });
    });
}
async function fetchVideos() {
    try {
        console.log('🎬 Fetching videos from Pexels API...\n');
        console.log(`📦 Download limit: ${MAX_VIDEOS} videos\n`);
        // Fetch videos from different categories
        const queries = ['nature', 'city', 'technology', 'people', 'animals'];
        const allVideos = [];
        const metadata = [];
        for (const query of queries) {
            console.log(`Searching for: ${query}`);
            const response = await axios_1.default.get('https://api.pexels.com/videos/search', {
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
            const hdVideo = video.video_files.find(f => f.quality === 'hd' && f.width <= 1920) || video.video_files[0];
            const videoFilename = `video_${video.id}.mp4`;
            const videoPath = path_1.default.join(RAW_VIDEOS_DIR, videoFilename);
            const thumbnailFilename = `thumbnail_${video.id}.jpg`;
            const thumbnailPath = path_1.default.join(THUMBNAILS_DIR, thumbnailFilename);
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
        const metadataPath = path_1.default.join(__dirname, 'metadata.json');
        fs_1.default.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`\n✅ Successfully downloaded ${metadata.length} videos!`);
        console.log(`📝 Metadata saved to: ${metadataPath}`);
        console.log(`\nNext step: Run npm run convert-hls\n`);
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('❌ Error:', error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
        }
        else {
            console.error('❌ Error:', error);
        }
    }
}
fetchVideos();
//# sourceMappingURL=fetchVideosFromPexels.js.map