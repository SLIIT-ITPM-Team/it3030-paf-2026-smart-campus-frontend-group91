import api, { API_BASE_URL } from './api';
import { getStoredUser, setAuthSession } from '../auth/authStorage';

const API_ORIGIN = new URL(API_BASE_URL).origin;

function extractToken(payload) {
  return (
    payload?.accessToken ||
    payload?.token ||
    payload?.jwt ||
    payload?.data?.accessToken ||
    payload?.data?.token ||
    null
  );
}

function extractUser(payload) {
  return payload?.user || payload?.data?.user || null;
}

export async function loginWithEmailPassword(credentials) {
  const response = await api.post('/auth/login', credentials, {
    skipAuthRedirect: true,
  });
  const token = extractToken(response.data);

  if (!token) {
    throw new Error('Login response did not include an access token.');
  }

  const user = extractUser(response.data);
  setAuthSession({ token, user });

  return { token, user };
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload, {
    skipAuthRedirect: true,
  });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data?.user || response.data;
}

export async function logoutRequest() {
  try {
    await api.post('/auth/logout', {}, { skipAuthRedirect: true });
  } catch (error) {
    // Ignore API logout failure and clear local session anyway.
  }
}

export function startGoogleSignIn() {
  window.location.assign(`${API_ORIGIN}/oauth2/authorization/google`);
}

export function restoreTokenFromCallback(token) {
  setAuthSession({
    token,
    user: getStoredUser(),
  });
}

export function authErrorMessage(error) {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data;

  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  if (error?.response?.status === 401) {
    return 'Invalid username or password.';
  }

  return 'Unable to sign in right now. Please try again.';
}
