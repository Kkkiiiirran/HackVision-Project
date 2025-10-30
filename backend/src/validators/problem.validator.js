const Joi = require('joi');

const createProblemSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10),
  image_url: Joi.string().uri().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  topics: Joi.array().items(Joi.string()).default([]),
  sample_input: Joi.string().optional(),
  sample_output: Joi.string().optional()
});

const updateProblemSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  image_url: Joi.string().uri().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  topics: Joi.array().items(Joi.string()).optional(),
  sample_input: Joi.string().optional(),
  sample_output: Joi.string().optional()
});

module.exports = {
  createProblemSchema,
  updateProblemSchema
};
