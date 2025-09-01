// Product search API
import express from 'express';
import { Op, Sequelize } from 'sequelize';
import db from '../models/index.js';

const router = express.Router();

/**
 * @api {get} /api/products/search Search products
 * @apiDescription Search products by category, budget, and keywords
 * @apiName SearchProducts
 * @apiGroup Products
 * 
 * @apiParam {String} [query] Keywords to search in product name and description
 * @apiParam {String} [category] Product category 
 * @apiParam {Number} [maxPrice] Maximum price (budget)
 * @apiParam {Number} [minPrice] Minimum price
 * @apiParam {String} [sortBy] Field to sort by (default: 'rating')
 * @apiParam {String} [sortDir] Sort direction (ASC or DESC, default: DESC)
 * @apiParam {Number} [limit] Number of products to return (default: 5)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      query, 
      category, 
      maxPrice, 
      minPrice, 
      sortBy = 'createdAt', 
      sortDir = 'DESC',
      limit = 5
    } = req.query;

    // Build where clause based on search parameters
    const where = {};
    const includeCategory = [];
    
    // Search by keywords in name or description
    if (query) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
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
    
    // Filter by category
    if (category) {
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
    
    // Add inventory to the include
    includeCategory.push({
      model: db.Inventory,
      required: false
    });
    
    // Fetch average rating for sorting by popularity
    let order = [[sortBy, sortDir]];
    if (sortBy === 'rating') {
      // Calculate average rating using a subquery if sorting by rating
      const subquery = `(
        SELECT AVG(r."rating") 
        FROM "Reviews" AS r 
        WHERE r."product_id" = "Product"."id"
      )`;
      
      order = [[Sequelize.literal(subquery), sortDir]];
    }

    // Execute query
    const products = await db.Product.findAll({
      where,
      include: includeCategory,
      order,
      limit: Number(limit)
    });
    
    // Transform data for the response
    const formattedProducts = products.map(product => {
      const p = product.toJSON();
      
      // Ensure proper image formatting
      if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
        p.images = ['/api/placeholder/400/400'];
      }
      
      // Include inventory count
      p.inventory = p.Inventory?.stock_quantity || 0;
      
      // Clean up response
      delete p.Inventory;
      
      return p;
    });

    return res.json({
      success: true,
      data: { 
        products: formattedProducts 
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

export default router;
