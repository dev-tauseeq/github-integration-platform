/**
 * Retry utility with exponential backoff
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (1-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt, baseDelay = 1000, maxDelay = 30000) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  // Add jitter (±25% randomization)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts
 * @param {number} options.baseDelay - Base delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {Function} options.shouldRetry - Function to determine if error is retryable
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise<any>} Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateBackoff(attempt, baseDelay, maxDelay);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      console.log(
        `Retry attempt ${attempt}/${maxAttempts} after ${delay}ms. Error: ${error.message}`
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable (typically network or rate limit errors)
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP status codes that should be retried
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  if (error.response && retryableStatuses.includes(error.response.status)) {
    return true;
  }

  // GitHub specific errors
  if (error.message && error.message.includes('rate limit')) {
    return true;
  }

  return false;
}

/**
 * Retry specifically for GitHub API calls
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the function
 */
async function retryGitHubCall(fn, options = {}) {
  return retryWithBackoff(fn, {
    maxAttempts: options.maxAttempts || 3,
    baseDelay: options.baseDelay || 2000,
    maxDelay: options.maxDelay || 60000,
    shouldRetry: (error, attempt) => {
      // Don't retry on authentication errors
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      return isRetryableError(error);
    },
    onRetry: (error, attempt, delay) => {
      console.log(
        `GitHub API call failed (attempt ${attempt}). Retrying in ${delay}ms...`
      );
    },
    ...options,
  });
}

module.exports = {
  sleep,
  calculateBackoff,
  retryWithBackoff,
  isRetryableError,
  retryGitHubCall,
};
