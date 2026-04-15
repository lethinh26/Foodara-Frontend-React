import { delay } from '../utils/helpers';
import { apiClient } from './apiClient';
import { env } from '../config/env';
import { mockRestaurants } from '../mocks/restaurants';
import type { Restaurant, RestaurantFilters } from '../types/restaurant';

interface BackendStore {
  id: string;
  name: string;
  slug: string;
  description: string;
  address_line: string;
  latitude: number;
  longitude: number;
  phone: string;
  is_open?: boolean;
  isOpen?: boolean;
  is_active: boolean;
  avg_preparation_time: number;
  min_order_amount: number;
  avg_rating: number;
  total_ratings: number;
  total_orders: number;
  cover_image_url?: string;
  coverImageUrl?: string;
  logo_url: string;
  created_at: string;
  distance: number;
  estimated_delivery_time: number;
  delivery_fee: number;
  has_promotion: boolean;
  promotion_text: string;
  is_new: boolean;
  is_featured: boolean;
}

function mapBackendStore(s: BackendStore): Restaurant {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug || '',
    description: s.description || '',
    coverImage: s.cover_image_url || s.coverImageUrl || '',
    logo: s.logo_url || '',
    categories: [],
    categoryNames: [],
    address: s.address_line || '',
    coordinates: { lat: s.latitude || 0, lng: s.longitude || 0 },
    phone: s.phone || '',
    rating: s.avg_rating || 0,
    reviewCount: s.total_ratings || 0,
    deliveryFee: s.delivery_fee || 0,
    minOrder: s.min_order_amount || 0,
    estimatedDeliveryTime: s.estimated_delivery_time || 30,
    distance: s.distance || 0,
    openingHours: [],
    status: (s.is_open ?? s.isOpen) ? 'open' : 'closed',
    isVerified: true,
    isFeatured: s.is_featured || false,
    isNew: s.is_new || false,
    hasPromotion: s.has_promotion || false,
    promotionText: s.promotion_text || '',
    totalOrders: s.total_orders || 0,
    merchantId: '',
    createdAt: s.created_at || '',
    updatedAt: s.created_at || '',
  };
}

export const searchService = {
  async searchStores(filters?: Partial<RestaurantFilters>): Promise<{ data: Restaurant[]; total: number }> {
    if (env.isMockMode) {
      await delay(600);
      let results = [...mockRestaurants];
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(r => r.name.toLowerCase().includes(q) || r.categoryNames.some(c => c.toLowerCase().includes(q)));
      }
      if (filters?.minRating) {
        results = results.filter(r => r.rating >= (filters.minRating || 0));
      }
      if (filters?.maxDeliveryFee) {
        results = results.filter(r => r.deliveryFee <= (filters.maxDeliveryFee || Infinity));
      }
      if (filters?.hasPromotion) {
        results = results.filter(r => r.hasPromotion);
      }
      if (filters?.sortBy === 'rating') {
        results.sort((a, b) => b.rating - a.rating);
      } else if (filters?.sortBy === 'delivery_fee') {
        results.sort((a, b) => a.deliveryFee - b.deliveryFee);
      } else {
        results.sort((a, b) => a.distance - b.distance);
      }
      return { data: results, total: results.length };
    }
    try {
      const params: Record<string, string> = {};
      if (filters?.query) params.query = filters.query;
      if (filters?.categoryIds?.length) params.categoryId = filters.categoryIds[0];
      if (filters?.minRating) params.minRating = String(filters.minRating);
      if (filters?.maxDeliveryFee) params.maxDeliveryFee = String(filters.maxDeliveryFee);
      if (filters?.hasPromotion) params.hasPromotion = String(filters.hasPromotion);
      if (filters?.sortBy) params.sortBy = filters.sortBy;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.pageSize) params.limit = String(filters.pageSize);

      const items = await apiClient.get<BackendStore[]>('/v1/search/stores', params);
      return {
        data: items.map(mapBackendStore),
        total: items.length,
      };
    } catch (e) {
      console.warn("Failed to search stores", e);
      return { data: [], total: 0 };
    }
  },

  async getSuggestions(query: string, limit = 10): Promise<string[]> {
    if (env.isMockMode) {
      await delay(300);
      return [];
    }
    try {
      const items = await apiClient.get<string[]>('/v1/search/suggestions', { query, limit: String(limit) });
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn("Failed to get suggestions", e);
      return [];
    }
  },

  async getSearchHistory(): Promise<string[]> {
    if (env.isMockMode) {
      await delay(300);
      return [];
    }
    try {
      const items = await apiClient.get<{ search_query: string }[]>('/v1/search/history');
      return items.map((h) => h.search_query);
    } catch (e) {
      console.warn("Failed to get search history", e);
      return [];
    }
  },

  async clearSearchHistory(): Promise<void> {
    if (env.isMockMode) {
      await delay(300);
      return;
    }
    try {
      await apiClient.delete('/v1/search/history');
    } catch (e) {
      console.warn("Failed to clear search history", e);
    }
  },
};
