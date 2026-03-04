const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('bmj_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export async function apiRegister(data) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiLogin(email, password) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// ── User ──────────────────────────────────────────────────────
export async function apiGetMe() {
  return request('/api/users/me');
}

export async function apiUpdateMe(data) {
  return request('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiUploadPhoto(file) {
  const token = localStorage.getItem('bmj_token');
  const form = new FormData();
  form.append('photo', file);
  const res = await fetch(`${BASE}/api/users/me/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error('Photo upload failed');
  return res.json();
}

// ── Discover ──────────────────────────────────────────────────
export async function apiGetDiscover() {
  return request('/api/discover');
}

export async function apiChoose(profileId) {
  return request('/api/discover/choose', { method: 'POST', body: JSON.stringify({ profileId }) });
}

export async function apiGetNotifications() {
  return request('/api/discover/notifications');
}

export async function apiRespond(chooserId, accept) {
  return request('/api/discover/respond', { method: 'POST', body: JSON.stringify({ chooserId, accept }) });
}

export async function apiGetMatches() {
  return request('/api/discover/matches');
}

// ── Push ──────────────────────────────────────────────────────
export async function apiGetVapidKey() {
  return request('/api/push/vapid-public-key');
}

export async function apiSavePushSubscription(subscription) {
  return request('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) });
}

// ── Chat ──────────────────────────────────────────────────────
export async function apiGetMessages(matchId) {
  return request(`/api/chat/${matchId}`);
}

export async function apiSendMessage(matchId, text) {
  return request(`/api/chat/${matchId}`, { method: 'POST', body: JSON.stringify({ text }) });
}

export async function apiDateResponse(matchId, yes) {
  return request(`/api/chat/${matchId}/date-response`, { method: 'POST', body: JSON.stringify({ yes }) });
}

// —— Unmatch ———————————————————————————————————————————————————
export async function apiUnmatch(matchId) {
  return request(`/api/discover/matches/${matchId}`, { method: 'DELETE' });
}