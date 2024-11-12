import * as Joi from 'joi';

export const CreateRecipeSchema = Joi.object()
  .keys({
    title: Joi.string().trim().min(3).required().messages({
      'string.empty': `Please input the title`,
      'string.min': `Title is at least 3 characters`,
    }),
    description: Joi.string().trim().min(5).messages({
      'string.min': `Description is at least 5 characters`,
    }),
    servings: Joi.string().trim().min(1).messages({
      'string.min': `Serving is at least 5 characters`,
    }),
    cookingTime: Joi.string().trim().min(1).messages({
      'string.min': `Cooking time is at least 5 characters`,
    }),
    ingredients: Joi.array()
      .required()
      .items(Joi.string().min(3).trim())
      .min(1)
      .messages({
        'array.min': `At Least 1 ingredient`,
        'string.empty': `Enter an ingredient`,
        'string.min': `Ingredient is at least 3 characters`,
      }),
    instructions: Joi.array()
      .required()
      .items(Joi.string().trim().min(3))
      .min(1)
      .messages({
        'array.min': `At least 1 Instruction`,
        'string.empty': `Enter an instruction`,
        'string.min': `Instruction is at least 3 characters`,
      }),
    image: Joi.string().trim().required().messages({
      'string.empty': `Image is required`,
    }),
  })
  .options({ abortEarly: true });

export const UpdateRecipeSchema = Joi.object()
  .keys({
    title: Joi.string().trim().min(3).required().messages({
      'string.empty': `Please input the title`,
      'string.min': `Title is at least 3 characters`,
    }),
    description: Joi.string().trim().min(5).messages({
      'string.empty': `Please input the description`,
      'string.min': `Description is at least 5 characters`,
    }),
    servings: Joi.string().trim().min(5).messages({
      'string.min': `Serving is at least 5 characters`,
    }),
    cookingTime: Joi.string().trim().min(5).messages({
      'string.min': `Cooking time is at least 5 characters`,
    }),
    ingredients: Joi.array()
      .required()
      .items(Joi.string().min(3).trim())
      .min(1)
      .messages({
        'array.min': `At Least 1 ingredient`,
        'string.empty': `Enter an ingredient`,
        'string.min': `Ingredient is at least 3 characters`,
      }),
    instructions: Joi.array()
      .required()
      .items(Joi.string().trim().min(3))
      .min(1)
      .messages({
        'array.min': `At least 1 Instruction`,
        'string.empty': `Enter an instruction`,
        'string.min': `Instruction is at least 3 characters`,
      }),
    image: Joi.string().trim().required().messages({
      'string.empty': `Image is required`,
    }),
  })
  .options({ abortEarly: true });
