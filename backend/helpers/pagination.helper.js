/**
 * Pagination helpers
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query parameters
 * @param {Object} defaults - Default values
 * @returns {Object} Parsed pagination parameters
 */
function parsePaginationParams(query, defaults = {}) {
  const page = parseInt(query.page) || defaults.page || 1;
  const limit = Math.min(
    parseInt(query.limit) || defaults.limit || 10,
    defaults.maxLimit || 100
  );
  const skip = (page - 1) * limit;

  // Parse sort
  let sort = defaults.sort || { createdAt: -1 };
  if (query.sort) {
    const order = query.order === 'asc' || query.order === '1' || query.order === 'ascending' ? 1 : -1;
    sort = { [query.sort]: order };
  }

  return {
    page,
    limit,
    skip,
    sort,
  };
}

/**
 * Build pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Paginated response
 */
function buildPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
    },
  };
}

/**
 * Build filter conditions from query parameters
 * @param {Object} query - Request query parameters
 * @param {Array<string>} allowedFilters - Allowed filter fields
 * @returns {Object} MongoDB filter conditions
 */
function buildFilterConditions(query, allowedFilters = []) {
  const conditions = {};

  allowedFilters.forEach((filter) => {
    if (query[filter] !== undefined && query[filter] !== '') {
      // Handle different filter types
      if (filter.endsWith('Id') && query[filter]) {
        // ObjectId filter
        conditions[filter] = query[filter];
      } else if (filter === 'state' || filter === 'status') {
        // Exact match for state/status
        conditions[filter] = query[filter];
      } else if (filter === 'since' || filter === 'from') {
        // Date range start
        conditions.createdAt = conditions.createdAt || {};
        conditions.createdAt.$gte = new Date(query[filter]);
      } else if (filter === 'until' || filter === 'to') {
        // Date range end
        conditions.createdAt = conditions.createdAt || {};
        conditions.createdAt.$lte = new Date(query[filter]);
      } else if (filter === 'search' || filter === 'q') {
        // Text search
        conditions.$text = { $search: query[filter] };
      } else if (typeof query[filter] === 'string') {
        // String filter with regex for partial matching
        conditions[filter] = new RegExp(query[filter], 'i');
      } else {
        // Exact match
        conditions[filter] = query[filter];
      }
    }
  });

  return conditions;
}

/**
 * Build sort options from query parameters
 * @param {Object} query - Request query parameters
 * @param {Object} defaultSort - Default sort options
 * @returns {Object} MongoDB sort options
 */
function buildSortOptions(query, defaultSort = { createdAt: -1 }) {
  if (!query.sort) {
    return defaultSort;
  }

  const order = query.order === 'asc' || query.order === '1' || query.order === 'ascending' ? 1 : -1;
  return { [query.sort]: order };
}

/**
 * Middleware for parsing pagination parameters
 */
function paginationMiddleware(defaults = {}) {
  return (req, res, next) => {
    req.pagination = parsePaginationParams(req.query, defaults);
    next();
  };
}

/**
 * Build pagination links for HAL/HATEOAS
 * @param {string} baseUrl - Base URL for the resource
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} totalPages - Total number of pages
 * @param {Object} query - Additional query parameters
 * @returns {Object} Pagination links
 */
function buildPaginationLinks(baseUrl, page, limit, totalPages, query = {}) {
  const buildUrl = (pageNum) => {
    const params = new URLSearchParams({
      ...query,
      page: pageNum,
      limit,
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const links = {
    self: buildUrl(page),
    first: buildUrl(1),
    last: buildUrl(totalPages),
  };

  if (page > 1) {
    links.prev = buildUrl(page - 1);
  }

  if (page < totalPages) {
    links.next = buildUrl(page + 1);
  }

  return links;
}

module.exports = {
  parsePaginationParams,
  buildPaginationResponse,
  buildFilterConditions,
  buildSortOptions,
  paginationMiddleware,
  buildPaginationLinks,
};
