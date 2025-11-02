/**
 * Batch processing utilities
 */

/**
 * Process array items in batches with concurrency control
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {Object} options - Batch options
 * @param {number} options.batchSize - Number of items per batch
 * @param {number} options.concurrency - Number of concurrent operations
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Array>} Results array
 */
async function processBatch(items, processor, options = {}) {
  const {
    batchSize = 10,
    concurrency = 5,
    onProgress = null,
  } = options;

  const results = [];
  const errors = [];

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);

    console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

    // Process batch with concurrency control
    const batchResults = await processConcurrently(batch, processor, concurrency);

    results.push(...batchResults.filter((r) => r.status === 'fulfilled').map((r) => r.value));
    errors.push(...batchResults.filter((r) => r.status === 'rejected').map((r) => r.reason));

    // Call progress callback
    if (onProgress) {
      onProgress({
        processed: i + batch.length,
        total: items.length,
        batch: batchNumber,
        totalBatches,
        successCount: results.length,
        errorCount: errors.length,
      });
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
    total: items.length,
  };
}

/**
 * Process items concurrently with a concurrency limit
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} concurrency - Max concurrent operations
 * @returns {Promise<Array>} Results array
 */
async function processConcurrently(items, processor, concurrency = 5) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const promise = Promise.resolve().then(() => processor(item));
    results.push(promise);

    if (concurrency <= items.length) {
      const executing_promise = promise.then(() => {
        executing.splice(executing.indexOf(executing_promise), 1);
      });
      executing.push(executing_promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.allSettled(results);
}

/**
 * Batch API calls with rate limiting
 * @param {Array} calls - Array of functions that return promises
 * @param {Object} options - Options
 * @param {number} options.batchSize - Calls per batch
 * @param {number} options.delayBetweenBatches - Delay in ms between batches
 * @returns {Promise<Array>} Results
 */
async function batchApiCalls(calls, options = {}) {
  const {
    batchSize = 10,
    delayBetweenBatches = 1000,
  } = options;

  const results = [];

  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);

    // Execute batch
    const batchResults = await Promise.allSettled(batch.map((call) => call()));
    results.push(...batchResults);

    // Delay between batches (except for the last batch)
    if (i + batchSize < calls.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Chunk an array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process items in parallel with Promise.all
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @returns {Promise<Array>} Results
 */
async function parallelProcess(items, processor) {
  return Promise.all(items.map(processor));
}

/**
 * Process items in parallel with allSettled (doesn't fail if one fails)
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @returns {Promise<Object>} Results and errors
 */
async function parallelProcessSafe(items, processor) {
  const results = await Promise.allSettled(items.map(processor));

  return {
    results: results.filter((r) => r.status === 'fulfilled').map((r) => r.value),
    errors: results.filter((r) => r.status === 'rejected').map((r) => r.reason),
  };
}

module.exports = {
  processBatch,
  processConcurrently,
  batchApiCalls,
  chunkArray,
  parallelProcess,
  parallelProcessSafe,
};
