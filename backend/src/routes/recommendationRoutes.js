const router = require('express').Router();
const ctrl = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { recommendationsQuery } = require('../validators/predictionValidators');
const { caseIdParamSchema } = require('../validators/caseValidators');

router.use(protect);
router.get('/', validate(recommendationsQuery, 'query'), ctrl.list);
router.get('/case/:caseId', validate(caseIdParamSchema, 'params'), ctrl.forCase);

module.exports = router;
