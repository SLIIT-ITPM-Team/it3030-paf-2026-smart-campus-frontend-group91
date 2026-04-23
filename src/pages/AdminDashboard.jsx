import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';

const ROLE_OPTIONS = ['USER', 'TECHNICIAN', 'ADMIN'];

const extractErrorMessage = (error, fallback) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return typeof message === 'string' && message.trim() ? message : fallback;
};

const mapUserFromApi = (item) => {
  const role = item?.role || item?.roles?.[0] || 'USER';
  const userId = item?.id ?? item?.userId;
  const fallbackKey = item?.username ?? item?.email ?? 'unknown-user';

  return {
    id: userId == null ? '' : String(userId),
    rowKey: String(userId ?? fallbackKey),
    username: item?.username || item?.name || '',
    email: item?.email || '',
    role: String(role).toUpperCase(),
  };
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [tableError, setTableError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingUserId, setEditingUserId] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');

  const adminName = useMemo(() => {
    return user?.name || user?.fullName || user?.username || user?.email || 'Administrator';
  }, [user]);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setTableError('');

    try {
      const response = await api.get('/admin/users');
      const payload = Array.isArray(response?.data) ? response.data : [];
      setUsers(payload.map(mapUserFromApi));
      setEditingUserId('');
      setDraftRole('');
    } catch (error) {
      setTableError(extractErrorMessage(error, 'Unable to load users from backend.'));
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const startRoleEdit = (item) => {
    setActionError('');
    setActionMessage('');
    setEditingUserId(item.id);
    setDraftRole(item.role);
  };

  const cancelRoleEdit = () => {
    setEditingUserId('');
    setDraftRole('');
  };

  const updateUserRole = async (item) => {
    if (!item.id) {
      return;
    }

    if (!draftRole || draftRole === item.role) {
      cancelRoleEdit();
      return;
    }

    setUpdatingUserId(item.id);
    setActionError('');
    setActionMessage('');

    try {
      const response = await api.patch(`/admin/users/${item.id}/role`, { role: draftRole });
      const updatedUser = mapUserFromApi(response?.data ?? { ...item, role: draftRole });

      setUsers((prev) => prev.map((userItem) => (userItem.id === item.id ? updatedUser : userItem)));
      setActionMessage(`Role updated for "${updatedUser.username}".`);
      cancelRoleEdit();
    } catch (error) {
      setActionError(extractErrorMessage(error, 'Unable to update role.'));
    } finally {
      setUpdatingUserId('');
    }
  };

  const deleteUser = async (item) => {
    if (!item.id) {
      return;
    }

    const shouldDelete = window.confirm(`Delete user "${item.username}"?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingUserId(item.id);
    setActionError('');
    setActionMessage('');

    try {
      await api.delete(`/admin/users/${item.id}`);
      setUsers((prev) => prev.filter((userItem) => userItem.id !== item.id));

      if (editingUserId === item.id) {
        cancelRoleEdit();
      }

      setActionMessage(`User "${item.username}" deleted successfully.`);
    } catch (error) {
      setActionError(extractErrorMessage(error, 'Unable to delete user.'));
    } finally {
      setDeletingUserId('');
    }
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
            grid-template-columns: 1fr;
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

          .adash-btn-sm {
            padding: 6px 10px;
            font-size: 13px;
            border-radius: 8px;
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

          .adash-message-error {
            border-color: rgba(239, 68, 68, 0.35);
            background: rgba(254, 226, 226, 0.75);
            color: #b91c1c;
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

          .adash-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
          }

          .adash-select-inline {
            min-width: 140px;
            padding: 6px 8px;
            font-size: 13px;
          }

          .adash-btn-delete {
            border-color: rgba(220, 38, 38, 0.3);
            color: #b91c1c;
            background: #ffffff;
          }

          .adash-btn-delete:hover {
            border-color: rgba(185, 28, 28, 0.55);
            background: #fef2f2;
            color: #991b1b;
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
            Manage user accounts from a single control panel with quick role updates and safe account
            removal actions.
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
                <p className="adash-sub">Search, update roles, and remove user accounts.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="adash-btn adash-btn-outline" onClick={loadUsers}>
                  Refresh
                </button>
              </div>
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
            {tableError ? <div className="adash-message adash-message-error">{tableError}</div> : null}
            {actionError ? <div className="adash-message adash-message-error">{actionError}</div> : null}
            {actionMessage ? <div className="adash-message">{actionMessage}</div> : null}

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
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={4} className="adash-empty">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="adash-empty">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => (
                      <tr key={item.rowKey}>
                        <td>{item.username}</td>
                        <td>{item.email}</td>
                        <td>
                          <span className="adash-role">{item.role}</span>
                        </td>
                        <td>
                          {editingUserId === item.id ? (
                            <div className="adash-actions">
                              <select
                                className="adash-select adash-select-inline"
                                value={draftRole}
                                onChange={(event) => setDraftRole(event.target.value)}
                                disabled={updatingUserId === item.id}
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="adash-btn adash-btn-sm"
                                onClick={() => updateUserRole(item)}
                                disabled={updatingUserId === item.id}
                              >
                                {updatingUserId === item.id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="adash-btn adash-btn-outline adash-btn-sm"
                                onClick={cancelRoleEdit}
                                disabled={updatingUserId === item.id}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="adash-actions">
                              <button
                                type="button"
                                className="adash-btn adash-btn-outline adash-btn-sm"
                                onClick={() => startRoleEdit(item)}
                                disabled={Boolean(updatingUserId || deletingUserId) || !item.id}
                              >
                                Edit Role
                              </button>
                              <button
                                type="button"
                                className="adash-btn adash-btn-sm adash-btn-delete"
                                onClick={() => deleteUser(item)}
                                disabled={deletingUserId === item.id || Boolean(updatingUserId) || !item.id}
                              >
                                {deletingUserId === item.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
};

export default AdminDashboard;
