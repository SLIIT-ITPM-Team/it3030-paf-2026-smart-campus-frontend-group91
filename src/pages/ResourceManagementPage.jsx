import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import catalogResourceService from '../services/catalogResourceService';
import './ResourceManagementPage.css';

const RESOURCE_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const RESOURCE_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];
const DAY_OPTIONS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const emptyForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  status: 'ACTIVE',
  location: {
    id: null,
    buildingName: '',
    floorNumber: '',
    roomNumber: '',
    description: '',
  },
  availabilityWindows: [
    {
      id: null,
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '18:00',
    },
  ],
};

const normalizeFilters = (filters) => ({
  keyword: filters.keyword.trim() || undefined,
  type: filters.type !== 'ALL' ? filters.type : undefined,
  status: filters.status !== 'ALL' ? filters.status : undefined,
  minCapacity: filters.minCapacity ? Number(filters.minCapacity) : undefined,
  location: filters.location.trim() || undefined,
});

const toTimeInput = (value) => {
  if (!value) {
    return '';
  }
  return String(value).slice(0, 5);
};

const mapResourceToForm = (resource) => ({
  name: resource.name || '',
  type: resource.type || 'LECTURE_HALL',
  capacity: resource.capacity ?? '',
  status: resource.status || 'ACTIVE',
  location: {
    id: resource.location?.id ?? null,
    buildingName: resource.location?.buildingName || '',
    floorNumber: resource.location?.floorNumber || '',
    roomNumber: resource.location?.roomNumber || '',
    description: resource.location?.description || '',
  },
  availabilityWindows:
    resource.availabilityWindows && resource.availabilityWindows.length > 0
      ? resource.availabilityWindows.map((windowItem) => ({
          id: windowItem.id ?? null,
          dayOfWeek: windowItem.dayOfWeek || 'MONDAY',
          startTime: toTimeInput(windowItem.startTime) || '08:00',
          endTime: toTimeInput(windowItem.endTime) || '18:00',
        }))
      : emptyForm.availabilityWindows,
});

const ResourceManagementPage = () => {
  const formRef = useRef(null);
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    type: 'ALL',
    status: 'ALL',
    location: '',
    minCapacity: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setActionMessage('');

    try {
      const data = await catalogResourceService.getResources(normalizeFilters(filters));
      setResources(data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to load resources.';

      setErrorMessage(message);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const statusBreakdown = useMemo(() => {
    return RESOURCE_STATUSES.reduce((acc, status) => {
      acc[status] = resources.filter((item) => item.status === status).length;
      return acc;
    }, {});
  }, [resources]);

  const onFilterChange = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onClearFilters = () => {
    setFilters({ keyword: '', type: 'ALL', status: 'ALL', location: '', minCapacity: '' });
  };

  const onFormChange = (key) => (event) => {
    setFormState((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onLocationChange = (key) => (event) => {
    setFormState((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [key]: event.target.value,
      },
    }));
  };

  const onWindowChange = (index, key) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.map((windowItem, windowIndex) =>
        windowIndex === index ? { ...windowItem, [key]: value } : windowItem,
      ),
    }));
  };

  const addWindow = () => {
    setFormState((prev) => ({
      ...prev,
      availabilityWindows: [
        ...prev.availabilityWindows,
        { id: null, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00' },
      ],
    }));
  };

  const removeWindow = (index) => {
    setFormState((prev) => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.filter((_, windowIndex) => windowIndex !== index),
    }));
  };

  const startEdit = (resource) => {
    setEditingId(resource.id);
    setFormState(mapResourceToForm(resource));
    setActionMessage('');
    setErrorMessage('');
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormState(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setActionMessage('');

    const payload = {
      name: formState.name.trim(),
      type: formState.type,
      capacity: formState.capacity === '' ? null : Number(formState.capacity),
      status: formState.status,
      location: {
        id: formState.location.id || null,
        buildingName: formState.location.buildingName.trim(),
        floorNumber: formState.location.floorNumber.trim(),
        roomNumber: formState.location.roomNumber.trim(),
        description: formState.location.description.trim(),
      },
      availabilityWindows: formState.availabilityWindows.map((windowItem) => ({
        id: windowItem.id || null,
        dayOfWeek: windowItem.dayOfWeek,
        startTime: windowItem.startTime || null,
        endTime: windowItem.endTime || null,
      })),
    };

    try {
      if (editingId) {
        await catalogResourceService.updateResource(editingId, payload);
        setActionMessage('Resource updated successfully.');
      } else {
        await catalogResourceService.createResource(payload);
        setActionMessage('Resource created successfully.');
      }
      cancelEdit();
      await loadResources();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to save resource.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    const shouldDelete = window.confirm(`Delete resource "${resource.name}"?`);
    if (!shouldDelete) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setActionMessage('');

    try {
      await catalogResourceService.deleteResource(resource.id);
      setActionMessage('Resource deleted successfully.');
      await loadResources();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to delete resource.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rmanage-root">
      <div className="rmanage-wrap">
        <header className="rmanage-hero">
          <p className="rmanage-kicker">Admin Panel</p>
          <h1>Resource Management</h1>
          <p>
            Monitor campus resource inventory, review availability, and keep status updates aligned
            with maintenance activity.
          </p>
          <div className="rmanage-meta">
            <span className="rmanage-pill">Total resources: {resources.length}</span>
            <span className="rmanage-pill">Active: {statusBreakdown.ACTIVE || 0}</span>
            <span className="rmanage-pill">Out of service: {statusBreakdown.OUT_OF_SERVICE || 0}</span>
            <span className="rmanage-pill">
              Maintenance: {statusBreakdown.UNDER_MAINTENANCE || 0}
            </span>
          </div>
        </header>

        <section className="rmanage-card">
          <div className="rmanage-row">
            <div>
              <h2>Resource Inventory</h2>
              <p className="rmanage-sub">Filter by keyword, type, or status.</p>
            </div>
            <div className="rmanage-actions">
              <button type="button" className="rmanage-btn rmanage-btn-outline" onClick={loadResources}>
                Refresh
              </button>
              <button type="button" className="rmanage-btn" onClick={onClearFilters}>
                Clear Filters
              </button>
            </div>
          </div>

          <div className="rmanage-filters">
            <input
              type="text"
              className="rmanage-input"
              placeholder="Search by name or status"
              value={filters.keyword}
              onChange={onFilterChange('keyword')}
            />
            <select
              className="rmanage-select"
              value={filters.type}
              onChange={onFilterChange('type')}
            >
              <option value="ALL">All types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="rmanage-select"
              value={filters.status}
              onChange={onFilterChange('status')}
            >
              <option value="ALL">All statuses</option>
              {RESOURCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="rmanage-input"
              placeholder="Filter by location"
              value={filters.location}
              onChange={onFilterChange('location')}
            />
            <input
              type="number"
              min="0"
              className="rmanage-input"
              placeholder="Min capacity"
              value={filters.minCapacity}
              onChange={onFilterChange('minCapacity')}
            />
          </div>

          {errorMessage ? <div className="rmanage-message rmanage-message-error">{errorMessage}</div> : null}
          {actionMessage ? <div className="rmanage-message">{actionMessage}</div> : null}

          <form ref={formRef} className="rmanage-form" onSubmit={handleSubmit}>
            <div className="rmanage-form-header">
              <div>
                <h3>{editingId ? 'Edit Resource' : 'Add New Resource'}</h3>
                <p className="rmanage-sub">Update core details, location, and availability windows.</p>
              </div>
              <div className="rmanage-actions">
                {editingId ? (
                  <button type="button" className="rmanage-btn rmanage-btn-outline" onClick={cancelEdit}>
                    Cancel Edit
                  </button>
                ) : null}
                <button type="submit" className="rmanage-btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId ? 'Update Resource' : 'Create Resource'}
                </button>
              </div>
            </div>

            <div className="rmanage-form-grid">
              <label className="rmanage-field">
                Resource Name
                <input
                  type="text"
                  className="rmanage-input"
                  value={formState.name}
                  onChange={onFormChange('name')}
                  required
                />
              </label>
              <label className="rmanage-field">
                Resource Type
                <select
                  className="rmanage-select"
                  value={formState.type}
                  onChange={onFormChange('type')}
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="rmanage-field">
                Capacity
                <input
                  type="number"
                  min="0"
                  className="rmanage-input"
                  value={formState.capacity}
                  onChange={onFormChange('capacity')}
                  required
                />
              </label>
              <label className="rmanage-field">
                Status
                <select
                  className="rmanage-select"
                  value={formState.status}
                  onChange={onFormChange('status')}
                >
                  {RESOURCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="rmanage-field">
                Building Name
                <input
                  type="text"
                  className="rmanage-input"
                  value={formState.location.buildingName}
                  onChange={onLocationChange('buildingName')}
                  required
                />
              </label>
              <label className="rmanage-field">
                Floor Number
                <input
                  type="text"
                  className="rmanage-input"
                  value={formState.location.floorNumber}
                  onChange={onLocationChange('floorNumber')}
                />
              </label>
              <label className="rmanage-field">
                Room Number
                <input
                  type="text"
                  className="rmanage-input"
                  value={formState.location.roomNumber}
                  onChange={onLocationChange('roomNumber')}
                />
              </label>
              <label className="rmanage-field rmanage-field-wide">
                Location Notes
                <input
                  type="text"
                  className="rmanage-input"
                  value={formState.location.description}
                  onChange={onLocationChange('description')}
                />
              </label>
            </div>

            <div className="rmanage-windows">
              <div className="rmanage-row">
                <div>
                  <h4>Availability Windows</h4>
                  <p className="rmanage-sub">Define available days and times for this resource.</p>
                </div>
                <button type="button" className="rmanage-btn rmanage-btn-outline" onClick={addWindow}>
                  Add Window
                </button>
              </div>
              {formState.availabilityWindows.map((windowItem, index) => (
                <div className="rmanage-window-row" key={`${windowItem.id ?? 'new'}-${index}`}>
                  <select
                    className="rmanage-select"
                    value={windowItem.dayOfWeek}
                    onChange={onWindowChange(index, 'dayOfWeek')}
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className="rmanage-input"
                    value={windowItem.startTime}
                    onChange={onWindowChange(index, 'startTime')}
                  />
                  <input
                    type="time"
                    className="rmanage-input"
                    value={windowItem.endTime}
                    onChange={onWindowChange(index, 'endTime')}
                  />
                  <button
                    type="button"
                    className="rmanage-btn rmanage-btn-outline"
                    onClick={() => removeWindow(index)}
                    disabled={formState.availabilityWindows.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </form>

          <div className="rmanage-table-wrap">
            <table className="rmanage-table">
              <thead>
                <tr>
                  <th>Resource ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="rmanage-empty">
                      Loading resources...
                    </td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="rmanage-empty">
                      No resources found.
                    </td>
                  </tr>
                ) : (
                  resources.map((item) => (
                    <tr key={String(item.id ?? item.resourceId)}>
                      <td>{item.id ?? 'N/A'}</td>
                      <td>{item.name || 'Unnamed resource'}</td>
                      <td>{item.type || 'N/A'}</td>
                      <td>
                        {item.location?.buildingName || 'N/A'}
                        {item.location?.roomNumber ? ` / ${item.location.roomNumber}` : ''}
                      </td>
                      <td>{item.capacity ?? 'N/A'}</td>
                      <td>
                        <span className={`rmanage-status rmanage-status-${String(item.status || '').toLowerCase()}`}>
                          {item.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        <div className="rmanage-actions">
                          <button
                            type="button"
                            className="rmanage-btn rmanage-btn-outline"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rmanage-btn rmanage-btn-danger"
                            onClick={() => handleDelete(item)}
                            disabled={isSaving}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
};

export default ResourceManagementPage;
