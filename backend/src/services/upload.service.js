const s3 = require('../config/s3');
const { v4: uuidv4 } = require('uuid');

class UploadService {
  async uploadImage(file) {
    const key = `images/${uuidv4()}-${file.originalname}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key
    };
  }

  async generatePresignedUrl(fileName, fileType) {
    const key = `images/${uuidv4()}-${fileName}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY) || 3600
    };

    const url = await s3.getSignedUrlPromise('putObject', params);

    return {
      presigned_url: url,
      key,
      public_url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    };
  }

  async deleteImage(key) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
  }
}

module.exports = new UploadService();
