// Admin-only endpoints (product CRUD).
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import db from '../models/index.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';
import { ProductIngestionService, uploadProductImage } from '../services/productIngestionService.js';

const router = express.Router();

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// CSV upload storage
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'csv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const csvUpload = multer({ 
  storage: csvStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CSV files
  }
});

router.use(authRequired, adminRequired);

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, category, images, brand, attributes, variants } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: 'Product name is required' });
    
    // Use the product ingestion service for manual product creation
    const result = await ProductIngestionService.processManualIngestion({
      name,
      description,
      price,
      category,
      images: Array.isArray(images) ? images : [],
      brand,
      attributes,
      variants: Array.isArray(variants) ? variants : []
    }, { user: req.user });
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        id: result.id,
        created: result.created 
      }
    });
  } catch (e) {
    console.error('Product creation error:', e);
    // Log more details about the error
    console.error('Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return res.status(500).json({ 
      success: false, 
      error: e.message || 'Create failed' 
    });
  }
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', async (req, res) => {
  try {
    const p = await db.Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, error: 'Not found' });
    
    const { name, description, price, images, brand, attributes, variants } = req.body || {};
    if (images && !Array.isArray(images)) return res.status(400).json({ success: false, error: 'images must be array' });
    
    // Update basic product info
    await p.update({ 
      name, 
      price, 
      images: images ? images.slice(0,10) : undefined, 
      description,
      brand,
      attributes
    });
    
    // Handle variants if provided
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant.id) {
          // Update existing variant
          const existingVariant = await db.ProductVariant.findOne({
            where: { id: variant.id, product_id: p.id }
          });
          
          if (existingVariant) {
            await existingVariant.update({
              sku: variant.sku,
              barcode: variant.barcode,
              price_cents: variant.price_cents || Math.round(variant.price * 100) || 0,
              compare_at_price_cents: variant.compare_at_price_cents,
              options: variant.options || {},
              weight_grams: variant.weight_grams,
              dimensions: variant.dimensions
            });
            
            // Update inventory if provided
            if (variant.inventory) {
              let inventory = await db.Inventory.findOne({
                where: { variant_id: existingVariant.id }
              });
              
              if (inventory) {
                await inventory.update({
                  stock_quantity: variant.inventory.quantity || 0,
                  safety_stock: variant.inventory.safety_stock || 0
                });
              } else {
                await db.Inventory.create({
                  variant_id: existingVariant.id,
                  product_id: p.id,
                  stock_quantity: variant.inventory.quantity || 0,
                  safety_stock: variant.inventory.safety_stock || 0
                });
              }
            }
          }
        } else {
          // Create new variant
          const newVariant = await db.ProductVariant.create({
            product_id: p.id,
            sku: variant.sku,
            barcode: variant.barcode,
            price_cents: variant.price_cents || Math.round(variant.price * 100) || 0,
            compare_at_price_cents: variant.compare_at_price_cents,
            options: variant.options || {},
            weight_grams: variant.weight_grams,
            dimensions: variant.dimensions,
            currency: variant.currency || 'USD'
          });
          
          // Create inventory if provided
          if (variant.inventory) {
            await db.Inventory.create({
              variant_id: newVariant.id,
              product_id: p.id,
              stock_quantity: variant.inventory.quantity || 0,
              safety_stock: variant.inventory.safety_stock || 0
            });
          }
        }
      }
    }
    
    await writeAudit(req.user.id, 'update', 'Products', p.id);
    return res.json({ success: true, data: { id: p.id } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const p = await db.Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, error: 'Not found' });
    await p.destroy();
    await writeAudit(req.user.id, 'delete', 'Products', p.id);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

// POST /api/admin/products/image-upload
router.post('/products/image-upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Upload to storage service
    const url = await uploadProductImage(req.file);
    
    // Return the URL
    return res.json({ success: true, data: { url } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// POST /api/admin/products/:id/images
router.post('/products/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { variantId } = req.body;
    
    // Check if product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if variant exists if variantId is provided
    if (variantId) {
      const variant = await db.ProductVariant.findOne({
        where: { id: variantId, product_id: productId }
      });
      
      if (!variant) {
        return res.status(404).json({ success: false, error: 'Variant not found' });
      }
    }
    
    // Upload each image
    const uploadPromises = req.files.map(file => uploadProductImage(file));
    const urls = await Promise.all(uploadPromises);
    
    // Attach images to product or variant
    const mediaAssets = await ProductIngestionService.attachImages(productId, urls, {
      variantId: variantId ? parseInt(variantId, 10) : null,
      purpose: req.body.purpose || 'gallery'
    });
    
    // Return the URLs
    return res.json({
      success: true,
      data: {
        urls,
        assets: mediaAssets
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Image upload failed' });
  }
});

// POST /api/admin/products/csv-upload
router.post('/products/csv-upload', csvUpload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Process the CSV file
    const result = await ProductIngestionService.processCsvIngestion(req.file.path, {
      user: req.user,
      hasHeader: req.body.hasHeader !== 'false', // Default to true
      delimiter: req.body.delimiter || ','
    });
    
    // Return the job ID and results
    return res.json({
      success: true,
      data: {
        jobId: result.job.id,
        status: result.job.status,
        stats: result.job.stats
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'CSV processing failed: ' + e.message });
  }
});

// GET /api/admin/ingestion-jobs
router.get('/ingestion-jobs', async (req, res) => {
  try {
    const jobs = await db.IngestionJob.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    return res.json({ success: true, data: { jobs } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch ingestion jobs' });
  }
});

// GET /api/admin/ingestion-jobs/:id
router.get('/ingestion-jobs/:id', async (req, res) => {
  try {
    const job = await db.IngestionJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    // Get associated events
    const events = await db.IngestionEvent.findAll({
      where: { job_id: job.id },
      order: [['createdAt', 'ASC']]
    });
    
    return res.json({
      success: true,
      data: {
        job,
        events
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch job details' });
  }
});

// GET /api/admin/sellers
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await db.Seller.findAll({
      order: [['name', 'ASC']]
    });
    
    return res.json({ success: true, data: { sellers } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch sellers' });
  }
});

// POST /api/admin/sellers
router.post('/sellers', async (req, res) => {
  try {
    const { name, contact_email, webhook_url, status } = req.body;
    
    if (!name || !contact_email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }
    
    // Generate API key
    const apiKey = crypto.randomBytes(16).toString('hex');
    
    // Create seller
    const seller = await db.Seller.create({
      name,
      contact_email,
      api_key: apiKey,
      webhook_url,
      status: status || 'active'
    });
    
    await writeAudit(req.user.id, 'create', 'Sellers', seller.id, { name });
    
    return res.status(201).json({
      success: true,
      data: {
        id: seller.id,
        apiKey
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create seller' });
  }
});

// PATCH /api/admin/sellers/:id
router.patch('/sellers/:id', async (req, res) => {
  try {
    const { name, contact_email, webhook_url, status } = req.body;
    
    const seller = await db.Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }
    
    // Update seller
    await seller.update({
      name: name || seller.name,
      contact_email: contact_email || seller.contact_email,
      webhook_url,
      status: status || seller.status
    });
    
    await writeAudit(req.user.id, 'update', 'Sellers', seller.id);
    
    return res.json({
      success: true,
      data: { id: seller.id }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to update seller' });
  }
});

export default router;
