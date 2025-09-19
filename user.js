import { userLogin, createOrder, getOrders, markReceived } from './api.js';
import { el, fmtOrder } from './app.js';
import { io } from 'https://cdn.socket.io/4.7.0/socket.io.esm.min.js';

let me = null;
let socket = null;

el('user-login').addEventListener('click', async () => {
  const username = el('username').value.trim();
  if (!username) return alert('enter name');
  const r = await userLogin(username);
  if (r.ok && r.user) {
    me = r.user;
    localStorage.setItem('cheesy_user', JSON.stringify(me));
    document.getElementById('login').style.display = 'none';
    document.getElementById('place-order').style.display = 'block';
    startSocket();
    loadMyOrders();
  } else alert('Login failed');
});

el('place').addEventListener('click', async () => {
  const name = el('item-name').value.trim();
  const qty = Number(el('item-qty').value) || 1;
  if (!name || !me) return alert('login and enter item');
  const payload = { userId: me._id, items: [{ name, qty }] };
  const r = await createOrder(payload);
  if (r.ok) {
    el('item-name').value = '';
    loadMyOrders();
  } else alert('Failed to create order');
});

async function loadMyOrders() {
  if (!me) return;
  const r = await getOrders(me._id);
  const d = el('my-orders');
  d.innerHTML = '';
  if (r.ok) {
    r.orders.forEach(o => {
      const div = document.createElement('div');
      div.className = 'order';
      div.innerHTML = `<div>${fmtOrder(o)}</div>
        ${o.status !== 'received' ? `<button data-id="${o._id}" class="received-btn">Mark Received</button>` : ''}`;
      d.appendChild(div);
    });
    document.querySelectorAll('.received-btn').forEach(b => b.addEventListener('click', async ev => {
      const id = ev.target.dataset.id;
      await markReceived(id);
      loadMyOrders();
    }));
  }
}

function startSocket() {
  import('./config.js').then(m => {
    const url = m.API_BASE.replace(/\\$/, '');
    socket = io(url, { transports: ['websocket','polling'] });
    socket.on('connect', () => {
      socket.emit('register', { userId: me._id });
    });
    socket.on('orderUpdated', payload => {
      // if payload concerns this user, reload
      loadMyOrders();
    });
  });
}

// try to auto login from localStorage
const prev = localStorage.getItem('cheesy_user');
if (prev) {
  try {
    me = JSON.parse(prev);
    document.getElementById('login').style.display = 'none';
    document.getElementById('place-order').style.display = 'block';
    startSocket();
    loadMyOrders();
  } catch(e){}
}
