import { useEffect, useRef, useState } from 'react';
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
  ) => { addTo: (map: LeafletMapInstance) => void; remove: () => void };
}

const DEFAULT_CENTER: [number, number] = [-6.2, 106.816666];
const DEFAULT_TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
};

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
  tileLayerUrl?: string;
  tileLayerAttribution?: string;
  markerClassName?: string;
  markerHtml?: string;
  markerIconAnchor?: [number, number];
  markerIconSize?: [number, number];
  recenterKey?: string | number;
}

export function ShowMapLeaflet({
  value,
  onCoordinateChange,
  className,
  zoom = 15,
  ariaLabel = 'Peta lokasi',
  tileLayerUrl = DEFAULT_TILE_LAYER.url,
  tileLayerAttribution = DEFAULT_TILE_LAYER.attribution,
  markerClassName = 'leaflet-coordinate-marker',
  markerHtml = '<span aria-hidden="true"></span>',
  markerIconAnchor = [10, 10],
  markerIconSize = [20, 20],
  recenterKey,
}: ShowMapLeafletProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarkerInstance | null>(null);
  const tileLayerRef = useRef<{ addTo: (map: LeafletMapInstance) => void; remove: () => void } | null>(null);
  const leafletRef = useRef<LeafletRuntime | null>(null);
  const onCoordinateChangeRef = useRef(onCoordinateChange);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
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

      try {
        // Keep Leaflet client-only for SSR, but bundle it eagerly with this module so
        // Next.js does not request a separate, failure-prone Leaflet runtime chunk.
        const imported = (await import(/* webpackMode: "eager" */ 'leaflet')) as unknown as LeafletRuntime & { default?: LeafletRuntime };
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

        tileLayerRef.current = leaflet.tileLayer(tileLayerUrl, {
          attribution: tileLayerAttribution,
          maxZoom: 19,
        });
        tileLayerRef.current.addTo(map);

        map.on('click', (event) => onCoordinateChangeRef.current?.(event.latlng));
        mapRef.current = map;

        if (initialCoordinate) {
          markerRef.current = leaflet.marker([initialCoordinate.lat, initialCoordinate.lng], {
            icon: leaflet.divIcon({
              className: markerClassName,
              html: markerHtml,
              iconAnchor: markerIconAnchor,
              iconSize: markerIconSize,
            }),
          }).addTo(map);
        }

        setMapLoadError(false);
        window.setTimeout(() => map.invalidateSize(), 0);
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => map.invalidateSize());
          resizeObserver.observe(containerRef.current);
        }
      } catch {
        if (!cancelled) setMapLoadError(true);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      tileLayerRef.current?.remove();
      tileLayerRef.current = null;
      mapRef.current?.off();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
    // Coordinate updates are handled by the effect below; this only reruns for an explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet) return;

    tileLayerRef.current?.remove();
    tileLayerRef.current = leaflet.tileLayer(tileLayerUrl, {
      attribution: tileLayerAttribution,
      maxZoom: 19,
    });
    tileLayerRef.current.addTo(map);
  }, [tileLayerAttribution, tileLayerUrl]);

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
        className: markerClassName,
        html: markerHtml,
        iconAnchor: markerIconAnchor,
        iconSize: markerIconSize,
      }),
    }).addTo(map);
  }, [coordinateLat, coordinateLng, markerClassName, markerHtml, markerIconAnchor, markerIconSize, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || coordinateLat === undefined || coordinateLng === undefined) return;
    map.setView([coordinateLat, coordinateLng], zoom);
  }, [coordinateLat, coordinateLng, recenterKey, zoom]);

  return (
    <div className={cn('relative h-64 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100', className)}>
      <div ref={containerRef} role="application" aria-label={ariaLabel} className="h-full w-full" />
      {mapLoadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 px-4 text-center text-sm text-slate-600" role="alert">
          <span>Peta gagal dimuat.</span>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            onClick={() => {
              setMapLoadError(false);
              setLoadAttempt((attempt) => attempt + 1);
            }}
          >
            Muat ulang peta
          </button>
        </div>
      ) : null}
    </div>
  );
}
