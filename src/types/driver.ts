import type { Coordinates } from './common';

export type DriverStatus = 'available' | 'busy' | 'offline' | 'suspended';

export interface Driver {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  avatar: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car';
  vehiclePlate: string;
  status: DriverStatus;
  currentLocation: Coordinates;
  rating: number;
  reviewCount: number;
  totalDeliveries: number;
  completionRate: number;
  joinedAt: string;
  isVerified: boolean;
  documents: DriverDocument[];
}

export interface DriverDocument {
  id: string;
  type: 'id_card' | 'driver_license' | 'vehicle_registration' | 'insurance';
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  expiresAt: string;
}
