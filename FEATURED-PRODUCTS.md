# Featured Products Implementation

This document describes the implementation of featured products for the phone store application.

## Overview

Featured products are displayed on the home page and are a great way to highlight specific products. This implementation allows admins to mark products as featured, which will then be displayed prominently on the home page.

## Database Changes

A new `featured` column has been added to the `Products` table:

```sql
ALTER TABLE "Products" ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false
```

This is implemented through a migration file: `20250902000000-add-featured-to-products.js`

## API Endpoints

### Public Endpoints

- `GET /api/products/featured` - Returns a list of featured products
  - Query parameters:
    - `limit` - Maximum number of products to return (default: 6)

### Admin Endpoints

- `PATCH /api/admin/products/:id` - Update a product, including its featured status
- `PATCH /api/admin/products/:id/featured` - Toggle featured status of a product
  - Request body:
    - `featured` - Boolean value to set the featured status (optional, toggles current value if not provided)

## Frontend Implementation

### API Client

- `getFeaturedProducts(limit = 6)` - Fetch featured products
- `toggleProductFeatured(id, featured)` - Toggle featured status of a product

### Home Page

The home page has been updated to display featured products using the new API endpoint.

### Product Card

The `ProductCard` component now displays a "Featured" badge for featured products.

## Setup

To set up random products as featured for demonstration purposes, run:

```bash
cd backend
npm run set-featured
```

This script will:
1. Check if the featured column exists, adding it if necessary
2. Reset all products to not featured
3. Set 6 random products as featured

## Future Enhancements

Potential future enhancements include:
- Admin UI for managing featured products
- Scheduling of featured products
- Featured product sections on category pages
- Enhanced visual treatment for featured products
