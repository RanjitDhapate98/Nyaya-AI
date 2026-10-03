const router = require('express').Router();
const ctrl = require('../controllers/predictionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createPredictionSchema, listPredictionsQuery } = require('../validators/predictionValidators');
const { idParamSchema, caseIdParamSchema } = require('../validators/caseValidators');

router.use(protect);

router.get('/model-info', ctrl.modelInfo);
router.get('/case/:caseId', validate(caseIdParamSchema, 'params'), ctrl.latestForCase);
router
  .route('/')
  .get(validate(listPredictionsQuery, 'query'), ctrl.list)
  .post(authorize('admin', 'analyst'), validate(createPredictionSchema), ctrl.create);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.get);

module.exports = router;
