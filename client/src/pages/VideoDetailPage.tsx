import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchVideoById, clearCurrentVideo } from '../redux/slices/videoSlice';
import { RootState } from '../store';
import { VideoPlayer } from '../components/player/VideoPlayer';

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { currentVideo, currentVideoLoading, currentVideoError } = useSelector(
    (state: RootState) => state.videos
  );
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const videoId = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(videoId)) {
      navigate('/home', { replace: true });
      return;
    }
    dispatch(fetchVideoById(videoId) as any);
    return () => {
      dispatch(clearCurrentVideo());
    };
  }, [id, isAuthenticated, navigate, dispatch]);

  const handleLogout = () => {
    dispatch(logout() as any);
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated) return null;

  if (currentVideoLoading) {
    return (
      <div className="browse">
        <header className="browse-header">
          <div className="browse-header__inner">
            <Link to="/home" className="browse-header__logo">
              STREAM
            </Link>
            <nav className="browse-header__nav">
              <Link to="/home" className="browse-header__nav-link">
                Home
              </Link>
              <Link to="/search" className="browse-header__nav-link">
                Search
              </Link>
            </nav>
            <div className="browse-header__user">
              <span className="browse-header__email">
                {user?.displayName || user?.email}
              </span>
              <button
                type="button"
                className="browse-header__logout"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="browse-main">
          <div className="video-detail video-detail--loading">Loading video...</div>
        </main>
      </div>
    );
  }

  if (currentVideoError || !currentVideo) {
    return (
      <div className="browse">
        <header className="browse-header">
          <div className="browse-header__inner">
            <Link to="/home" className="browse-header__logo">
              STREAM
            </Link>
            <Link to="/home" className="browse-header__back">
              ← Back to Browse
            </Link>
          </div>
        </header>
        <main className="browse-main">
          <div className="video-detail video-detail--error">
            {currentVideoError || 'Video not found.'}
            <Link to="/home" className="video-detail__back-link">
              Back to Browse
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const durationStr = formatDuration(currentVideo.duration);

  return (
    <div className="browse">
      <header className="browse-header">
        <div className="browse-header__inner">
          <Link to="/home" className="browse-header__logo">
            STREAM
          </Link>
          <nav className="browse-header__nav">
            <Link to="/home" className="browse-header__nav-link">
              Home
            </Link>
            <Link to="/search" className="browse-header__nav-link">
              Search
            </Link>
          </nav>
          <div className="browse-header__user">
            <span className="browse-header__email">
              {user?.displayName || user?.email}
            </span>
            <button
              type="button"
              className="browse-header__logout"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="browse-main">
        <article className="video-detail">
          <div className="video-detail__media">
            <VideoPlayer
              manifestUrl={currentVideo.manifest_url}
              onError={setPlayerError}
            />
            {playerError && (
              <div className="video-detail__player-error">{playerError}</div>
            )}
          </div>

          <div className="video-detail__body">
            <h1 className="video-detail__title">{currentVideo.title}</h1>
            <div className="video-detail__meta">
              {durationStr && (
                <span className="video-detail__meta-item">{durationStr}</span>
              )}
              {currentVideo.width != null && currentVideo.height != null && (
                <span className="video-detail__meta-item">
                  {currentVideo.height}p
                </span>
              )}
            </div>
            {currentVideo.description && (
              <p className="video-detail__description">
                {currentVideo.description}
              </p>
            )}

            {currentVideo.tags && currentVideo.tags.length > 0 && (
              <div className="video-detail__tags">
                <span className="video-detail__tags-label">Tags:</span>
                <div className="video-detail__tags-list">
                  {currentVideo.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/search?tags=${tag.id}`}
                      className="video-detail-tag"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  );
};