// Product validation schema and utilities
import crypto from 'crypto';

/**
 * Schema validator for product data
 * We're implementing a simple validation system here, but in a real app
 * you might want to use a library like Zod, Joi, or Yup
 */
export class ProductValidator {
  /**
   * Validates a product object against the schema
   * @param {Object} product - Product data to validate
   * @returns {Object} The validated and normalized product
   * @throws {ValidationError} If validation fails
   */
  static validate(product) {
    // Validate required fields
    if (!product.name || typeof product.name !== 'string' || product.name.trim().length === 0) {
      throw new ValidationError('Product name is required');
    }
    
    if (!product.price && !product.variants?.length) {
      throw new ValidationError('Either product price or variants with prices are required');
    }
    
    // If variants are provided, each must have price_cents
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant, index) => {
        if (!variant.price_cents && !variant.price) {
          throw new ValidationError(`Variant at index ${index} must have a price`);
        }
        
        // Convert price to price_cents if needed
        if (variant.price && !variant.price_cents) {
          variant.price_cents = Math.round(parseFloat(variant.price) * 100);
        }
      });
    }
    
    // Normalize price to cents if needed
    if (product.price && !product.price_cents) {
      product.price_cents = Math.round(parseFloat(product.price) * 100);
    }
    
    // Sanitize description (simple HTML stripping)
    if (product.description) {
      product.description = this.sanitizeHtml(product.description);
    }
    
    // Generate slug if not provided
    if (!product.slug) {
      product.slug = this.generateSlug(product.name);
    }
    
    // Validate images format
    if (product.images && !Array.isArray(product.images)) {
      product.images = [];
    }
    
    // Validate attributes
    if (product.attributes && typeof product.attributes !== 'object') {
      product.attributes = {};
    }
    
    return product;
  }
  
  /**
   * Sanitize HTML content to prevent XSS
   * @param {string} html - HTML content to sanitize
   * @returns {string} Sanitized content
   */
  static sanitizeHtml(html) {
    if (!html) return '';
    
    // Simple HTML stripping - in production use a proper sanitizer library
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Generate a URL-friendly slug from a string
   * @param {string} str - The string to convert to a slug
   * @returns {string} The generated slug
   */
  static generateSlug(str) {
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
   * Validate variant data
   * @param {Object} variant - Variant data to validate
   * @returns {Object} The validated variant
   * @throws {ValidationError} If validation fails
   */
  static validateVariant(variant) {
    // Convert price to price_cents if needed
    if (variant.price && !variant.price_cents) {
      variant.price_cents = Math.round(parseFloat(variant.price) * 100);
    }
    
    if (!variant.price_cents) {
      throw new ValidationError('Variant price is required');
    }
    
    // Validate options
    if (variant.options && typeof variant.options !== 'object') {
      variant.options = {};
    }
    
    return variant;
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * CSV column mappings for product imports
 * Maps CSV column names to product model fields
 */
export const CSV_MAPPINGS = {
  // Standard fields
  'name': 'name',
  'title': 'name',
  'product_name': 'name',
  'description': 'description',
  'product_description': 'description',
  'price': 'price',
  'cost': 'price',
  'price_usd': 'price',
  'brand': 'brand',
  'brand_name': 'brand',
  'category': 'category',
  'category_name': 'category',
  'sku': 'sku',
  'product_sku': 'sku',
  'barcode': 'barcode',
  'upc': 'barcode',
  'gtin': 'barcode',
  'ean': 'barcode',
  'external_id': 'external_id',
  'product_id': 'external_id',
  
  // Image fields
  'image': 'image_url',
  'image_url': 'image_url',
  'main_image': 'image_url',
  'gallery_images': 'gallery_images',
  'additional_images': 'gallery_images',
  
  // Variant fields
  'variant_sku': 'variant.sku',
  'variant_barcode': 'variant.barcode',
  'variant_price': 'variant.price',
  'option1_name': 'variant.option1_name',
  'option1_value': 'variant.option1_value',
  'option2_name': 'variant.option2_name',
  'option2_value': 'variant.option2_value',
  'option3_name': 'variant.option3_name',
  'option3_value': 'variant.option3_value',
  
  // Inventory fields
  'quantity': 'inventory.quantity',
  'stock': 'inventory.quantity',
  'stock_quantity': 'inventory.quantity',
  'inventory': 'inventory.quantity',
  'safety_stock': 'inventory.safety_stock',
};

/**
 * Transform raw CSV data into product objects
 * @param {Array<Object>} rows - CSV rows as objects
 * @returns {Array<Object>} Transformed product objects
 */
export function transformCsvToProducts(rows) {
  const products = new Map(); // Use map to group variants by product
  
  for (const row of rows) {
    // Map CSV columns to product fields
    const productData = {
      name: '',
      price: null,
      description: '',
      category: '',
      brand: '',
      external_id: '',
      images: [],
      attributes: {},
      variants: [],
    };
    
    // Extract variant data if present
    const variantData = {
      sku: '',
      barcode: '',
      price: null,
      options: {},
    };
    
    // Extract inventory data if present
    const inventoryData = {
      quantity: 0,
      safety_stock: 0,
    };
    
    // Map each column using our mappings
    for (const [csvCol, value] of Object.entries(row)) {
      const normalizedCol = csvCol.toLowerCase().trim();
      const targetField = CSV_MAPPINGS[normalizedCol];
      
      if (!targetField) {
        // Unknown column, store as attribute
        productData.attributes[csvCol] = value;
        continue;
      }
      
      // Handle nested fields
      if (targetField.startsWith('variant.')) {
        const variantField = targetField.substring(8); // Remove 'variant.'
        
        if (variantField.startsWith('option') && variantField.endsWith('_name')) {
          // Handle option name/value pairs
          const optionIndex = variantField.match(/\d+/)[0];
          const valueCol = normalizedCol.replace('_name', '_value');
          const optionName = value;
          const optionValue = row[valueCol];
          
          if (optionName && optionValue) {
            variantData.options[optionName] = optionValue;
          }
        } else {
          // Handle other variant fields
          variantData[variantField] = value;
        }
      } else if (targetField.startsWith('inventory.')) {
        // Handle inventory fields
        const inventoryField = targetField.substring(10); // Remove 'inventory.'
        inventoryData[inventoryField] = parseInt(value, 10) || 0;
      } else if (targetField === 'image_url') {
        // Handle main image
        if (value) {
          productData.images.unshift(value); // Add as first image
        }
      } else if (targetField === 'gallery_images') {
        // Handle additional images
        if (value) {
          const additionalImages = value.split(',').map(img => img.trim());
          productData.images.push(...additionalImages);
        }
      } else {
        // Handle regular product fields
        productData[targetField] = value;
      }
    }
    
    // Get existing product or create new one
    const productKey = productData.external_id || productData.name;
    if (!products.has(productKey)) {
      products.set(productKey, {
        ...productData,
        variants: [],
      });
    }
    
    // Add variant if we have variant-specific data
    const product = products.get(productKey);
    if (variantData.sku || variantData.barcode || variantData.price || Object.keys(variantData.options).length > 0) {
      // Convert price to price_cents
      if (variantData.price) {
        variantData.price_cents = Math.round(parseFloat(variantData.price) * 100);
      }
      
      // Add inventory data to variant
      variantData.inventory = inventoryData;
      
      product.variants.push(variantData);
    } else if (inventoryData.quantity > 0) {
      // If we have inventory but no variant, create a default variant
      product.variants.push({
        sku: product.sku || '',
        barcode: product.barcode || '',
        price_cents: product.price ? Math.round(parseFloat(product.price) * 100) : 0,
        options: {},
        inventory: inventoryData,
      });
    }
  }
  
  return Array.from(products.values());
}
