const mongoose = require('mongoose');


/** 
 * Variant Schema
 */
const variantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  featuredImage: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  attributes: [{
    key: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    }
  }]
});


/**
 * Product schema 
 */
const productSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  featuredImage: {
    type: String,
  },
  variants: {
    type: [variantSchema],
    required: true,
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;