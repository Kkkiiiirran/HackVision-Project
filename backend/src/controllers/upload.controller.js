const multer = require('multer');
const uploadService = require('../services/upload.service');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,image/webp').split(',');

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

class UploadController {
  getUploadMiddleware() {
    return upload.single('image');
  }

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const result = await uploadService.uploadImage(req.file);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPresignedUrl(req, res, next) {
    try {
      const { fileName, fileType } = req.query;

      if (!fileName || !fileType) {
        return res.status(400).json({ error: 'fileName and fileType are required' });
      }

      const result = await uploadService.generatePresignedUrl(fileName, fileType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();
