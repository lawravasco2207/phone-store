# Product Categories Implementation

This document explains how the product categories have been implemented in the phone store application.

## Database Structure

The implementation supports two scenarios:
1. **Proper Categories Table**: Using a many-to-many relationship between Products and Categories
2. **Legacy Category Field**: Using the existing category field on the Products table

## Setup Instructions

### Step 1: Initialize Categories Table (Optional)

If you want to use the proper categories implementation (recommended), run the following command:

```bash
cd backend
npm run init-categories
```

This script will:
1. Check if the Categories table exists
2. Create the table if it doesn't exist
3. Create a junction table for the many-to-many relationship
4. Add default categories
5. Map existing products to categories based on their category field

### Step 2: Start the Application

The application is now fully compatible with both database scenarios:
- If the Categories table exists, it will use the proper many-to-many relationship
- If not, it will fall back to using the category field on the Products table

## Implementation Details

### Backend

The implementation includes:
- Resilient API endpoints in `/api/products` and `/api/categories`
- Automatic detection of database state
- Fallback categories when the Categories table doesn't exist

### Frontend

The frontend has been updated to:
- Display categories in the product list and detail pages
- Filter products by category
- Handle both database scenarios gracefully

## Default Categories

The following default categories are provided:
- Smartphones
- Accessories
- Wearables
- Audio
- Tablets
- Chargers
- Cases
- Screen Protectors

## Troubleshooting

If you encounter any issues:

1. Check your database connection by running:
   ```bash
   cd backend
   node scripts/check-db.js
   ```

2. Ensure the Categories table is properly initialized:
   ```bash
   cd backend
   npm run init-categories
   ```

3. If your database is on Neon.tech, make sure your connection string is correctly configured in the `.env` file.
