const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const {
  educatorSignupSchema,
  studentSignupSchema,
  loginSchema,
  refreshTokenSchema
} = require('../validators/auth.validator');

router.post('/educator/signup', validate(educatorSignupSchema), authController.educatorSignup);
router.post('/student/signup', validate(studentSignupSchema), authController.studentSignup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
