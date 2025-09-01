// Modular product search helper used by chat routes
import { Op } from 'sequelize';
import db from '../models/index.js';
import productRecommendationService from './productRecommendationService.js';

/**
 * Find products by free-text query and optional budget/category using Sequelize
 * @param {Object} params
 * @param {string} params.query - Free-text query
 * @param {number|null} params.budget - Max price filter (<= budget)
 * @param {string|null} params.category - Category name
 * @param {number|null} params.minPrice - Minimum price filter
 * @param {string|null} params.purpose - Usage purpose keywords (e.g., programming)
 * @param {number} [params.limit=5] - Max number of results
 * @returns {Promise<Array>} products
 */
export async function findProductsByQuery({
  query = '',
  budget = null,
  category = null,
  minPrice = null,
  purpose = null,
  limit = 5,
} = {}) {
  // Delegate to existing recommendation service for consistent transforms
  return productRecommendationService.searchProducts({
    query,
    category,
    maxPrice: budget,
    minPrice,
    purpose,
    limit,
  });
}

/**
 * Get fallback recommendations when search returns no results
 * @param {string|null} category
 * @param {number} [limit=5]
 */
export async function getFallbackRecommendations(category = null, limit = 5) {
  return productRecommendationService.getRecommendedProducts(category, limit);
}

export default {
  findProductsByQuery,
  getFallbackRecommendations,
};
