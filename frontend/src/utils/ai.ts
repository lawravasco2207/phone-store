/**
 * ai.ts – Extension points for future AI features
 *
 * This module centralizes contracts for AI-driven capabilities such as:
 * - product recommendations (personalized or trending)
 * - predictive filters (auto-suggested ranges/tags based on behavior)
 * - intent detection for search/filters
 *
 * Keeping these contracts separate allows pages/components to import lightweight
 * hooks without coupling to implementations. In production, these would call
 * your backend or an SDK; for now we provide typed stubs.
 */

import type { Product } from './mockData'

export type RecommendationContext = {
  currentProductId?: string
  cartProductIds?: string[]
  filters?: Record<string, unknown>
}

// Suggest related products; pages can use this to render carousels under PDP, cart, etc.
export async function getRecommendations(ctx: RecommendationContext): Promise<Product[]> {
  // TODO: integrate with backend/ML service; stub returns empty list
  void ctx
  return []
}

// Predict likely filters based on behavior/session; used in ProductsList for quick-pick chips
export async function getSuggestedFilters(): Promise<Array<{ key: string; label: string; value: unknown }>> {
  return []
}

// Simple scoring helper for A/B testing different layouts or colors if desired
export function scoreEngagement(signal: { clicks: number; dwellMs: number }): number {
  const { clicks, dwellMs } = signal
  const dwellScore = Math.min(1, dwellMs / 60000) // cap at 1 after 60s
  const clickScore = Math.min(1, clicks / 5)
  return 0.6 * dwellScore + 0.4 * clickScore
}
