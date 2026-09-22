import Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  AI_PROVIDER: Joi.string().valid('mock', 'gemini').default('mock'),
  AI_MODEL: Joi.string().default('triage-v1'),
  AI_TIMEOUT_MS: Joi.number().integer().min(100).max(60000).default(8000),
  GEMINI_API_KEY: Joi.when('AI_PROVIDER', { is: 'gemini', then: Joi.string().min(1).required(), otherwise: Joi.string().allow('').optional() }),
  GEMINI_MODEL: Joi.string().default('gemini-2.0-flash'),
});
