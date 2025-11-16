/**
 * Compliance Service Joi Validation Schemas
 * 
 * NASA-level robust validation for compliance endpoints
 * 
 * @module @shield/shared/validation/complianceSchemas
 */

import Joi from 'joi';
import { commonSchemas, idParamSchema } from './schemas';

/**
 * Document type validation
 */
const documentTypeSchema = Joi.string()
  .valid('PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'OTHER')
  .required()
  .messages({
    'any.only': 'Document type must be one of: PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, OTHER',
    'any.required': 'Document type is required',
  });

/**
 * Country code validation (ISO 3166-1 alpha-2)
 */
const countryCodeSchema = Joi.string()
  .length(2)
  .pattern(/^[A-Z]{2}$/)
  .uppercase()
  .required()
  .messages({
    'string.length': 'Country code must be exactly 2 characters',
    'string.pattern.base': 'Country code must be uppercase letters only',
    'any.required': 'Country code is required',
  });

/**
 * Date of birth validation (must be 18+ years old)
 */
const dateOfBirthSchema = Joi.string()
  .isoDate()
  .required()
  .custom((value, helpers) => {
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      const actualAge = age - 1;
      if (actualAge < 18) {
        return helpers.error('any.invalid', {
          message: 'User must be at least 18 years old',
        });
      }
    } else if (age < 18) {
      return helpers.error('any.invalid', {
        message: 'User must be at least 18 years old',
      });
    }
    
    // Check if date is not in the future
    if (birthDate > today) {
      return helpers.error('any.invalid', {
        message: 'Date of birth cannot be in the future',
      });
    }
    
    return value;
  })
  .messages({
    'string.isoDate': 'Date of birth must be a valid ISO date',
    'any.required': 'Date of birth is required',
  });

/**
 * KYC schema
 */
export const kycSchema = Joi.object({
  firstName: commonSchemas.nonEmptyString('First name', 1, 50)
    .pattern(/^[A-Za-z\s'-]+$/)
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  lastName: commonSchemas.nonEmptyString('Last name', 1, 50)
    .pattern(/^[A-Za-z\s'-]+$/)
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  dateOfBirth: dateOfBirthSchema,
  country: countryCodeSchema,
  documentType: documentTypeSchema,
  documentNumber: commonSchemas.nonEmptyString('Document number', 3, 50)
    .pattern(/^[A-Z0-9]+$/)
    .uppercase()
    .messages({
      'string.pattern.base': 'Document number must contain only uppercase letters and numbers',
    }),
})
  .strict();

/**
 * Business type validation
 */
const businessTypeSchema = Joi.string()
  .valid('CORPORATION', 'LLC', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'OTHER')
  .required()
  .messages({
    'any.only': 'Business type must be one of: CORPORATION, LLC, PARTNERSHIP, SOLE_PROPRIETORSHIP, OTHER',
    'any.required': 'Business type is required',
  });

/**
 * KYB schema
 */
export const kybSchema = Joi.object({
  businessName: commonSchemas.nonEmptyString('Business name', 2, 200),
  registrationNumber: commonSchemas.nonEmptyString('Registration number', 3, 50)
    .pattern(/^[A-Z0-9-]+$/)
    .uppercase()
    .messages({
      'string.pattern.base': 'Registration number must contain only uppercase letters, numbers, and hyphens',
    }),
  country: countryCodeSchema,
  businessType: businessTypeSchema,
  taxId: commonSchemas.optionalString(50)
    .pattern(/^[A-Z0-9-]+$/)
    .uppercase()
    .messages({
      'string.pattern.base': 'Tax ID must contain only uppercase letters, numbers, and hyphens',
    }),
})
  .strict();

/**
 * Screen wallet schema
 */
export const screenWalletSchema = Joi.object({
  address: Joi.when('chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
  chain: commonSchemas.chainType,
})
  .strict()
  .custom((value, helpers) => {
    // Cross-field validation
    if (value.chain === 'POLYGON' && !/^0x[a-fA-F0-9]{40}$/.test(value.address)) {
      return helpers.error('any.invalid', {
        message: 'Address format does not match chain type',
      });
    }
    if (value.chain === 'TRON' && !/^T[A-Za-z1-9]{33}$/.test(value.address)) {
      return helpers.error('any.invalid', {
        message: 'Address format does not match chain type',
      });
    }
    return value;
  });

/**
 * Screen transaction schema
 */
export const screenTransactionSchema = Joi.object({
  transactionId: commonSchemas.uuid,
  fromAddress: Joi.when('$chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
  amount: commonSchemas.positiveDecimal.custom((value, helpers) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      return helpers.error('any.invalid', { message: 'Amount must be a positive number' });
    }
    return value;
  }),
})
  .strict();

/**
 * Review compliance check schema
 */
export const reviewComplianceCheckSchema = Joi.object({
  decision: Joi.string()
    .valid('APPROVED', 'REJECTED')
    .required()
    .messages({
      'any.only': 'Decision must be either APPROVED or REJECTED',
      'any.required': 'Decision is required',
    }),
  notes: commonSchemas.optionalString(2000),
})
  .strict();

/**
 * Compliance check ID parameter schema
 */
export const complianceCheckIdParamSchema = idParamSchema;

