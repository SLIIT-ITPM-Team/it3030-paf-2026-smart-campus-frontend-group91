import { useCallback, useEffect, useState } from 'react';
import catalogResourceService from '../services/catalogResourceService';
import './ResourceCatalogPage.css';

const RESOURCE_TYPES = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const RESOURCE_STATUSES = ['ALL', 'ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];

const normalizeFilters = (filters) => ({
  keyword: filters.keyword.trim() || undefined,
  type: filters.type !== 'ALL' ? filters.type : undefined,
  status: filters.status !== 'ALL' ? filters.status : undefined,
  minCapacity: filters.minCapacity ? Number(filters.minCapacity) : undefined,
  location: filters.location.trim() || undefined,
});

const formatLocation = (location) => {
  if (!location) {
    return 'Location not set';
  }
  const parts = [location.buildingName, location.floorNumber, location.roomNumber].filter(Boolean);
  return parts.join(' / ') || location.description || 'Location not set';
};

const formatWindow = (windowItem) => {
  if (!windowItem) {
    return 'Schedule not set';
  }
  const start = String(windowItem.startTime || '').slice(0, 5);
  const end = String(windowItem.endTime || '').slice(0, 5);
  return `${windowItem.dayOfWeek || 'DAY'} ${start || '--:--'} - ${end || '--:--'}`;
};

const ResourceCatalogPage = () => {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    type: 'ALL',
    status: 'ALL',
    location: '',
    minCapacity: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await catalogResourceService.getResources(normalizeFilters(filters));
      setResources(data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to load resource catalogue.';
      setErrorMessage(message);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const onFilterChange = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <section className="rcatalog-root">
      <div className="rcatalog-wrap">
        <header className="rcatalog-hero">
          <p className="rcatalog-kicker">Resource Catalogue</p>
          <h1>Find Campus Facilities & Assets</h1>
          <p>
            Browse availability, capacity, and location details for campus resources before submitting
            booking requests.
          </p>
        </header>

        <section className="rcatalog-card">
          <div className="rcatalog-row">
            <div>
              <h2>Search & Filter</h2>
              <p className="rcatalog-sub">Use filters to narrow down by type, location, or status.</p>
            </div>
            <button type="button" className="rcatalog-btn rcatalog-btn-outline" onClick={loadResources}>
              Refresh
            </button>
          </div>

          <div className="rcatalog-filters">
            <input
              type="text"
              className="rcatalog-input"
              placeholder="Search by name or status"
              value={filters.keyword}
              onChange={onFilterChange('keyword')}
            />
            <select className="rcatalog-select" value={filters.type} onChange={onFilterChange('type')}>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select className="rcatalog-select" value={filters.status} onChange={onFilterChange('status')}>
              {RESOURCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="rcatalog-input"
              placeholder="Filter by location"
              value={filters.location}
              onChange={onFilterChange('location')}
            />
            <input
              type="number"
              min="0"
              className="rcatalog-input"
              placeholder="Min capacity"
              value={filters.minCapacity}
              onChange={onFilterChange('minCapacity')}
            />
          </div>

          {errorMessage ? <div className="rcatalog-message rcatalog-message-error">{errorMessage}</div> : null}

          {isLoading ? (
            <div className="rcatalog-empty">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="rcatalog-empty">No resources match the current filters.</div>
          ) : (
            <div className="rcatalog-grid">
              {resources.map((resource) => (
                <article className="rcatalog-item" key={String(resource.id)}>
                  <div className="rcatalog-item-head">
                    <div>
                      <h3>{resource.name}</h3>
                      <p className="rcatalog-meta">{resource.type}</p>
                    </div>
                    <span className={`rcatalog-status rcatalog-status-${String(resource.status || '').toLowerCase()}`}>
                      {resource.status || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="rcatalog-details">
                    <p>
                      <strong>Location:</strong> {formatLocation(resource.location)}
                    </p>
                    <p>
                      <strong>Capacity:</strong> {resource.capacity ?? 'N/A'}
                    </p>
                    <div>
                      <strong>Availability:</strong>
                      <ul>
                        {(resource.availabilityWindows || []).length > 0 ? (
                          resource.availabilityWindows.map((windowItem) => (
                            <li key={`${resource.id}-${windowItem.id || windowItem.dayOfWeek}`}>
                              {formatWindow(windowItem)}
                            </li>
                          ))
                        ) : (
                          <li>Schedule not set.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default ResourceCatalogPage;
