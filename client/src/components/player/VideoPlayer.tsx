// client/src/components/player/VideoPlayer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { API_BASE } from '../../services/api';

interface VideoPlayerProps {
  manifestUrl: string;            // e.g. "/videos/video_855564/master.m3u8" or "https://..."
  onError?: (message: string) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getStandardResolutionLabel(height: number): string {
  if (height <= 240) return '240p';
  if (height <= 360) return '360p';
  if (height <= 480) return '480p';
  if (height <= 720) return '720p';
  if (height <= 1080) return '1080p';
  if (height <= 1440) return '1440p';
  if (height <= 2160) return '4K';
  return `${height}p`;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ manifestUrl, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelLabel, setLevelLabel] = useState<string>('AUTO');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<Array<{ index: number; height: number; bitrate: number; label: string }>>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1); // -1 means AUTO

  // Build absolute URL if it's a relative path like "/videos/..."
  const sourceUrl = manifestUrl.startsWith('http')
    ? manifestUrl
    : `${API_BASE}${manifestUrl}`;

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const t = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(t);
  }, [controlsTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    console.log('Loading video stream:', sourceUrl);

    const canPlayNative = video.canPlayType('application/vnd.apple.mpegurl');
    const useHls = Hls.isSupported();

    console.log('HLS support:', {
      hlsSupported: Hls.isSupported(),
      nativeSupported: canPlayNative,
      usingHls: useHls,
    });

    if (useHls) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data) => {
        const lvl = hls.levels?.[data.level];
        if (!lvl) return;
      
        const standardLabel = getStandardResolutionLabel(lvl.height);
        const msg = `HLS LEVEL -> ${standardLabel} (${Math.round((lvl.bitrate ?? 0) / 1000)} kbps) [index=${data.level}]`;
        console.log(msg);
        
        // Update label only if in AUTO mode
        if (selectedLevel === -1) {
          setLevelLabel(`AUTO (${standardLabel})`);
        }
      });
      
      hls.on(Hls.Events.FRAG_CHANGED, () => {
        const idx = hls.currentLevel;
        const lvl = hls.levels?.[idx];
        if (!lvl) return;
        // useful if you want frequent confirmation
        console.log(`Playing: ${lvl.height}p (currentLevel=${idx})`);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(
          'HLS levels:',
          hls.levels.map((l, i) => ({ i, height: l.height, bitrate: l.bitrate }))
        );
        console.log('autoLevelEnabled:', hls.autoLevelEnabled, 'currentLevel:', hls.currentLevel);
        
        // Store available quality levels and deduplicate by STANDARD resolution label
        // Keep the highest bitrate for each unique standard label
        const levelsByLabel = new Map<string, { index: number; height: number; bitrate: number; label: string }>();
        
        hls.levels.forEach((l, i) => {
          const standardLabel = getStandardResolutionLabel(l.height);
          const existing = levelsByLabel.get(standardLabel);
          const bitrate = l.bitrate || 0;
          
          if (!existing || bitrate > existing.bitrate) {
            levelsByLabel.set(standardLabel, {
              index: i,
              height: l.height,
              bitrate: bitrate,
              label: standardLabel
            });
          }
        });
        
        const uniqueLevels = Array.from(levelsByLabel.values());
        setAvailableLevels(uniqueLevels);
        setLoading(false);
        // Autoplay: Start playing when video is ready
        video.play().catch((error) => {
        console.warn('Autoplay prevented by browser:', error);
        // Autoplay was prevented, user will need to click play manually
       });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: (data as any).url,
        });
        if (data.fatal) {
          setLoading(false);
          let errorMsg = 'Playback error';
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.details === 'manifestLoadError') {
                errorMsg =
                  'Failed to load video manifest. Ensure the file exists and your connection is OK.';
              } else {
                errorMsg = `Network error: ${data.details || 'check your connection'}`;
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              errorMsg = 'Media error. The video format may not be supported.';
              break;
            default:
              errorMsg = `Error: ${data.details || 'Unknown error'}`;
          }
          onError?.(errorMsg);
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      // Native HLS (Safari)
      video.src = sourceUrl;
      video.crossOrigin = sourceUrl.startsWith(API_BASE) ? '' : 'anonymous';

      const handleLoadedMetadata = () => setLoading(false);

      const handleError = () => {
        setLoading(false);
        const error = video.error;
        if (error) {
          let errorMsg = 'Video playback error';
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMsg = 'Video loading aborted';
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMsg = 'Network error while loading video';
              break;
            case error.MEDIA_ERR_DECODE:
              errorMsg = 'Video decoding error';
              break;
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Video format not supported';
              break;
          }
          onError?.(errorMsg);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      return () => {
        video.src = '';
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };
    }
  }, [sourceUrl, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    resetControlsTimeout();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = Number(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const v = Number(e.target.value);
    setVolume(v);
    if (video) video.volume = v;
    if (v > 0) setIsMuted(false);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
    resetControlsTimeout();
  };

  const toggleQualityMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQualityMenu(!showQualityMenu);
    resetControlsTimeout();
  };

  const selectQuality = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
  
    if (levelIndex === -1) {
      // Auto mode
      hls.currentLevel = -1;
      setSelectedLevel(-1);
      setLevelLabel('AUTO');
      console.log('Quality set to AUTO');
    } else {
      // Manual level selection
      hls.currentLevel = levelIndex;
      setSelectedLevel(levelIndex);
      const level = hls.levels[levelIndex];
      if (level) {
        const standardLabel = getStandardResolutionLabel(level.height);
        setLevelLabel(standardLabel);
        console.log(`Quality manually set to ${standardLabel}`);
      }
    }
    setShowQualityMenu(false);
    resetControlsTimeout();
  };

  return (
    <div
      ref={containerRef}
      className="video-player"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (controlsTimeout) clearTimeout(controlsTimeout);
        setControlsTimeout(null);
        setShowControls(false);
      }}
      onClick={() => {
        if (showQualityMenu) setShowQualityMenu(false);
      }}
    >
      {loading && (
        <div className="video-player__loading">
          <div className="video-player__spinner" />
          <span>Loading video...</span>
        </div>
      )}
      <video
        ref={videoRef}
        className="video-player__video"
        onClick={togglePlay}
        playsInline
        autoPlay
      />

      <div
        className={`video-player__controls ${
          showControls ? 'video-player__controls--visible' : ''
        }`}
      >
        <div className="video-player__progress-wrap">
          <input
            type="range"
            className="video-player__progress"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="video-player__bar">
          <button
            type="button"
            className="video-player__btn"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>

          <span className="video-player__time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="video-player__volume">
            <button
              type="button"
              className="video-player__btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              className="video-player__volume-slider"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {availableLevels.length > 0 && (
            <div className="video-player__quality">
              <button
                type="button"
                className={`video-player__btn ${showQualityMenu ? 'video-player__btn--active' : ''}`}
                onClick={toggleQualityMenu}
                aria-label="Quality settings"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
                <span className="video-player__quality-label">{levelLabel}</span>
              </button>
              
              {showQualityMenu && (
                <div className="video-player__quality-menu">
                  <div className="video-player__quality-title">Quality</div>
                  <button
                    type="button"
                    className={`video-player__quality-option ${selectedLevel === -1 ? 'video-player__quality-option--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectQuality(-1);
                    }}
                  >
                    <span>Auto</span>
                    {selectedLevel === -1 && <span className="video-player__quality-check">✓</span>}
                  </button>
                  {availableLevels
                    .sort((a, b) => b.height - a.height)
                    .map((level) => (
                      <button
                        key={level.index}
                        type="button"
                        className={`video-player__quality-option ${selectedLevel === level.index ? 'video-player__quality-option--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectQuality(level.index);
                        }}
                      >
                          <span>{level.label}</span>
                        {selectedLevel === level.index && <span className="video-player__quality-check">✓</span>}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="video-player__btn video-player__btn--fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};