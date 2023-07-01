const { Schema, model } = require('mongoose');

// Mongoose schema for Order
const orderSchema = new Schema({
  user: { type: String, required: true },
  productTitle: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  userId: { type: String, required: true },
  price: { type: Number, required: true }
});

// Mongoose schema for OrdersPayload
const ordersSchema = new Schema({
  items: { type: [orderSchema], required: true },
  totalItems: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  datePlaced: { type: Number, required: true },
  user: { type: String, required: true }
});

// Mongoose model for Orders
const Order = model('Order', ordersSchema);

module.exports = Order;

