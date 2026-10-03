const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ctrl = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { registerSchema, loginSchema, updateRoleSchema } = require('../validators/authValidators');
const { idParamSchema } = require('../validators/caseValidators');

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.', error: 'RATE_LIMITED' },
});

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.get('/me', protect, ctrl.me);

// Admin user management
router.get('/users', protect, authorize('admin'), ctrl.listUsers);
router.patch('/users/:id/role', protect, authorize('admin'), validate(idParamSchema, 'params'), validate(updateRoleSchema), ctrl.updateRole);

module.exports = router;
