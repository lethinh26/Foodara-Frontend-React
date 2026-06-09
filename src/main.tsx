import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import App from './app/App';

// Tắt telemetry beacon (events.mapbox.com) — tránh ERR_BLOCKED_BY_CLIENT trên adblock
(mapboxgl as unknown as { setTelemetryEnabled?: (v: boolean) => void }).setTelemetryEnabled?.(false);

createRoot(document.getElementById('root')!).render(<App />);
