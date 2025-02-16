import * as Joi from 'joi';

export const RegisterSchema = Joi.object({
  fullname: Joi.string().trim().min(8).required().messages({
    'string.base': `"Fullname" should be a text type`,
    'string.empty': `Enter Fullname`,
    'string.min': `Use at least 8 characters`,
    'any.required': `"fullname" is required`,
  }),
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required()
    .messages({
      'string.base': `"Email" should be a text type`,
      'string.email': `Email format should be ".com" or ".net"`,
      'string.empty': `Enter Email`,
    }),
  password: Joi.string().trim().min(8).required().messages({
    'string.base': `"Password" should be a text type`,
    'string.empty': `Please input a stronger password. Try a mix of letters, numbers, and symbols`,
    'string.min': `Use at least 8 characters`,
  }),
  birthDate: Joi.date().iso().max('now'),
  image: Joi.string().allow(''),
}).options({
  abortEarly: true,
});

export const LoginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required()
    .messages({
      'string.base': `"Email" should be a text type`,
      'string.email': `Email format should be ".com" or ".net"`,
      'string.empty': `Enter Email`,
    }),
  password: Joi.string().trim().required().messages({
    'string.base': `"Password" should be a text type`,
    'string.empty': `Enter Password`,
  }),
}).options({
  abortEarly: true,
});
