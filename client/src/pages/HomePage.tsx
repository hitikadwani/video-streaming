import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchVideos } from '../redux/slices/videoSlice';
import { RootState } from '../store';
import { VideoCard } from '../components/browse/VideoCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { videos, loading, error } = useSelector((state: RootState) => state.videos);

  useEffect(() => {
    // Fetch videos regardless of auth status (public page)
    dispatch(fetchVideos({ limit: 24 }) as any);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout() as any);
    navigate('/login', { replace: true });
  };

  return (
    <div className="browse">
      <header className="browse-header">
        <div className="browse-header__inner">
          <Link to="/home" className="browse-header__logo">
            STREAM
          </Link>
          <nav className="browse-header__nav">
            <Link to="/home" className="browse-header__nav-link browse-header__nav-link--active">
              Home
            </Link>
            <Link to="/search" className="browse-header__nav-link">
              Search
            </Link>
          </nav>
          <div className="browse-header__user">
            {isAuthenticated && user ? (
              <>
                <span className="browse-header__email">{user?.displayName || user?.email}</span>
                <button type="button" className="browse-header__logout" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="browse-header__login-btn">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="browse-main">
        <section className="browse-section">
          <h1 className="browse-section__title">Trending Now</h1>
          {loading && <div className="browse-loading" />}
          {error && <div className="browse-error">{error}</div>}
          {!loading && !error && videos.length === 0 && (
            <div className="browse-empty">No videos available</div>
          )}
          {!loading && videos.length > 0 && (
            <div className="video-grid">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
