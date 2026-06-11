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
  addressLine: string;
  ward: string;
  districtName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  phone: string;
  isOpen: boolean;
  isActive: boolean;
  avgPreparationTime: number;
  minOrderAmount: number;
  avgRating: number;
  totalRatings: number;
  totalOrders: number;
  coverImageUrl: string;
  logoUrl: string;
  createdAt: string;
  distance: number;
  estimatedDeliveryTime: number;
  deliveryFee: number;
  hasPromotion: boolean;
  promotionText: string;
  isNew: boolean;
  isFeatured: boolean;
  location: string;
  isOpenNow: boolean;
}

function mapBackendStore(s: BackendStore): Restaurant {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug || '',
    description: s.description || '',
    coverImage: s.coverImageUrl || '',
    logo: s.logoUrl || '',
    categories: [],
    categoryNames: [],
    address: s.addressLine || [s.ward, s.districtName, s.cityName].filter(Boolean).join(', ') || '',
    coordinates: { lat: s.latitude || 0, lng: s.longitude || 0 },
    phone: s.phone || '',
    rating: s.avgRating || 0,
    reviewCount: s.totalRatings || 0,
    deliveryFee: s.deliveryFee || 0,
    minOrder: s.minOrderAmount || 0,
    estimatedDeliveryTime: s.estimatedDeliveryTime || s.avgPreparationTime || 30,
    distance: s.distance || 0,
    openingHours: [],
    status: s.isOpen ? 'open' : 'closed',
    isVerified: s.isActive ?? true,
    isFeatured: s.isFeatured || false,
    isNew: s.isNew || false,
    hasPromotion: s.hasPromotion || false,
    promotionText: s.promotionText || '',
    totalOrders: s.totalOrders || 0,
    merchantId: '',
    createdAt: s.createdAt || '',
    updatedAt: s.createdAt || '',
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
