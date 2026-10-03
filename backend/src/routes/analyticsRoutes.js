const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { analyticsQuery } = require('../validators/predictionValidators');

router.use(protect);
router.get('/summary', validate(analyticsQuery, 'query'), ctrl.summary);
router.get('/prediction-trend', ctrl.predictionTrend);
router.get('/filters', ctrl.filterOptions);

module.exports = router;
