import { ApiError } from '../utils/apiError.js';

export function validate(schema, property = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      return next(new ApiError(400, message));
    }
    req[property] = result.data;
    next();
  };
}
