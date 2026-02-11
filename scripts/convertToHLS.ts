import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { VideoMetadata } from '../server/src/types';

const RAW_VIDEOS_DIR = path.join(__dirname, '../public/videos/raw');
const OUTPUT_DIR = path.join(__dirname, '../public/videos');
const metadataPath = path.join(__dirname, 'metadata.json');

// Check if FFmpeg is installed
function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

// Check if video has audio stream
function hasAudioStream(inputPath: string): boolean {
  try {
    const result = execSync(
      `ffprobe -i "${inputPath}" -show_streams -select_streams a -loglevel error`,
      { encoding: 'utf8' }
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// Convert single video to HLS
function convertToHLS(inputPath: string, outputDir: string, videoId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create output directories
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(path.join(outputDir, 'v0'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'v1'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'v2'), { recursive: true });

    console.log(`Converting: ${path.basename(inputPath)}`);

    const hasAudio = hasAudioStream(inputPath);
    console.log(`  Audio: ${hasAudio ? 'yes' : 'no (will add silent track)'}`);

    // Build FFmpeg args
    const args: string[] = [];

    if (!hasAudio) {
      // Add silent audio source as second input
      args.push(
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-i', inputPath,
        // Map video from input 1 (the actual video), audio from input 0 (silent)
        '-map', '1:v:0', '-map', '0:a:0',
        '-map', '1:v:0', '-map', '0:a:0',
        '-map', '1:v:0', '-map', '0:a:0',
        '-shortest'
      );
    } else {
      args.push(
        '-i', inputPath,
        // Map video and audio streams (3 variants)
        '-map', '0:v:0', '-map', '0:a:0',
        '-map', '0:v:0', '-map', '0:a:0',
        '-map', '0:v:0', '-map', '0:a:0'
      );
    }

    // Common encoding settings
    args.push(
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
    );

    const ffmpeg = spawn('ffmpeg', args);

    // Capture stderr for debugging
    let stderrOutput = '';
    ffmpeg.stderr.on('data', (data) => {
      stderrOutput += data.toString();
      process.stdout.write('.');
    });

    ffmpeg.on('close', (code) => {
      console.log(''); // New line
      if (code === 0) {
        console.log(`  ✓ Converted: video_${videoId}\n`);
        resolve();
      } else {
        // Print last few lines of FFmpeg error for debugging
        const errorLines = stderrOutput.split('\n').slice(-5).join('\n');
        console.error(`  FFmpeg error output:\n${errorLines}\n`);
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

    let successCount = 0;
    let failCount = 0;

    // Convert each video
    for (let i = 0; i < metadata.length; i++) {
      const video = metadata[i];
      const inputPath = path.join(RAW_VIDEOS_DIR, video.video_file);
      const outputDir = path.join(OUTPUT_DIR, `video_${video.pexels_id}`);

      console.log(`[${i + 1}/${metadata.length}]`);

      try {
        await convertToHLS(inputPath, outputDir, video.pexels_id);
        video.manifest_url = `/videos/video_${video.pexels_id}/master.m3u8`;
        successCount++;
      } catch (err) {
        console.error(`  ✗ Failed: video_${video.pexels_id}, skipping...\n`);
        failCount++;
        // Continue with next video instead of stopping
        continue;
      }
    }

    // Save updated metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`\n✅ Conversion complete!`);
    console.log(`   Success: ${successCount} | Failed: ${failCount}`);
    console.log(`\nNext step: Run npm run seed-db\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

convertAllVideos();