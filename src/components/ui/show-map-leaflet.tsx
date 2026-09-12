import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface MapCoordinate {
  lat: number;
  lng: number;
}

type MapCoordinateValue = string | MapCoordinate | null | undefined;

interface LeafletMapInstance {
  invalidateSize: () => void;
  off: () => void;
  on: (event: string, handler: (event: { latlng: MapCoordinate }) => void) => void;
  remove: () => void;
  setView: (coordinate: [number, number], zoom?: number) => void;
}

interface LeafletMarkerInstance {
  addTo: (map: LeafletMapInstance) => LeafletMarkerInstance;
  remove: () => void;
  setLatLng: (coordinate: [number, number]) => void;
}

interface LeafletRuntime {
  divIcon: (options: Record<string, unknown>) => unknown;
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMapInstance;
  marker: (coordinate: [number, number], options?: Record<string, unknown>) => LeafletMarkerInstance;
  tileLayer: (
    url: string,
    options: Record<string, unknown>,
  ) => { addTo: (map: LeafletMapInstance) => void };
}

const DEFAULT_CENTER: [number, number] = [-6.2, 106.816666];

export const parseMapCoordinate = (value: MapCoordinateValue): MapCoordinate | null => {
  if (!value) return null;

  if (typeof value === 'object') {
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      return parseMapCoordinate({
        lat: Number(parsed.lat ?? parsed.latitude),
        lng: Number(parsed.lng ?? parsed.longitude),
      });
    } catch {
      return null;
    }
  }

  const [latitude, longitude] = trimmed.split(',').map((part) => Number(part.trim()));
  return parseMapCoordinate({ lat: latitude, lng: longitude });
};

export const serializeMapCoordinate = ({ lat, lng }: MapCoordinate) =>
  `${Number(lat.toFixed(7))},${Number(lng.toFixed(7))}`;

interface ShowMapLeafletProps {
  value?: MapCoordinateValue;
  onCoordinateChange?: (coordinate: MapCoordinate) => void;
  className?: string;
  zoom?: number;
  ariaLabel?: string;
}

export function ShowMapLeaflet({
  value,
  onCoordinateChange,
  className,
  zoom = 15,
  ariaLabel = 'Peta lokasi',
}: ShowMapLeafletProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarkerInstance | null>(null);
  const leafletRef = useRef<LeafletRuntime | null>(null);
  const onCoordinateChangeRef = useRef(onCoordinateChange);
  const coordinate = parseMapCoordinate(value);
  const coordinateLat = coordinate?.lat;
  const coordinateLng = coordinate?.lng;

  useEffect(() => {
    onCoordinateChangeRef.current = onCoordinateChange;
  }, [onCoordinateChange]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const initializeMap = async () => {
      if (!containerRef.current || mapRef.current) return;

      // Leaflet does not ship TypeScript declarations; keep the runtime import client-only for Next.js SSR.
      const imported = (await import('leaflet')) as unknown as LeafletRuntime & { default?: LeafletRuntime };
      const leaflet = imported.default ?? imported;
      if (cancelled || !containerRef.current) return;

      leafletRef.current = leaflet;
      const initialCoordinate = parseMapCoordinate(value);
      const center: [number, number] = initialCoordinate
        ? [initialCoordinate.lat, initialCoordinate.lng]
        : DEFAULT_CENTER;
      const map = leaflet.map(containerRef.current, {
        center,
        zoom: initialCoordinate ? zoom : 11,
        scrollWheelZoom: true,
      });

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', (event) => onCoordinateChangeRef.current?.(event.latlng));
      mapRef.current = map;

      if (initialCoordinate) {
        markerRef.current = leaflet.marker([initialCoordinate.lat, initialCoordinate.lng], {
          icon: leaflet.divIcon({
            className: 'leaflet-coordinate-marker',
            html: '<span aria-hidden="true"></span>',
            iconAnchor: [10, 10],
            iconSize: [20, 20],
          }),
        }).addTo(map);
      }

      window.setTimeout(() => map.invalidateSize(), 0);
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(containerRef.current);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.off();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
    // The map is initialized once; coordinate updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet) return;

    if (coordinateLat === undefined || coordinateLng === undefined) {
      markerRef.current?.remove();
      markerRef.current = null;
      map.setView(DEFAULT_CENTER, 11);
      return;
    }

    const position: [number, number] = [coordinateLat, coordinateLng];
    map.setView(position, zoom);
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      return;
    }

    markerRef.current = leaflet.marker(position, {
      icon: leaflet.divIcon({
        className: 'leaflet-coordinate-marker',
        html: '<span aria-hidden="true"></span>',
        iconAnchor: [10, 10],
        iconSize: [20, 20],
      }),
    }).addTo(map);
  }, [coordinateLat, coordinateLng, zoom]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={ariaLabel}
      className={cn('h-64 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100', className)}
    />
  );
}
