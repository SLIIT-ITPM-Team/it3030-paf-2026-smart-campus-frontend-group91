import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import catalogResourceService from '../services/catalogResourceService';
import './ResourceCatalogPage.css';

const normalizeFilters = (filters) => ({
  keyword: filters.keyword.trim() || undefined,
});

const formatLocation = (location) => {
  if (!location) return 'Location not set';
  const parts = [location.buildingName, location.floorNumber, location.roomNumber].filter(Boolean);
  return parts.join(' / ') || location.description || 'Location not set';
};

const formatHours = (windows = []) => {
  if (!windows.length) return 'Not set';
  if (windows.length > 1) return 'Multiple';
  const w = windows[0];
  const start = String(w.startTime || '').slice(0, 5);
  const end = String(w.endTime || '').slice(0, 5);
  return `${start || '--:--'} – ${end || '--:--'}`;
};

const fallbackImage =
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:8081';

const getResourceImageUrl = (resource) =>
  resource.id ? `${BACKEND_URL}/api/catalog/resources/${resource.id}/image` : fallbackImage;

const ResourceCatalogPage = () => {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ keyword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await catalogResourceService.getResources(normalizeFilters(filters));
      setResources(data);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || error?.message || 'Unable to load resource catalogue.',
      );
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadResources(); }, [loadResources]);

  return (
    <section className="rcat-root">
      <div className="rcat-wrap">

        {/* Header */}
        <div className="rcat-header">
          <div className="rcat-header-text">
            <span className="rcat-kicker">Resource Catalogue</span>
            <h1>Discover Campus Facilities</h1>
            <p>Search and book the perfect space or asset in seconds.</p>
          </div>
          <div className="rcat-search-bar">
            <span className="rcat-search-icon">🔍</span>
            <input
              type="text"
              className="rcat-search-input"
              placeholder="Search by resource name…"
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
            />
            <button type="button" className="rcat-search-btn" onClick={loadResources}>
              Search
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="rcat-error">{errorMessage}</div>
        )}

        {/* Feed */}
        {isLoading ? (
          <div className="rcat-state">
            <div className="rcat-spinner" />
            <p>Loading resources…</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="rcat-state">
            <span className="rcat-empty-icon">📭</span>
            <p>No resources match your search.</p>
          </div>
        ) : (
          <div className="rcat-feed">
            {resources.map((resource) => (
              <article className="rcat-card" key={String(resource.id)}>

                {/* Image — full width top */}
                <div className="rcat-card-img">
                  <img
                    src={getResourceImageUrl(resource)}
                    alt={resource.name}
                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                  />
                </div>

                {/* Body */}
                <div className="rcat-card-body">

                  {/* Category + Status row */}
                  <div className="rcat-card-badges">
                    <span className="rcat-tag">{resource.type || 'RESOURCE'}</span>
                    <span className={`rcat-badge ${resource.status === 'ACTIVE' ? 'rcat-badge-active' : 'rcat-badge-inactive'}`}>
                      {resource.status === 'ACTIVE' ? '● Available' : `● ${resource.status || 'Unavailable'}`}
                    </span>
                  </div>

                  {/* Name */}
                  <h2 className="rcat-card-name">{resource.name}</h2>

                  {/* Location */}
                  <p className="rcat-card-location">
                    <span className="rcat-loc-icon">📍</span>
                    {formatLocation(resource.location)}
                  </p>

                  {/* Info panels */}
                  <div className="rcat-info-row">
                    <div className="rcat-info-panel">
                      <span className="rcat-info-label">CAPACITY</span>
                      <strong className="rcat-info-value">{resource.capacity ?? 'N/A'}</strong>
                    </div>
                    <div className="rcat-info-panel">
                      <span className="rcat-info-label">HOURS</span>
                      <strong className="rcat-info-value">{formatHours(resource.availabilityWindows)}</strong>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link className="rcat-cta" to="/user/bookings/new">
                    View Details and Book
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResourceCatalogPage;
