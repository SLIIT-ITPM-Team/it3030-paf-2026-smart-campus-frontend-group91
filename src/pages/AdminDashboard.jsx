import { useState } from 'react';

const ROLE_OPTIONS = ['USER', 'TECHNICIAN'];
const INITIAL_FORM = {
  username: '',
  email: '',
  role: '',
};

const AdminDashboard = () => {
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const onToggleAddUserForm = () => {
    setShowAddUserForm((prev) => !prev);
    setErrors({});
    setForm(INITIAL_FORM);
  };

  const onFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedEmail = form.email.trim();

    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.role) {
      nextErrors.role = 'Role is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const nextUser = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    setUsers((prev) => [nextUser, ...prev]);
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const onReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const onDelete = (userId, username) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${username}"?`,
    );

    if (!confirmed) {
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  return (
    <main className="landing-main" style={{ paddingTop: '24px', textAlign: 'left' }}>
      <section
        className="landing-hero fade-in bg-white border border-blue-100 rounded-2xl shadow-sm"
        style={{ maxWidth: '1160px' }}
      >
        <p className="landing-kicker text-blue-600">Admin Dashboard</p>
        <h2 style={{ margin: '10px 0 8px', color: '#1d4ed8' }}>User Management</h2>
        <p className="landing-subtitle" style={{ maxWidth: '70ch' }}>
          Manage platform users from a single place. Add users with roles and remove
          users when needed.
        </p>
      </section>

      <section className="landing-section" style={{ marginTop: '16px' }}>
        <div
          className="landing-card bg-white border border-blue-100 rounded-2xl shadow-sm"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#0f172a' }}>Admin Actions</h3>
            <p style={{ marginTop: '6px', color: '#475569' }}>
              Use the add-user panel to create a new user entry.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleAddUserForm}
            className="login-btn login-btn-primary"
            style={{ minWidth: '140px' }}
          >
            {showAddUserForm ? 'Close Form' : 'Add User'}
          </button>
        </div>
      </section>

      {showAddUserForm ? (
        <section className="landing-section" style={{ marginTop: '16px' }}>
          <div className="landing-card slide-up bg-white border border-blue-100 rounded-2xl shadow-sm">
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1d4ed8' }}>
              Add New User
            </h3>

            <form onSubmit={onSubmit} noValidate>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                <label className="auth-field" htmlFor="admin-username">
                  Username
                  <div className="auth-input-wrap">
                    <input
                      id="admin-username"
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={onFieldChange}
                      placeholder="Enter username"
                    />
                  </div>
                  {errors.username ? (
                    <span className="field-error">{errors.username}</span>
                  ) : null}
                </label>

                <label className="auth-field" htmlFor="admin-email">
                  Gmail / Email
                  <div className="auth-input-wrap">
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onFieldChange}
                      placeholder="Enter email"
                    />
                  </div>
                  {errors.email ? <span className="field-error">{errors.email}</span> : null}
                </label>

                <label className="auth-field" htmlFor="admin-role">
                  Role
                  <div className="auth-input-wrap">
                    <select
                      id="admin-role"
                      name="role"
                      value={form.role}
                      onChange={onFieldChange}
                      className="auth-select"
                    >
                      <option value="">Select role</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.role ? <span className="field-error">{errors.role}</span> : null}
                </label>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" className="login-submit-btn" style={{ width: 'auto' }}>
                  Add User
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="login-google-btn"
                  style={{ width: 'auto' }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="landing-section" style={{ marginTop: '16px' }}>
        <div className="landing-card bg-white border border-blue-100 rounded-2xl shadow-sm">
          <h3 style={{ marginTop: 0, marginBottom: '14px', color: '#0f172a' }}>Users</h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
              <thead>
                <tr style={{ background: '#eff6ff' }}>
                  <th style={headerCellStyle}>Username</th>
                  <th style={headerCellStyle}>Gmail / Email</th>
                  <th style={headerCellStyle}>Role</th>
                  <th style={headerCellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={emptyCellStyle}>
                      No users added yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #dbeafe' }}>
                      <td style={bodyCellStyle}>{user.username}</td>
                      <td style={bodyCellStyle}>{user.email}</td>
                      <td style={bodyCellStyle}>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            fontWeight: 600,
                            fontSize: '12px',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={bodyCellStyle}>
                        <button
                          type="button"
                          onClick={() => onDelete(user.id, user.username)}
                          className="login-google-btn"
                          style={{
                            width: 'auto',
                            borderColor: '#bfdbfe',
                            color: '#1d4ed8',
                            padding: '8px 12px',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};

const headerCellStyle = {
  textAlign: 'left',
  padding: '12px',
  color: '#1e3a8a',
  fontSize: '14px',
  borderBottom: '1px solid #dbeafe',
};

const bodyCellStyle = {
  textAlign: 'left',
  padding: '12px',
  color: '#0f172a',
  fontSize: '14px',
};

const emptyCellStyle = {
  textAlign: 'center',
  padding: '20px 12px',
  color: '#64748b',
  fontSize: '14px',
};

export default AdminDashboard;
