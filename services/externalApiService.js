const axios = require('axios');
const config = require('../config/config');
const { validateApiUrl } = require('./serviceUtils');

// Maximum allowed depth for property access to prevent DoS
const MAX_TRANSFORM_DEPTH = 10;

/**
 * Safely apply a JSONPath-like transformation to data without using Function constructor.
 * Supports simple property access patterns like "data.items" or "response.results[0]".
 * 
 * @param {Object} data - The data to transform
 * @param {string} transform - A dot-notation path to extract (e.g., "data.items" or "response.results")
 * @returns {*} The extracted data or the original data if transform fails
 */
function safeTransform(data, transform) {
  if (!transform || typeof transform !== 'string') {
    return data;
  }

  // Only allow safe property access patterns (alphanumeric, dots, brackets with numbers)
  const safePattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+\])*$/;
  
  // Handle "return data.path" or just "data.path" patterns
  let path = transform.trim();
  if (path.startsWith('return ')) {
    path = path.substring(7).trim();
  }
  // Remove trailing semicolon if present
  if (path.endsWith(';')) {
    path = path.slice(0, -1).trim();
  }

  if (!safePattern.test(path)) {
    console.warn('[WARNING] Transform pattern contains unsafe characters, returning original data');
    return data;
  }

  try {
    // Parse the path and navigate through the object
    const parts = path.split(/\.|\[|\]/).filter(Boolean);
    
    // Check depth limit to prevent DoS
    if (parts.length > MAX_TRANSFORM_DEPTH) {
      console.warn(`[WARNING] Transform path exceeds maximum depth of ${MAX_TRANSFORM_DEPTH}, returning original data`);
      return data;
    }
    
    let result = data;
    
    for (const part of parts) {
      if (result === null || result === undefined) {
        return data;
      }
      // Handle numeric indices and string keys
      const key = /^\d+$/.test(part) ? parseInt(part, 10) : part;
      result = result[key];
    }
    
    return result !== undefined ? result : data;
  } catch (error) {
    console.warn('[WARNING] Failed to apply transform, returning original data:', error.message);
    return data;
  }
}

/**
 * Service for fetching data from external APIs to enrich AI prompts
 */
class ExternalApiService {
  /**
   * Fetch data from the configured external API
   * @returns {Promise<Object|string|null>} The data from the API or null if disabled/error
   */
  async fetchData() {
    try {
      // Check if external API integration is enabled
      if (!config.externalApiConfig || config.externalApiConfig.enabled !== 'yes') {
        console.log('[DEBUG] External API integration is disabled');
        return null;
      }

      const {
        url,
        method = 'GET',
        headers = {},
        body = {},
        timeout = 5000,
        transform
      } = config.externalApiConfig;

      if (!url) {
        console.error('[ERROR] External API URL not configured');
        return null;
      }

      // Validate URL to prevent SSRF attacks
      // Note: allowPrivateIPs is set based on environment - administrators may need internal APIs
      const allowPrivateIPs = process.env.EXTERNAL_API_ALLOW_PRIVATE_IPS === 'yes';
      const urlValidation = validateApiUrl(url, { allowPrivateIPs });
      if (!urlValidation.valid) {
        console.error(`[ERROR] External API URL validation failed: ${urlValidation.error}`);
        return null;
      }

      console.log(`[DEBUG] Fetching data from external API: ${url}`);

      // Parse headers if they're a string
      let parsedHeaders = headers;
      if (typeof headers === 'string') {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch (error) {
          console.error('[ERROR] Failed to parse external API headers:', error.message);
          parsedHeaders = {};
        }
      }

      // Parse body if it's a string
      let parsedBody = body;
      if (typeof body === 'string' && (method === 'POST' || method === 'PUT')) {
        try {
          parsedBody = JSON.parse(body);
        } catch (error) {
          console.error('[ERROR] Failed to parse external API body:', error.message);
          parsedBody = {};
        }
      }

      // Configure request options
      const options = {
        method,
        url,
        headers: parsedHeaders,
        timeout: parseInt(timeout) || 5000,
      };

      // Add request body for POST/PUT requests
      if (method === 'POST' || method === 'PUT') {
        options.data = parsedBody;
      }

      // Make the request
      const response = await axios(options);
      let data = response.data;

      // Apply safe transform if provided (replaces unsafe Function constructor)
      if (transform && typeof transform === 'string') {
        try {
          data = safeTransform(data, transform);
          console.log('[DEBUG] Successfully transformed external API data');
        } catch (error) {
          console.error('[ERROR] Failed to execute transform:', error.message);
        }
      }

      return data;
    } catch (error) {
      console.error('[ERROR] Failed to fetch data from external API:', error.message);
      if (error.response) {
        console.error('[ERROR] API Response:', error.response.status, error.response.data);
      }
      return null;
    }
  }
}

module.exports = new ExternalApiService();
