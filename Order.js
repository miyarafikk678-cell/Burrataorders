const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: String,
  qty: { type: Number, default: 1 }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [ItemSchema],
  status: { type: String, enum: ['sent','received'], default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
