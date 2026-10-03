const authService = require('../services/authService');
const { asyncHandler, sendSuccess } = require('../utils/http');

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.validated.body);
  sendSuccess(res, { status: 201, data: { user, token }, message: 'Registration successful' });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.validated.body);
  sendSuccess(res, { data: { user, token }, message: 'Login successful' });
});

// JWTs are stateless; the client discards its token. Endpoint exists for a uniform API & auditing.
exports.logout = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: {}, message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user }, message: 'Current user' });
});

exports.listUsers = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: { users: await authService.listUsers() }, message: 'Users' });
});

exports.updateRole = asyncHandler(async (req, res) => {
  const user = await authService.updateRole(req.validated.params.id, req.validated.body.role, req.user);
  sendSuccess(res, { data: { user }, message: 'Role updated' });
});
