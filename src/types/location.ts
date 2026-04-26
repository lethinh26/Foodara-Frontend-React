import type { Coordinates } from './common';

export interface Address {
  id: string;
  userId: string;
  label: string; // 'home', 'work', 'other'
  fullAddress: string;
  street: string;
  ward: string;
  districtId?: string;
  district: string;
  cityId?: string;
  city: string;
  coordinates: Coordinates;
  note: string; // delivery instructions
  driverNote: string; // driver-specific directions
  isDefault: boolean;
  phone: string;
  contactName: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  cities: City[];
}

export interface City {
  id: string;
  regionId?: string;
  name: string;
  code: string;
  isActive: boolean;
  districts: District[];
}

export interface District {
  id: string;
  cityId: string;
  name: string;
  code: string;
  isActive: boolean;
  zones: Zone[];
}

export interface Zone {
  id: string;
  districtId: string;
  name: string;
  code: string;
  isActive: boolean;
  polygon: Coordinates[]; // geo-fence coordinates
  baseFee: number;
  peakMultiplier: number;
}

export interface ServiceZone {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  cityId: string;
  districtIds: string[];
  maxDeliveryRadius: number; // km
  estimatedDeliveryTime: number; // minutes
  baseFee: number;
}
