import { API_BASE } from './config.js';

async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);
  return res.json();
}

async function adminLogin(username, password) {
  return apiFetch('/api/auth/admin/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ username, password })
  });
}

async function userLogin(username) {
  return apiFetch('/api/auth/user/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ username })
  });
}

async function getOrders(userId) {
  const q = userId ? `?userId=${userId}` : '';
  return apiFetch(`/api/orders${q}`);
}

async function createOrder(payload) {
  return apiFetch('/api/orders', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
}

async function resendOrder(orderId, token) {
  return apiFetch(`/api/orders/${orderId}/resend`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}
  });
}

async function markReceived(orderId) {
  return apiFetch(`/api/orders/${orderId}/received`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'}
  });
}

export { adminLogin, userLogin, getOrders, createOrder, resendOrder, markReceived };
