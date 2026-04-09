const TOKEN_KEY = 'smart-campus.auth.token';
const USER_KEY = 'smart-campus.auth.user';

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  return readJson(USER_KEY);
}

export function setAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function normalizeRole(role) {
  if (!role) {
    return '';
  }

  return String(role).replace(/^ROLE_/, '').toUpperCase();
}

export function hasAnyRole(user, roles) {
  if (!user || !Array.isArray(roles) || roles.length === 0) {
    return false;
  }

  const userRoles = Array.isArray(user.roles)
    ? user.roles.map(normalizeRole)
    : [];
  const allowed = roles.map(normalizeRole);

  return allowed.some((role) => userRoles.includes(role));
}

