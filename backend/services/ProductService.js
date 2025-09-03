// Product Service for the AI Sales Assistant
import db from '../models/index.js';
import { Op } from 'sequelize';
import productRecommendationService from './productRecommendationService.js';

/**
 * Service to handle product-related operations for the AI Sales Assistant
 */
class ProductService {
  /**
   * Search for products based on criteria
   * @param {Object} params - Search parameters
   * @param {string} params.text - Free-text search
   * @param {number|null} params.budget - Maximum price
   * @param {string|null} params.category - Product category
   * @param {string|null} params.brand - Preferred brand
   * @param {Object} params.minSpecFilters - Minimum specifications filters
   * @param {number} params.limit - Maximum number of results
   * @returns {Promise<Array>} Array of matching products
   */
  async search({ text, budget, category, brand, minSpecFilters = {}, limit = 3 }) {
    try {
      console.log('Product search params:', { text, budget, category, brand, limit });
      
      // Map common terms to category names
      const categoryMap = {
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
      
      // Detect category from text if not explicitly provided
      if (!category && text) {
        const textLower = text.toLowerCase();
        for (const [term, categoryName] of Object.entries(categoryMap)) {
          if (textLower.includes(term.toLowerCase())) {
            category = categoryName;
            console.log(`Detected category "${category}" from search text`);
            break;
          }
        }
      }
      
      // Check for price-related queries in the text and extract price constraints
      let extractedMaxPrice = null;
      if (text) {
        // Check for "under $X" or "less than $X" patterns
        const underPriceMatch = text.match(/under\s+\$?(\d+)/i) || 
                               text.match(/less than\s+\$?(\d+)/i) ||
                               text.match(/below\s+\$?(\d+)/i);
        
        if (underPriceMatch && underPriceMatch[1]) {
          extractedMaxPrice = parseInt(underPriceMatch[1], 10);
          console.log(`Extracted price constraint: under $${extractedMaxPrice}`);
        }
        
        // Check for "between $X and $Y" pattern
        const betweenPriceMatch = text.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/i);
        if (betweenPriceMatch && betweenPriceMatch[1] && betweenPriceMatch[2]) {
          const minPrice = parseInt(betweenPriceMatch[1], 10);
          extractedMaxPrice = parseInt(betweenPriceMatch[2], 10);
          console.log(`Extracted price range: $${minPrice} to $${extractedMaxPrice}`);
        }
      }
      
      // Convert parameters for the existing search services
      const searchParams = {
        query: text,
        maxPrice: budget || extractedMaxPrice, // Use extracted price if budget not explicitly provided
        category,
        purpose: minSpecFilters.purpose,
        limit,
        inStock: true // Add this parameter to request in-stock items by default
      };

      // If brand is specified, add it to the query
      if (brand) {
        searchParams.query = `${searchParams.query} ${brand}`.trim();
      }
      
      console.log('Using search params:', searchParams);

      // Use existing service to search products
      const products = await productRecommendationService.searchProducts(searchParams);
      console.log(`Found ${products?.length || 0} products via search`);

      // If no results, get fallback recommendations
      if (!products || products.length === 0) {
        console.log('No search results, getting fallback recommendations');
        const fallbackProducts = await productRecommendationService.getRecommendedProducts(
          category, 
          limit,
          searchParams.inStock // Pass inStock parameter to fallback recommendations
        );
        console.log(`Found ${fallbackProducts?.length || 0} fallback products`);
        return fallbackProducts;
      }

      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get product details by ID
   * @param {number} productId - The product ID
   * @returns {Promise<Object|null>} The product details or null if not found
   */
  async getProductById(productId) {
    try {
      const product = await db.Product.findByPk(productId, {
        include: [
          { model: db.Inventory, required: false },
          { model: db.Category, through: { attributes: [] } },
          { model: db.MediaAsset, required: false }
        ]
      });

      if (!product) return null;

      // Format the product for response
      return this.formatProductResponse(product);
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  /**
   * Get multiple products by their IDs
   * @param {Array<number>} productIds - Array of product IDs
   * @returns {Promise<Array>} Array of product details
   */
  async getProductsByIds(productIds) {
    try {
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return [];
      }

      const products = await db.Product.findAll({
        where: { id: { [Op.in]: productIds } },
        include: [
          { model: db.Inventory, required: false },
          { model: db.Category, through: { attributes: [] } },
          { model: db.MediaAsset, required: false }
        ]
      });

      // Format each product
      return products.map(product => this.formatProductResponse(product));
    } catch (error) {
      console.error('Error getting products by IDs:', error);
      return [];
    }
  }

  /**
   * Format a product for response
   * @param {Object} product - The raw product data
   * @returns {Object} Formatted product object
   */
  formatProductResponse(product) {
    const p = product.toJSON();

    // Format images
    let images = [];
    if (p.MediaAssets && p.MediaAssets.length > 0) {
      images = p.MediaAssets.map(asset => asset.url);
    } else if (p.images && Array.isArray(p.images)) {
      images = p.images;
    }

    if (images.length === 0) {
      images = ['/api/placeholder/400/400'];
    }

    // Format categories
    const categories = p.Categories ? p.Categories.map(c => c.name) : [];

    // Get inventory status
    const stockQuantity = p.Inventory ? p.Inventory.stock_quantity : 0;
    const inStock = stockQuantity > 0;

    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      description: p.description || '',
      images,
      categories,
      inStock,
      stockQuantity,
      featured: p.featured || false
    };
  }

  /**
   * Create a summary of a product for the LLM context
   * @param {Object} product - The product to summarize
   * @returns {string} A concise summary of the product
   */
  summarizeForLLM(product) {
    if (!product) return '';

    // Ensure price is properly formatted
    const price = typeof product.price === 'number' 
      ? `$${product.price.toFixed(2)}` 
      : `$${Number(product.price).toFixed(2)}`;
    
    // Debug inventory information
    console.log(`Product ID: ${product.id}, inStock: ${product.inStock}, stockQuantity: ${product.stockQuantity || product.inventory || 0}`);
    
    // Stock status
    const stockStatus = product.inStock || product.inventory > 0 || product.stockQuantity > 0
      ? (product.stockQuantity <= 5 || product.inventory <= 5) 
        ? `Only ${product.stockQuantity || product.inventory} left in stock!` 
        : 'In stock'
      : 'Out of stock';
    
    // Categories
    const categories = Array.isArray(product.categories) && product.categories.length > 0
      ? `Category: ${product.categories.join(', ')}`
      : '';

    return `Product ID: ${product.id}, ${product.name}, ${price}, ${stockStatus}. ${categories}. ${product.description ? product.description.substring(0, 100) : ''}${product.description?.length > 100 ? '...' : ''}`;
  }
}

export default new ProductService();
