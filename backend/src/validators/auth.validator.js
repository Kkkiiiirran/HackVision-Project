const Joi = require('joi');

const educatorSignupSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  organization: Joi.string().max(200).optional(),
  website: Joi.string().uri().optional()
});

const studentSignupSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
});

module.exports = {
  educatorSignupSchema,
  studentSignupSchema,
  loginSchema,
  refreshTokenSchema
};
