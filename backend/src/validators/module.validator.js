const Joi = require('joi');

const createModuleSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10),
  price_cents: Joi.number().integer().min(0).required(),
  currency: Joi.string().length(3).default('INR'),
  tags: Joi.array().items(Joi.string()).default([]),
  topics: Joi.array().items(Joi.string()).default([]),
  cover_image_url: Joi.string().uri().optional()
});

const updateModuleSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  price_cents: Joi.number().integer().min(0).optional(),
  currency: Joi.string().length(3).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  topics: Joi.array().items(Joi.string()).optional(),
  cover_image_url: Joi.string().uri().optional()
});

module.exports = {
  createModuleSchema,
  updateModuleSchema
};
