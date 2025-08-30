import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get a product by its name
 * @param {string} name - Product name to search for
 * @returns {Promise<Object>} - Product object
 */
export async function getProductByName(name) {
    return db.Product.findOne({ where: { name } });
}

/**
 * Get all products with pagination, sorting, and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.sortBy - Sort field (default: 'id')
 * @param {string} options.sortDir - Sort direction 'ASC' or 'DESC' (default: 'ASC')
 * @param {string} options.category - Filter by category name
 * @param {string} options.search - Search term for product name
 * @returns {Promise<Object>} - Products and pagination info
 */
export async function getProducts(options = {}) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = options.sortBy || 'id';
    const sortDir = options.sortDir || 'ASC';
    
    // Build where clause
    const where = {};
    
    // Add search if provided
    if (options.search) {
        where.name = { [Op.iLike]: `%${options.search}%` };
    }
    
    // Build include for category filtering
    let include = [
        { model: db.Inventory, as: 'Inventory', required: false },
        { model: db.ProductImage, as: 'ProductImages', required: false }
    ];
    
    // Add category filter if provided
    if (options.category) {
        include.push({
            model: db.Category,
            as: 'Categories',
            where: { name: options.category },
            required: true
        });
    } else {
        include.push({
            model: db.Category,
            as: 'Categories',
            required: false
        });
    }
    
    // Execute query
    const { count, rows } = await db.Product.findAndCountAll({
        where,
        include,
        limit,
        offset,
        order: [[sortBy, sortDir]],
        distinct: true
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return {
        products: rows,
        pagination: {
            page,
            limit,
            total: count,
            pages: totalPages
        }
    };
}

/**
 * Get a product by its ID with related data
 * @param {number} id - Product ID
 * @returns {Promise<Object>} - Product with related data
 */
export async function getProductById(id) {
    return db.Product.findByPk(id, {
        include: [
            { model: db.Inventory, as: 'Inventory' },
            { model: db.ProductImage, as: 'ProductImages' },
            { model: db.Category, as: 'Categories' },
            { 
                model: db.Review,
                as: 'Reviews',
                include: [
                    { model: db.User, as: 'User', attributes: ['id', 'name'] }
                ]
            }
        ]
    });
}