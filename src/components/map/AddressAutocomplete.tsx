import { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Spin } from 'antd';
import { mapboxLocationService, type SuggestResponse } from '../../services/locationService';

export interface SelectedAddress {
  fullAddress: string;
  lat: number;
  lng: number;
  ward?: string;
  districtName?: string;
  cityName?: string;
  mapboxId?: string;
}

interface Props {
  value?: string;
  placeholder?: string;
  proximity?: { lat: number; lng: number };
  onSelect: (address: SelectedAddress) => void;
}

export default function AddressAutocomplete({ value, placeholder, proximity, onSelect }: Props) {
  const [query, setQuery] = useState(value ?? '');
  const [items, setItems] = useState<SuggestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionToken = useMemo(() => crypto.randomUUID(), []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setItems([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await mapboxLocationService.suggest(query.trim(), sessionToken, proximity);
        setItems(res);
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sessionToken, proximity?.lat, proximity?.lng]);

  const handlePick = async (item: SuggestResponse) => {
    setOpen(false);
    setQuery(item.fullAddress || item.name);
    try {
      const res = await mapboxLocationService.retrieve(item.id, sessionToken);
      onSelect({
        fullAddress: res.formattedAddress || item.fullAddress || item.name,
        lat: res.latitude,
        lng: res.longitude,
        ward: res.ward,
        districtName: res.districtName,
        cityName: res.cityName,
        mapboxId: item.id,
      });
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Input
        value={query}
        placeholder={placeholder ?? 'Nhập địa chỉ giao hàng'}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        suffix={loading ? <Spin size="small" /> : null}
      />
      {open && items.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {items.map((item) => (
            <li
              key={item.id}
              onMouseDown={() => handlePick(item)}
              style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 4 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.fullAddress}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

