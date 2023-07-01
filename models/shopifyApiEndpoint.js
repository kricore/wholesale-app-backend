const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

/**
 * shopifyApiEndpoint Model
 */
const shopifyApiEndpointSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    unique: true,
  },
  lastTimestamp: {
    type: Number,
    required: true,
  },
}, { collection: 'shopifyApiEndpoints' });

const shopifyApiEndpoint = mongoose.model('shopifyApiEndpoint', shopifyApiEndpointSchema);

module.exports = shopifyApiEndpoint;