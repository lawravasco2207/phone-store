## AI Session, Memory, and Dynamic Pages

New endpoints to enable persistent AI memory and dynamic page creation:

- Session & memory:
	- GET `/api/ai/session/:sessionId/memory?limit=30`
	- POST `/api/ai/session/:sessionId/memory` { role, content, tool_calls? }

- Database access (limited):
	- POST `/api/ai/db/query` { sql: SELECT-only, replacements? }
	- POST `/api/ai/db/update` { table, where, values }

- Frontend dynamic pages:
	- POST `/api/ai/pages` { routePath, title?, componentCode? } -> Writes `frontend/src/ai-pages/*.tsx` and updates manifest
	- GET `/api/ai/pages/manifest`

The server sets/accepts `X-Session-Id` or `sid` cookie to track sessions. Chat endpoints now persist messages to `ChatSession` and `ChatMessage` tables.

# Phone Store API (minimal)

- Express + Sequelize (Postgres)
- JWT (HttpOnly cookie) auth, email verification
- Admin product CRUD, cart, checkout (mock), reviews, support, audit logs

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Create DB and run migrations with sequelize-cli or sync.
3. Start server.

## Env

- PORT, DATABASE_URL, JWT_SECRET
- EMAIL_FROM, SMTP_* (optional; Ethereal if absent)
- CORS_ORIGIN, FRONTEND_URL, API_BASE_URL
- AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT

## Auth

- POST /api/auth/register { name, email, password }
- POST /api/auth/login { email, password } -> sets JWT cookie
- GET  /api/auth/verify-email?token=...
- POST /api/auth/google { email, name } (requires separate Google token validation on frontend)

## Products

- GET /api/products?category=&page=&limit=&sort=createdAt|price&order=ASC|DESC
- GET /api/products/:id
- POST /api/admin/products (admin) { name, description, price, images: string[] }
- PATCH /api/admin/products/:id (admin)
- DELETE /api/admin/products/:id (admin)

## Cart & Checkout

- GET /api/cart
- POST /api/cart { product_id, quantity }
- PATCH /api/cart/:itemId { quantity }
- DELETE /api/cart/:itemId
- POST /api/checkout -> creates order, order items, mock payment, clears cart

## Reviews

- GET /api/reviews/:productId
- POST /api/reviews/:productId (auth) { rating, comment }

## Support

- POST /api/support (auth) { subject, message }
- GET  /api/support (admin)
- PATCH /api/support/:id (admin) { status }

## Notes

- Responses use { success, data?, error? }
- Admin routes require role=admin.
- Payment uses method='mock' and status='completed'.