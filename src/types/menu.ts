export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface Size {
  id: string;
  name: string;
  priceAdjustment: number; // additional cost
  isDefault: boolean;
  isAvailable?: boolean;
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  maxQuantity: number;
}

export interface ToppingGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ToppingOption[];
}

export interface ComboOption {
  id: string;
  name: string;
  items: ComboItem[];
  price: number;
  originalPrice: number;
  isAvailable: boolean;
}

export interface ComboItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  basePrice: number;
  originalPrice: number;
  sizes: Size[];
  toppingGroups: ToppingGroup[];
  variants: MenuVariant[];
  comboOptions: ComboOption[];
  isAvailable: boolean;
  isPopular: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  maxQuantity: number;
  preparationTime: number; // minutes
  calories: number;
  tags: string[];
  soldCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SelectedTopping {
  groupId: string;
  optionId: string;
  quantity: number;
}

export interface SelectedSize {
  sizeId: string;
}
