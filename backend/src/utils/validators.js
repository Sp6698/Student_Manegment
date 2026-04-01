const Joi = require('joi');
const logger = require('./logger');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: false });
  if (error) {
    logger.warn(`Validation failed for ${req.path}: ${error.details.map(d => d.message).join(', ')} | body: ${JSON.stringify(req.body)}`);
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }
  req.body = value; // use validated/coerced values
  next();
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const createAdminSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('STUDENT', 'TEACHER').optional(),
  age: Joi.number().integer().min(1).max(120).optional(),
  teacher_id: Joi.string().uuid().optional().allow('', null),
  marks: Joi.array().items(
    Joi.object({
      subject_id: Joi.number().integer().required(),
      score: Joi.number().min(0).max(100).required(),
      remarks: Joi.string().max(255).allow('').optional(),
    })
  ).optional().default([]),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  age: Joi.number().integer().min(1).max(120),
  is_active: Joi.boolean(),
  teacher_id: Joi.string().uuid().optional().allow('', null),
}).min(1);

const markSchema = Joi.object({
  student_id: Joi.string().uuid().required(),  // students.id (not users.id)
  subject_id: Joi.number().integer().required(),
  score: Joi.number().min(0).max(100).required(),
  remarks: Joi.string().max(255).allow('').optional(),
});

module.exports = {
  validate,
  loginSchema,
  createAdminSchema,
  createUserSchema,
  updateUserSchema,
  markSchema,
};
