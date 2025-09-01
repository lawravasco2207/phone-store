# AI Chatbot with Product Recommendations

## Overview
We've enhanced the chatbot in our e-commerce platform to parse user queries, recommend relevant products, and display them in real-time. The implementation uses a combination of AI analysis and product search functionality.

## Key Features

1. **Enhanced AI Chatbot**
   - Parses user requests to extract search parameters (budget, category, purpose)
   - Uses Azure OpenAI for natural language understanding
   - Provides conversational responses while simultaneously displaying matching products

2. **Product Search Functionality**
   - New API endpoint `/api/products/search` for filtering products
   - Supports filtering by category, price range, and keywords
   - Returns relevant products sorted by relevance or rating

3. **Real-time UI Updates**
   - Displays product cards inline within the chat interface
   - Each card includes name, price, image, rating, and action buttons
   - Supports "Add to Cart" and "View Details" functionality directly from chat

4. **Integration with Existing E-commerce Features**
   - Connected to the cart system for direct product additions
   - Provides navigation to product detail pages
   - Reuses existing authentication system

## Implementation Details

### Backend
- **New Endpoints**:
  - `/api/products/search` - Searches products based on various filters
  
- **New Services**:
  - `chatAnalysisService.js` - Analyzes user requests to extract search parameters
  - `productRecommendationService.js` - Provides product recommendations and search

- **Enhanced Chat Routes**:
  - Updated the `/api/chat/with-tools` endpoint to support product search and recommendation

### Frontend
- **New Components**:
  - `ProductCard.tsx` - Displays product information in a card format
  - `ProductResults.tsx` - Renders a collection of product cards

- **Enhanced Components**:
  - `ChatBot.tsx` - Updated to handle product recommendations
  - `ChatBubble.tsx` - Modified to display product cards below messages

- **Updated Styling**:
  - Added styling for product cards in the chat interface

## Usage Example
1. User: "I need a good laptop for programming under $1000"
2. AI: "Sure! Here are some options that match your budget and use case."
3. Below the AI's message, 3-5 laptop cards appear showing laptops under $1000 suitable for programming.
4. User can add items directly to cart or view more details.

## Future Enhancements
- Add streaming responses for a more dynamic chat experience
- Implement advanced filtering based on technical specifications
- Add comparison features between multiple products
- Enhance product recommendations with machine learning
