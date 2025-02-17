import * as Joi from 'joi';

export const UserValidationSchema = Joi.object()
  .keys({
    fullname: Joi.string()
      .trim()
      .min(8)
      .messages({
        'string.base': `"Fullname" should be a text type`,
        'string.empty': `Enter Fullname`,
        'string.min': `Use at least 8 characters`,
      })
      .optional(),
    email: Joi.string()
      .trim()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
      .required()
      .messages({
        'string.base': `"Email" should be a text type.`,
        'string.email': `Should be email format or Email format should be ".com" or ".net."`,
        'string.empty': `Enter Email.`,
      }),
    username: Joi.string()
      .trim()
      .regex(/^[a-z0-9_]+$/i)
      .min(8)
      .required()
      .messages({
        'string.base': `"Username" should be a text type.`,
        'string.empty': `Enter username.`,
        'string.min': `Username at least 8 characters.`,
        'string.pattern.base': `Username can only contain letters (a-z), numbers (0-9), and underscores (_)`,
      }),
    birthDate: Joi.date().max('now').min('1947-01-01'),
    image: Joi.string().allow(''),
  })
  .options({ abortEarly: true });
