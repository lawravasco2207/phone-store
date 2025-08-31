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

      // Products data
      const productsData = [
        // Phones Category
        {
          name: "iPhone 15 Pro",
          description: "Apple's latest flagship with A17 Pro chip, 120Hz ProMotion display, and titanium design.",
          price: 999,
          images: JSON.stringify([
            "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg"
          ]),
          category: "Phones"
        },
        {
          name: "Samsung Galaxy S23 Ultra",
          description: "Featuring a 200MP camera, S Pen functionality, and Snapdragon 8 Gen 2 processor.",
          price: 1199,
          images: JSON.stringify([
            "https://images.samsung.com/is/image/samsung/p6pim/levant/2302/gallery/levant-galaxy-s23-ultra-s918-sm-s918bzkcmea-thumb-534863401"
          ]),
          category: "Phones"
        },
        {
          name: "Google Pixel 8 Pro",
          description: "Google's AI-powered smartphone with incredible camera capabilities and pure Android experience.",
          price: 899,
          images: JSON.stringify([
            "https://lh3.googleusercontent.com/kkMsZw-CSs0S_PCz6lCy8l_jnHlFzZMrReFrD5Cw5eFYUvFJ6S8z-DTJKg1Wj8oZzq68-TluoA_q1HegQUvLnLU78lyhaNM=rw-e365-w1440"
          ]),
          category: "Phones"
        },
        {
          name: "OnePlus 12",
          description: "Flagship killer with Snapdragon 8 Gen 3, Hasselblad cameras and 100W fast charging.",
          price: 799,
          images: JSON.stringify([
            "https://oasis.opstatics.com/content/dam/oasis/page/2023/12-series/spec/12/Flowy%20Emerald-gallery.png"
          ]),
          category: "Phones"
        },
        {
          name: "Xiaomi 14 Ultra",
          description: "Premium smartphone with Leica optics, Snapdragon 8 Gen 3, and 120W HyperCharge.",
          price: 899,
          images: JSON.stringify([
            "https://i02.appmifile.com/708_operator_sg/10/03/2024/8ce51e77b3f5f6f1f3dd329bcecc7a01.png"
          ]),
          category: "Phones"
        },
        {
          name: "Nothing Phone (2)",
          description: "Distinctive transparent design with Glyph interface and clean Android experience.",
          price: 699,
          images: JSON.stringify([
            "https://nothing.tech/cdn/shop/files/Phone_2_Dark_Grey_Front.png"
          ]),
          category: "Phones"
        },
        {
          name: "Motorola Edge 50 Pro",
          description: "Curved display with 144Hz refresh rate, 125W TurboPower charging, and impressive camera system.",
          price: 499,
          images: JSON.stringify([
            "https://motorolaus.vtexassets.com/arquivos/ids/163984-800-auto"
          ]),
          category: "Phones"
        },
        {
          name: "OPPO Find X7 Ultra",
          description: "Quad camera system with dual periscope lenses and MediaTek Dimensity 9300 processor.",
          price: 1099,
          images: JSON.stringify([
            "https://image01.oneplus.net/ebp/202401/06/1-m00-51-00-ckch3wwyzdoahjc5aakz-rnj7cw267.1360x1360.png"
          ]),
          category: "Phones"
        },
        {
          name: "TECNO Phantom X2 Pro",
          description: "First retractable portrait lens in a smartphone with MediaTek Dimensity 9000 chipset.",
          price: 699,
          images: JSON.stringify([
            "https://www.tecno-mobile.com/storage/images/phantom-x2-pro/param-1/p-x2-pro-1.png"
          ]),
          category: "Phones"
        },
        {
          name: "Sony Xperia 1 V",
          description: "Pro-grade camera system with 4K 120fps recording and dedicated camera shutter button.",
          price: 1299,
          images: JSON.stringify([
            "https://www.sony.com/image/5d02da1df552836db894cead8a68f5f4"
          ]),
          category: "Phones"
        },

        // Laptops Category
        {
          name: "MacBook Pro 16-inch (M3 Max)",
          description: "Powerful laptop with M3 Max chip, up to 128GB unified memory, and stunning Liquid Retina XDR display.",
          price: 3499,
          images: JSON.stringify([
            "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310?wid=904&hei=840&fmt=jpeg"
          ]),
          category: "Laptops"
        },
        {
          name: "Dell XPS 15",
          description: "Premium Windows laptop with 13th Gen Intel Core processors and NVIDIA GeForce RTX graphics.",
          price: 1899,
          images: JSON.stringify([
            "https://i.dell.com/is/image/DellContent/content/dam/images/products/laptops-and-2-in-1s/xps/15-9530/media-gallery/black/laptop-xps-15-9530-t-black-gallery-1.psd?fmt=png-alpha"
          ]),
          category: "Laptops"
        },
        {
          name: "Lenovo ThinkPad X1 Carbon",
          description: "Business-class ultrabook with military-grade durability, Intel vPro, and legendary keyboard.",
          price: 1649,
          images: JSON.stringify([
            "https://p2-ofp.static.pub/fes/cms/2023/04/05/d7i2bqczzr9lj1ubhzpo9f5qprrtmo029591.png"
          ]),
          category: "Laptops"
        },
        {
          name: "ASUS ROG Zephyrus G14",
          description: "Powerful gaming laptop with AMD Ryzen 9, NVIDIA RTX 4090, and AniMe Matrix display.",
          price: 1999,
          images: JSON.stringify([
            "https://dlcdnwebimgs.asus.com/gain/8BC0AF66-6639-4933-8031-C79FECF39D45/w1000/h732"
          ]),
          category: "Laptops"
        },
        {
          name: "HP Spectre x360 14",
          description: "Premium 2-in-1 convertible with OLED display, Intel Evo platform, and gem-cut design.",
          price: 1499,
          images: JSON.stringify([
            "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08164796.png"
          ]),
          category: "Laptops"
        },
        {
          name: "Microsoft Surface Laptop Studio 2",
          description: "Versatile creative workstation with unique hinge design and NVIDIA RTX graphics.",
          price: 2399,
          images: JSON.stringify([
            "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RW13YDH"
          ]),
          category: "Laptops"
        },
        {
          name: "Razer Blade 16",
          description: "Ultimate gaming laptop with Intel Core i9, NVIDIA RTX 4090, and dual-mode mini-LED display.",
          price: 3299,
          images: JSON.stringify([
            "https://assets3.razerzone.com/jY_wgmGbWbRP4-GGHo_TinLCX70=/300x300/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh7b%2Fh83%2F9665921802270%2Fblade16-ch9-2023-1500x1000-1.png"
          ]),
          category: "Laptops"
        },
        {
          name: "LG Gram 17",
          description: "Ultra-lightweight 17-inch laptop with all-day battery life and Intel Evo certification.",
          price: 1499,
          images: JSON.stringify([
            "https://www.lg.com/us/images/laptops/md08000486/gallery/desktop-01.jpg"
          ]),
          category: "Laptops"
        },
        {
          name: "Acer Swift Edge 16",
          description: "World's lightest 16-inch OLED laptop with AMD Ryzen processors and premium design.",
          price: 1299,
          images: JSON.stringify([
            "https://static-ecapac.acer.com/media/catalog/product/s/f/sf16-71_bl2_nonbacklit_01.png"
          ]),
          category: "Laptops"
        },
        {
          name: "Framework Laptop 16",
          description: "Modular, upgradeable laptop with customizable expansion cards and replaceable components.",
          price: 1699,
          images: JSON.stringify([
            "https://content.framework.com/ocntogviy5sxcvqb/FW-Laptop-16-Angled-1.png"
          ]),
          category: "Laptops"
        },

        // Accessories Category
        {
          name: "AirPods Pro (2nd Generation)",
          description: "Active noise cancellation earbuds with spatial audio and adaptive transparency mode.",
          price: 249,
          images: JSON.stringify([
            "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=1144&hei=1144&fmt=jpeg"
          ]),
          category: "Accessories"
        },
        {
          name: "Samsung Galaxy Watch 6 Classic",
          description: "Premium smartwatch with rotating bezel, health tracking, and Wear OS powered by Samsung.",
          price: 399,
          images: JSON.stringify([
            "https://image-us.samsung.com/us/watches/galaxy-watch6-classic/GW6C-47mm-Black-hub-D.jpg"
          ]),
          category: "Accessories"
        },
        {
          name: "Anker 737 Power Bank",
          description: "140W portable charger with 24,000mAh capacity, digital display, and fast charging support.",
          price: 149,
          images: JSON.stringify([
            "https://m.media-amazon.com/images/I/71kGfR5W45L._AC_SL1500_.jpg"
          ]),
          category: "Accessories"
        },
        {
          name: "Sony WH-1000XM5",
          description: "Premium noise-cancelling headphones with industry-leading audio quality and 30-hour battery life.",
          price: 399,
          images: JSON.stringify([
            "https://d13o3tuo14g2wf.cloudfront.net/thumbnails%2Flarge%2FAsset+Hierarchy%2FConsumer+Assets%2FAccessories%2FHeadphones%2FWH-1000XM5%2FProduct+Images%2FBlack%2FeComm%2F1+WH-1000XM5_standard_black.png.png"
          ]),
          category: "Accessories"
        },
        {
          name: "Logitech MX Master 3S",
          description: "Advanced wireless mouse with quiet clicks, 8K DPI tracking, and customizable buttons.",
          price: 99,
          images: JSON.stringify([
            "https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-pale-gray-top-view.png"
          ]),
          category: "Accessories"
        },
        {
          name: "Keychron Q1 Pro",
          description: "Wireless mechanical keyboard with QMK/VIA support, hot-swappable switches, and aluminum body.",
          price: 199,
          images: JSON.stringify([
            "https://cdn.shopify.com/s/files/1/0059/0630/1017/products/Keychron-Q1-Pro-QMK-VIA-wireless-custom-mechanical-keyboard-layout-badge-knob-gasket-red-for-Mac-Windows_1800x1800.jpg"
          ]),
          category: "Accessories"
        },
        {
          name: "Twelve South BookArc",
          description: "Vertical desktop stand for MacBooks with cable management and space-saving design.",
          price: 59,
          images: JSON.stringify([
            "https://cdn.shopify.com/s/files/1/0058/0252/4783/products/12-1813_BookArc-M1_Hero_v1b_1445x.jpg"
          ]),
          category: "Accessories"
        },
        {
          name: "Peak Design Everyday Backpack",
          description: "Versatile camera and tech backpack with innovative FlexFold dividers and expandable side pockets.",
          price: 279,
          images: JSON.stringify([
            "https://cdn.shopify.com/s/files/1/2986/1172/products/20191022-BEDP-20-BL-1_1800x1800.jpg"
          ]),
          category: "Accessories"
        },
        {
          name: "Apple MagSafe Charger",
          description: "Wireless charger that perfectly aligns with iPhone magnets for efficient charging.",
          price: 39,
          images: JSON.stringify([
            "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MHXH3?wid=2000&hei=2000&fmt=jpeg"
          ]),
          category: "Accessories"
        },
        {
          name: "Elgato Stream Deck MK.2",
          description: "Customizable control panel with 15 LCD keys for streamers, content creators, and professionals.",
          price: 149,
          images: JSON.stringify([
            "https://edge.elgato.com/cdn-cgi/image/format=auto,width=600,quality=100/https://edgeup.asus.com/wp-content/uploads/2021/07/Elgato-Stream-Deck-MK.2-1.png"
          ]),
          category: "Accessories"
        },

        // Furniture Category
        {
          name: "Herman Miller Aeron Chair",
          description: "Ergonomic office chair with PostureFit SL and 8Z Pellicle suspension material for comfort.",
          price: 1395,
          images: JSON.stringify([
            "https://store.hermanmiller.com/dw/image/v2/BBBV_PRD/on/demandware.static/-/Sites-master-catalog/default/dw1b24d61a/images/1B9_BK_BK_BK_3.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "Article Sven Sofa",
          description: "Mid-century modern leather sofa with tufted bench seat and sturdy corner-blocked wooden frame.",
          price: 1799,
          images: JSON.stringify([
            "https://www.article.com/pim/s/42b8d49a5b72aa31eeff1e5f1e6014729c0938fd_res-1000/3897478/tan-charme-tan-sven-charme-tan-sofa.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "West Elm Mid-Century Bed",
          description: "Solid wood bed frame with tapered legs and FSC-certified materials in walnut finish.",
          price: 1499,
          images: JSON.stringify([
            "https://assets.weimgs.com/weimgs/rk/images/wcm/products/202345/0121/mid-century-bed-walnut-2-z.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "Floyd The Table",
          description: "Modular dining table with linoleum top and birch wood legs, designed for easy assembly.",
          price: 795,
          images: JSON.stringify([
            "https://images.ctfassets.net/3p8h3sh5y7qy/1C1m2QKcnvtrBjNMQkuhaE/a67306b66830c1df03e310cd6b92a9e0/the-dining-table-blush-linoleum-black-b.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "IKEA KALLAX Shelf Unit",
          description: "Versatile cube storage system that can be used horizontally or vertically with optional inserts.",
          price: 159,
          images: JSON.stringify([
            "https://www.ikea.com/us/en/images/products/kallax-shelf-unit-white__0644181_pe702464_s5.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "Crate & Barrel Lounge II Sofa",
          description: "Deep, comfortable sofa with down-blend cushions and durable upholstery in various colors.",
          price: 2199,
          images: JSON.stringify([
            "https://cb2.scene7.com/is/image/CB2/LoungIISofaTealSHF16/$web_pdp_main_carousel_sm$/190905021652/lounge-ii-petite-83-sofa.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "Room & Board Copenhagen Bookcase",
          description: "Solid wood bookcase with adjustable shelves and clean, Scandinavian-inspired design.",
          price: 1799,
          images: JSON.stringify([
            "https://images.roomandboard.com/is/image/roomandboard/copenhagen_677396_22e_g?$PDP_MAIN$"
          ]),
          category: "Furniture"
        },
        {
          name: "Burrow Nomad Sectional",
          description: "Modular sectional sofa with built-in USB charger, stain-resistant fabric, and tool-free assembly.",
          price: 2495,
          images: JSON.stringify([
            "https://media.graphassets.com/resize=w:2048,fit:crop/quality=value:75/auto_image/compress/yyuDwrKSQNaKGuhLX59N"
          ]),
          category: "Furniture"
        },
        {
          name: "Fully Jarvis Standing Desk",
          description: "Award-winning adjustable height desk with powerful motor and customizable options.",
          price: 599,
          images: JSON.stringify([
            "https://m.media-amazon.com/images/I/712+dL4BVUL._AC_SL1500_.jpg"
          ]),
          category: "Furniture"
        },
        {
          name: "CB2 Stairway White Bookcase",
          description: "Wall-mounted bookcase with five floating shelves for a minimal, space-saving design.",
          price: 399,
          images: JSON.stringify([
            "https://cb2.scene7.com/is/image/CB2/StairwayWallMountBookcaseSHS21/$web_pdp_main_carousel_md$/201214151256/stairway-white-wall-mounted-bookcase.jpg"
          ]),
          category: "Furniture"
        },

        // Shoes Category
        {
          name: "Nike Air Jordan 1 Retro High OG",
          description: "Iconic basketball shoes with full-grain leather and Nike Air cushioning in classic colorways.",
          price: 180,
          images: JSON.stringify([
            "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/f094c151-14db-416a-be8d-5e8afcbc290c/air-jordan-1-retro-high-og-shoes-89W8x4.png"
          ]),
          category: "Shoes"
        },
        {
          name: "Adidas Ultraboost 24",
          description: "Premium running shoes with responsive Boost midsole and Primeknit upper for adaptive support.",
          price: 190,
          images: JSON.stringify([
            "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/60d5e0e5f45d40a684c8e4b8ca927594_9366/Ultraboost_Light_Running_Shoes_White_IF2335_06_standard.jpg"
          ]),
          category: "Shoes"
        },
        {
          name: "On Cloud X",
          description: "Lightweight, versatile training shoes with CloudTec cushioning and zero-gravity foam.",
          price: 149,
          images: JSON.stringify([
            "https://img01.ztat.net/article/spp-media-p1/66ac350b0e1e443a8b5ceb20bcc5fb44/d0dd998be7534d71b0b36a1a586e9144.jpg"
          ]),
          category: "Shoes"
        },
        {
          name: "New Balance 990v6",
          description: "Premium made-in-USA running shoes with ENCAP midsole cushioning and suede/mesh upper.",
          price: 199,
          images: JSON.stringify([
            "https://nb.scene7.com/is/image/NB/m990gl6_nb_02_i?$pdpflexf2$&wid=440&hei=440"
          ]),
          category: "Shoes"
        },
        {
          name: "Converse Chuck Taylor All Star",
          description: "Classic canvas high-top sneakers with iconic design and vulcanized rubber sole.",
          price: 60,
          images: JSON.stringify([
            "https://images.converse.com/is/image/converseeu/M9160_A_PREM?$GRID_ITEM_LG$"
          ]),
          category: "Shoes"
        },
        {
          name: "HOKA Clifton 9",
          description: "Lightweight, cushioned running shoes with balanced meta-rocker geometry for smooth stride.",
          price: 145,
          images: JSON.stringify([
            "https://s7d2.scene7.com/is/image/hoka/1127901-ABOB_1?wid=1600&hei=1600"
          ]),
          category: "Shoes"
        },
        {
          name: "Dr. Martens 1460 Boots",
          description: "Iconic 8-eye leather boots with signature yellow stitching and air-cushioned sole.",
          price: 170,
          images: JSON.stringify([
            "https://i8.amplience.net/i/drmartens/11822006.80.jpg"
          ]),
          category: "Shoes"
        },
        {
          name: "Vans Old Skool",
          description: "Classic skate shoes with suede and canvas upper featuring the iconic side stripe.",
          price: 70,
          images: JSON.stringify([
            "https://images.vans.com/is/image/VansEU/VD3HY28-HERO?$PDP-FULL-IMAGE$"
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
            "https://images.lululemon.com/is/image/lululemon/LM5ACSS_032476_1"
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
            "https://www.madewell.com/dw/image/v2/AALW_PRD/on/demandware.static/-/Sites-madewell_master/default/dw5c2d7159/images/n7405_DM7869_d2.jpg"
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
            "https://vuoriclothing.com/cdn/shop/files/W_SundayPerformanceJogger.Black.Product_1_4f7c1b66-5ed9-4df9-845b-6d8b6e86a4e4.jpg"
          ]),
          category: "Clothes"
        },
        {
          name: "Madewell Lightweight Cardigan Sweater",
          description: "Versatile cardigan in soft, lightweight yarn with relaxed fit and button front.",
          price: 88,
          images: JSON.stringify([
            "https://www.madewell.com/dw/image/v2/AALW_PRD/on/demandware.static/-/Sites-madewell_master/default/dw78a72120/images/n7405_NA5308_d2.jpg"
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
        if (!productExists) {
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
        } else {
          console.log(`Product ${productData.name} already exists, skipping creation`);
          
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

      console.log('E-com seed data successfully added!');
    } catch (error) {
      console.error('Error seeding e-com data:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    // Don't delete categories or products that might be referenced by orders
    // Just for safety, this doesn't delete anything
    console.log('No data was deleted by the down migration for e-com products');
  }
};
