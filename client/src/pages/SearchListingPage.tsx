import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchSearch, fetchTags } from '../redux/slices/videoSlice';
import { RootState } from '../store';
import { VideoCard } from '../components/browse/VideoCard';

export const SearchListingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { videos, count, loading, error, tags, tagsLoading } = useSelector((state: RootState) => state.videos);

  const qFromUrl = searchParams.get('q') ?? '';
  const tagsFromUrl = searchParams.get('tags');
  const tagIdsFromUrl = tagsFromUrl ? tagsFromUrl.split(',').map((t) => parseInt(t, 10)).filter((n) => !Number.isNaN(n)) : [];

  const [query, setQuery] = useState(qFromUrl);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(tagIdsFromUrl);

  useEffect(() => {
    // Fetch tags regardless of auth status (public page)
    dispatch(fetchTags() as any);
  }, [dispatch]);

  useEffect(() => {
    setQuery(qFromUrl);
    setSelectedTagIds(tagIdsFromUrl);
    // Fetch search results regardless of auth status (public page)
    dispatch(
      fetchSearch({
        q: qFromUrl || undefined,
        tagIds: tagIdsFromUrl.length ? tagIdsFromUrl : undefined,
        limit: 48,
      }) as any
    );
  }, [qFromUrl, tagsFromUrl, dispatch]);

   // Debounced search effect - automatically search as user types
  useEffect(() => {
    // Create a timeout to delay the search
    const timeoutId = setTimeout(() => {
     // Only update URL if query has changed
      if (query !== qFromUrl || selectedTagIds.join(',') !== tagIdsFromUrl.join(',')) {
      const nextParams = new URLSearchParams();
      if (query.trim()) nextParams.set('q', query.trim());
      if (selectedTagIds.length) nextParams.set('tags', selectedTagIds.join(','));
      setSearchParams(nextParams);
     }
    }, 500); // 500ms delay (adjust as needed)

    // Cleanup: cancel timeout if user types again before delay finishes
       return () => clearTimeout(timeoutId);
  }, [query, selectedTagIds]); // Run when query or selectedTagIds change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now automatic via debounce, but we can trigger immediately on Enter
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query.trim());
    if (selectedTagIds.length) next.set('tags', selectedTagIds.join(','));
    setSearchParams(next);
  };

  const toggleTag = (tagId: number) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(next);
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set('q', query.trim());
    if (next.length) nextParams.set('tags', next.join(','));
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTagIds([]);
    setSearchParams({});
  };

  const hasActiveFilters = query.trim() !== '' || selectedTagIds.length > 0;

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
            <Link to="/home" className="browse-header__nav-link">
              Home
            </Link>
            <Link to="/search" className="browse-header__nav-link browse-header__nav-link--active">
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

      <main className="browse-main search-listing">
        <h1 className="browse-section__title">Search &amp; Filter</h1>

        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            className="search-bar__input"
            placeholder="Search by title, description or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search videos"
          />
          <button type="submit" className="search-bar__btn">
            Search
          </button>
        </form>

        <div className="search-filters">
          <span className="search-filters__label">Filter by tag:</span>
          {tagsLoading && <span className="search-filters__loading">Loading tags…</span>}
          <div className="search-chips">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`search-chip ${selectedTagIds.includes(tag.id) ? 'search-chip--active' : ''}`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button type="button" className="search-clear" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>

        <p className="search-results-count">
          {loading ? 'Searching…' : `${count} video${count !== 1 ? 's' : ''} found`}
        </p>

        {error && <div className="browse-error">{error}</div>}
        {!loading && !error && videos.length === 0 && (
          <div className="browse-empty">No videos match your search. Try different keywords or tags.</div>
        )}
        {!loading && videos.length > 0 && (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
