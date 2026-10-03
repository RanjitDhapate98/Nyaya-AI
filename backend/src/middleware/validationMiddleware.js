const ApiError = require('../utils/ApiError');

/**
 * validate(schema, source) - validates req[source] with a Zod schema.
 * Parsed (coerced/sanitised) values are stored on req.validated[source].
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.') || source, message: i.message }));
    const status = source === 'body' ? 422 : 400;
    return next(new ApiError(status, details[0]?.message || 'Validation failed', details));
  }
  req.validated = { ...(req.validated || {}), [source]: result.data };
  return next();
};

module.exports = { validate };
