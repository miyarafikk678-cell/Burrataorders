import { adminLogin, getOrders, createOrder, resendOrder } from './api.js';
import { el, fmtOrder } from './app.js';
import { io } from 'https://cdn.socket.io/4.7.0/socket.io.esm.min.js';

// UI
const loginSection = el('login-section');
const sidebar = el('sidebar');
const ordersSection = el('orders-section');
const ordersList = el('orders-list');

let adminToken = null;
let socket = null;

el('admin-login').addEventListener('click', async () => {
  const username = el('admin-username').value;
  const password = el('admin-password').value;
  const res = await adminLogin(username, password);
  if (res.ok && res.token) {
    adminToken = res.token;
    loginSection.style.display = 'none';
    sidebar.style.display = 'block';
    ordersSection.style.display = 'block';
    startSocket();
    loadOrders();
  } else {
    el('login-result').innerText = 'Login failed';
  }
});

el('refresh-orders').addEventListener('click', loadOrders);

el('create-order').addEventListener('click', async () => {
  const username = el('create-username').value.trim();
  const item = el('create-item').value.trim();
  const qty = Number(el('create-qty').value) || 1;
  if (!username || !item) return alert('username and item required');

  // find user by fetching all orders and looking up or instruct to use user-login first
  // For simplicity: ask backend to create an order by first retrieving all users (we don't have users endpoint)
  // Instead: ask user to log in first and use that userId. Quick approach: fetch all orders and find user.
  const all = await getOrders();
  const user = all.orders.find(o => o.userId && o.userId.username === username);
  if (!user) return alert('User not found — ask user to login once first');
  const payload = { userId: user.userId._id, items: [{ name: item, qty }] };
  const created = await createOrder(payload);
  if (created.ok) {
    alert('Order created');
    loadOrders();
  } else alert('Create failed');
});

async function loadOrders() {
  const res = await getOrders();
  ordersList.innerHTML = '';
  if (res.ok) {
    for (const o of res.orders) {
      const d = document.createElement('div');
      d.className = 'order';
      d.innerHTML = `<strong>${o.userId?.username || 'unknown'}</strong><div>${fmtOrder(o)}</div>
        <button data-id="${o._id}" class="resend">Resend</button>`;
      ordersList.appendChild(d);
    }
    document.querySelectorAll('.resend').forEach(btn => btn.addEventListener('click', async ev => {
      const id = ev.target.dataset.id;
      if (!confirm('Resend this order to user?')) return;
      const r = await resendOrder(id, adminToken);
      if (r.ok) loadOrders();
      else alert('Resend failed');
    }));
  }
}

function startSocket() {
  if (socket) socket.disconnect();
  // connect to backend (same origin as API_BASE)
  import('./config.js').then(m => {
    const url = m.API_BASE.replace(/\/$/, '');
    socket = io(url, { transports: ['websocket','polling'] });
    socket.on('connect', () => console.log('socket connected'));
    socket.on('orderUpdated', payload => {
      // simple update: reload
      loadOrders();
    });
  });
}
