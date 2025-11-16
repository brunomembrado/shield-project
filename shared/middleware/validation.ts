/**
 * Enhanced Validation Middleware
 * 
 * NASA-level robust validation with comprehensive error handling
 * 
 * @module @shield/shared/middleware/validation
 */

import { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';
import { createValidationErrorResponse } from '../utils';

/**
 * Validates request body using Joi schema
 * 
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateRequest(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Collect all errors
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert types when possible
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      res.status(400).json(
        createValidationErrorResponse('Validation failed', errors, req.path)
      );
      return;
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

/**
 * Validates request query parameters using Joi schema
 * 
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateQuery(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      res.status(400).json(
        createValidationErrorResponse('Query validation failed', errors, req.path)
      );
      return;
    }

    req.query = value as typeof req.query;
    next();
  };
}

/**
 * Validates request path parameters using Joi schema
 * 
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateParams(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      res.status(400).json(
        createValidationErrorResponse('Parameter validation failed', errors, req.path)
      );
      return;
    }

    req.params = value as typeof req.params;
    next();
  };
}

/**
 * Validates request with context (for conditional validation)
 * 
 * @param schema - Joi validation schema
 * @param getContext - Function to get validation context
 * @returns Express middleware function
 */
export function validateWithContext(
  schema: Schema,
  getContext: (req: Request) => Record<string, unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = getContext(req);
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      context,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      res.status(400).json(
        createValidationErrorResponse('Validation failed', errors, req.path)
      );
      return;
    }

    req.body = value;
    next();
  };
}

