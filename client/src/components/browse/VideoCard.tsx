import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types/video';
import { API_BASE } from '../../services/api';

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function thumbnailUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface VideoCardProps {
  video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const thumb = thumbnailUrl(video.thumbnail_url);

  return (
    <Link to={`/videos/${video.id}`} className="video-card">
      <div className="video-card__thumb">
        {thumb ? (
          <img src={thumb} alt={video.title} loading="lazy" />
        ) : (
          <div className="video-card__thumb-placeholder" />
        )}
        <div className="video-card__play-icon" aria-label="Play video" />
        {video.duration != null && (
          <span className="video-card__duration">{formatDuration(video.duration)}</span>
        )}
      </div>
      <div className="video-card__info">
        <h3 className="video-card__title">{video.title}</h3>
        {video.description && (
          <p className="video-card__desc">{video.description}</p>
        )}
      </div>
    </Link>
  );
};
