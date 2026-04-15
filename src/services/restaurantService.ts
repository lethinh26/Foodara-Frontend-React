import { delay } from '../utils/helpers';
import { apiClient } from './apiClient';
import { env } from '../config/env';
import { mockRestaurants, mockCategories } from '../mocks/restaurants';
import { mockMenuItems, mockMenuCategories } from '../mocks/menuItems';
import { mockReviews } from '../mocks/orders';
import type { Restaurant, RestaurantCategory, RestaurantFilters } from '../types/restaurant';
import type { MenuItem, MenuCategory } from '../types/menu';
import type { Review } from '../types/review';

// Backend response interfaces
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

interface BackendStoreCategoryResponse {
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

interface BackendMenuCategoryResponse {
  id: string;
  storeId?: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  itemCount?: number;
}

interface BackendMenuItemResponse {
  id: string;
  storeId?: string;
  categoryId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice?: number;
  isAvailable?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  maxQuantityPerOrder?: number;
  totalSold?: number;
  avgRating?: number;
  totalRatings?: number;
  createdAt?: string;
}

interface BackendOptionItemResponse {
  id: string;
  optionGroupId?: string;
  name: string;
  priceAdjustment?: number;
  isAvailable?: boolean;
  isDefault?: boolean;
  displayOrder?: number;
}

interface BackendOptionGroupResponse {
  id: string;
  storeId?: string;
  name: string;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  displayOrder?: number;
  options?: BackendOptionItemResponse[];
}

interface BackendMenuItemDetailResponse extends BackendMenuItemResponse {
  optionGroups?: BackendOptionGroupResponse[];
}

interface BackendReviewResponse {
  id: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_avatar?: string;
  store_id?: string;
  store_name?: string;
  driver_id?: string;
  driver_name?: string;
  store_rating?: number;
  food_rating?: number;
  driver_rating?: number;
  comment?: string;
  tags?: string[];
  images?: string[];
  reply?: {
    content: string;
    replied_by?: string;
    repliedBy?: string;
    replied_at?: string;
    repliedAt?: string;
  } | null;
  is_anonymous?: boolean;
  isAnonymous?: boolean;
  created_at?: string;
  createdAt?: string;
}

function mapBackendStore(s: BackendStoreResponse): Restaurant {
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

function mapBackendStoreCategory(c: BackendStoreCategoryResponse): RestaurantCategory {
  return {
    id: String(c.id),
    name: String(c.name || ''),
    slug: c.slug || '',
    icon: c.icon_url || c.iconUrl || '🍽️',
    description: c.description || '',
    restaurantCount: c.restaurant_count || c.restaurantCount || 0,
    sortOrder: Number(c.display_order || c.displayOrder || 0),
    isActive: c.is_active ?? c.isActive ?? true,
  };
}

function mapBackendMenuCategory(c: BackendMenuCategoryResponse, restaurantId: string): MenuCategory {
  return {
    id: String(c.id),
    restaurantId: String(c.storeId || restaurantId),
    name: String(c.name || ''),
    description: c.description || '',
    sortOrder: Number(c.displayOrder || 0),
    isActive: c.isActive ?? true,
    itemCount: c.itemCount ?? 0,
  };
}

function mapBackendMenuItem(m: BackendMenuItemResponse, restaurantId: string): MenuItem {
  return {
    id: String(m.id || ''),
    restaurantId: String(m.storeId || restaurantId),
    categoryId: String(m.categoryId || ''),
    name: String(m.name || ''),
    description: String(m.description || ''),
    image: String(m.imageUrl || ''),
    basePrice: Number(m.basePrice || 0),
    originalPrice: Number(m.basePrice || 0),
    sizes: [],
    toppingGroups: [],
    variants: [],
    comboOptions: [],
    isAvailable: m.isAvailable ?? true,
    isPopular: m.isPopular ?? false,
    isNew: m.isNew ?? false,
    isBestSeller: m.isPopular ?? false,
    maxQuantity: Number(m.maxQuantityPerOrder || 10),
    preparationTime: 15,
    calories: 0,
    tags: [],
    soldCount: Number(m.totalSold || 0),
    rating: Number(m.avgRating || 0),
    reviewCount: Number(m.totalRatings || 0),
    createdAt: String(m.createdAt || ''),
    updatedAt: String(m.createdAt || ''),
  };
}

function mapBackendMenuItemDetail(m: BackendMenuItemDetailResponse, restaurantId: string): MenuItem {
  const base = mapBackendMenuItem(m, restaurantId);

  // Map option groups to sizes and topping groups
  const sizes: MenuItem['sizes'] = [];
  const toppingGroups: MenuItem['toppingGroups'] = [];

  m.optionGroups?.forEach(group => {
    if (group.name.toLowerCase().includes('size')) {
      // This is a size group
      group.options?.forEach(opt => {
        sizes.push({
          id: opt.id || '',
          name: opt.name || '',
          priceAdjustment: Number(opt.priceAdjustment || 0),
          isDefault: opt.isDefault ?? false,
          isAvailable: opt.isAvailable ?? true,
        });
      });
    } else {
      // This is a topping group
      toppingGroups.push({
        id: group.id || '',
        name: group.name || '',
        required: group.isRequired ?? false,
        minSelect: group.minSelections ?? 0,
        maxSelect: group.maxSelections ?? 1,
        options: group.options?.map(opt => ({
          id: opt.id || '',
          name: opt.name || '',
          price: Number(opt.priceAdjustment || 0),
          isDefault: opt.isDefault ?? false,
          isAvailable: opt.isAvailable ?? true,
        })) || [],
      });
    }
  });

  return {
    ...base,
    sizes,
    toppingGroups,
  };
}

function mapBackendReview(r: BackendReviewResponse): Review {
  return {
    id: String(r.id || ''),
    orderId: String(r.order_id || ''),
    customerId: String(r.customer_id || ''),
    customerName: String(r.customer_name || 'Khách hàng'),
    customerAvatar: String(r.customer_avatar || ''),
    restaurantId: String(r.store_id || ''),
    driverId: r.driver_id ? String(r.driver_id) : null,
    restaurantRating: Number(r.store_rating || 0),
    driverRating: r.driver_rating != null ? Number(r.driver_rating) : null,
    foodRating: Number(r.food_rating || 0),
    comment: String(r.comment || ''),
    tags: r.tags || [],
    images: r.images || [],
    reply: r.reply ? {
      id: '',
      content: r.reply.content || '',
      repliedBy: r.reply.replied_by || r.reply.repliedBy || '',
      repliedAt: r.reply.replied_at || r.reply.repliedAt || '',
    } : null,
    isAnonymous: r.is_anonymous ?? r.isAnonymous ?? false,
    createdAt: String(r.created_at || r.createdAt || ''),
    updatedAt: String(r.created_at || r.createdAt || ''),
  };
}

export const restaurantService = {
  async getCategories(): Promise<RestaurantCategory[]> {
    if (env.isMockMode) {
      await delay(400);
      return mockCategories;
    }

    try {
      const items = await apiClient.get<BackendStoreCategoryResponse[]>('/v1/home/categories');
      return items.map(mapBackendStoreCategory);
    } catch (e) {
      console.warn("Failed to fetch categories from API, falling back to mock", e);
      return mockCategories;
    }
  },

  async getRestaurants(filters?: Partial<RestaurantFilters>): Promise<{ data: Restaurant[]; total: number }> {
    if (env.isMockMode) {
      await delay(600);
      let results = [...mockRestaurants];
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        results = results.filter(r => r.name.toLowerCase().includes(q) || r.categoryNames.some(c => c.toLowerCase().includes(q)));
      }
      if (filters?.categoryIds?.length) {
        results = results.filter(r => r.categories.some(c => filters.categoryIds!.includes(c)));
      }
      if (filters?.minRating) {
        results = results.filter(r => r.rating >= filters.minRating!);
      }
      if (filters?.maxDeliveryFee) {
        results = results.filter(r => r.deliveryFee <= filters.maxDeliveryFee!);
      }
      if (filters?.hasPromotion) {
        results = results.filter(r => r.hasPromotion);
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

      const items = await apiClient.get<BackendStoreResponse[]>('/v1/search/stores', params);
      return {
        data: items.map(mapBackendStore),
        total: items.length,
      };
    } catch (e) {
      console.warn("Failed to search stores", e);
      return { data: [], total: 0 };
    }
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    if (env.isMockMode) {
      await delay(500);
      return mockRestaurants.find(r => r.id === id) || null;
    }
    try {
      const s = await apiClient.get<BackendStoreResponse>(`/v1/stores/${id}`);
      return mapBackendStore(s);
    } catch {
      return null;
    }
  },

  async getFeatured(): Promise<Restaurant[]> {
    if (env.isMockMode) {
      await delay(400);
      return mockRestaurants.filter(r => r.isFeatured);
    }
    try {
      const items = await apiClient.get<BackendStoreResponse[]>('/v1/home/popular-stores', { limit: '10' });
      return items.map(mapBackendStore);
    } catch {
      return [];
    }
  },

  async getNearby(): Promise<Restaurant[]> {
    if (env.isMockMode) {
      await delay(400);
      return [...mockRestaurants].sort((a, b) => a.distance - b.distance).slice(0, 6);
    }
    try {
      const items = await apiClient.get<BackendStoreResponse[]>('/v1/home/nearby-stores', { limit: '10' });
      return items.map(mapBackendStore);
    } catch {
      return [];
    }
  },

  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    if (env.isMockMode) {
      await delay(300);
      return mockMenuCategories.filter(c => c.restaurantId === restaurantId);
    }
    try {
      const items = await apiClient.get<BackendMenuCategoryResponse[]>(`/v1/stores/${restaurantId}/menu-categories`);
      return items.map(c => mapBackendMenuCategory(c, restaurantId));
    } catch (e) {
      console.warn("Failed to fetch menu categories from API, falling back to mock", e);
      return mockMenuCategories.filter(c => c.restaurantId === restaurantId);
    }
  },

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    if (env.isMockMode) {
      await delay(500);
      return mockMenuItems.filter(i => i.restaurantId === restaurantId);
    }
    try {
      // Try to get menu items with option groups first
      const items = await apiClient.get<BackendMenuItemDetailResponse[]>(`/v1/stores/${restaurantId}/menu-items-detail`);
      return items.map(m => mapBackendMenuItemDetail(m, restaurantId));
    } catch (e) {
      console.warn("Failed to fetch menu items with options, falling back to basic", e);
      try {
        const items = await apiClient.get<BackendMenuItemResponse[]>(`/v1/stores/${restaurantId}/menu-items`);
        return items.map(m => mapBackendMenuItem(m, restaurantId));
      } catch (e2) {
        return mockMenuItems.filter(i => i.restaurantId === restaurantId);
      }
    }
  },

  async getReviews(restaurantId: string): Promise<Review[]> {
    if (env.isMockMode) {
      await delay(400);
      return mockReviews.filter(r => r.restaurantId === restaurantId);
    }
    try {
      const items = await apiClient.get<BackendReviewResponse[]>(`/v1/stores/${restaurantId}/reviews`);
      return items.map(mapBackendReview);
    } catch {
      return mockReviews.filter(r => r.restaurantId === restaurantId);
    }
  },
};
