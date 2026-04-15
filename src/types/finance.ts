
export interface PricingConfig {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  zoneName: string;
  baseDeliveryFee: number;
  perKmFee: number;
  peakHourMultiplier: number;
  peakHours: string[]; // ["11:00-13:00", "17:00-20:00"]
  rainMultiplier: number;
  platformFeePercentage: number;
  platformFeeMin: number;
  platformFeeMax: number;
  minOrderValue: number;
  smallOrderFee: number;
  smallOrderThreshold: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface SLAConfig {
  id: string;
  name: string;
  description: string;
  merchantResponseTime: number; // seconds
  maxPreparationTime: number; // minutes
  driverPickupTime: number; // minutes after ready
  maxDeliveryTime: number; // minutes
  autoRejectAfter: number; // seconds, auto reject order
  autoCancelAfter: number; // minutes, auto cancel order
  warningThreshold: number; // percentage of SLA time
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}
