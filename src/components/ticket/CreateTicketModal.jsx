import { useState, useEffect } from 'react';
import api from '../../api/api';
import resourceService from '../../services/resourceService';
import './CreateTicketModal.css';

const CreateTicketModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    resourceId: '',
    category: '',
    priority: 'MEDIUM',
    contactDetails: '',
    description: ''
  });
  const [resources, setResources] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    resourceService.getResources().then(setResources).catch(() => {});
  }, []);

  const categories = ['Hardware', 'Software', 'Network', 'Facility', 'Other'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 3) {
        alert("Maximum 3 images allowed");
        return;
      }
      const areAllImages = selectedFiles.every(f => f.type.startsWith('image/'));
      if (!areAllImages) {
        alert("Only image files are allowed");
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const data = new FormData();

      const payload = {
        ...formData,
        resourceId: formData.resourceId !== '' ? parseInt(formData.resourceId, 10) : null,
      };
      const ticketBlob = new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      });
      data.append('ticket', ticketBlob);

      files.forEach(file => {
        data.append('files', file);
      });

      await api.post('/tickets', data);

      onCreated();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit ticket. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Create New Ticket</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select name="category" className="input-field" value={formData.category} onChange={handleInputChange} required>
                <option value="" disabled>Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority *</label>
              <select name="priority" className="input-field" value={formData.priority} onChange={handleInputChange} required>
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Resource</label>
            <select name="resourceId" className="input-field" value={formData.resourceId} onChange={handleInputChange}>
              <option value="">Select Resource (optional)</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.resourceName}{r.location ? ` — ${r.location}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Contact Details *</label>
            <input type="text" name="contactDetails" className="input-field" placeholder="Phone number or alternate email"
                   value={formData.contactDetails} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" className="input-field t-area" rows="4" placeholder="Describe the issue in detail"
                      value={formData.description} onChange={handleInputChange} required></textarea>
          </div>

          <div className="form-group">
            <label>Attachments (Max 3 Images)</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="file-input" />
            <div className="file-count">
              {files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(254,226,226,0.85)',
              border: '1px solid rgba(220,38,38,0.25)',
              color: '#b91c1c',
              fontSize: '13px',
              marginTop: '4px'
            }}>
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
