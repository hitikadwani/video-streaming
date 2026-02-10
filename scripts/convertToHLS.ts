import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { VideoMetadata } from '../server/src/types';

const RAW_VIDEOS_DIR = path.join(__dirname, '../public/videos/raw');
const OUTPUT_DIR = path.join(__dirname, '../public/videos');
const metadataPath = path.join(__dirname, 'metadata.json');

// Check if FFmpeg is installed
function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('error', () => resolve(false));
    ffmpeg.on('close', (code) => resolve(code === 0));
  });
}

// Convert single video to HLS
function convertToHLS(inputPath: string, outputDir: string, videoId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const masterPlaylist = path.join(outputDir, 'master.m3u8');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Converting: ${path.basename(inputPath)}`);

    // FFmpeg command for multi-bitrate HLS
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      
      // Map video and audio streams (3 variants)
      '-map', '0:v:0', '-map', '0:a:0',
      '-map', '0:v:0', '-map', '0:a:0',
      '-map', '0:v:0', '-map', '0:a:0',
      
      // Video codec
      '-c:v', 'libx264',
      '-c:a', 'aac',
      
      // 1080p variant
      '-b:v:0', '5000k',
      '-s:v:0', '1920x1080',
      '-maxrate:v:0', '5350k',
      '-bufsize:v:0', '7500k',
      
      // 720p variant
      '-b:v:1', '2800k',
      '-s:v:1', '1280x720',
      '-maxrate:v:1', '3000k',
      '-bufsize:v:1', '4200k',
      
      // 480p variant
      '-b:v:2', '1400k',
      '-s:v:2', '854x480',
      '-maxrate:v:2', '1500k',
      '-bufsize:v:2', '2100k',
      
      // Audio bitrate
      '-b:a', '128k',
      
      // HLS settings
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_flags', 'independent_segments',
      '-hls_segment_type', 'mpegts',
      
      // Variant stream mapping
      '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
      
      // Master playlist
      '-master_pl_name', 'master.m3u8',
      
      // Output pattern
      '-f', 'hls',
      '-hls_segment_filename', path.join(outputDir, 'v%v/segment%d.ts'),
      path.join(outputDir, 'v%v/playlist.m3u8')
    ]);

    ffmpeg.stderr.on('data', (data) => {
      // Show progress
      process.stdout.write('.');
    });

    ffmpeg.on('close', (code) => {
      console.log(''); // New line
      if (code === 0) {
        console.log(`✓ Converted: video_${videoId}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

async function convertAllVideos(): Promise<void> {
  try {
    // Check FFmpeg
    const hasFFmpeg = await checkFFmpeg();
    if (!hasFFmpeg) {
      console.error('❌ FFmpeg is not installed!');
      console.log('Install it with: brew install ffmpeg (macOS)');
      process.exit(1);
    }

    // Load metadata
    if (!fs.existsSync(metadataPath)) {
      console.error('❌ metadata.json not found!');
      console.log('Run fetchVideosFromPexels.ts first');
      process.exit(1);
    }

    const metadata: VideoMetadata[] = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`🎬 Converting ${metadata.length} videos to HLS...\n`);

    // Convert each video
    for (let i = 0; i < metadata.length; i++) {
      const video = metadata[i];
      const inputPath = path.join(RAW_VIDEOS_DIR, video.video_file);
      const outputDir = path.join(OUTPUT_DIR, `video_${video.pexels_id}`);

      console.log(`[${i + 1}/${metadata.length}]`);
      
      await convertToHLS(inputPath, outputDir, video.pexels_id);

      // Update metadata with manifest path
      video.manifest_url = `/videos/video_${video.pexels_id}/master.m3u8`;
    }

    // Save updated metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`\n✅ Successfully converted all videos!`);
    console.log(`\nNext step: Run npm run seed-db\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

convertAllVideos();