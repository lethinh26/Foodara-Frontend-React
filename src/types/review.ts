export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  restaurantId: string;
  driverId: string | null;
  restaurantRating: number;
  driverRating: number | null;
  foodRating: number;
  comment: string;
  images: string[];
  tags: string[];
  reply: ReviewReply | null;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewReply {
  id: string;
  content: string;
  repliedBy: string;
  repliedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  type: 'restaurant' | 'menu_item';
  targetId: string;
  targetName: string;
  targetImage: string;
  restaurantId: string;
  restaurantName: string;
  addedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratings: { stars: number; count: number; percentage: number }[];
  topTags: { tag: string; count: number }[];
}
