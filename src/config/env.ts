export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  isMockMode: import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_API_BASE_URL,

  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  mapStyle: import.meta.env.VITE_MAP_STYLE || 'mapbox://styles/mapbox/streets-v12',
  defaultLat: parseFloat(import.meta.env.VITE_DEFAULT_LAT || '10.8231'),
  defaultLng: parseFloat(import.meta.env.VITE_DEFAULT_LNG || '106.6297'),

  paymentProviderKey: import.meta.env.VITE_PAYMENT_PROVIDER_KEY || '',

  featureRealtime: import.meta.env.VITE_FEATURE_REALTIME === 'true',
  featureAnalytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',

  analyticsKey: import.meta.env.VITE_ANALYTICS_KEY || '',

  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  apiUrl: import.meta.env.VITE_CLOUDINARY_API_URL,

  get hasMapProvider(): boolean {
    return !!this.mapboxToken;
  },
  get hasPaymentProvider(): boolean {
    return !!this.paymentProviderKey;
  },
  get isApiConnected(): boolean {
    return !this.isMockMode && !!this.apiBaseUrl;
  },
} as const;
