const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../helpers/error.helper');
const mongoose = require('mongoose');

/**
 * Validate request and throw error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(
      new AppError(
        'Validation failed',
        400,
        errorMessages
      )
    );
  }
  next();
};

/**
 * Validation rules for sync operations
 */
const syncValidation = {
  // Validate integration ID
  integrationId: [
    body('integrationId')
      .notEmpty()
      .withMessage('Integration ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid integration ID format');
        }
        return true;
      }),
    validate,
  ],

  // Validate sync repositories
  syncRepositories: [
    body('integrationId')
      .notEmpty()
      .withMessage('Integration ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid integration ID format');
        }
        return true;
      }),
    body('owner')
      .notEmpty()
      .withMessage('Owner is required')
      .isString()
      .withMessage('Owner must be a string')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Owner must be between 1 and 100 characters'),
    validate,
  ],

  // Validate sync commits/pulls/issues
  syncRepoEntity: [
    body('integrationId')
      .notEmpty()
      .withMessage('Integration ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid integration ID format');
        }
        return true;
      }),
    body('owner')
      .notEmpty()
      .withMessage('Owner is required')
      .isString()
      .withMessage('Owner must be a string')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Owner must be between 1 and 100 characters'),
    body('repo')
      .notEmpty()
      .withMessage('Repository name is required')
      .isString()
      .withMessage('Repository name must be a string')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Repository name must be between 1 and 100 characters'),
    validate,
  ],

  // Validate sync progress
  syncProgress: [
    param('integrationId')
      .notEmpty()
      .withMessage('Integration ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid integration ID format');
        }
        return true;
      }),
    validate,
  ],
};

/**
 * Validation rules for pagination
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  query('order')
    .optional()
    .isIn(['asc', 'desc', 'ascending', 'descending', '1', '-1'])
    .withMessage('Order must be asc or desc'),
  validate,
];

/**
 * Validation rules for filtering
 */
const filterValidation = {
  commits: [
    query('repoId')
      .optional()
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid repository ID format');
        }
        return true;
      }),
    query('author')
      .optional()
      .isString()
      .trim(),
    query('since')
      .optional()
      .isISO8601()
      .withMessage('Since date must be in ISO 8601 format'),
    query('until')
      .optional()
      .isISO8601()
      .withMessage('Until date must be in ISO 8601 format'),
    ...paginationValidation,
  ],

  pulls: [
    query('repoId')
      .optional()
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid repository ID format');
        }
        return true;
      }),
    query('state')
      .optional()
      .isIn(['open', 'closed', 'all'])
      .withMessage('State must be open, closed, or all'),
    query('author')
      .optional()
      .isString()
      .trim(),
    ...paginationValidation,
  ],

  issues: [
    query('repoId')
      .optional()
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid repository ID format');
        }
        return true;
      }),
    query('state')
      .optional()
      .isIn(['open', 'closed', 'all'])
      .withMessage('State must be open, closed, or all'),
    query('labels')
      .optional()
      .isString()
      .trim(),
    ...paginationValidation,
  ],
};

module.exports = {
  validate,
  syncValidation,
  paginationValidation,
  filterValidation,
};
