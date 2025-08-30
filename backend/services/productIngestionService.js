// Product ingestion service
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import db from '../models/index.js';
import { ProductValidator, ValidationError, transformCsvToProducts } from './validationService.js';
import { storageService } from './storageService.js';
import { sequelize } from '../models/index.js';
import { writeAudit } from '../utils/audit.js';
import { generateSlug } from '../utils/helpers.js';

/**
 * Service for product ingestion across different methods
 */
export class ProductIngestionService {
  /**
   * Create a new ingestion job
   * @param {string} type - Job type ('manual', 'csv', 'api')
   * @param {number} sellerId - ID of the seller
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} The created job
   */
  static async createJob(type, sellerId, options = {}) {
    const job = await db.IngestionJob.create({
      type,
      seller_id: sellerId,
      status: 'queued',
      options,
      stats: {
        total: 0,
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        warnings: 0,
      },
    });
    
    await this.logEvent(job.id, 'info', 'JOB_CREATED', `Started ${type} ingestion job`);
    return job;
  }
  
  /**
   * Log an event for a job
   * @param {number} jobId - ID of the job
   * @param {string} level - Event level ('info', 'warn', 'error')
   * @param {string} code - Event code
   * @param {string} message - Event message
   * @param {Object} payload - Additional data
   * @returns {Promise<Object>} The created event
   */
  static async logEvent(jobId, level, code, message, payload = {}) {
    const now = new Date();
    return db.IngestionEvent.create({
      job_id: jobId,
      level,
      code,
      message,
      payload,
      createdAt: now // Explicitly set createdAt since timestamps are disabled for this model
    });
  }
  
  /**
   * Update job status and stats
   * @param {number} jobId - ID of the job
   * @param {string} status - New status
   * @param {Object} stats - Updated stats
   * @returns {Promise<Object>} The updated job
   */
  static async updateJobStatus(jobId, status, stats = {}) {
    const job = await db.IngestionJob.findByPk(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    job.status = status;
    
    if (stats) {
      job.stats = { ...job.stats, ...stats };
    }
    
    await job.save();
    return job;
  }
  
  /**
   * Process a product ingestion from manual input
   * @param {Object} productData - The product data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} The created/updated product
   */
  static async processManualIngestion(productData, options = {}) {
    const { user, jobId } = options;
    let job;
    
    // Create ingestion job if not provided
    if (!jobId) {
      // Pass null for seller_id since it's a foreign key to Sellers table, not Users table
      job = await this.createJob('manual', null);
    } else {
      job = await db.IngestionJob.findByPk(jobId);
    }
    
    try {
      // Start processing
      await this.updateJobStatus(job.id, 'processing');
      
      // Validate product data
      const validatedProduct = ProductValidator.validate(productData);
      
      // Upsert the product
      const product = await this.upsertProduct(validatedProduct, {
        sellerId: user?.id,
        source: 'manual',
        dedupeKeys: ['sku', 'barcode', 'external_id'],
        jobId: job.id,
      });
      
      // Update job status
      await this.updateJobStatus(job.id, 'done', {
        processed: 1,
        created: product.created ? 1 : 0,
        updated: product.created ? 0 : 1,
      });
      
      // Log audit
      if (user) {
        await writeAudit(
          user.id,
          product.created ? 'create' : 'update',
          'Products',
          product.id,
          { name: product.name, method: 'manual' }
        );
      }
      
      return product;
    } catch (error) {
      // Log error and update job status
      await this.logEvent(job.id, 'error', 'PROCESSING_ERROR', error.message, { error: error.toString() });
      await this.updateJobStatus(job.id, 'failed', { failed: 1 });
      throw error;
    }
  }
  
  /**
   * Process a CSV file ingestion
   * @param {string} filePath - Path to the CSV file
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Job result summary
   */
  static async processCsvIngestion(filePath, options = {}) {
    const { user, jobId, mappings = {}, hasHeader = true, delimiter = ',' } = options;
    let job;
    
    // Create ingestion job if not provided
    if (!jobId) {
      job = await this.createJob('csv', null, {
        originalFilename: path.basename(filePath),
      });
      
      // Store file path in job
      job.file_path = filePath;
      await job.save();
    } else {
      job = await db.IngestionJob.findByPk(jobId);
    }
    
    try {
      // Start processing
      await this.updateJobStatus(job.id, 'processing');
      await this.logEvent(job.id, 'info', 'PROCESSING_STARTED', `Processing CSV file: ${path.basename(filePath)}`);
      
      // Read and parse CSV file
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const records = parse(fileContent, {
        columns: hasHeader,
        skip_empty_lines: true,
        trim: true,
        delimiter,
      });
      
      // Update job with total count
      await this.updateJobStatus(job.id, 'processing', { total: records.length });
      
      // Transform CSV data to product objects
      const products = transformCsvToProducts(records);
      
      // Process each product
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        warnings: 0,
      };
      
      for (const productData of products) {
        try {
          // Validate product data
          const validatedProduct = ProductValidator.validate(productData);
          
          // Upsert the product
          const product = await this.upsertProduct(validatedProduct, {
            sellerId: user?.id,
            source: 'csv',
            dedupeKeys: ['sku', 'barcode', 'external_id'],
            jobId: job.id,
          });
          
          // Update results
          results.processed++;
          if (product.created) {
            results.created++;
          } else {
            results.updated++;
          }
          
          // Log progress every 10 products
          if (results.processed % 10 === 0) {
            await this.updateJobStatus(job.id, 'processing', {
              processed: results.processed,
              created: results.created,
              updated: results.updated,
              failed: results.failed,
              warnings: results.warnings,
            });
          }
        } catch (error) {
          // Log error and continue with next product
          results.failed++;
          results.processed++;
          
          await this.logEvent(job.id, 'error', 'PRODUCT_ERROR', error.message, {
            product: productData.name || 'Unknown product',
            error: error.toString(),
          });
        }
      }
      
      // Update job status with final results
      await this.updateJobStatus(job.id, 'done', results);
      await this.logEvent(
        job.id,
        'info',
        'PROCESSING_COMPLETED',
        `Completed processing ${results.processed} products: ${results.created} created, ${results.updated} updated, ${results.failed} failed`
      );
      
      // Log audit
      if (user) {
        await writeAudit(
          user.id,
          'bulk-import',
          'Products',
          null,
          { method: 'csv', results }
        );
      }
      
      return { job, results };
    } catch (error) {
      // Log error and update job status
      await this.logEvent(job.id, 'error', 'PROCESSING_ERROR', error.message, { error: error.toString() });
      await this.updateJobStatus(job.id, 'failed', { failed: 1 });
      throw error;
    }
  }
  
  /**
   * Process API-based product ingestion
   * @param {Array<Object>} products - Array of product data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Job result summary
   */
  static async processApiIngestion(products, options = {}) {
    const { user, jobId, apiKey } = options;
    let sellerId = null;
    let job;
    
    // If apiKey is provided, find the seller
    if (apiKey) {
      const seller = await db.Seller.findOne({ where: { api_key: apiKey } });
      if (seller) {
        sellerId = seller.id;
      } else {
        throw new Error('Invalid API key');
      }
    }
    
    // Create ingestion job if not provided
    if (!jobId) {
      job = await this.createJob('api', sellerId);
    } else {
      job = await db.IngestionJob.findByPk(jobId);
    }
    
    try {
      // Start processing
      await this.updateJobStatus(job.id, 'processing');
      await this.logEvent(job.id, 'info', 'PROCESSING_STARTED', `Processing ${products.length} products via API`);
      
      // Update job with total count
      await this.updateJobStatus(job.id, 'processing', { total: products.length });
      
      // Process each product
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        warnings: 0,
      };
      
      for (const productData of products) {
        try {
          // Validate product data
          const validatedProduct = ProductValidator.validate(productData);
          
          // Upsert the product
          const product = await this.upsertProduct(validatedProduct, {
            sellerId,
            source: 'api',
            dedupeKeys: ['sku', 'barcode', 'external_id'],
            jobId: job.id,
          });
          
          // Update results
          results.processed++;
          if (product.created) {
            results.created++;
          } else {
            results.updated++;
          }
        } catch (error) {
          // Log error and continue with next product
          results.failed++;
          results.processed++;
          
          await this.logEvent(job.id, 'error', 'PRODUCT_ERROR', error.message, {
            product: productData.name || 'Unknown product',
            error: error.toString(),
          });
        }
      }
      
      // Update job status with final results
      await this.updateJobStatus(job.id, 'done', results);
      await this.logEvent(
        job.id,
        'info',
        'PROCESSING_COMPLETED',
        `Completed processing ${results.processed} products: ${results.created} created, ${results.updated} updated, ${results.failed} failed`
      );
      
      // Log audit
      if (user) {
        await writeAudit(
          user.id,
          'bulk-import',
          'Products',
          null,
          { method: 'api', results }
        );
      }
      
      return { job, results };
    } catch (error) {
      // Log error and update job status
      await this.logEvent(job.id, 'error', 'PROCESSING_ERROR', error.message, { error: error.toString() });
      await this.updateJobStatus(job.id, 'failed', { failed: 1 });
      throw error;
    }
  }
  
  /**
   * Upsert a product and its variants
   * @param {Object} productData - The product data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} The created/updated product
   */
  static async upsertProduct(productData, options = {}) {
    const { sellerId, source, dedupeKeys = ['sku', 'barcode', 'external_id'], jobId } = options;
    let transaction;
    
    try {
      // Start transaction
      transaction = await sequelize.transaction();
      
      // Try to find existing product using dedupe keys
      let existingProduct = null;
      
      // Check by external_id
      if (productData.external_id && dedupeKeys.includes('external_id')) {
        existingProduct = await db.Product.findOne({
          where: { external_id: productData.external_id },
          transaction,
        });
      }
      
      // Check by SKU in variants
      if (!existingProduct && productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          if (variant.sku && dedupeKeys.includes('sku')) {
            const existingVariant = await db.ProductVariant.findOne({
              where: { sku: variant.sku },
              include: [{ model: db.Product }],
              transaction,
            });
            
            if (existingVariant) {
              existingProduct = existingVariant.Product;
              break;
            }
          }
          
          if (variant.barcode && dedupeKeys.includes('barcode')) {
            const existingVariant = await db.ProductVariant.findOne({
              where: { barcode: variant.barcode },
              include: [{ model: db.Product }],
              transaction,
            });
            
            if (existingVariant) {
              existingProduct = existingVariant.Product;
              break;
            }
          }
        }
      }
      
      let product;
      let created = false;
      
      // Extract variant and inventory data
      const variants = productData.variants || [];
      delete productData.variants;
      
      // Extract images
      const images = productData.images || [];
      
      if (existingProduct) {
        // Update existing product
        await existingProduct.update({
          name: productData.name,
          description: productData.description,
          brand: productData.brand,
          category: productData.category,
          price: productData.price || existingProduct.price,
          images: images,
          attributes: productData.attributes,
          slug: productData.slug || existingProduct.slug || generateSlug(productData.name),
          external_id: productData.external_id || existingProduct.external_id,
        }, { transaction });
        
        product = existingProduct;
        
        // Log event for update
        if (jobId) {
          await this.logEvent(jobId, 'info', 'PRODUCT_UPDATED', `Updated product: ${product.name}`, {
            productId: product.id,
          });
        }
      } else {
        // Create new product
        product = await db.Product.create({
          name: productData.name,
          description: productData.description,
          brand: productData.brand,
          category: productData.category,
          price: productData.price || 0,
          images: images,
          attributes: productData.attributes,
          slug: productData.slug || generateSlug(productData.name),
          external_id: productData.external_id,
        }, { transaction });
        
        created = true;
        
        // Log event for creation
        if (jobId) {
          await this.logEvent(jobId, 'info', 'PRODUCT_CREATED', `Created product: ${product.name}`, {
            productId: product.id,
          });
        }
      }
      
      // Process variants
      for (const variantData of variants) {
        let existingVariant = null;
        
        // Try to find existing variant
        if (variantData.sku) {
          existingVariant = await db.ProductVariant.findOne({
            where: { 
              [sequelize.Op.or]: [
                { product_id: product.id, sku: variantData.sku },
                { sku: variantData.sku } // Also check SKU across all products
              ]
            },
            transaction,
          });
        } else if (variantData.barcode) {
          existingVariant = await db.ProductVariant.findOne({
            where: { 
              [sequelize.Op.or]: [
                { product_id: product.id, barcode: variantData.barcode },
                { barcode: variantData.barcode } // Also check barcode across all products
              ]
            },
            transaction,
          });
        }
        
        let variant;
        
        // Extract inventory data
        const inventoryData = variantData.inventory || {};
        delete variantData.inventory;
        
        if (existingVariant) {
          // If variant exists but belongs to another product, log warning and skip
          if (existingVariant.product_id !== product.id) {
            if (jobId) {
              await this.logEvent(jobId, 'warn', 'VARIANT_CONFLICT', 
                `Variant with SKU ${variantData.sku || 'unknown'} already exists for another product`, {
                existingProductId: existingVariant.product_id,
                newProductId: product.id,
              });
            }
            continue;
          }
          
          // Update existing variant
          await existingVariant.update({
            price_cents: variantData.price_cents,
            compare_at_price_cents: variantData.compare_at_price_cents,
            options: variantData.options,
            weight_grams: variantData.weight_grams,
            dimensions: variantData.dimensions,
            currency: variantData.currency || 'USD',
          }, { transaction });
          
          variant = existingVariant;
        } else {
          // Create new variant
          variant = await db.ProductVariant.create({
            product_id: product.id,
            sku: variantData.sku,
            barcode: variantData.barcode,
            price_cents: variantData.price_cents,
            compare_at_price_cents: variantData.compare_at_price_cents,
            options: variantData.options || {},
            weight_grams: variantData.weight_grams,
            dimensions: variantData.dimensions,
            currency: variantData.currency || 'USD',
          }, { transaction });
        }
        
        // Process inventory
        if (inventoryData && (inventoryData.quantity || inventoryData.safety_stock)) {
          let inventory = await db.Inventory.findOne({
            where: { variant_id: variant.id },
            transaction,
          });
          
          if (inventory) {
            // Update existing inventory
            await inventory.update({
              stock_quantity: inventoryData.quantity,
              safety_stock: inventoryData.safety_stock,
              warehouse_id: inventoryData.warehouse_id,
            }, { transaction });
          } else {
            // Create new inventory
            await db.Inventory.create({
              variant_id: variant.id,
              product_id: product.id, // Keep legacy association
              stock_quantity: inventoryData.quantity,
              safety_stock: inventoryData.safety_stock,
              warehouse_id: inventoryData.warehouse_id,
            }, { transaction });
          }
        }
      }
      
      // Create offer if seller is provided and valid
      if (sellerId) {
        // Check if seller exists first
        const seller = await db.Seller.findByPk(sellerId, { transaction });
        if (seller) {
          const existingOffer = await db.Offer.findOne({
            where: { product_id: product.id, seller_id: sellerId },
            transaction,
          });
          
          if (!existingOffer) {
            await db.Offer.create({
              product_id: product.id,
              seller_id: sellerId,
              status: 'active',
            }, { transaction });
          }
        }
      }
      
      // Handle category association
      if (productData.category) {
        // Find or create the category
        const [category] = await db.Category.findOrCreate({
          where: { name: productData.category },
          defaults: { description: `Category for ${productData.category} products` },
          transaction
        });
        
        // Associate product with category
        await db.ProductCategory.create({
          product_id: product.id,
          category_id: category.id
        }, { transaction });
      }
      
      // Commit transaction
      await transaction.commit();
      
      return { ...product.toJSON(), created };
    } catch (error) {
      // Rollback transaction on error
      if (transaction) await transaction.rollback();
      throw error;
    }
  }
  
  /**
   * Attach images to a product or variant
   * @param {number} productId - ID of the product
   * @param {Array<string>} urls - URLs of the images
   * @param {Object} options - Additional options
   * @returns {Promise<Array<Object>>} The created media assets
   */
  static async attachImages(productId, urls, options = {}) {
    const { variantId, purpose = 'gallery' } = options;
    
    // Validate that product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Validate variant if provided
    if (variantId) {
      const variant = await db.ProductVariant.findOne({
        where: { id: variantId, product_id: productId },
      });
      
      if (!variant) {
        throw new Error(`Variant with ID ${variantId} not found for product ${productId}`);
      }
    }
    
    // Create media assets
    const mediaAssets = [];
    
    for (const url of urls) {
      const asset = await db.MediaAsset.create({
        url,
        purpose,
        product_id: productId,
        variant_id: variantId,
      });
      
      mediaAssets.push(asset);
    }
    
    // Update product's images array if no specific variant
    if (!variantId) {
      const existingImages = product.images || [];
      const newImages = [...existingImages];
      
      for (const url of urls) {
        if (!newImages.includes(url)) {
          if (purpose === 'main' && newImages.length > 0) {
            // If it's a main image, put it first
            newImages.unshift(url);
          } else {
            newImages.push(url);
          }
        }
      }
      
      await product.update({ images: newImages });
    }
    
    return mediaAssets;
  }
}

// Export utility function for external use
export const uploadProductImage = async (file, options = {}) => {
  const { folder = 'products' } = options;
  
  // Store the file
  const url = await storageService.storeFile(
    file.buffer || file.data || file,
    file.originalname || 'product.jpg',
    { folder }
  );
  
  return url;
};
