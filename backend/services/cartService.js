import db from '../models/index.js';

/**
 * Add a product to the user's cart
 * @param {number} userId - User ID
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {Promise<Object>} - Updated or created cart item
 */
export async function addToCart(userId, productId, quantity = 1) {
    // Ensure the product exists and has inventory
    const product = await db.Product.findByPk(productId, {
        include: [{ model: db.Inventory, as: 'Inventory' }]
    });
    
    if (!product) {
        throw new Error('Product not found');
    }
    
    // Check inventory if available
    if (product.Inventory && product.Inventory.stock_quantity < quantity) {
        throw new Error('Insufficient inventory');
    }
    
    // Find existing cart item or create new one
    const existing = await db.CartItem.findOne({ 
        where: { user_id: userId, product_id: productId } 
    });
    
    if (existing) {
        // Update quantity
        const newQuantity = existing.quantity + Number(quantity);
        
        // Check if new quantity exceeds inventory
        if (product.Inventory && product.Inventory.stock_quantity < newQuantity) {
            throw new Error('Insufficient inventory');
        }
        
        return existing.update({ quantity: newQuantity });
    } else {
        // Create new cart item
        return db.CartItem.create({ 
            user_id: userId, 
            product_id: productId, 
            quantity: Number(quantity) 
        });
    }
}

/**
 * Get all cart items for a user with product details
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of cart items with product details
 */
export async function getCart(userId) {
    return db.CartItem.findAll({
        where: { user_id: userId },
        include: [{
            model: db.Product,
            include: [
                { model: db.Inventory, as: 'Inventory' },
                { model: db.ProductImage, as: 'ProductImages' }
            ]
        }]
    });
}

/**
 * Update the quantity of a cart item
 * @param {number} itemId - Cart item ID
 * @param {number} userId - User ID (for security)
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} - Updated cart item
 */
export async function updateCartItem(itemId, userId, quantity) {
    const item = await db.CartItem.findOne({
        where: { id: itemId, user_id: userId },
        include: [{
            model: db.Product,
            include: [{ model: db.Inventory, as: 'Inventory' }]
        }]
    });
    
    if (!item) {
        throw new Error('Cart item not found');
    }
    
    // Check inventory
    if (
        item.Product.Inventory && 
        item.Product.Inventory.stock_quantity < quantity
    ) {
        throw new Error('Insufficient inventory');
    }
    
    return item.update({ quantity: Number(quantity) });
}

/**
 * Remove an item from the cart
 * @param {number} itemId - Cart item ID
 * @param {number} userId - User ID (for security)
 * @returns {Promise<boolean>} - Success status
 */
export async function removeCartItem(itemId, userId) {
    const deleted = await db.CartItem.destroy({
        where: { id: itemId, user_id: userId }
    });
    
    return deleted > 0;
}

/**
 * Empty the user's cart
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export async function clearCart(userId) {
    const deleted = await db.CartItem.destroy({
        where: { user_id: userId }
    });
    
    return deleted > 0;
}
