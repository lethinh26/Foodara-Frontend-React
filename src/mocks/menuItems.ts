import type { MenuItem, MenuCategory } from '../types/menu';

export const mockMenuCategories: MenuCategory[] = [
  { id: 'mcat-1', restaurantId: 'rest-001', name: 'Phở', description: 'Các loại phở truyền thống', sortOrder: 1, isActive: true, itemCount: 4 },
  { id: 'mcat-2', restaurantId: 'rest-001', name: 'Bún', description: 'Bún bò, bún riêu', sortOrder: 2, isActive: true, itemCount: 3 },
  { id: 'mcat-3', restaurantId: 'rest-001', name: 'Nước uống', description: 'Nước ngọt, nước suối', sortOrder: 3, isActive: true, itemCount: 3 },
  { id: 'mcat-4', restaurantId: 'rest-002', name: 'Cơm tấm', description: 'Cơm tấm đặc biệt', sortOrder: 1, isActive: true, itemCount: 5 },
  { id: 'mcat-5', restaurantId: 'rest-002', name: 'Món thêm', description: 'Trứng, canh, rau', sortOrder: 2, isActive: true, itemCount: 4 },
  { id: 'mcat-6', restaurantId: 'rest-003', name: 'Trà sữa', description: 'Các loại trà sữa', sortOrder: 1, isActive: true, itemCount: 5 },
  { id: 'mcat-7', restaurantId: 'rest-003', name: 'Topping', description: 'Topping thêm', sortOrder: 2, isActive: true, itemCount: 3 },
];

const baseToppingGroups = [
  {
    id: 'tg-1', name: 'Thêm thịt', required: false, minSelect: 0, maxSelect: 3,
    options: [
      { id: 'tp-1', name: 'Thêm bò tái', price: 20000, isAvailable: true, maxQuantity: 2 },
      { id: 'tp-2', name: 'Thêm gân bò', price: 25000, isAvailable: true, maxQuantity: 2 },
      { id: 'tp-3', name: 'Thêm nạm', price: 20000, isAvailable: true, maxQuantity: 2 },
    ],
  },
];

const drinkToppingGroups = [
  {
    id: 'tg-ts-1', name: 'Topping', required: false, minSelect: 0, maxSelect: 3,
    options: [
      { id: 'ts-tp-1', name: 'Trân châu đen', price: 8000, isAvailable: true, maxQuantity: 2 },
      { id: 'ts-tp-2', name: 'Trân châu trắng', price: 8000, isAvailable: true, maxQuantity: 2 },
      { id: 'ts-tp-3', name: 'Pudding', price: 10000, isAvailable: true, maxQuantity: 1 },
    ],
  },
  {
    id: 'tg-ts-2', name: 'Độ ngọt', required: true, minSelect: 1, maxSelect: 1,
    options: [
      { id: 'ts-sw-1', name: '100% đường', price: 0, isAvailable: true, maxQuantity: 1 },
      { id: 'ts-sw-2', name: '70% đường', price: 0, isAvailable: true, maxQuantity: 1 },
      { id: 'ts-sw-3', name: '50% đường', price: 0, isAvailable: true, maxQuantity: 1 },
    ],
  },
];

const drinkSizes = [
  { id: 'ts-s', name: 'Size M', priceAdjustment: 0, isDefault: true },
  { id: 'ts-l', name: 'Size L', priceAdjustment: 10000, isDefault: false },
];

const phoSizes = [
  { id: 'size-s', name: 'Nhỏ', priceAdjustment: -10000, isDefault: false },
  { id: 'size-m', name: 'Vừa', priceAdjustment: 0, isDefault: true },
  { id: 'size-l', name: 'Lớn', priceAdjustment: 15000, isDefault: false },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: 'item-001', restaurantId: 'rest-001', categoryId: 'mcat-1',
    name: 'Phở Bò Tái Nạm', description: 'Phở bò tái nạm truyền thống, nước dùng ninh xương 12 tiếng',
    image: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=400',
    basePrice: 55000, originalPrice: 55000, sizes: phoSizes, toppingGroups: baseToppingGroups,
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: true, isNew: false, isBestSeller: true,
    maxQuantity: 10, preparationTime: 10, calories: 450, tags: ['Bán chạy'],
    soldCount: 3420, rating: 4.8, reviewCount: 245,
    createdAt: '2023-06-01T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'item-002', restaurantId: 'rest-001', categoryId: 'mcat-1',
    name: 'Phở Gà', description: 'Phở gà ta, thịt gà xé nhỏ, nước dùng thanh ngọt',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',
    basePrice: 50000, originalPrice: 50000, sizes: phoSizes, toppingGroups: [],
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: false, isNew: false, isBestSeller: false,
    maxQuantity: 10, preparationTime: 10, calories: 380, tags: [],
    soldCount: 1890, rating: 4.6, reviewCount: 102,
    createdAt: '2023-06-01T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'item-003', restaurantId: 'rest-001', categoryId: 'mcat-3',
    name: 'Trà Đá', description: 'Trà đá truyền thống',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    basePrice: 5000, originalPrice: 5000, sizes: [], toppingGroups: [],
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: false, isNew: false, isBestSeller: false,
    maxQuantity: 20, preparationTime: 1, calories: 5, tags: [],
    soldCount: 8900, rating: 4.0, reviewCount: 23,
    createdAt: '2023-06-01T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'item-005', restaurantId: 'rest-002', categoryId: 'mcat-4',
    name: 'Cơm Tấm Sườn Bì Chả', description: 'Cơm tấm đặc biệt với sườn nướng, bì, chả trứng',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    basePrice: 45000, originalPrice: 45000, sizes: [],
    toppingGroups: [{
      id: 'tg-ct-1', name: 'Món thêm', required: false, minSelect: 0, maxSelect: 4,
      options: [
        { id: 'ct-tp-1', name: 'Thêm sườn', price: 15000, isAvailable: true, maxQuantity: 2 },
        { id: 'ct-tp-2', name: 'Trứng ốp la', price: 8000, isAvailable: true, maxQuantity: 2 },
      ],
    }],
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: true, isNew: false, isBestSeller: true,
    maxQuantity: 10, preparationTime: 12, calories: 650, tags: ['Bán chạy'],
    soldCount: 6540, rating: 4.7, reviewCount: 389,
    createdAt: '2023-03-15T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'item-006', restaurantId: 'rest-002', categoryId: 'mcat-4',
    name: 'Cơm Tấm Sườn Nướng', description: 'Cơm tấm sườn nướng than hồng',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    basePrice: 40000, originalPrice: 40000, sizes: [], toppingGroups: [],
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: false, isNew: false, isBestSeller: false,
    maxQuantity: 10, preparationTime: 10, calories: 580, tags: [],
    soldCount: 3210, rating: 4.5, reviewCount: 156,
    createdAt: '2023-03-15T00:00:00Z', updatedAt: '2025-03-14T00:00:00Z',
  },
  {
    id: 'item-007', restaurantId: 'rest-003', categoryId: 'mcat-6',
    name: 'Trà Sữa Đường Nâu', description: 'Trà sữa đường nâu signature, vân hổ đặc trưng',
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400',
    basePrice: 55000, originalPrice: 55000, sizes: drinkSizes,
    toppingGroups: drinkToppingGroups,
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: true, isNew: false, isBestSeller: true,
    maxQuantity: 5, preparationTime: 5, calories: 350, tags: ['Signature'],
    soldCount: 9800, rating: 4.6, reviewCount: 890,
    createdAt: '2023-08-20T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'item-008', restaurantId: 'rest-003', categoryId: 'mcat-6',
    name: 'Trà Ô Long Vải', description: 'Trà ô long với vải tươi, thanh mát',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    basePrice: 45000, originalPrice: 45000, sizes: drinkSizes, toppingGroups: [],
    variants: [], comboOptions: [],
    isAvailable: true, isPopular: false, isNew: true, isBestSeller: false,
    maxQuantity: 5, preparationTime: 5, calories: 180, tags: ['Mới'],
    soldCount: 1200, rating: 4.4, reviewCount: 67,
    createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
];
