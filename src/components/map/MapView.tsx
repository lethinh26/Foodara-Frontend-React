import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '../../config/env';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'store' | 'delivery' | 'driver';
  label?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  polyline?: string;
  height?: number;
}

const COLOR_BY_TYPE: Record<MapMarker['type'], string> = {
  store: '#10b981',
  delivery: '#ef4444',
  driver: '#3b82f6',
};

export default function MapView({ markers, polyline, height = 320 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!env.mapboxToken) return;

    mapboxgl.accessToken = env.mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: env.mapStyle,
      center: [env.defaultLng, env.defaultLat],
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markers.length) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    markers.forEach((m) => {
      const marker = new mapboxgl.Marker({ color: COLOR_BY_TYPE[m.type] })
        .setLngLat([m.lng, m.lat]);
      if (m.label) {
        marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(m.label));
      }
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend([m.lng, m.lat]);
    });

    if (markers.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    } else {
      map.easeTo({ center: [markers[0].lng, markers[0].lat], zoom: 14 });
    }
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = 'route';
    const layerId = 'route-line';

    const apply = () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      if (!polyline) return;
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: decodePolyline(polyline) },
        },
      });
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 4 },
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [polyline]);

  if (!env.mapboxToken) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded border border-dashed text-sm text-gray-500"
      >
        Map provider chưa được cấu hình.
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: 8 }} />;
}

function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    result = 0;
    shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}
