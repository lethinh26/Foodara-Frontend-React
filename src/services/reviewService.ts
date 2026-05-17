import { apiClient } from './apiClient';

export interface CreateReviewPayload {
  orderId: string;
  storeRating: number;
  storeComment?: string;
  driverRating?: number;
  driverComment?: string;
  isAnonymous?: boolean;
  tags?: string[];
  items?: Array<{ menuItemId: string; rating: number; comment?: string }>;
}

export interface ReviewItemResponse {
  menuItemId: string;
  menuItemName?: string;
  rating: number | null;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  orderId?: string;
  storeId?: string;
  storeRating: number | null;
  storeComment?: string;
  driverRating?: number | null;
  driverComment?: string;
  isAnonymous?: boolean;
  status?: string;
  tags?: string[];
  items?: ReviewItemResponse[];
  createdAt?: string;
  customerName?: string;
  customerAvatar?: string;
}

export const reviewService = {
  createReview: (payload: CreateReviewPayload) =>
    apiClient.post<ReviewResponse>('/v1/reviews', payload),

  getReview: (id: string) =>
    apiClient.get<ReviewResponse>(`/v1/reviews/${id}`),

  getReviewByOrder: (orderId: string) =>
    apiClient.get<ReviewResponse | null>(`/v1/reviews/order/${orderId}`),

  getStoreReviews: (storeId: string) =>
    apiClient.get<ReviewResponse[]>(`/v1/stores/${storeId}/reviews`),
};
