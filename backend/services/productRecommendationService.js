// Product recommendation service
import { Op, Sequelize } from 'sequelize';
import db from '../models/index.js';

/**
 * Search for products based on query and filters
 * @param {Object} options - Search options
 * @param {string} options.query - Search text
 * @param {string} options.category - Product category
 * @param {number} options.maxPrice - Maximum price
 * @param {number} options.minPrice - Minimum price
 * @param {string} options.purpose - Use case/purpose
 * @param {number} options.limit - Max results to return
 * @param {boolean} options.inStock - Filter for in-stock products only
 * @returns {Promise<Array>} - Array of product objects
 */
export async function searchProducts({
  query = '',
  category = '',
  maxPrice = null,
  minPrice = null,
  purpose = '',
  limit = 10,
  inStock = false
} = {}) {
  
  console.log('productRecommendationService.searchProducts called with:', { query, category, maxPrice, minPrice, purpose, limit, inStock });
  
  try {
    // Build the where clause
    const where = {};
    const includeCategory = [];
    
    // Add search by query to where clause
    if (query && query.trim() !== '') {
      // Use a more flexible approach - first try the complete query
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ];
      
      // Then split into significant terms and use them for broader matching
      const searchTerms = query.split(' ')
        .filter(term => term.trim() !== '')
        .filter(term => term.length > 2); // Filter out very short words
      
      if (searchTerms.length > 0) {
        // For each significant term, add it as an OR condition
        searchTerms.forEach(term => {
          where[Op.or].push(
            { name: { [Op.iLike]: `%${term}%` } },
            { description: { [Op.iLike]: `%${term}%` } }
          );
        });
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
      console.log(`Applying price filter: price <= ${maxPrice}`);
    }
    
    if (minPrice && !isNaN(Number(minPrice))) {
      where.price = {
        ...where.price,
        [Op.gte]: Number(minPrice)
      };
      console.log(`Applying price filter: price >= ${minPrice}`);
    }
    
    // Check for price-related terms in the query and remove them to avoid confusing the search
    let cleanedQuery = query;
    if (query) {
      const pricePatternsToRemove = [
        /under\s+\$?\d+/i,
        /less than\s+\$?\d+/i,
        /below\s+\$?\d+/i,
        /between\s+\$?\d+\s+and\s+\$?\d+/i,
        /cheaper than\s+\$?\d+/i,
        /around\s+\$?\d+/i,
        /about\s+\$?\d+/i,
        /\$\d+/i
      ];
      
      pricePatternsToRemove.forEach(pattern => {
        cleanedQuery = cleanedQuery.replace(pattern, '');
      });
      
      // Trim and clean up the query
      cleanedQuery = cleanedQuery.trim().replace(/\s+/g, ' ');
      
      if (cleanedQuery !== query) {
        console.log(`Cleaned price-related terms from query: "${query}" -> "${cleanedQuery}"`);
        query = cleanedQuery;
      }
    }
    
    // Enhanced category detection - Map common terms to categories
    const categoryMappings = {
      'laptop': 'Laptops',
      'computer': 'Laptops',
      'pc': 'Laptops',
      'notebook': 'Laptops',
      'phone': 'Phones',
      'smartphone': 'Phones',
      'mobile': 'Phones',
      'headphone': 'Audio',
      'earbuds': 'Audio',
      'speaker': 'Audio',
      'watch': 'Wearables',
      'wearable': 'Wearables',
      'tablet': 'Tablets',
      'ipad': 'Tablets',
      'accessory': 'Accessories',
      'accessories': 'Accessories',
      'case': 'Accessories',
      'charger': 'Accessories',
      'furniture': 'Furniture',
      'clothes': 'Clothes',
      'shirt': 'Clothes',
      'shoes': 'Shoes'
    };
      
    // Check if the query contains any category terms
    let detectedCategory = null;
    if (query) {
      const queryCategoryMatch = Object.keys(categoryMappings).find(term => 
        query.toLowerCase().includes(term.toLowerCase())
      );
      
      if (queryCategoryMatch) {
        detectedCategory = categoryMappings[queryCategoryMatch];
        console.log(`Detected category "${detectedCategory}" from query term "${queryCategoryMatch}"`);
      }
    }
    
    // Filter by explicit category if provided, otherwise use detected category
    const categoryToUse = (category && category.trim() !== '') ? category : detectedCategory;
    
    if (categoryToUse) {
      console.log(`Searching for products in category: "${categoryToUse}"`);
      includeCategory.push({
        model: db.Category,
        where: { 
          name: { [Op.iLike]: `%${categoryToUse}%` }
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
      required: inStock // If inStock is true, require inventory to exist and have stock
    });
    
    // If inStock is true, add stock quantity condition
    if (inStock) {
      console.log('Filtering for in-stock products only');
      // Add a where condition on the Inventory association
      includeCategory[includeCategory.length - 1].where = {
        stock_quantity: { [Op.gt]: 0 }
      };
    }
    
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
      
      // Include inventory count and stock status
      p.inventory = p.Inventory?.stock_quantity || 0;
      p.inStock = p.inventory > 0; // Add this explicit inStock property
      p.stockQuantity = p.inventory; // Add stockQuantity for consistency with ProductService
      
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
 * @param {boolean} inStock - Filter for in-stock products only
 * @returns {Promise<Array>} - Recommended products
 */
export async function getRecommendedProducts(category = null, limit = 5, inStock = false) {
  console.log('getRecommendedProducts called with category:', category, 'limit:', limit, 'inStock:', inStock);
  try {
    const includeOptions = [
      { 
        model: db.Inventory, 
        required: inStock // If inStock is true, require inventory to exist
      }
    ];
    
    // If inStock is true, add stock quantity condition
    if (inStock) {
      console.log('Filtering recommended products for in-stock only');
      // Add a where condition on the Inventory association
      includeOptions[0].where = {
        stock_quantity: { [Op.gt]: 0 }
      };
    }
    
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
    
    console.log(`Found ${products.length} recommended products`);
    
    // Transform products same as in searchProducts
    return products.map(product => {
      const p = product.toJSON();
      
      // Rating calculation skipped (no Reviews included)
      p.rating = null;
      
      // Ensure proper image formatting
      if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
        p.images = ['/api/placeholder/400/400'];
      }
      
      // Include inventory count and stock status
      p.inventory = p.Inventory?.stock_quantity || 0;
      p.inStock = p.inventory > 0; // Add this explicit inStock property
      p.stockQuantity = p.inventory; // Add stockQuantity for consistency
      
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
