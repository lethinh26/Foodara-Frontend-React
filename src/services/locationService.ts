import { env } from '../config/env';

// ============================================================
// Vietnam Provinces API (https://provinces.open-api.vn/api/v1/)
// ============================================================
const PROVINCES_API = 'https://provinces.open-api.vn/api/v1';

// ── Types from provinces.open-api.vn ──
export interface ProvinceItem {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
}

export interface DistrictItem {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
}

export interface WardItem {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  district_code: number;
}

// ── Types for backend location APIs ──
export interface CoverageCheckResponse {
  covered: boolean;
  cityId: string | null;
  cityName: string | null;
  zoneId: string | null;
  zoneName: string | null;
  surgeMultiplier: number | null;
}

export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

// ── Cache to avoid re-fetching ──
let provincesCache: ProvinceItem[] | null = null;

// ============================================================
// Location Service
// ============================================================
export const locationService = {
  /**
   * Lấy danh sách tỉnh/thành phố Việt Nam
   */
  async getProvinces(): Promise<ProvinceItem[]> {
    if (provincesCache) return provincesCache;

    const response = await fetch(`${PROVINCES_API}/p/`);
    if (!response.ok) throw new Error('Không thể tải danh sách tỉnh/thành phố');
    const data: ProvinceItem[] = await response.json();
    provincesCache = data;
    return data;
  },

  /**
   * Lấy danh sách quận/huyện theo mã tỉnh/thành phố
   */
  async getDistricts(provinceCode: number): Promise<DistrictItem[]> {
    const response = await fetch(`${PROVINCES_API}/p/${provinceCode}?depth=2`);
    if (!response.ok) throw new Error('Không thể tải danh sách quận/huyện');
    const data = await response.json();
    return data.districts || [];
  },

  /**
   * Lấy danh sách phường/xã theo mã quận/huyện
   */
  async getWards(districtCode: number): Promise<WardItem[]> {
    const response = await fetch(`${PROVINCES_API}/d/${districtCode}?depth=2`);
    if (!response.ok) throw new Error('Không thể tải danh sách phường/xã');
    const data = await response.json();
    return data.wards || [];
  },

  /**
   * Kiểm tra vùng phục vụ (backend API)
   */
  async checkCoverage(lat: number, lng: number): Promise<CoverageCheckResponse> {
    if (env.isMockMode || !env.apiBaseUrl) {
      if (lat > 10.5 && lat < 11.2 && lng > 106.3 && lng < 107.0) {
        return { covered: true, cityId: 'city-hcm', cityName: 'Hồ Chí Minh', zoneId: 'zone-1', zoneName: 'HCM Trung tâm', surgeMultiplier: 1.0 };
      }
      return { covered: false, cityId: null, cityName: null, zoneId: null, zoneName: null, surgeMultiplier: null };
    }

    const response = await fetch(`${env.apiBaseUrl}/v1/locations/check-coverage?lat=${lat}&lng=${lng}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await response.json();
    if (body.code === 1000) return body.result;
    throw new Error(body.message || 'Check coverage failed');
  },

  /**
   * Geocode: địa chỉ → toạ độ (backend API)
   */
  async geocode(address: string): Promise<GeocodeResponse> {
    if (env.isMockMode || !env.apiBaseUrl) {
      return { latitude: 10.7735, longitude: 106.7022, formattedAddress: address };
    }

    const response = await fetch(`${env.apiBaseUrl}/v1/locations/geocode?address=${encodeURIComponent(address)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await response.json();
    if (body.code === 1000) return body.result;
    throw new Error(body.message || 'Geocoding failed');
  },

  /**
   * Reverse geocode: toạ độ → địa chỉ (backend API)
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResponse> {
    if (env.isMockMode || !env.apiBaseUrl) {
      return { latitude: lat, longitude: lng, formattedAddress: `${lat}, ${lng}` };
    }

    const response = await fetch(`${env.apiBaseUrl}/v1/locations/reverse-geocode?lat=${lat}&lng=${lng}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await response.json();
    if (body.code === 1000) return body.result;
    throw new Error(body.message || 'Reverse geocoding failed');
  },
};
