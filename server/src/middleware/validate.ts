import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: result.array(),
        });
      }
    }
    next();
  };
};

export { body, param, query } from 'express-validator';
