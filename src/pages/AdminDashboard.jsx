import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const ROLE_OPTIONS = ['USER', 'TECHNICIAN', 'ADMIN'];

const INITIAL_FORM = {
  username: '',
  email: '',
  role: '',
};

const INITIAL_USERS = [
  { id: 'USR-001', username: 'john.smith', email: 'john@smartcampus.edu', role: 'USER' },
  { id: 'USR-002', username: 'nethmi.tech', email: 'nethmi@smartcampus.edu', role: 'TECHNICIAN' },
  { id: 'USR-003', username: 'admin.main', email: 'admin@smartcampus.edu', role: 'ADMIN' },
];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState(INITIAL_USERS);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const adminName = useMemo(() => {
    return user?.name || user?.fullName || user?.username || user?.email || 'Administrator';
  }, [user]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return users;
    }

    return users.filter((item) =>
      `${item.username} ${item.email} ${item.role}`.toLowerCase().includes(keyword),
    );
  }, [users, searchTerm]);

  const roleBreakdown = useMemo(() => {
    return ROLE_OPTIONS.reduce((acc, role) => {
      acc[role] = users.filter((item) => item.role === role).length;
      return acc;
    }, {});
  }, [users]);

  const openAddPanel = () => {
    setShowAddPanel(true);
    setErrors({});
    setMessage('');
  };

  const closeAddPanel = () => {
    setShowAddPanel(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setMessage('');
  };

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  const validateForm = () => {
    const nextErrors = {};
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();

    if (!username) {
      nextErrors.username = 'Username is required.';
    }

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email.';
    } else if (users.some((item) => item.email.toLowerCase() === email)) {
      nextErrors.email = 'This email is already in the table.';
    }

    if (!form.role) {
      nextErrors.role = 'Role is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onAddUser = (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    const nextUser = {
      id: createId(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    };

    setUsers((prev) => [nextUser, ...prev]);
    setForm(INITIAL_FORM);
    setErrors({});
    setMessage(`User "${nextUser.username}" added successfully.`);
  };

  const onRemoveUser = (userId) => {
    setUsers((prev) => prev.filter((item) => item.id !== userId));
    setMessage('User removed from the table.');
  };

  return (
    <section className="adash-root">
      <style>
        {`
          .adash-root {
            min-height: calc(100svh - 82px);
            padding: 24px 20px 36px;
            color: #020617;
            text-align: left;
            background:
              radial-gradient(circle at 90% -12%, rgba(37, 99, 235, 0.2) 0%, transparent 52%),
              radial-gradient(circle at 8% 110%, rgba(37, 99, 235, 0.12) 0%, transparent 48%),
              #ffffff;
          }

          .adash-wrap {
            width: min(1140px, 100%);
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .adash-hero {
            border: 1px solid rgba(2, 6, 23, 0.12);
            border-radius: 18px;
            padding: 24px;
            background: linear-gradient(150deg, #ffffff 0%, #eff6ff 100%);
            box-shadow: 0 18px 34px rgba(2, 6, 23, 0.08);
            animation: adashFade 0.45s ease both;
          }

          .adash-kicker {
            margin: 0;
            color: #2563eb;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .adash-hero h1 {
            margin: 8px 0 10px;
            line-height: 1.08;
            font-size: clamp(30px, 4vw, 44px);
            color: #020617;
          }

          .adash-hero p {
            margin: 0;
            max-width: 75ch;
            color: #0f172a;
          }

          .adash-meta-row {
            margin-top: 14px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .adash-pill {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            border: 1px solid rgba(37, 99, 235, 0.3);
            background: rgba(37, 99, 235, 0.09);
            color: #1e3a8a;
            font-size: 13px;
            font-weight: 600;
            padding: 7px 14px;
          }

          .adash-summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .adash-stat {
            border: 1px solid rgba(2, 6, 23, 0.12);
            border-radius: 12px;
            padding: 12px;
            background: #ffffff;
            box-shadow: 0 8px 22px rgba(2, 6, 23, 0.05);
          }

          .adash-stat h3 {
            margin: 0;
            font-size: 13px;
            color: #1d4ed8;
          }

          .adash-stat strong {
            margin-top: 6px;
            display: block;
            font-size: 28px;
            color: #020617;
            line-height: 1.1;
          }

          .adash-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
            gap: 14px;
          }

          .adash-card {
            border: 1px solid rgba(2, 6, 23, 0.12);
            border-radius: 14px;
            padding: 18px;
            background: #ffffff;
            box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
            animation: adashSlide 0.5s ease both;
          }

          .adash-card h2 {
            margin: 0 0 10px;
            color: #020617;
            font-size: 21px;
          }

          .adash-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
          }

          .adash-sub {
            margin: 0;
            color: #334155;
            font-size: 14px;
          }

          .adash-input,
          .adash-select {
            width: 100%;
            border: 1px solid rgba(2, 6, 23, 0.2);
            border-radius: 10px;
            background: #ffffff;
            color: #020617;
            font: inherit;
            padding: 10px;
            box-sizing: border-box;
          }

          .adash-input:focus,
          .adash-select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
          }

          .adash-btn {
            border: 1px solid #2563eb;
            border-radius: 10px;
            background: #2563eb;
            color: #ffffff;
            padding: 10px 14px;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .adash-btn:hover {
            background: #1d4ed8;
            border-color: #1d4ed8;
          }

          .adash-btn-outline {
            background: #ffffff;
            color: #0f172a;
            border-color: rgba(2, 6, 23, 0.24);
          }

          .adash-btn-outline:hover {
            border-color: #020617;
            background: #f8fafc;
          }

          .adash-btn-danger {
            background: #0f172a;
            border-color: #0f172a;
            color: #ffffff;
          }

          .adash-btn-danger:hover {
            background: #000000;
            border-color: #000000;
          }

          .adash-form {
            margin-top: 12px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .adash-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
          }

          .adash-error {
            color: #000000;
            font-size: 12px;
            font-weight: 500;
          }

          .adash-message {
            margin-top: 10px;
            border: 1px solid rgba(37, 99, 235, 0.35);
            border-radius: 10px;
            background: rgba(219, 234, 254, 0.68);
            color: #1e40af;
            padding: 10px 12px;
            font-size: 14px;
          }

          .adash-table-wrap {
            margin-top: 12px;
            overflow-x: auto;
          }

          .adash-table {
            width: 100%;
            min-width: 640px;
            border-collapse: collapse;
          }

          .adash-table th {
            text-align: left;
            background: #eff6ff;
            color: #1e3a8a;
            border-bottom: 1px solid #bfdbfe;
            font-size: 14px;
            padding: 12px;
          }

          .adash-table td {
            text-align: left;
            border-bottom: 1px solid #dbeafe;
            color: #020617;
            font-size: 14px;
            padding: 12px;
          }

          .adash-role {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            border: 1px solid rgba(37, 99, 235, 0.35);
            background: rgba(37, 99, 235, 0.1);
            color: #1e3a8a;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.3px;
            padding: 4px 10px;
          }

          .adash-empty {
            text-align: center;
            color: #334155;
            padding: 20px 12px;
            font-size: 14px;
          }

          @keyframes adashFade {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes adashSlide {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 980px) {
            .adash-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .adash-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px) {
            .adash-summary {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="adash-wrap">
        <header className="adash-hero">
          <p className="adash-kicker">Admin Dashboard</p>
          <h1>Campus User Management</h1>
          <p>
            Manage user accounts from a single control panel with a clean table view and quick user
            creation flow.
          </p>
          <div className="adash-meta-row">
            <span className="adash-pill">Signed in as: {adminName}</span>
            <span className="adash-pill">Admin access enabled</span>
          </div>
        </header>

        <section className="adash-summary">
          <article className="adash-stat">
            <h3>Total Users</h3>
            <strong>{users.length}</strong>
          </article>
          <article className="adash-stat">
            <h3>Users</h3>
            <strong>{roleBreakdown.USER}</strong>
          </article>
          <article className="adash-stat">
            <h3>Technicians</h3>
            <strong>{roleBreakdown.TECHNICIAN}</strong>
          </article>
          <article className="adash-stat">
            <h3>Admins</h3>
            <strong>{roleBreakdown.ADMIN}</strong>
          </article>
        </section>

        <section className="adash-grid">
          <article className="adash-card">
            <div className="adash-row">
              <div>
                <h2>User Table</h2>
                <p className="adash-sub">Search and review existing user accounts.</p>
              </div>
              <button type="button" className="adash-btn" onClick={openAddPanel}>
                Add User
              </button>
            </div>

            <div style={{ marginTop: '12px' }}>
              <input
                type="text"
                className="adash-input"
                placeholder="Search by username, email, role"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="adash-table-wrap">
              <table className="adash-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="adash-empty">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.username}</td>
                        <td>{item.email}</td>
                        <td>
                          <span className="adash-role">{item.role}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="adash-btn adash-btn-danger"
                            onClick={() => onRemoveUser(item.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="adash-card">
            <div className="adash-row">
              <h2>Add New User</h2>
              {showAddPanel ? (
                <button type="button" className="adash-btn adash-btn-outline" onClick={closeAddPanel}>
                  Close
                </button>
              ) : null}
            </div>
            <p className="adash-sub">
              Click the Add User button to open fields for username, email, and role.
            </p>

            {showAddPanel ? (
              <form className="adash-form" onSubmit={onAddUser} noValidate>
                <label className="adash-field" htmlFor="admin-username">
                  Username
                  <input
                    id="admin-username"
                    name="username"
                    type="text"
                    className="adash-input"
                    value={form.username}
                    onChange={onFieldChange}
                    placeholder="Enter username"
                  />
                  {errors.username ? <span className="adash-error">{errors.username}</span> : null}
                </label>

                <label className="adash-field" htmlFor="admin-email">
                  Email
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    className="adash-input"
                    value={form.email}
                    onChange={onFieldChange}
                    placeholder="Enter email"
                  />
                  {errors.email ? <span className="adash-error">{errors.email}</span> : null}
                </label>

                <label className="adash-field" htmlFor="admin-role">
                  Role
                  <select
                    id="admin-role"
                    name="role"
                    className="adash-select"
                    value={form.role}
                    onChange={onFieldChange}
                  >
                    <option value="">Select role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {errors.role ? <span className="adash-error">{errors.role}</span> : null}
                </label>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="submit" className="adash-btn">
                    Save User
                  </button>
                  <button
                    type="button"
                    className="adash-btn adash-btn-outline"
                    onClick={() => {
                      setForm(INITIAL_FORM);
                      setErrors({});
                      setMessage('');
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="adash-btn" onClick={openAddPanel}>
                  Add User
                </button>
              </div>
            )}

            {message ? <div className="adash-message">{message}</div> : null}
          </aside>
        </section>
      </div>
    </section>
  );
};

export default AdminDashboard;
