const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authenticate = require('../middleware/authenticate');

// Direct upload
router.post(
  '/image',
  authenticate,
  uploadController.getUploadMiddleware(),
  uploadController.uploadImage
);

// Get presigned URL
router.get(
  '/presigned-url',
  authenticate,
  uploadController.getPresignedUrl
);

module.exports = router;
