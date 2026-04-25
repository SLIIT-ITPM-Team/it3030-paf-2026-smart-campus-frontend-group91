import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api/api';
import './AdminDashboard.css';

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
  const navigate = useNavigate();
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

      <div className="adash-wrap">
        <header className="adash-hero">
          <p className="adash-kicker">Smart Campus Hub — Admin Control</p>
          <h1>Campus User Management</h1>
          <p>
            Manage user accounts from a single control panel with quick role updates and safe account
            removal actions.
          </p>
          <div className="adash-meta-row">
            <span className="adash-pill">Signed in as: {adminName}</span>
            <span className="adash-pill">Total Users: {users.length}</span>
            <span className="adash-pill">Admin Access Enabled</span>
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
                <button
                  type="button"
                  className="adash-btn adash-btn-outline"
                  onClick={() => navigate('/admin/resources')}
                >
                  Resource Management
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
