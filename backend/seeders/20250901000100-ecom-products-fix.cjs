'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if records exist before inserting
    const checkExists = async (table, whereClause) => {
      try {
        const records = await queryInterface.sequelize.query(
          `SELECT * FROM "${table}" WHERE ${Object.keys(whereClause).map(key => `"${key}" = ?`).join(' AND ')}`,
          { 
            replacements: Object.values(whereClause),
            type: Sequelize.QueryTypes.SELECT 
          }
        );
        return records.length > 0;
      } catch (error) {
        console.error(`Error checking if record exists in ${table}:`, error.message);
        return false;
      }
    };

    // Starting IDs (to avoid conflicts with existing data)
    const CATEGORY_START_ID = 100;
    const PRODUCT_START_ID = 100;
    const INVENTORY_START_ID = 100;

    try {
      // Create e-com categories (if they don't exist)
      const categories = [
        { id: CATEGORY_START_ID, name: 'Phones', description: 'Smartphones and mobile devices', createdAt: new Date(), updatedAt: new Date() },
        { id: CATEGORY_START_ID + 1, name: 'Laptops', description: 'Portable computers for work and play', createdAt: new Date(), updatedAt: new Date() },
        { id: CATEGORY_START_ID + 2, name: 'Accessories', description: 'Tech accessories and peripherals', createdAt: new Date(), updatedAt: new Date() },
        { id: CATEGORY_START_ID + 3, name: 'Furniture', description: 'Home and office furniture', createdAt: new Date(), updatedAt: new Date() },
        { id: CATEGORY_START_ID + 4, name: 'Shoes', description: 'Footwear for all occasions', createdAt: new Date(), updatedAt: new Date() },
        { id: CATEGORY_START_ID + 5, name: 'Clothes', description: 'Apparel and clothing items', createdAt: new Date(), updatedAt: new Date() }
      ];

      // Insert categories
      for (const category of categories) {
        const exists = await checkExists('Categories', { name: category.name });
        if (!exists) {
          await queryInterface.bulkInsert('Categories', [category], {});
          console.log(`Created category: ${category.name}`);
        } else {
          console.log(`Category ${category.name} already exists, skipping creation`);
        }
      }

      // Get the actual category IDs (they might differ from our expected IDs)
      const categoryIds = {};
      for (const category of categories) {
        const [result] = await queryInterface.sequelize.query(
          `SELECT id FROM "Categories" WHERE name = ?`,
          {
            replacements: [category.name],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        if (result) {
          categoryIds[category.name] = result.id;
        } else {
          categoryIds[category.name] = category.id; // Fallback to our preset ID
        }
      }

      // Products data - All images now use Unsplash which has permissive CORS policies
      const productsData = [
        // Phones Category
        {
          name: "iPhone 15 Pro",
          description: "Apple's latest flagship with A17 Pro chip, 120Hz ProMotion display, and titanium design.",
          price: 999,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1695048133142-1a2be8632d0d?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "Samsung Galaxy S23 Ultra",
          description: "Featuring a 200MP camera, S Pen functionality, and Snapdragon 8 Gen 2 processor.",
          price: 1199,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1675454758590-41aeba9fb7d6?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "Google Pixel 8 Pro",
          description: "Google's AI-powered smartphone with incredible camera capabilities and pure Android experience.",
          price: 899,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1698863933285-54c3ba0f3df5?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "OnePlus 12",
          description: "Flagship killer with Snapdragon 8 Gen 3, Hasselblad cameras and 100W fast charging.",
          price: 799,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1682687982204-f1a77dcc3067?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "Xiaomi 14 Ultra",
          description: "Premium smartphone with Leica optics, Snapdragon 8 Gen 3, and 120W HyperCharge.",
          price: 899,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1611407019488-0a354079be44?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "Nothing Phone (2)",
          description: "Distinctive transparent design with Glyph interface and clean Android experience.",
          price: 699,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1678911820864-e5cfd1367799?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "Motorola Edge 50 Pro",
          description: "Curved display with 144Hz refresh rate, 125W TurboPower charging, and impressive camera system.",
          price: 499,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "OPPO Find X7 Ultra",
          description: "Quad camera system with dual periscope lenses and MediaTek Dimensity 9300 processor.",
          price: 1099,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1669146122306-f2ef8d00eff7?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "TECNO Phantom X2 Pro",
          description: "First retractable portrait lens in a smartphone with MediaTek Dimensity 9000 chipset.",
          price: 699,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },
        {
          name: "Sony Xperia 1 V",
          description: "Pro-grade camera system with 4K 120fps recording and dedicated camera shutter button.",
          price: 1299,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1530319067432-f2a729c03db5?w=800&auto=format&fit=crop"
          ]),
          category: "Phones"
        },

        // Laptops Category
        {
          name: "MacBook Pro 16-inch (M3 Max)",
          description: "Powerful laptop with M3 Max chip, up to 128GB unified memory, and stunning Liquid Retina XDR display.",
          price: 3499,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "Dell XPS 15",
          description: "Premium Windows laptop with 13th Gen Intel Core processors and NVIDIA GeForce RTX graphics.",
          price: 1899,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "Lenovo ThinkPad X1 Carbon",
          description: "Business-class ultrabook with military-grade durability, Intel vPro, and legendary keyboard.",
          price: 1649,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1602080858428-57174f9431cf?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "ASUS ROG Zephyrus G14",
          description: "Powerful gaming laptop with AMD Ryzen 9, NVIDIA RTX 4090, and AniMe Matrix display.",
          price: 1999,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "HP Spectre x360 14",
          description: "Premium 2-in-1 convertible with OLED display, Intel Evo platform, and gem-cut design.",
          price: 1499,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1629751372750-3a9d8ec13c98?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "Microsoft Surface Laptop Studio 2",
          description: "Versatile creative workstation with unique hinge design and NVIDIA RTX graphics.",
          price: 2399,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1625171515035-8d1db0192c70?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "Razer Blade 16",
          description: "Ultimate gaming laptop with Intel Core i9, NVIDIA RTX 4090, and dual-mode mini-LED display.",
          price: 3299,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "LG Gram 17",
          description: "Ultra-lightweight 17-inch laptop with all-day battery life and Intel Evo certification.",
          price: 1499,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "Acer Swift Edge 16",
          description: "World's lightest 16-inch OLED laptop with AMD Ryzen processors and premium design.",
          price: 1299,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },
        {
          name: "Framework Laptop 16",
          description: "Modular, upgradeable laptop with customizable expansion cards and replaceable components.",
          price: 1699,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop"
          ]),
          category: "Laptops"
        },

        // Accessories Category
        {
          name: "AirPods Pro (2nd Generation)",
          description: "Active noise cancellation earbuds with spatial audio and adaptive transparency mode.",
          price: 249,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Samsung Galaxy Watch 6 Classic",
          description: "Premium smartwatch with rotating bezel, health tracking, and Wear OS powered by Samsung.",
          price: 399,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Anker 737 Power Bank",
          description: "140W portable charger with 24,000mAh capacity, digital display, and fast charging support.",
          price: 149,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Sony WH-1000XM5",
          description: "Premium noise-cancelling headphones with industry-leading audio quality and 30-hour battery life.",
          price: 399,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Logitech MX Master 3S",
          description: "Advanced wireless mouse with quiet clicks, 8K DPI tracking, and customizable buttons.",
          price: 99,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Keychron Q1 Pro",
          description: "Wireless mechanical keyboard with QMK/VIA support, hot-swappable switches, and aluminum body.",
          price: 199,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1573643808568-4a3c26f3a06a?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Twelve South BookArc",
          description: "Vertical desktop stand for MacBooks with cable management and space-saving design.",
          price: 59,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1602080858428-57174f9431cf?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Peak Design Everyday Backpack",
          description: "Versatile camera and tech backpack with innovative FlexFold dividers and expandable side pockets.",
          price: 279,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Apple MagSafe Charger",
          description: "Wireless charger that perfectly aligns with iPhone magnets for efficient charging.",
          price: 39,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1600490722773-35753aea6332?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },
        {
          name: "Elgato Stream Deck MK.2",
          description: "Customizable control panel with 15 LCD keys for streamers, content creators, and professionals.",
          price: 149,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1614285457768-646f65ca8548?w=800&auto=format&fit=crop"
          ]),
          category: "Accessories"
        },

        // Furniture Category
        {
          name: "Herman Miller Aeron Chair",
          description: "Ergonomic office chair with PostureFit SL and 8Z Pellicle suspension material for comfort.",
          price: 1395,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1595520407624-65a57e218fb1?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "Article Sven Sofa",
          description: "Mid-century modern leather sofa with tufted bench seat and sturdy corner-blocked wooden frame.",
          price: 1799,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "West Elm Mid-Century Bed",
          description: "Solid wood bed frame with tapered legs and FSC-certified materials in walnut finish.",
          price: 1499,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "Floyd The Table",
          description: "Modular dining table with linoleum top and birch wood legs, designed for easy assembly.",
          price: 795,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "IKEA KALLAX Shelf Unit",
          description: "Versatile cube storage system that can be used horizontally or vertically with optional inserts.",
          price: 159,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1595428774223-ef52624120ec?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "Crate & Barrel Lounge II Sofa",
          description: "Deep, comfortable sofa with down-blend cushions and durable upholstery in various colors.",
          price: 2199,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "Room & Board Copenhagen Bookcase",
          description: "Solid wood bookcase with adjustable shelves and clean, Scandinavian-inspired design.",
          price: 1799,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "Burrow Nomad Sectional",
          description: "Modular sectional sofa with built-in USB charger, stain-resistant fabric, and tool-free assembly.",
          price: 2495,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "Fully Jarvis Standing Desk",
          description: "Award-winning adjustable height desk with powerful motor and customizable options.",
          price: 599,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },
        {
          name: "CB2 Stairway White Bookcase",
          description: "Wall-mounted bookcase with five floating shelves for a minimal, space-saving design.",
          price: 399,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=800&auto=format&fit=crop"
          ]),
          category: "Furniture"
        },

        // Shoes Category
        {
          name: "Nike Air Jordan 1 Retro High OG",
          description: "Iconic basketball shoes with full-grain leather and Nike Air cushioning in classic colorways.",
          price: 180,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "Adidas Ultraboost 24",
          description: "Premium running shoes with responsive Boost midsole and Primeknit upper for adaptive support.",
          price: 190,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "On Cloud X",
          description: "Lightweight, versatile training shoes with CloudTec cushioning and zero-gravity foam.",
          price: 149,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "New Balance 990v6",
          description: "Premium made-in-USA running shoes with ENCAP midsole cushioning and suede/mesh upper.",
          price: 199,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "Converse Chuck Taylor All Star",
          description: "Classic canvas high-top sneakers with iconic design and vulcanized rubber sole.",
          price: 60,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1494496195158-c3becb4f2475?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "HOKA Clifton 9",
          description: "Lightweight, cushioned running shoes with balanced meta-rocker geometry for smooth stride.",
          price: 145,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "Dr. Martens 1460 Boots",
          description: "Iconic 8-eye leather boots with signature yellow stitching and air-cushioned sole.",
          price: 170,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1610398752800-146f269dfcc8?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "Vans Old Skool",
          description: "Classic skate shoes with suede and canvas upper featuring the iconic side stripe.",
          price: 70,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "Birkenstock Arizona",
          description: "Classic two-strap sandals with contoured cork footbed that molds to your feet.",
          price: 110,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1600855685699-a211e1cc867a?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },
        {
          name: "Allbirds Wool Runners",
          description: "Sustainable sneakers made from ZQ Merino wool with cushioned midsole and minimalist design.",
          price: 110,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1584735175315-9d5df23be5c1?w=800&auto=format&fit=crop"
          ]),
          category: "Shoes"
        },

        // Clothes Category
        {
          name: "Lululemon ABC Pants Classic",
          description: "Versatile, comfortable pants with four-way stretch Warpstreme fabric and hidden pockets.",
          price: 128,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Patagonia Better Sweater",
          description: "Fleece jacket made with 100% recycled polyester and Fair Trade Certified sewn.",
          price: 159,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Everlane The Organic Cotton Crew",
          description: "Premium t-shirt made from 100% organic cotton with a classic, relaxed fit.",
          price: 30,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Uniqlo Ultra Light Down Jacket",
          description: "Lightweight, packable down jacket with water-repellent coating and compact carrying pouch.",
          price: 69,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Levi's 501 Original Fit Jeans",
          description: "Iconic straight leg jeans with button fly and signature leather patch.",
          price: 98,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Madewell The Perfect Vintage Jean",
          description: "High-rise jeans with tapered leg, vintage-inspired look and comfort stretch denim.",
          price: 128,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Polo Ralph Lauren Oxford Shirt",
          description: "Classic button-down shirt in breathable cotton oxford with signature pony embroidery.",
          price: 98,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "The North Face ThermoBall Eco Jacket",
          description: "Packable insulated jacket with recycled ThermoBall Eco insulation equivalent to 600-fill down.",
          price: 230,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1606028629488-e9570c9ae43b?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Vuori Sunday Performance Jogger",
          description: "Lightweight, moisture-wicking joggers with four-way stretch fabric for all-day comfort.",
          price: 98,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        },
        {
          name: "Madewell Lightweight Cardigan Sweater",
          description: "Versatile cardigan in soft, lightweight yarn with relaxed fit and button front.",
          price: 88,
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop"
          ]),
          category: "Clothes"
        }
      ];

      // Insert products
      const products = [];
      for (let i = 0; i < productsData.length; i++) {
        const productData = productsData[i];
        const productId = PRODUCT_START_ID + i;
        
        // Check if product with this name already exists
        const productExists = await checkExists('Products', { name: productData.name });
        if (productExists) {
          // Product exists, let's update its images to the Unsplash ones
          await queryInterface.sequelize.query(
            `UPDATE "Products" SET images = ? WHERE name = ?`,
            {
              replacements: [productData.images, productData.name],
              type: Sequelize.QueryTypes.UPDATE
            }
          );
          console.log(`Updated images for product: ${productData.name}`);
          
          // Get the ID of the existing product
          const [result] = await queryInterface.sequelize.query(
            `SELECT id FROM "Products" WHERE name = ?`,
            {
              replacements: [productData.name],
              type: Sequelize.QueryTypes.SELECT
            }
          );
          
          if (result) {
            products.push({
              id: result.id,
              name: productData.name,
              category: productData.category
            });
          }
        } else {
          // Product doesn't exist, create it
          const product = {
            id: productId,
            name: productData.name,
            price: productData.price,
            description: productData.description,
            images: productData.images,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await queryInterface.bulkInsert('Products', [product], {});
          console.log(`Created product: ${productData.name}`);
          
          products.push({
            id: productId,
            name: productData.name,
            category: productData.category
          });
        }
      }

      // Create product categories associations
      for (const product of products) {
        const categoryId = categoryIds[product.category];
        if (!categoryId) {
          console.log(`Category ${product.category} not found, skipping association for ${product.name}`);
          continue;
        }
        
        // Check if association already exists
        const exists = await queryInterface.sequelize.query(
          `SELECT * FROM "ProductCategories" WHERE "product_id" = ? AND "category_id" = ?`,
          {
            replacements: [product.id, categoryId],
            type: Sequelize.QueryTypes.SELECT
          }
        ).then(records => records.length > 0)
          .catch(() => false);
        
        if (!exists) {
          await queryInterface.bulkInsert('ProductCategories', [{
            product_id: product.id,
            category_id: categoryId
          }], {});
          console.log(`Associated product ${product.name} with category ${product.category}`);
        } else {
          console.log(`Product ${product.name} already associated with category ${product.category}`);
        }
      }

      // Add inventory for products
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const inventoryId = INVENTORY_START_ID + i;
        
        // Check if inventory already exists for this product
        const inventoryExists = await checkExists('Inventories', { product_id: product.id });
        if (!inventoryExists) {
          // Generate a random stock quantity between 10 and 100
          const stockQuantity = Math.floor(Math.random() * 91) + 10;
          
          await queryInterface.bulkInsert('Inventories', [{
            id: inventoryId,
            product_id: product.id,
            stock_quantity: stockQuantity,
            createdAt: new Date(),
            updatedAt: new Date()
          }], {});
          console.log(`Created inventory for product ${product.name} with ${stockQuantity} items`);
        } else {
          console.log(`Inventory for product ${product.name} already exists, skipping creation`);
        }
      }

      console.log('E-com seed data successfully updated with reliable image URLs!');
    } catch (error) {
      console.error('Error updating e-com data:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    // Don't delete categories or products that might be referenced by orders
    // Just for safety, this doesn't delete anything
    console.log('No data was deleted by the down migration for e-com products');
  }
};
