// Product recommendation service
import { Op, Sequelize } from 'sequelize';
import db from '../models/index.js';

/**
 * Search for products based on parameters
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.category - Product category
 * @param {number} params.maxPrice - Maximum price
 * @param {number} params.minPrice - Minimum price
 * @param {string} params.purpose - Usage purpose
 * @param {number} params.limit - Max number of results
 * @returns {Promise<Array>} - Matching products
 */
export async function searchProducts(params) {
  const { 
    query = '', 
    category = null, 
    maxPrice = null, 
    minPrice = null, 
    purpose = null,
    limit = 5 
  } = params;
  
  try {
    // Build the where clause
    const where = {};
    const includeCategory = [];
    
    // Add search by query to where clause
    if (query && query.trim() !== '') {
      const searchTerms = query.split(' ').filter(term => term.trim() !== '');
      
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => ({
          [Op.or]: [
            { name: { [Op.iLike]: `%${term}%` } },
            { description: { [Op.iLike]: `%${term}%` } }
          ]
        }));
        
        where[Op.and] = searchConditions;
      }
    }
    
    // Add purpose to search query if provided
    if (purpose && purpose.trim() !== '') {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { description: { [Op.iLike]: `%${purpose}%` } }
      ];
    }
    
    // Filter by price range (budget)
    if (maxPrice && !isNaN(Number(maxPrice))) {
      where.price = {
        ...where.price,
        [Op.lte]: Number(maxPrice)
      };
    }
    
    if (minPrice && !isNaN(Number(minPrice))) {
      where.price = {
        ...where.price,
        [Op.gte]: Number(minPrice)
      };
    }
    
    // Filter by category if provided
    if (category && category.trim() !== '') {
      includeCategory.push({
        model: db.Category,
        where: { 
          name: { [Op.iLike]: `%${category}%` }
        },
        through: { attributes: [] }
      });
    } else {
      // Still include categories, but don't filter by them
      includeCategory.push({
        model: db.Category,
        through: { attributes: [] }
      });
    }
    
    // Include inventory data
    includeCategory.push({
      model: db.Inventory,
      required: false
    });
    
  // Note: Skip including Review to avoid errors if Reviews table isn't present yet
    
    // Execute query
    const products = await db.Product.findAll({
      where,
      include: includeCategory,
      order: [['createdAt', 'DESC']], // Default sort by newest
      limit: Number(limit)
    });
    
    // Transform products for response
    return products.map(product => {
      const p = product.toJSON();
      
      // Rating calculation skipped (no Reviews included)
      p.rating = null;
      
      // Ensure proper image formatting
      if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
        p.images = ['/api/placeholder/400/400'];
      }
      
      // Include inventory count
      p.inventory = p.Inventory?.stock_quantity || 0;
      
      // Clean up response by removing unnecessary nested data
      delete p.Inventory;
  // No Reviews to remove
      
      return p;
    });
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
}

/**
 * Get recommended products by category and popularity
 * @param {string} category - Product category
 * @param {number} limit - Max number of results
 * @returns {Promise<Array>} - Recommended products
 */
export async function getRecommendedProducts(category = null, limit = 5) {
  try {
    const includeOptions = [
      { model: db.Inventory, required: false }
    ];
    
    // Add category filter if provided
    if (category && category.trim() !== '') {
      includeOptions.push({
        model: db.Category,
        where: { name: { [Op.iLike]: `%${category}%` } },
        through: { attributes: [] }
      });
    } else {
      includeOptions.push({
        model: db.Category,
        through: { attributes: [] }
      });
    }
    
    const products = await db.Product.findAll({
      include: includeOptions,
      order: [['createdAt', 'DESC']], // Sort by newest as a proxy for popularity
      limit: Number(limit)
    });
    
    // Transform products same as in searchProducts
    return products.map(product => {
      const p = product.toJSON();
      
      // Rating calculation skipped (no Reviews included)
      p.rating = null;
      
      // Ensure proper image formatting
      if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
        p.images = ['/api/placeholder/400/400'];
      }
      
      // Include inventory count
      p.inventory = p.Inventory?.stock_quantity || 0;
      
      // Clean up response
      delete p.Inventory;
  // No Reviews to remove
      
      return p;
    });
  } catch (error) {
    console.error('Error getting recommended products:', error);
    return [];
  }
}

export default {
  searchProducts,
  getRecommendedProducts
};
