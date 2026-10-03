const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'nyaya-ai',
    algorithm: 'HS256',
  });

async function register({ name, email, password, role }) {
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists', { field: 'email' });
  // Bootstrap: the very first account becomes admin so the system is manageable.
  const isFirst = (await User.estimatedDocumentCount()) === 0;
  const user = await User.create({ name, email, password, role: isFirst ? 'admin' : role || 'analyst' });
  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email / wrong password to avoid account enumeration.
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  return { user, token: signToken(user) };
}

async function listUsers() {
  return User.find().sort({ createdAt: -1 }).lean();
}

async function updateRole(id, role, actingUser) {
  if (actingUser._id.equals(id) && role !== 'admin') throw ApiError.badRequest('You cannot remove your own admin role');
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

module.exports = { register, login, listUsers, updateRole, signToken };
