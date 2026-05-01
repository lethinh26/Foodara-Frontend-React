import type { Coordinates } from './common';

export interface Address {
  id: string;
  userId: string;
  label: string; // 'home', 'work', 'other'
  fullAddress: string;
  street: string;
  ward: string;
  districtName?: string;
  cityName?: string;
  coordinates: Coordinates;
  note: string; // delivery instructions
  driverNote: string; // driver-specific directions
  isDefault: boolean;
  phone: string;
  contactName: string;
}
