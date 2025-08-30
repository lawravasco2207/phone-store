// Common helper functions
import crypto from 'crypto';

/**
 * Generate a URL-friendly slug from a string
 * @param {string} str - The string to convert to a slug
 * @returns {string} The generated slug
 */
export function generateSlug(str) {
  if (!str) return '';
  
  // Convert to lowercase, remove special chars, replace spaces with hyphens
  const baseSlug = str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
    
  // Add a short hash to make it unique
  const hash = crypto.createHash('md5')
    .update(str + Date.now().toString())
    .digest('hex')
    .substring(0, 6);
    
  return `${baseSlug}-${hash}`;
}

/**
 * Format a price in cents to a display price
 * @param {number} cents - Price in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted price
 */
export function formatPrice(cents, currency = 'USD') {
  if (typeof cents !== 'number') return '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  
  return formatter.format(cents / 100);
}

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export function randomString(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
