import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '../../config/env';

export interface MapPickerCoords {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  value?: MapPickerCoords;
  onChange?: (coords: MapPickerCoords) => void;
  height?: number;
  zoom?: number;
}

export default function MapPicker({ value, onChange, height = 320, zoom = 15 }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!env.mapboxToken) return;

    mapboxgl.accessToken = env.mapboxToken;
    const center: [number, number] = value
      ? [value.lng, value.lat]
      : [env.defaultLng, env.defaultLat];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: env.mapStyle,
      center,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true, color: '#ef4444' })
      .setLngLat(center)
      .addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const ll = marker.getLngLat();
      onChange?.({ lat: ll.lat, lng: ll.lng });
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      onChange?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value || !mapRef.current || !markerRef.current) return;
    const next: [number, number] = [value.lng, value.lat];
    markerRef.current.setLngLat(next);
    mapRef.current.easeTo({ center: next });
  }, [value?.lat, value?.lng]);

  if (!env.mapboxToken) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded border border-dashed text-sm text-gray-500"
      >
        Map provider chưa được cấu hình (VITE_MAPBOX_TOKEN).
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: 8 }} />;
}
