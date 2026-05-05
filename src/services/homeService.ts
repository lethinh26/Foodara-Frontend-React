import { delay } from '../utils/helpers';
import { apiClient } from './apiClient';
import { env } from '../config/env';
import type { Restaurant, RestaurantCategory } from '../types/restaurant';

interface BackendBannerResponse {
  id: string;
  title?: string;
  imageUrl?: string;
  image_url?: string;
  targetUrl?: string;
  target_url?: string;
  targetType?: string;
  target_type?: string;
  targetId?: string;
  target_id?: string;
  position?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  targetType?: string;
  targetId?: string;
}

function mapBackendBanner(b: BackendBannerResponse): Banner {
  return {
    id: b.id,
    title: b.title || '',
    imageUrl: b.imageUrl || b.image_url || '',
    targetUrl: b.targetUrl || b.target_url || undefined,
    targetType: b.targetType || b.target_type || undefined,
    targetId: b.targetId || b.target_id || undefined,
  };
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  banner_url: string;
}

interface BackendStoreResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  coverImageUrl?: string;
  logo_url?: string;
  logoUrl?: string;
  address_line?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  avg_rating?: number;
  avgRating?: number;
  total_ratings?: number;
  totalRatings?: number;
  delivery_fee?: number;
  deliveryFee?: number;
  min_order_amount?: number;
  minOrderAmount?: number;
  estimated_delivery_time?: number;
  estimatedDeliveryTime?: number;
  distance?: number;
  is_open?: boolean;
  isOpen?: boolean;
  is_featured?: boolean;
  isFeatured?: boolean;
  is_new?: boolean;
  isNew?: boolean;
  has_promotion?: boolean;
  hasPromotion?: boolean;
  promotion_text?: string;
  promotionText?: string;
  total_orders?: number;
  totalOrders?: number;
  merchant_id?: string;
  merchantId?: string;
  created_at?: string;
  createdAt?: string;
}

interface BackendCategoryResponse {
  id: string;
  name: string;
  slug?: string;
  icon_url?: string;
  iconUrl?: string;
  description?: string;
  display_order?: number;
  displayOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
  restaurant_count?: number;
  restaurantCount?: number;
}

function mapBackendStoreToRestaurant(s: BackendStoreResponse): Restaurant {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug || '',
    description: s.description || '',
    coverImage: s.cover_image_url || s.coverImageUrl || '',
    logo: s.logo_url || s.logoUrl || '',
    categories: [],
    categoryNames: [],
    address: s.address_line || s.addressLine || '',
    coordinates: { lat: s.latitude || 0, lng: s.longitude || 0 },
    phone: s.phone || '',
    rating: s.avg_rating || s.avgRating || 0,
    reviewCount: s.total_ratings || s.totalRatings || 0,
    deliveryFee: s.delivery_fee || s.deliveryFee || 0,
    minOrder: s.min_order_amount || s.minOrderAmount || 0,
    estimatedDeliveryTime: s.estimated_delivery_time || s.estimatedDeliveryTime || 30,
    distance: s.distance || 0,
    openingHours: [],
    status: (s.is_open ?? s.isOpen) ? 'open' : 'closed',
    isVerified: true,
    isFeatured: s.is_featured || s.isFeatured || false,
    isNew: s.is_new || s.isNew || false,
    hasPromotion: s.has_promotion || s.hasPromotion || false,
    promotionText: s.promotion_text || s.promotionText || '',
    totalOrders: s.total_orders || s.totalOrders || 0,
    merchantId: s.merchant_id || s.merchantId || '',
    createdAt: s.created_at || s.createdAt || '',
    updatedAt: s.created_at || s.createdAt || '',
  };
}

function mapBackendCategoryToCategory(c: BackendCategoryResponse): RestaurantCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug || '',
    icon: c.icon_url || c.iconUrl || '🍽️',
    description: c.description || '',
    restaurantCount: c.restaurant_count || c.restaurantCount || 0,
    sortOrder: c.display_order || c.displayOrder || 0,
    isActive: c.is_active ?? c.isActive ?? true,
  };
}

export const homeService = {
  async getBanners(): Promise<Banner[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<BackendBannerResponse[]>('/v1/home/banners');
      return items.map(mapBackendBanner);
    } catch (e) {
      console.warn("Failed to fetch banners", e);
      return [];
    }
  },

  async getCategories(): Promise<RestaurantCategory[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<BackendCategoryResponse[]>('/v1/home/categories');
      return items.map(mapBackendCategoryToCategory);
    } catch (e) {
      console.warn("Failed to fetch categories", e);
      return [];
    }
  },

  async getNearbyStores(lat?: number, lng?: number, limit = 10): Promise<Restaurant[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const params: Record<string, string> = { limit: String(limit) };
      if (lat != null && lng != null) {
        params.lat = String(lat);
        params.lng = String(lng);
      }
      const items = await apiClient.get<BackendStoreResponse[]>('/v1/home/nearby-stores', params);
      return items.map(mapBackendStoreToRestaurant);
    } catch (e) {
      console.warn("Failed to fetch nearby stores", e);
      return [];
    }
  },

  async getPopularStores(limit = 10): Promise<Restaurant[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<BackendStoreResponse[]>('/v1/home/popular-stores', { limit: String(limit) });
      return items.map(mapBackendStoreToRestaurant);
    } catch (e) {
      console.warn("Failed to fetch popular stores", e);
      return [];
    }
  },

  async getPromotionStores(limit = 10): Promise<Restaurant[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<BackendStoreResponse[]>('/v1/home/promotions', { limit: String(limit) });
      return items.map(mapBackendStoreToRestaurant);
    } catch (e) {
      console.warn("Failed to fetch promotion stores", e);
      return [];
    }
  },

  async getFlashDeals(): Promise<Campaign[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<Campaign[]>('/v1/home/flash-deals');
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn("Failed to fetch flash deals", e);
      return [];
    }
  },

  async getCampaigns(): Promise<Campaign[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<Campaign[]>('/v1/home/campaigns');
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn("Failed to fetch campaigns", e);
      return [];
    }
  },

  async getRecommendations(limit = 10): Promise<Restaurant[]> {
    if (env.isMockMode) {
      await delay(400);
      return [];
    }
    try {
      const items = await apiClient.get<BackendStoreResponse[]>('/v1/home/recommendations', { limit: String(limit) });
      return items.map(mapBackendStoreToRestaurant);
    } catch (e) {
      console.warn("Failed to fetch recommendations", e);
      return [];
    }
  },
};
