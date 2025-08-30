/**
 * ai.ts – Extension points for AI features
 *
 * This module centralizes contracts for AI-driven capabilities such as:
 * - product recommendations (personalized or trending)
 * - predictive filters (auto-suggested ranges/tags based on behavior)
 * - intent detection for search/filters
 *
 * Keeping these contracts separate allows pages/components to import lightweight
 * hooks without coupling to implementations.
 */

import type { Product } from './api';
import { api } from './api';

export type RecommendationContext = {
  currentProductId?: string | number;
  cartProductIds?: (string | number)[];
  filters?: Record<string, unknown>;
  userId?: number;
}

// Suggest related products; pages can use this to render carousels under PDP, cart, etc.
export async function getRecommendations(ctx: RecommendationContext): Promise<Product[]> {
  try {
    // Start with a base query for recommended products
    const params: any = {
      limit: 4,
      sortBy: 'popularity',
      sortDir: 'DESC'
    };
    
    // If we have a current product, exclude it from results
    if (ctx.currentProductId) {
      // In a real implementation, you would call a dedicated recommendations endpoint
      // For now, we'll simulate by getting popular products
      const response = await api.getProducts(params);
      
      if (response.success && response.data?.products) {
        return response.data.products.filter(
          product => product.id !== Number(ctx.currentProductId)
        );
      }
    }
    
    // Default fallback - just get popular products
    const response = await api.getProducts(params);
    return response.success && response.data?.products ? response.data.products : [];
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

// Predict likely filters based on behavior/session
export async function getSuggestedFilters(): Promise<Array<{ key: string; label: string; value: unknown }>> {
  try {
    // In a real implementation, this would call an ML endpoint
    // For now, return static popular filters
    return [
      { key: 'category', label: 'Electronics', value: 'Electronics' },
      { key: 'priceRange', label: 'Under $100', value: { min: 0, max: 100 } },
      { key: 'rating', label: 'Top Rated', value: 4.5 }
    ];
  } catch (error) {
    console.error('Error getting suggested filters:', error);
    return [];
  }
}

// Simple scoring helper for A/B testing different layouts or colors
export function scoreEngagement(signal: { clicks: number; dwellMs: number }): number {
  const { clicks, dwellMs } = signal;
  const dwellScore = Math.min(1, dwellMs / 60000); // cap at 1 after 60s
  const clickScore = Math.min(1, clicks / 5);
  return 0.6 * dwellScore + 0.4 * clickScore;
}
