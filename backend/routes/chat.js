import express from 'express';
import { AzureOpenAI } from 'openai';
import db from '../models/index.js';
import { Sequelize } from 'sequelize';
import 'dotenv/config';

const router = express.Router();
const sequelize = db.sequelize;

// Helper function to find product info by ID in collections
function findProductInfoById(id, ...productCollections) {
  if (!id) return null;
  
  const idStr = String(id);
  
  // Flatten collections and filter out null/undefined values
  const allProducts = productCollections
    .filter(collection => collection && Array.isArray(collection))
    .flatMap(collection => collection);
  
  // Handle single product objects that might be passed
  const singleProducts = productCollections
    .filter(item => item && !Array.isArray(item))
    .map(item => item);
    
  // Combine all products
  const products = [...allProducts, ...singleProducts];
  
  // Find the product
  const product = products.find(p => p && String(p.id) === idStr);
  
  if (product) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || '',
      categories: product.Categories ? product.Categories.map(c => c.name).join(', ') : ''
    };
  }
  
  return null;
}

// Lazy Azure OpenAI client factory to avoid crashing when env is missing
function getAzureClient() {
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.OPENAI_API_VERSION || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    
    if (!apiKey || !baseURL) {
      console.warn('Azure OpenAI credentials missing (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT)');
      return null;
    }
    
    return new AzureOpenAI({ apiKey, baseURL, apiVersion });
  } catch (error) {
    console.error('Failed to initialize Azure OpenAI client:', error);
    return null;
  }
}

// Regular chat endpoint (without tool calls)
router.post('/', async (req, res) => {
  try {
    const { message, userId } = req.body;

    // fetch user + cart + last order 
    const user = userId ? await db.User.findByPk(userId, {
      include: [
        { model: db.CartItem, include: [db.Product] },
        { model: db.Order, limit: 1, order: [['createdAt', 'DESC']], include: [db.OrderItem] }
      ]
    }) : null;

    // Build context for AI 
    const context = `
      User: ${user?.name || 'Guest'}
      Cart: ${user?.CartItems?.map(ci => `${ci.Product.name} x${ci.quantity}`).join(', ') || 'Empty'}
      Last Order: ${user?.Orders?.[0]?.id || 'None'}
    `;

    // call azure openai when configured, else fallback
    const client = getAzureClient();
    let reply = '';
    if (client) {
      const completion = await client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful e-commerce assistant for a phone store.' },
          { role: 'system', content: `Context: ${context}` },
          { role: 'user', content: message }
        ],
        max_tokens: 500
      });
      reply = completion.choices?.[0]?.message?.content || '';
    } else {
      // graceful local fallback
      reply = `Hi${user?.name ? ' ' + user.name : ''}! I can't reach the AI service right now, but I can still help. You asked: "${message}". For product info, try browsing categories or search. If you need specs, open the product page.`;
    }

    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Chatbot error' });
  }
});

// Chat with tool calls endpoint
router.post('/with-tools', async (req, res) => {
  try {
    const { message, userId, context = {} } = req.body;
    
    // Extract the shopping flow state from context
    const { 
      shoppingFlowState = 'initial', 
      lastCategory = '', 
      lastSearchQuery = '',
      selectedProductId = ''
    } = context;

    // Fetch user with cart, orders, and reviews
    let user = null;
    try {
      user = userId ? await db.User.findByPk(userId, {
        include: [
          { model: db.CartItem, include: [db.Product] },
          { model: db.Order, limit: 3, order: [['createdAt', 'DESC']], include: [
            { model: db.OrderItem, include: [db.Product] }
          ]},
          { model: db.Review, limit: 5, order: [['createdAt', 'DESC']], include: [db.Product] }
        ]
      }) : null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Continue with null user
    }

    // Get trending and latest products with error handling
    let trendingProducts = [];
    let latestProducts = [];
    let selectedProduct = null;
    let categoryProducts = [];
    
    try {
      // Get trending products (most ordered)
      trendingProducts = await db.Product.findAll({
        include: [
          { 
            model: db.OrderItem,
            required: false
          },
          { 
            model: db.Category,
            required: false
          },
          { 
            model: db.Inventory,
            required: false
          }
        ],
        // Use simple ordering by created date as fallback
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    } catch (error) {
      console.error('Error fetching trending products:', error);
      // Try a simpler query as fallback
      try {
        trendingProducts = await db.Product.findAll({
          limit: 5,
          order: [['createdAt', 'DESC']]
        });
      } catch (fallbackError) {
        console.error('Fallback trending products query failed:', fallbackError);
      }
    }
    
    try {
      // Get latest products
      latestProducts = await db.Product.findAll({
        include: [
          { 
            model: db.Category,
            required: false
          }, 
          { 
            model: db.Inventory,
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    } catch (error) {
      console.error('Error fetching latest products:', error);
      // Try a simpler query as fallback
      try {
        latestProducts = await db.Product.findAll({
          limit: 5,
          order: [['createdAt', 'DESC']]
        });
      } catch (fallbackError) {
        console.error('Fallback latest products query failed:', fallbackError);
      }
    }
    
    // If we have a selectedProductId, fetch the product details
    if (selectedProductId) {
      try {
        selectedProduct = await db.Product.findByPk(selectedProductId, {
          include: [
            { model: db.Category },
            { model: db.Inventory },
            { model: db.Review, limit: 3, order: [['createdAt', 'DESC']] }
          ]
        });
      } catch (error) {
        console.error('Error fetching selected product:', error);
        // Continue with null selectedProduct
      }
    }
    
    // If we have a lastCategory, fetch products in that category
    if (lastCategory) {
      try {
        const category = await db.Category.findOne({
          where: {
            name: {
              [Sequelize.Op.iLike]: `%${lastCategory}%`
            }
          }
        });
        
        if (category) {
          categoryProducts = await db.Product.findAll({
            include: [
              { 
                model: db.Category,
                where: { id: category.id }
              },
              { model: db.Inventory }
            ],
            limit: 5
          });
        }
      } catch (error) {
        console.error('Error fetching category products:', error);
        // Continue with empty array
      }
    }
    
    // If we have a lastSearchQuery, fetch search results
    let searchResults = [];
    if (lastSearchQuery) {
      try {
        searchResults = await db.Product.findAll({
          where: {
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.iLike]: `%${lastSearchQuery}%` } },
              { description: { [Sequelize.Op.iLike]: `%${lastSearchQuery}%` } }
            ]
          },
          include: [
            { model: db.Category },
            { model: db.Inventory }
          ],
          limit: 5
        });
      } catch (error) {
        console.error('Error fetching search results:', error);
        // Continue with empty array
      }
    }

    // Build detailed cart info
    const cartItems = user?.CartItems || [];
    const cartItemsText = cartItems.length > 0 
      ? cartItems.map(ci => `${ci.Product.name} (ID: ${ci.Product.id}) x${ci.quantity} - $${ci.Product.price}`).join(', ')
      : 'Empty';
    
    // Build order history
    const orderHistory = user?.Orders?.map(order => {
      const items = order.OrderItems.map(item => 
        `${item.Product.name} x${item.quantity} at $${item.price_at_purchase}`
      ).join(', ');
      
      return `Order #${order.id} (${order.order_status}): ${items}`;
    }).join('\n') || 'No order history';
    
    // Build product recommendations
    const trendingProductsText = trendingProducts.map(p => 
      `${p.name} (ID: ${p.id}) - $${p.price} - ${p.Inventory?.stock_quantity || 0} in stock - Categories: ${p.Categories.map(c => c.name).join(', ')}`
    ).join('\n');
    
    const latestProductsText = latestProducts.map(p => 
      `${p.name} (ID: ${p.id}) - $${p.price} - ${p.Inventory?.stock_quantity || 0} in stock - Categories: ${p.Categories.map(c => c.name).join(', ')}`
    ).join('\n');
    
    // Build category products text if available
    const categoryProductsText = categoryProducts.length > 0
      ? categoryProducts.map(p => 
        `${p.name} (ID: ${p.id}) - $${p.price} - ${p.Inventory?.stock_quantity || 0} in stock - Categories: ${p.Categories.map(c => c.name).join(', ')}`
      ).join('\n')
      : '';
      
    // Build search results text if available
    const searchResultsText = searchResults.length > 0
      ? searchResults.map(p => 
        `${p.name} (ID: ${p.id}) - $${p.price} - ${p.Inventory?.stock_quantity || 0} in stock - Categories: ${p.Categories.map(c => c.name).join(', ')}`
      ).join('\n')
      : '';
      
    // Build selected product text if available
    const selectedProductText = selectedProduct
      ? `Selected Product:
         Name: ${selectedProduct.name} (ID: ${selectedProduct.id})
         Price: $${selectedProduct.price}
         Stock: ${selectedProduct.Inventory?.stock_quantity || 0} units
         Description: ${selectedProduct.description || 'No description available'}
         Categories: ${selectedProduct.Categories.map(c => c.name).join(', ')}
         Reviews: ${selectedProduct.Reviews.length > 0 
           ? selectedProduct.Reviews.map(r => `${r.rating}/5 stars - ${r.comment}`).join('; ') 
           : 'No reviews yet'}`
      : '';
    
    // Build comprehensive context
    const dbContext = `
      USER INFORMATION:
      User: ${user?.name || 'Guest'} (ID: ${user?.id || 'anonymous'})
      Email: ${user?.email || 'Not logged in'}
      
      CART CONTENTS:
      ${cartItemsText}
      
      ORDER HISTORY:
      ${orderHistory}
      
      TRENDING PRODUCTS:
      ${trendingProductsText}
      
      LATEST PRODUCTS:
      ${latestProductsText}
      ${categoryProductsText ? `\nCATEGORY PRODUCTS (${lastCategory}):\n${categoryProductsText}` : ''}
      ${searchResultsText ? `\nSEARCH RESULTS (${lastSearchQuery}):\n${searchResultsText}` : ''}
      ${selectedProductText ? `\n${selectedProductText}` : ''}
    `;
    
    // Include shopping flow state in context
    const shoppingFlowContext = `
      CURRENT SHOPPING STATE:
      Flow State: ${shoppingFlowState}
      Last Category: ${lastCategory}
      Last Search: ${lastSearchQuery}
      Selected Product ID: ${selectedProductId}
    `;

    // Define the available tools
    const tools = [
      {
        type: "function",
        function: {
          name: "searchProducts",
          description: "Search for products in the store",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "showProduct",
          description: "Show details for a specific product",
          parameters: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The product ID"
              }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "addToCart",
          description: "Add a product to the cart",
          parameters: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The product ID"
              },
              quantity: {
                type: "number",
                description: "The quantity to add (default: 1)"
              }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "removeFromCart",
          description: "Remove a product from the cart",
          parameters: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The cart item ID to remove"
              }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "openCheckout",
          description: "Open the checkout page",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    // System prompt for voice shopping assistant - now with context awareness
    const systemPrompt = [
      "You are ShopBot, a **friendly and persuasive AI-powered voice shopping assistant** for our e-commerce store, E-Com.",
      "Your role is not only to guide customers through the store but also to **actively sell products, create excitement, and build trust**.",
      "",
      "🎯 CORE BEHAVIOR:",
      "- Always greet warmly with enthusiasm, as if you’re a real in-store sales assistant.",
      "- Make customers feel understood: acknowledge their needs and reframe products as solutions to those needs.",
      "- Sell emotions, not just specs: emphasize reliability, style, comfort, status, or joy the product will bring.",
      "- Use natural **sales cadence**: introduce → highlight → compare → recommend → close.",
      "",
      "📋 SHOPPING FLOW:",
      "- If the flow state is `initial`, welcome the user warmly, introduce the store, and highlight popular categories with energy.",
      "- If browsing, showcase products in the selected category with excitement, mentioning **2–3 highlights** (e.g. best price, trending model, premium choice).",
      "- If viewing a specific product, show its details (name, price, short description) but also:",
      "  - Recommend it based on the customer’s intent.",
      "  - Compare it with 1–2 other options in the same category (budget vs premium).",
      "  - Create urgency (e.g., \"limited stock\", \"popular choice this week\").",
      "- If in the cart, remind them what’s inside, suggest one related upsell (“customers also add…”), and encourage checkout.",
      "- If in checkout, hand over to `openCheckout()`, reminding them for security voice is disabled there.",
      "",
      "🛠 TOOL USAGE:",
      "- When users ask broadly: mention categories first, then use `searchProducts(query)`.",
      "- When a product name is given (e.g. \"iPhone 15\"): immediately use `showProduct(productId)`.",
      "- When cart changes: use `addToCart()` or `removeFromCart()` with correct IDs.",
      "- For payment: always use `openCheckout()`.",
      "",
      "💡 SALES STRATEGY:",
      "- Use **anchoring bias**: show a higher-priced option first, then position a mid-tier option as “best value.”",
      "- Offer **promo codes** (“I can apply a 5% promo code today to save you some cash”).",
      "- Compare products clearly: \"This laptop is perfect for programmers because it has 16GB RAM and fast SSD, while this cheaper one has 8GB RAM, so you may notice lag if coding heavily.\"",
      "- Frame purchases emotionally:",
      "  - Phones = status, creativity, productivity.",
      "  - Laptops = power, speed, reliability.",
      "  - Shoes = comfort, style, confidence.",
      "  - Clothes = self-expression, uniqueness.",
      "  - Furniture = comfort, family, lifestyle.",
      "  - Accessories = convenience, fashion.",
      "",
      "🎤 VOICE & TONE:",
      "- Keep sentences short and conversational.",
      "- Speak like a helpful, enthusiastic store assistant who’s rooting for the customer.",
      "- Use natural persuasion: \"I think you’ll really enjoy this one, especially if you’re looking for…\".",
      "- Avoid sounding like a robot.",
      "",
      "🔒 SECURITY RULES:",
      "- Never ask for or store sensitive data (card details, passwords, etc.).",
      "- Always redirect payments to `openCheckout()`.",
      "- Protect customer data privacy at all times.",
      "",
      "⚡ CONTEXT AWARENESS:",
      `- Current flow state: ${shoppingFlowState}`,
      `- Database context: ${dbContext}`,
      `- Session context: ${shoppingFlowContext}`,
      ""
    ].join('\n');

    // Call Azure OpenAI when configured, else fallback
    const client = getAzureClient();
    let reply = '';
    let toolCalls = [];
    
    if (client) {
      try {
        const completion = await client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          tools: tools,
          tool_choice: "auto",
          max_tokens: 500
        });
        
        const assistantMessage = completion.choices?.[0]?.message;
        reply = assistantMessage?.content || '';
        toolCalls = assistantMessage?.tool_calls || [];
        
        // If there's a tool call but no reply content, generate a default message based on flow state
        if (toolCalls.length > 0 && !reply) {
          const toolNames = toolCalls.map(tc => tc.function.name).join(', ');
          
          if (toolNames.includes('searchProducts')) {
            const searchArgs = toolCalls.find(tc => tc.function.name === 'searchProducts')?.function?.arguments;
            if (searchArgs) {
              try {
                const { query } = JSON.parse(searchArgs);
                reply = `Let me find "${query}" for you. Here are some products that might match what you're looking for.`;
              } catch (e) {
                reply = "Let me show you some products that might interest you.";
              }
            } else {
              reply = "Let me show you some products that might interest you.";
            }
          } else if (toolNames.includes('showProduct')) {
            const productArgs = toolCalls.find(tc => tc.function.name === 'showProduct')?.function?.arguments;
            if (productArgs) {
              try {
                const { id } = JSON.parse(productArgs);
                // Try to find product info in the context
                const productInfo = findProductInfoById(id, trendingProducts, latestProducts, categoryProducts, searchResults);
                if (productInfo) {
                  reply = `Here are the details for ${productInfo.name}. It's priced at $${productInfo.price}. Would you like to add it to your cart?`;
                } else {
                  reply = "Here are the details for that product. Would you like to add it to your cart?";
                }
              } catch (e) {
                reply = "Here are the details for that product. Would you like to add it to your cart?";
              }
            } else {
              reply = "Here are the details for that product. Would you like to add it to your cart?";
            }
          } else if (toolNames.includes('addToCart')) {
            const cartArgs = toolCalls.find(tc => tc.function.name === 'addToCart')?.function?.arguments;
            if (cartArgs) {
              try {
                const { id } = JSON.parse(cartArgs);
                const productInfo = findProductInfoById(id, trendingProducts, latestProducts, categoryProducts, searchResults, [selectedProduct].filter(Boolean));
                if (productInfo) {
                  reply = `Great choice! I've added the ${productInfo.name} to your cart. Would you like to continue shopping or checkout?`;
                } else {
                  reply = "Great choice! I've added that item to your cart. Would you like to continue shopping or checkout?";
                }
              } catch (e) {
                reply = "Great choice! I've added that item to your cart. Would you like to continue shopping or checkout?";
              }
            } else {
              reply = "Great choice! I've added that item to your cart. Would you like to continue shopping or checkout?";
            }
          } else if (toolNames.includes('removeFromCart')) {
            reply = "I've removed that item from your cart. Is there anything else you'd like to do?";
          } else if (toolNames.includes('openCheckout')) {
            reply = "I'm taking you to checkout now. Please note that voice control is disabled during checkout for security reasons. You can continue using the screen to complete your purchase.";
          } else {
            reply = "I'm getting that information for you right now.";
          }
        }
        
        console.log('OpenAI response:', { 
          reply, 
          toolCalls: JSON.stringify(toolCalls)
        });
        
      } catch (error) {
        console.error('OpenAI API error:', error);
        reply = "I'm having trouble connecting to my services. Please try again in a moment.";
      }
    } else {
      // Graceful local fallback
      reply = `Hi${user?.name ? ' ' + user.name : ''}! I can't reach the AI service right now, but I can still help with your shopping needs. What kind of phone are you looking for today?`;
    }

    res.json({ 
      success: true, 
      message: reply,
      toolCalls
    });
  } catch (err) {
    console.error('Chat with tools error:', err);
    res.status(500).json({ success: false, error: 'Chatbot error' });
  }
});

export default router;