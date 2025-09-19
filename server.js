require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cheesy';

async function start() {
  await mongoose.connect(MONGODB_URI, {});

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: '*' }
  });

  app.use(cors());
  app.use(express.json());

  // attach io to app so routes can use it
  app.set('io', io);

  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);

  // socket handling: map userId -> room (use room with userId)
  io.on('connection', (socket) => {
    // client should emit "register" with userId
    socket.on('register', (payload) => {
      const { userId } = payload || {};
      if (userId) {
        socket.join(String(userId)); // room per user for private pushes
      }
    });

    socket.on('disconnect', () => {});
  });

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server', err);
});
