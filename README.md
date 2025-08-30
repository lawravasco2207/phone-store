# Phone Store - Full Stack E-commerce Application

A modern e-commerce application built with React + TypeScript frontend and Node.js + Express + Sequelize backend. This project demonstrates best practices for building scalable, maintainable web applications with a focus on performance, security, and user experience.

![Phone Store App](https://img.shields.io/badge/Phone%20Store-E--Commerce-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-336791)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Authentication
- **User Management**: Email/password registration and login
- **Security**: Email verification, JWT authentication with HttpOnly cookies
- **Social Login**: Google OAuth integration
- **Role-Based Access**: Admin and user roles with separate permissions
- **Session Management**: Secure logout, token refresh

### Products
- **Catalog**: Product browsing with pagination, sorting and search
- **Filtering**: Category and attribute-based filtering
- **Media**: Product detail pages with image galleries and 360° viewer
- **Stock Management**: Real-time inventory tracking
- **Admin Tools**: Complete CRUD operations for product management
- **Bulk Operations**: CSV import/export for products

### Shopping Experience
- **Cart System**: Persistent shopping cart for authenticated users
- **Checkout Flow**: Streamlined checkout with mock payment processing
- **Order Tracking**: Comprehensive order history and status updates
- **Stock Updates**: Real-time inventory adjustments during checkout

### User Engagement
- **Review System**: Product reviews with ratings and comments
- **Support Ticketing**: Customer support request system
- **Admin Dashboard**: Ticket management and response system
- **Notifications**: Email notifications for order updates and support responses

### AI Integration
- **Intelligent Chatbot**: Azure OpenAI powered shopping assistant
- **Context-Awareness**: Personalized responses based on user history
- **Product Recommendations**: AI-driven product suggestions
- **Graceful Fallbacks**: Seamless degradation when AI service is unavailable

### Security & Quality
- **Robust Headers**: Helmet for comprehensive security headers
- **API Security**: CORS configuration with credentials
- **Data Validation**: Input validation and sanitization throughout
- **Audit Trail**: Detailed logging of critical operations
- **Error Handling**: Comprehensive error capture and reporting

## 🛠️ Technology Stack

### Frontend
- **Core**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for lightning-fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling with custom design system
- **Routing**: React Router v6 for declarative navigation
- **State Management**: Context API with custom hooks for global state
- **Testing**: Vitest and React Testing Library for component testing
- **Optimization**: Code splitting, lazy loading, and memoization techniques

### Backend
- **Runtime**: Node.js with Express for REST API endpoints
- **Database**: PostgreSQL with Sequelize ORM for data persistence
- **Authentication**: JWT tokens stored in HttpOnly cookies
- **Security**: bcryptjs for password hashing, Helmet for HTTP headers
- **Email**: Nodemailer for transactional emails
- **File Storage**: Local file system with abstraction for cloud migration
- **AI Integration**: Azure OpenAI for natural language processing

### DevOps & Tooling
- **Version Control**: Git with conventional commits
- **Type Safety**: TypeScript for both frontend and backend
- **Linting**: ESLint with custom rules for code quality
- **Testing**: Vitest for unit and integration tests
- **Migration**: Sequelize migrations for database schema changes
- **Seeding**: Seed data for development and testing environments

## 📁 Project Structure

The repository is organized into two main directories:

### Frontend Structure
```
frontend/
├── public/            # Static assets
├── src/
│   ├── assets/        # Images, fonts, etc.
│   ├── components/    # Reusable UI components
│   │   ├── chatbot/   # Chatbot related components
│   │   └── ...
│   ├── pages/         # Page components with routing
│   ├── utils/         # Utilities and helpers
│   │   ├── api.ts     # API client
│   │   └── ...
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── .env.example       # Example environment variables
└── package.json       # Dependencies and scripts
```

### Backend Structure
```
backend/
├── config/            # Configuration files
├── middleware/        # Express middleware
├── migrations/        # Sequelize migrations
├── models/            # Data models
├── routes/            # API route handlers
├── scripts/           # Utility scripts
├── seeders/           # Database seed data
├── services/          # Business logic services
├── tests/             # Test files
├── uploads/           # Uploaded files storage
├── utils/             # Utility functions
├── .env.example       # Example environment variables
├── index.js           # Application entry point
└── package.json       # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- PostgreSQL 14+
- npm or yarn
- (Optional) Azure OpenAI API key for chatbot functionality

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lawravasco2207/phone-store.git
   cd phone-store
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Configure backend environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database and service configurations
   ```

3. **Setup database:**
   ```bash
   cd backend
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api

### Demo Accounts

After running the seeders, you can use these demo accounts:

- **Admin:** admin@phonestore.com / admin123
- **User:** user@example.com / password123

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email` - Email verification
- `POST /api/auth/google` - Google OAuth

### Products
- `GET /api/products` - List products (pagination, search, category filter)
- `GET /api/products/:id` - Get single product

### Admin (Auth Required)
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Cart (Auth Required)
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `PATCH /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove from cart

### Orders (Auth Required)
- `GET /api/orders` - Get user orders
- `POST /api/checkout` - Process checkout

### Reviews
- `GET /api/reviews/:productId` - Get product reviews
- `POST /api/reviews/:productId` - Create review (auth required)

### Support (Auth Required)
- `POST /api/support` - Create support ticket
- `GET /api/support` - List tickets (admin only)
- `PATCH /api/support/:id` - Update ticket (admin only)

### Chat
- `POST /api/chat` - Send chat message (context-aware)

## 🔧 Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/phonestore

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Azure OpenAI (Optional)
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=/api
```

## 💻 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

### Database Management
```bash
# Create new migration
npx sequelize-cli migration:generate --name your-migration-name

# Run migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create seeder
npx sequelize-cli seed:generate --name your-seeder-name

# Run specific seeder
npx sequelize-cli db:seed --seed 20250829131000-demo-data.js
```

### Code Quality
```bash
# Type checking
cd frontend
npx tsc --noEmit

# Linting
npm run lint

# Lint and fix
npm run lint:fix

# Format code
npm run format
```

## 🌐 Deployment

### Backend
1. Set production environment variables
2. Run migrations: `npx sequelize-cli db:migrate`
3. Start with: `NODE_ENV=production node index.js`

### Frontend
1. Set production API URL in environment
2. Build: `npm run build`
3. Serve the `dist` folder with your preferred static file server

## 🏗️ Architecture Notes

### Security
- All passwords are hashed with bcryptjs
- JWT tokens stored in HttpOnly cookies
- CORS configured for cross-origin requests
- Input validation on all endpoints
- Admin routes protected with role-based middleware

### Database
- PostgreSQL with Sequelize ORM
- Proper foreign key relationships
- Audit logging for important actions
- Inventory tracking with optimistic locking

### Frontend State Management
- React Context for global state (Auth, Cart, Favorites)
- API client with consistent error handling
- Type-safe API responses throughout

### Error Handling
- Graceful degradation for optional services
- Comprehensive error boundaries
- User-friendly error messages
- Detailed logging for debugging

## 🔍 Troubleshooting

### Common Issues

**Problem**: Backend fails to connect to database
- Check DATABASE_URL environment variable
- Ensure PostgreSQL is running
- Verify network connectivity to database server

**Problem**: Frontend API calls return 500 errors
- Check backend server logs
- Verify API response structure matches frontend expectations
- Ensure CORS is correctly configured

**Problem**: Authentication failures
- Check JWT_SECRET consistency
- Verify cookie settings and SameSite policy
- Check for HTTPS requirements in production

**Problem**: File uploads don't work
- Verify upload directory permissions
- Check file size limits
- Ensure multipart/form-data is properly handled

**Problem**: OpenAI integration not working
- Verify Azure OpenAI API credentials
- Check rate limits and quota
- Ensure deployment name is correct

### Debugging

- Backend logs are in the console and can be redirected to files
- Frontend has comprehensive error boundaries
- Check browser console for frontend errors
- Database queries are logged when NODE_ENV=development

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

### Coding Standards

- Follow the existing code style
- Write tests for new features
- Update documentation for API changes
- Use descriptive commit messages
- Keep pull requests focused on single concerns

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ by the Phone Store team. For support or inquiries, please open an issue on GitHub.
