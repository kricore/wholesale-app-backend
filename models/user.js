const mongoose = require('mongoose');

/**
 * Basic use schema which contains
 * a user and a password
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  level: {
    type: String,
    enum: ['USER', 'ADMIN'],
    required: false,
    unique: false
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;