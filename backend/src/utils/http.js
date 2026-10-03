/** Wraps async route handlers so rejected promises reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Consistent success envelope: { success, data, message }. */
const sendSuccess = (res, { data = {}, message = 'OK', status = 200, meta } = {}) => {
  const body = { success: true, data, message };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toISODate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

const daysBetween = (a, b = new Date()) => Math.max(0, Math.floor((new Date(b) - new Date(a)) / 86400000));

module.exports = { asyncHandler, sendSuccess, escapeRegex, toISODate, daysBetween };
