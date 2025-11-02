/**
 * Sanitize error messages to prevent sensitive data leakage
 */

// Patterns to sanitize
const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+\/]+/gi, // Bearer tokens
  /token[=:]\s*[A-Za-z0-9\-._~+\/]+/gi, // token parameters
  /api[_-]?key[=:]\s*[A-Za-z0-9\-._~+\/]+/gi, // API keys
  /password[=:]\s*[^\s&]+/gi, // Passwords
  /secret[=:]\s*[^\s&]+/gi, // Secrets
  /authorization:\s*[^\s,}]+/gi, // Authorization headers
  /ghp_[A-Za-z0-9]{36}/gi, // GitHub personal access tokens
  /ghs_[A-Za-z0-9]{36}/gi, // GitHub server tokens
  /mongodb:\/\/[^@]+@/gi, // MongoDB connection strings with credentials
];

const REPLACEMENT = '[REDACTED]';

/**
 * Sanitize a string by removing sensitive information
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }

  let sanitized = str;
  SENSITIVE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, REPLACEMENT);
  });

  return sanitized;
}

/**
 * Sanitize an error object
 * @param {Error} error - Error to sanitize
 * @returns {Object} Sanitized error object
 */
function sanitizeError(error) {
  if (!error) {
    return null;
  }

  const sanitized = {
    message: sanitizeString(error.message || 'Unknown error'),
    name: error.name || 'Error',
    code: error.code,
    status: error.status || error.statusCode,
  };

  // Sanitize stack trace
  if (error.stack) {
    sanitized.stack = sanitizeString(error.stack);
  }

  // Sanitize additional properties
  if (error.response) {
    sanitized.response = {
      status: error.response.status,
      statusText: error.response.statusText,
      data: sanitizeObject(error.response.data),
    };
  }

  return sanitized;
}

/**
 * Sanitize an object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive keys entirely
    if (/token|password|secret|key|auth/i.test(key)) {
      sanitized[key] = REPLACEMENT;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Safe console.error that sanitizes output
 */
function safeConsoleError(...args) {
  const sanitizedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      return sanitizeError(arg);
    } else if (typeof arg === 'object') {
      return sanitizeObject(arg);
    } else if (typeof arg === 'string') {
      return sanitizeString(arg);
    }
    return arg;
  });

  console.error(...sanitizedArgs);
}

/**
 * Safe console.log that sanitizes output
 */
function safeConsoleLog(...args) {
  const sanitizedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      return sanitizeError(arg);
    } else if (typeof arg === 'object') {
      return sanitizeObject(arg);
    } else if (typeof arg === 'string') {
      return sanitizeString(arg);
    }
    return arg;
  });

  console.log(...sanitizedArgs);
}

module.exports = {
  sanitizeString,
  sanitizeError,
  sanitizeObject,
  safeConsoleError,
  safeConsoleLog,
};
