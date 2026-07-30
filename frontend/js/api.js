/* Shared API client + small utilities used across all pages. */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('ledger_token');
}
function setSession(token, user) {
  localStorage.setItem('ledger_token', token);
  localStorage.setItem('ledger_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('ledger_token');
  localStorage.removeItem('ledger_user');
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('ledger_user')); } catch { return null; }
}

/** Redirects to login if there is no token. Call at the top of every protected page. */
function requireSession() {
  if (!getToken()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

/**
 * Wrapper around fetch() that attaches the JWT and parses JSON.
 * For file uploads, pass a FormData body and it will skip the JSON content-type header.
 */
async function api(path, { method = 'GET', body = null, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : undefined)
  });

  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  if (res.status === 401) {
    clearSession();
    window.location.href = '/index.html';
    throw new Error(data.error || 'Session expired.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

/* ---------- formatting helpers ---------- */

function formatMoney(value) {
  const n = Number(value || 0);
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}

function formatDateTime(value) {
  const d = new Date(value.replace ? value.replace(' ', 'T') : value);
  if (isNaN(d)) return value;
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------- toast ---------- */

function toast(message, type = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `toast show ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ---------- query params ---------- */

function qsParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
