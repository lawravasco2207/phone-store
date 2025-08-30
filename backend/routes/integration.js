// API endpoints for external integrations
import express from 'express';
import { apiKeyAuth } from '../middleware/auth.js';
import { ProductIngestionService } from '../services/productIngestionService.js';

const router = express.Router();

// All routes in this file require API key authentication
router.use(apiKeyAuth);

// POST /api/integration/products/batch
router.post('/products/batch', async (req, res) => {
  try {
    const products = req.body.products;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Request body must contain a products array' 
      });
    }
    
    // Process the products via API ingestion
    const result = await ProductIngestionService.processApiIngestion(products, {
      apiKey: req.headers['x-api-key'],
      sellerId: req.seller.id
    });
    
    return res.json({
      success: true,
      data: {
        jobId: result.job.id,
        status: result.job.status,
        stats: result.results
      }
    });
  } catch (e) {
    console.error('API ingestion error:', e);
    return res.status(500).json({ 
      success: false, 
      error: e.message || 'Processing failed' 
    });
  }
});

// GET /api/integration/products/status/:jobId
router.get('/products/status/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    // Fetch job status
    const job = await db.IngestionJob.findOne({
      where: { id: jobId, seller_id: req.seller.id }
    });
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found or does not belong to this seller' 
      });
    }
    
    // Get events if requested
    let events = [];
    if (req.query.includeEvents === 'true') {
      events = await db.IngestionEvent.findAll({
        where: { job_id: job.id },
        order: [['createdAt', 'ASC']]
      });
    }
    
    return res.json({
      success: true,
      data: {
        job,
        events: req.query.includeEvents === 'true' ? events : undefined
      }
    });
  } catch (e) {
    console.error('API status check error:', e);
    return res.status(500).json({ 
      success: false, 
      error: e.message || 'Status check failed' 
    });
  }
});

// GET /api/integration/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists and belongs to this seller
    const product = await db.Product.findOne({
      where: { id: productId },
      include: [
        {
          model: db.Offer,
          where: { seller_id: req.seller.id },
          required: true
        },
        {
          model: db.ProductVariant,
          include: [
            {
              model: db.Inventory
            }
          ]
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found or does not belong to this seller' 
      });
    }
    
    return res.json({
      success: true,
      data: { product }
    });
  } catch (e) {
    console.error('API product fetch error:', e);
    return res.status(500).json({ 
      success: false, 
      error: e.message || 'Product fetch failed' 
    });
  }
});

export default router;
