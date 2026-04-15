// Common shared types used across the application

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimeRange {
  open: string;  // HH:mm
  close: string; // HH:mm
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: string | number | boolean | string[] | number[];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}
