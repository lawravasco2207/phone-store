// API utilities for backend integration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
console.log('⚙️ API_BASE_URL configured as:', API_BASE_URL);

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
  images?: string[];
  featured?: boolean;
  Categories?: { id: number; name: string; description?: string }[];
  Inventory?: { stock_quantity: number };
  inventory?: number; // Flattened inventory for convenience
};

export type CartItem = {
  id: number;
  quantity: number;
  Product: Product;
};

export type Order = {
  id: number;
  total_amount: number;
  currency: string;
  order_status: string;
  createdAt: string;
  OrderItems: {
    quantity: number;
    price_at_purchase: number;
    Product: Product;
  }[];
};

export type Review = {
  id: number;
  rating: number;
  comment: string;
  User: { name: string };
  createdAt: string;
};

// Create a reusable fetch function with error handling
function getSessionId(): string | null {
  // Prefer cookie 'sid'
  const m = document.cookie.match(/(?:^|; )sid=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  // Fallback to localStorage
  return localStorage.getItem('sid');
}

function setSessionId(id: string) {
  try { localStorage.setItem('sid', id); } catch {}
  // Also set a cookie for server compatibility
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `sid=${encodeURIComponent(id)}; Path=/; Max-Age=${60*60*24*30}; SameSite=${isSecure ? 'None' : 'Lax'};${isSecure ? ' Secure;' : ''}`;
}

async function fetchWithErrorHandling<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    // Add default headers if not provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }

    // Add credentials for cookies
    options.credentials = 'include';

    // Attach session header if available
    const sid = getSessionId();
    (options.headers as Record<string, string>)['X-Session-Id'] = sid || '';
    
    // For cross-origin requests to production, also send token in Authorization header
    // This ensures auth works even if cookies aren't sent due to browser restrictions
    const tokenMatch = document.cookie.match(/(?:^|; )token=([^;]+)/);
    if (tokenMatch) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${decodeURIComponent(tokenMatch[1])}`;
      console.log("Adding Authorization header with token");
    } else {
      console.warn("No auth token found in cookies");
    }

    console.log(`Making ${options.method || 'GET'} request to ${url}`);
    if (options.body) {
      console.log("Request body:", options.body);
    }

    // Make the request
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      console.error(`Request failed: ${response.status} ${response.statusText}`);
      
      // Try to get more specific error message
      try {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, use the default error message
        console.error("Could not parse error response:", parseError);
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }

    // Parse the response
    const data = await response.json();
    console.log("Response data:", data);
    
    // Capture session id from response (if any)
    const anyData = data as any;
    const newSid = anyData?.data?.sessionId || anyData?.sessionId;
    if (typeof newSid === 'string' && newSid) setSessionId(newSid);
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Network errors, JSON parsing errors, etc.
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

class ApiClient {
  // Cache for data that rarely changes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheLifetime = 5 * 60 * 1000; // 5 minutes

  // Helper to build full API URL
  private getUrl(endpoint: string): string {
    // Ensure endpoint starts with a slash if API_BASE_URL doesn't end with one
    if (!API_BASE_URL.endsWith('/') && !endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🔗 API URL constructed:', url);
    return url;
  }

  // Get data from cache or fetch it
  private async getCachedOrFetch<T>(key: string, fetcher: () => Promise<ApiResponse<T>>, useCache = true): Promise<ApiResponse<T>> {
    // Skip cache in certain situations
    if (!useCache) {
      return fetcher();
    }
    
    // Check if data is in cache and still fresh
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheLifetime) {
      return cached.data;
    }
    
    // Fetch fresh data
    const response = await fetcher();
    
    // Cache successful responses
    if (response.success) {
      this.cache.set(key, { data: response, timestamp: Date.now() });
    }
    
    return response;
  }

  // Clear cache (used after mutations)
  private clearCache(prefix?: string): void {
    if (prefix) {
      // Clear specific keys with matching prefix
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<ApiResponse<T>> {
    const url = this.getUrl(endpoint);
    
    // If it's a GET request and we have a cache key, use caching
    if (options.method === undefined || options.method === 'GET') {
      const key = cacheKey || `GET:${endpoint}`;
      return this.getCachedOrFetch<T>(
        key,
        () => fetchWithErrorHandling<T>(url, options)
      );
    }
    
    // For non-GET requests, bypass cache
    return fetchWithErrorHandling<T>(url, options);
  }

  // Auth endpoints
  async register(name: string, email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token?: string }>> {
    return this.request<{ user: User; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse> {
    // Clear all cache on logout
    this.clearCache();
    return this.request('/auth/logout', { method: 'POST' });
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request('/auth/verify-email', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/me', {
      method: 'GET',
    }, 'currentUser');
  }

  // Products endpoints
  async getProducts(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
    category?: string;
    search?: string;
  }): Promise<ApiResponse<{
    products: Product[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortDir) query.set('sortDir', params.sortDir);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    // Include query params in cache key for proper caching
    const cacheKey = `products:${query.toString()}`;
    
    return this.request<{
      products: Product[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/products?${query}`, undefined, cacheKey);
  }

  async getCategories(): Promise<ApiResponse<{ categories: { id: number; name: string; description?: string }[] }>> {
    return this.request<{ categories: { id: number; name: string; description?: string }[] }>(
      '/categories', 
      undefined,
      'categories'
    );
  }

  async getProduct(id: number): Promise<ApiResponse<{ product: Product }>> {
    return this.request<{ product: Product }>(`/products/${id}`, 
      undefined, `product:${id}`);
  }

  // Cart endpoints
  async getCart(): Promise<ApiResponse<{ items: CartItem[] }>> {
  // Cache under a predictable key so mutations can invalidate via clearCache('cart')
  return this.request<{ items: CartItem[] }>('/cart', undefined, 'cart');
  }

  async addToCart(productId: number, quantity: number = 1): Promise<ApiResponse<{ item?: CartItem }>> {
    const response = await this.request<{ item?: CartItem }>('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    
  // Clear cart cache after modification
  this.clearCache('cart'); // prefix
  this.clearCache('GET:/cart'); // exact key safety
    return response;
  }

  async updateCartItem(itemId: number, quantity: number): Promise<ApiResponse<{ item?: CartItem }>> {
    const response = await this.request<{ item?: CartItem }>(`/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    
  // Clear cart cache after modification
  this.clearCache('cart');
  this.clearCache('GET:/cart');
    return response;
  }

  async removeFromCart(itemId: number): Promise<ApiResponse> {
    const response = await this.request(`/cart/${itemId}`, { method: 'DELETE' });
    
    // Clear cart cache after modification
  this.clearCache('cart');
  this.clearCache('GET:/cart');
    return response;
  }

  // Checkout - creates a new order
  async checkout(paymentMethod: string, paymentDetails?: any): Promise<ApiResponse<{
    orderId?: number;
    order?: { id: number; total_amount: number; currency: string; order_status: string };
    payment?: { id: number; payment_status: string; transaction_id: string };
  }>> {
    // Validate that we have the required payment details based on the method
    if (paymentMethod === 'paypal' && (!paymentDetails?.paypalOrderId)) {
      // For development/testing only - generate mock PayPal order ID
      if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
        paymentDetails = {
          ...paymentDetails,
          paypalOrderId: `PAYPAL-ORDER-${Date.now()}`
        };
        console.log("Using mock PayPal order ID:", paymentDetails.paypalOrderId);
      }
    } else if (paymentMethod === 'mpesa' && (!paymentDetails?.mpesaTransactionId && !paymentDetails?.phoneNumber)) {
      // For development/testing only - generate mock M-Pesa transaction ID if we have a phone number
      if (paymentDetails?.phoneNumber && (import.meta.env.DEV || import.meta.env.MODE === 'test')) {
        paymentDetails = {
          ...paymentDetails,
          mpesaTransactionId: `MPESA-TEST-${Date.now()}`
        };
      }
    }
    
    // Log the request body for debugging
    const requestBody = { paymentMethod, ...paymentDetails };
    console.log("Checkout request:", requestBody);
    
    const response = await this.request<{
      orderId?: number;
      order?: { id: number; total_amount: number; currency: string; order_status: string };
      payment?: { id: number; payment_status: string; transaction_id: string };
    }>('/checkout', { 
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    // Clear cart and orders cache after checkout
    this.clearCache('cart');
    this.clearCache('orders');
    
    return response;
  }

  // Process payment for an existing order
  async processPayment(orderId: number, paymentMethod: string, paymentDetails: any): Promise<ApiResponse<{
    order?: { id: number; status: string };
    payment?: { id: number; status: string; transactionId: string };
  }>> {
    // Validate payment details based on method
    if (paymentMethod === 'paypal' && !paymentDetails?.paypalOrderId) {
      return {
        success: false,
        error: 'PayPal Order ID is required for PayPal payments'
      };
    } else if (paymentMethod === 'mpesa' && !paymentDetails?.phoneNumber) {
      return {
        success: false,
        error: 'Phone number is required for M-Pesa payments'
      };
    }
    
    console.log(`Processing ${paymentMethod} payment for order #${orderId}:`, paymentDetails);
    
    // In development/test, simulate a successful payment
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock success response
      return {
        success: true,
        data: {
          order: {
            id: orderId,
            status: 'paid'
          },
          payment: {
            id: Date.now(),
            status: 'completed',
            transactionId: `${paymentMethod.toUpperCase()}-TEST-${Date.now()}`
          }
        }
      };
    }
    
    // For production, this would call the real payment endpoint
    return this.request<{
      order?: { id: number; status: string };
      payment?: { id: number; status: string; transactionId: string };
    }>(`/payments/${paymentMethod}/process`, {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        ...paymentDetails
      })
    });
  }

  // Get featured products
  async getFeaturedProducts(limit = 6): Promise<ApiResponse<{ products: Product[] }>> {
    return this.request<{ products: Product[] }>(
      `/products/featured?limit=${limit}`, 
      undefined, 
      `featuredProducts:${limit}`
    );
  }

  // Orders
  async getOrders(): Promise<ApiResponse<{ orders: Order[] }>> {
    return this.request<{ orders: Order[] }>('/orders', undefined, 'orders');
  }

  async getOrder(id: number): Promise<ApiResponse<{ order: Order }>> {
    return this.request<{ order: Order }>(`/orders/${id}`, undefined, `order:${id}`);
  }

  // Reviews
  async getReviews(productId: number): Promise<ApiResponse<{
    reviews: Review[];
  }>> {
    return this.request<{
      reviews: Review[];
    }>(`/reviews/${productId}`, undefined, `reviews:${productId}`);
  }

  async createReview(productId: number, review: { rating: number; comment: string }): Promise<ApiResponse> {
    const response = await this.request(`/reviews/${productId}`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
    
    // Clear product and reviews cache
    this.clearCache(`product:${productId}`);
    this.clearCache(`reviews:${productId}`);
    
    return response;
  }

  // Admin endpoints
  async createProduct(product: {
    name: string;
    category: string;
    price: number;
    description?: string;
    images?: string[];
  }): Promise<ApiResponse<{ product: Product }>> {
    const response = await this.request<{ product: Product }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    
    // Clear products cache
    this.clearCache('products');
    
    return response;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<ApiResponse<{ product: Product }>> {
    const response = await this.request<{ product: Product }>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    // Clear product and products cache
    this.clearCache(`product:${id}`);
    this.clearCache('products');
    this.clearCache('featuredProducts');
    
    return response;
  }

  // Toggle featured status of a product
  async toggleProductFeatured(id: number, featured?: boolean): Promise<ApiResponse<{ id: number; featured: boolean }>> {
    const response = await this.request<{ id: number; featured: boolean }>(`/admin/products/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ featured }),
    });
    
    // Clear product and featured products cache
    this.clearCache(`product:${id}`);
    this.clearCache('products');
    this.clearCache('featuredProducts');
    
    return response;
  }

  async deleteProduct(id: number): Promise<ApiResponse> {
    const response = await this.request(`/admin/products/${id}`, { method: 'DELETE' });
    
    // Clear product and products cache
    this.clearCache(`product:${id}`);
    this.clearCache('products');
    
    return response;
  }

  // Chat
  async chat(message: string, userId?: number): Promise<ApiResponse<{ reply?: string; products?: Product[] }>> {
    return this.request<{ reply?: string; products?: Product[] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userId }),
    });
  }
  
  // Chat with tool calls
  async chatWithToolCalls(message: string, userId?: number): Promise<ApiResponse<{
    message?: string;
    products?: Product[];
    toolCalls?: Array<{
      id: string;
      type: string;
      function: { name: string; arguments: any };
    }>;
    reply?: string; // Some endpoints may use reply instead of message
  }>> {
    return this.request<{
      message?: string;
      products?: Product[];
      toolCalls?: Array<{
        id: string;
        type: string;
        function: { name: string; arguments: any };
      }>;
      reply?: string;
    }>('/chat/with-tools', {
      method: 'POST',
      body: JSON.stringify({ message, userId }),
    });
  }
  
  // AI Sales Assistant endpoints
  async assistantSend(message: string, sessionId: string, context: any = {}): Promise<ApiResponse<{
    assistant_message: string;
    suggested_products: Product[];
    actions: string[];
    sessionId: string;
  }>> {
    try {
      console.log('📱 Frontend: Sending message to backend:', { message, sessionId });
      const response = await this.request<{
        assistant_message: string;
        suggested_products: Product[];
        actions: string[];
        sessionId: string;
      }>('/assist/send', {
        method: 'POST',
        body: JSON.stringify({ message, sessionId, context }),
      });
      
      console.log('📱 Frontend: Received response from backend:', response);
      
      // Ensure we have a properly formatted response
      // Cast to any to access properties that might be directly on the response object
      const anyResponse = response as any;
      
      // If it's a direct response (not wrapped in data), format it properly
      if (response.success && !response.data && anyResponse.assistant_message) {
        // Response has success:true but data is directly on the response object
        return {
          success: true,
          data: {
            assistant_message: anyResponse.assistant_message,
            suggested_products: Array.isArray(anyResponse.suggested_products) ? anyResponse.suggested_products : [],
            actions: Array.isArray(anyResponse.actions) ? anyResponse.actions : [],
            sessionId: anyResponse.sessionId || sessionId
          }
        };
      }
      
      // Ensure suggested_products is always an array if we have the data property
      if (response.success && response.data) {
        response.data.suggested_products = Array.isArray(response.data.suggested_products) 
          ? response.data.suggested_products 
          : [];
      }
      
      return response;
    } catch (error) {
      console.error('Error in assistantSend:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }
  
  async assistantFeedback(sessionId: string, messageId: string, vote: 'up' | 'down', reason?: string): Promise<ApiResponse> {
    return this.request('/assist/feedback', {
      method: 'POST',
      body: JSON.stringify({ sessionId, messageId, vote, reason }),
    });
  }
  
  async assistantSuggestions(params: {
    category?: string;
    budget?: number;
    brand?: string;
  }): Promise<ApiResponse<{
    products: Product[];
    sessionId: string;
  }>> {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.budget) query.set('budget', params.budget.toString());
    if (params.brand) query.set('brand', params.brand);
    
    return this.request<{
      products: Product[];
      sessionId: string;
    }>(`/assist/suggestions?${query}`);
  }

  // AI memory endpoints
  async getMemory(limit = 30): Promise<ApiResponse<any[]>> {
    const sid = getSessionId();
    if (!sid) return { success: true, data: [] as any };
    return this.request<any[]>(`/ai/session/${sid}/memory?limit=${limit}`);
  }

  async addMemory(role: 'user' | 'assistant' | 'system' | 'tool', content: string, tool_calls?: any): Promise<ApiResponse> {
    let sid = getSessionId();
    if (!sid) { sid = Math.random().toString(36).slice(2); setSessionId(sid); }
    return this.request(`/ai/session/${sid}/memory`, {
      method: 'POST',
      body: JSON.stringify({ role, content, tool_calls })
    });
  }

  // AI dynamic page creation
  async createAIPage(routePath: string, code?: string, title?: string): Promise<ApiResponse<{ routePath: string; file: string }>> {
    return this.request('/ai/pages', {
      method: 'POST',
      body: JSON.stringify({ routePath, componentCode: code, title })
    });
  }
  
  // Product search
  async searchProducts(params: {
    query?: string;
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    sortBy?: string;
    sortDir?: string;
    limit?: number;
  }): Promise<ApiResponse<{ products: Product[] }>> {
    const query = new URLSearchParams();
    if (params.query) query.set('query', params.query);
    if (params.category) query.set('category', params.category);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    if (params.limit) query.set('limit', params.limit.toString());
    
    return this.request<{ products: Product[] }>(`/products/search?${query}`);
  }
  
  // Initiate checkout
  async initiateCheckout(): Promise<ApiResponse> {
    // Open the checkout view, no API call needed here
    return { success: true };
  }

  // Payment methods
  async getPaymentMethods(): Promise<ApiResponse<{ paymentMethods: { id: string; name: string; icon: string }[] }>> {
    return this.request<{ paymentMethods: { id: string; name: string; icon: string }[] }>(
      '/checkout/payment-methods',
      undefined,
      'paymentMethods'
    );
  }
}

// Export a singleton instance
export const api = new ApiClient();
