import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import catalogResourceService from '../services/catalogResourceService';
import './ResourceManagementPage.css';

const RESOURCE_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const RESOURCE_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];
const DAY_OPTIONS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:8081';

const emptyForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  status: 'ACTIVE',
  location: { id: null, buildingName: '', floorNumber: '', roomNumber: '', description: '' },
  availabilityWindows: [{ id: null, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00' }],
};

const emptyErrors = {
  name: '', capacity: '', buildingName: '', windows: '',
};

const toTimeInput = (v) => (v ? String(v).slice(0, 5) : '');

const mapResourceToForm = (r) => ({
  name: r.name || '',
  type: r.type || 'LECTURE_HALL',
  capacity: r.capacity ?? '',
  status: r.status || 'ACTIVE',
  location: {
    id: r.location?.id ?? null,
    buildingName: r.location?.buildingName || '',
    floorNumber: r.location?.floorNumber || '',
    roomNumber: r.location?.roomNumber || '',
    description: r.location?.description || '',
  },
  availabilityWindows:
    r.availabilityWindows?.length > 0
      ? r.availabilityWindows.map((w) => ({
          id: w.id ?? null,
          dayOfWeek: w.dayOfWeek || 'MONDAY',
          startTime: toTimeInput(w.startTime) || '08:00',
          endTime: toTimeInput(w.endTime) || '18:00',
        }))
      : emptyForm.availabilityWindows,
});

const normalizeFilters = (f) => ({
  keyword: f.keyword.trim() || undefined,
  type: f.type !== 'ALL' ? f.type : undefined,
  status: f.status !== 'ALL' ? f.status : undefined,
  minCapacity: f.minCapacity ? Number(f.minCapacity) : undefined,
  location: f.location.trim() || undefined,
});

const validate = (form) => {
  const errs = { ...emptyErrors };
  if (!form.name.trim()) errs.name = 'Resource name is required.';
  if (form.capacity === '' || Number(form.capacity) < 0)
    errs.capacity = 'Capacity must be a non-negative number.';
  if (!form.location.buildingName.trim()) errs.buildingName = 'Building name is required.';
  const badWindow = form.availabilityWindows.find((w) => w.startTime >= w.endTime);
  if (badWindow) errs.windows = "Each window's start time must be before its end time.";
  return errs;
};

const hasErrors = (errs) => Object.values(errs).some(Boolean);

const ResourceManagementPage = () => {
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', type: 'ALL', status: 'ALL', location: '', minCapacity: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState(emptyErrors);
  const [touched, setTouched] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  /* image preview */
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(editingId ? `${BACKEND_URL}/api/catalog/resources/${editingId}/image` : '');
    return undefined;
  }, [imageFile, editingId]);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setActionMessage('');
    try {
      const data = await catalogResourceService.getResources(normalizeFilters(filters));
      setResources(data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Unable to load resources.');
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadResources(); }, [loadResources]);

  const statusBreakdown = useMemo(() =>
    RESOURCE_STATUSES.reduce((acc, s) => {
      acc[s] = resources.filter((r) => r.status === s).length;
      return acc;
    }, {}),
  [resources]);

  /* form helpers */
  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const onFormChange = (key) => (e) => {
    const val = e.target.value;
    setFormState((p) => ({ ...p, [key]: val }));
    setFormErrors((p) => ({ ...p, [key]: '' }));
  };

  const onLocationChange = (key) => (e) => {
    const val = e.target.value;
    setFormState((p) => ({ ...p, location: { ...p.location, [key]: val } }));
    if (key === 'buildingName') setFormErrors((p) => ({ ...p, buildingName: '' }));
  };

  const onWindowChange = (idx, key) => (e) => {
    const val = e.target.value;
    setFormState((p) => ({
      ...p,
      availabilityWindows: p.availabilityWindows.map((w, i) =>
        i === idx ? { ...w, [key]: val } : w,
      ),
    }));
    setFormErrors((p) => ({ ...p, windows: '' }));
  };

  const addWindow = () =>
    setFormState((p) => ({
      ...p,
      availabilityWindows: [...p.availabilityWindows, { id: null, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00' }],
    }));

  const removeWindow = (idx) =>
    setFormState((p) => ({
      ...p,
      availabilityWindows: p.availabilityWindows.filter((_, i) => i !== idx),
    }));

  const startEdit = (resource) => {
    setEditingId(resource.id);
    setFormState(mapResourceToForm(resource));
    setImageFile(null);
    setFormErrors(emptyErrors);
    setTouched({});
    setActionMessage('');
    setErrorMessage('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setImageFile(null);
    setFormErrors(emptyErrors);
    setTouched({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(formState);
    setFormErrors(errs);
    setTouched({ name: true, capacity: true, buildingName: true, windows: true });
    if (hasErrors(errs)) return;

    setIsSaving(true);
    setErrorMessage('');
    setActionMessage('');

    const payload = {
      name: formState.name.trim(),
      type: formState.type,
      capacity: formState.capacity === '' ? null : Number(formState.capacity),
      status: formState.status,
      imageUrl: null,
      location: {
        id: formState.location.id || null,
        buildingName: formState.location.buildingName.trim(),
        floorNumber: formState.location.floorNumber.trim(),
        roomNumber: formState.location.roomNumber.trim(),
        description: formState.location.description.trim(),
      },
      availabilityWindows: formState.availabilityWindows.map((w) => ({
        id: w.id || null,
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime || null,
        endTime: w.endTime || null,
      })),
    };

    try {
      let saved;
      if (editingId) {
        saved = await catalogResourceService.updateResource(editingId, payload);
        setActionMessage('✓ Resource updated successfully.');
      } else {
        saved = await catalogResourceService.createResource(payload);
        setActionMessage('✓ Resource created successfully.');
      }
      if (imageFile && saved?.id) {
        await catalogResourceService.uploadImage(saved.id, imageFile);
      }
      cancelEdit();
      await loadResources();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Unable to save resource.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete "${resource.name}"? This cannot be undone.`)) return;
    setIsSaving(true);
    setErrorMessage('');
    setActionMessage('');
    try {
      await catalogResourceService.deleteResource(resource.id);
      setActionMessage('✓ Resource deleted successfully.');
      await loadResources();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Unable to delete resource.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rm-root">
      <div className="rm-wrap">

        {/* ── Hero ── */}
        <header className="rm-hero">
          <div className="rm-hero-text">
            <span className="rm-kicker">Admin Panel</span>
            <h1>Resource Management</h1>
            <p>Manage campus resources, availability windows, and status updates.</p>
          </div>
          <div className="rm-stats">
            <div className="rm-stat">
              <strong>{resources.length}</strong>
              <span>Total</span>
            </div>
            <div className="rm-stat rm-stat-active">
              <strong>{statusBreakdown.ACTIVE || 0}</strong>
              <span>Active</span>
            </div>
            <div className="rm-stat rm-stat-oos">
              <strong>{statusBreakdown.OUT_OF_SERVICE || 0}</strong>
              <span>Out of Service</span>
            </div>
            <div className="rm-stat rm-stat-maint">
              <strong>{statusBreakdown.UNDER_MAINTENANCE || 0}</strong>
              <span>Maintenance</span>
            </div>
          </div>
        </header>

        {/* ── Filters ── */}
        <div className="rm-panel">
          <div className="rm-panel-head">
            <div>
              <h2>Resource Inventory</h2>
              <p className="rm-sub">Filter and manage all campus resources.</p>
            </div>
            <div className="rm-btn-group">
              <button type="button" className="rm-btn rm-btn-ghost" onClick={loadResources}>↻ Refresh</button>
              <button type="button" className="rm-btn rm-btn-ghost" onClick={() => setFilters({ keyword: '', type: 'ALL', status: 'ALL', location: '', minCapacity: '' })}>Clear Filters</button>
            </div>
          </div>

          <div className="rm-filters">
            <input className="rm-input" placeholder="Search by name…" value={filters.keyword}
              onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value }))} />
            <select className="rm-select" value={filters.type}
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
              <option value="ALL">All Types</option>
              {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <select className="rm-select" value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="ALL">All Statuses</option>
              {RESOURCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <input className="rm-input" placeholder="Filter by location…" value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))} />
            <input className="rm-input" type="number" min="0" placeholder="Min capacity"
              value={filters.minCapacity}
              onChange={(e) => setFilters((p) => ({ ...p, minCapacity: e.target.value }))} />
          </div>

          {errorMessage && <div className="rm-alert rm-alert-error">{errorMessage}</div>}
          {actionMessage && <div className="rm-alert rm-alert-success">{actionMessage}</div>}
        </div>

        {/* ── Form ── */}
        <div className="rm-panel" ref={formRef}>
          <div className="rm-panel-head">
            <div>
              <h2>{editingId ? '✏️ Edit Resource' : '➕ Add New Resource'}</h2>
              <p className="rm-sub">Fill in all required fields marked with *</p>
            </div>
            {editingId && (
              <button type="button" className="rm-btn rm-btn-ghost" onClick={cancelEdit}>✕ Cancel Edit</button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Section: Core Details */}
            <div className="rm-section-label">Core Details</div>
            <div className="rm-grid-2">
              <div className="rm-field">
                <label className="rm-label">Resource Name <span className="rm-req">*</span></label>
                <input
                  className={`rm-input ${touched.name && formErrors.name ? 'rm-input-error' : ''}`}
                  value={formState.name}
                  onChange={onFormChange('name')}
                  onBlur={() => touch('name')}
                  placeholder="e.g. Main Lecture Hall A"
                />
                {touched.name && formErrors.name && <span className="rm-err-msg">{formErrors.name}</span>}
              </div>

              <div className="rm-field">
                <label className="rm-label">Resource Type</label>
                <select className="rm-select" value={formState.type} onChange={onFormChange('type')}>
                  {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div className="rm-field">
                <label className="rm-label">Capacity <span className="rm-req">*</span></label>
                <input
                  className={`rm-input ${touched.capacity && formErrors.capacity ? 'rm-input-error' : ''}`}
                  type="number" min="0"
                  value={formState.capacity}
                  onChange={onFormChange('capacity')}
                  onBlur={() => touch('capacity')}
                  placeholder="e.g. 50"
                />
                {touched.capacity && formErrors.capacity && <span className="rm-err-msg">{formErrors.capacity}</span>}
              </div>

              <div className="rm-field">
                <label className="rm-label">Status</label>
                <select className="rm-select" value={formState.status} onChange={onFormChange('status')}>
                  {RESOURCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Section: Photo */}
            <div className="rm-section-label">Resource Photo</div>
            <div className="rm-photo-row">
              <div className="rm-photo-upload">
                <label className="rm-label">Upload Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="rm-file-input"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <p className="rm-hint">JPG, PNG or WEBP · max 15 MB</p>
              </div>
              <div className="rm-photo-preview">
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <span className="rm-no-img">📷 No image</span>}
              </div>
            </div>

            {/* Section: Location */}
            <div className="rm-section-label">Location</div>
            <div className="rm-grid-2">
              <div className="rm-field">
                <label className="rm-label">Building Name <span className="rm-req">*</span></label>
                <input
                  className={`rm-input ${touched.buildingName && formErrors.buildingName ? 'rm-input-error' : ''}`}
                  value={formState.location.buildingName}
                  onChange={onLocationChange('buildingName')}
                  onBlur={() => touch('buildingName')}
                  placeholder="e.g. Engineering Block"
                />
                {touched.buildingName && formErrors.buildingName && <span className="rm-err-msg">{formErrors.buildingName}</span>}
              </div>

              <div className="rm-field">
                <label className="rm-label">Floor Number</label>
                <input className="rm-input" value={formState.location.floorNumber}
                  onChange={onLocationChange('floorNumber')} placeholder="e.g. 2" />
              </div>

              <div className="rm-field">
                <label className="rm-label">Room Number</label>
                <input className="rm-input" value={formState.location.roomNumber}
                  onChange={onLocationChange('roomNumber')} placeholder="e.g. 204" />
              </div>

              <div className="rm-field">
                <label className="rm-label">Location Notes</label>
                <input className="rm-input" value={formState.location.description}
                  onChange={onLocationChange('description')} placeholder="e.g. Near main entrance" />
              </div>
            </div>

            {/* Section: Availability */}
            <div className="rm-section-label-row">
              <span className="rm-section-label" style={{ margin: 0 }}>Availability Windows</span>
              <button type="button" className="rm-btn rm-btn-ghost rm-btn-sm" onClick={addWindow}>+ Add Window</button>
            </div>
            {formErrors.windows && <div className="rm-alert rm-alert-error" style={{ marginBottom: 8 }}>{formErrors.windows}</div>}
            <div className="rm-windows">
              {formState.availabilityWindows.map((w, idx) => (
                <div className="rm-window-row" key={`${w.id ?? 'new'}-${idx}`}>
                  <select className="rm-select" value={w.dayOfWeek} onChange={onWindowChange(idx, 'dayOfWeek')}>
                    {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="rm-time-group">
                    <label className="rm-time-label">From</label>
                    <input type="time" className="rm-input" value={w.startTime} onChange={onWindowChange(idx, 'startTime')} />
                  </div>
                  <div className="rm-time-group">
                    <label className="rm-time-label">To</label>
                    <input type="time" className="rm-input" value={w.endTime} onChange={onWindowChange(idx, 'endTime')} />
                  </div>
                  <button
                    type="button"
                    className="rm-btn rm-btn-danger-ghost rm-btn-sm"
                    onClick={() => removeWindow(idx)}
                    disabled={formState.availabilityWindows.length <= 1}
                  >✕</button>
                </div>
              ))}
            </div>

            {/* Submit — bottom of form */}
            <div className="rm-form-footer">
              {editingId && (
                <button type="button" className="rm-btn rm-btn-ghost" onClick={cancelEdit}>Cancel</button>
              )}
              <button type="submit" className="rm-btn rm-btn-primary rm-btn-wide" disabled={isSaving}>
                {isSaving ? (
                  <><span className="rm-btn-spinner" /> Saving…</>
                ) : editingId ? '✓ Update Resource' : '✓ Create Resource'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Table ── */}
        <div className="rm-panel">
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>All Resources</h2>
          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead>
                <tr>
                  <th>ID</th>
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
                  <tr><td colSpan={7} className="rm-td-center">Loading…</td></tr>
                ) : resources.length === 0 ? (
                  <tr><td colSpan={7} className="rm-td-center">No resources found.</td></tr>
                ) : resources.map((item) => (
                  <tr key={String(item.id)}>
                    <td className="rm-td-muted">#{item.id}</td>
                    <td className="rm-td-bold">{item.name || '—'}</td>
                    <td><span className="rm-type-tag">{(item.type || '').replace(/_/g, ' ')}</span></td>
                    <td className="rm-td-muted">
                      {item.location?.buildingName || '—'}
                      {item.location?.roomNumber ? ` · ${item.location.roomNumber}` : ''}
                    </td>
                    <td>{item.capacity ?? '—'}</td>
                    <td>
                      <span className={`rm-status rm-status-${String(item.status || '').toLowerCase()}`}>
                        {(item.status || 'UNKNOWN').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="rm-btn-group">
                        <button type="button" className="rm-btn rm-btn-ghost rm-btn-sm" onClick={() => startEdit(item)}>Edit</button>
                        <button type="button" className="rm-btn rm-btn-danger rm-btn-sm" onClick={() => handleDelete(item)} disabled={isSaving}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ResourceManagementPage;
