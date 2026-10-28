import React, { useEffect, useRef, useState } from 'react';
import type { RouteModel } from '@/@types/route.types';
import { parseMapCoordinate, type MapCoordinate } from '@/components/ui/show-map-leaflet';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface TarifRouteLeafletMapProps {
  routes: RouteModel[];
  className?: string;
}

interface LeafletMapInstance {
  invalidateSize: () => void;
  remove: () => void;
  fitBounds: (bounds: [number, number][], options?: Record<string, unknown>) => void;
  setView: (coordinate: [number, number], zoom?: number) => void;
}

export function TarifRouteLeafletMap({ routes, className }: TarifRouteLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Filter routes that have valid coordinates
  const validRoutePoints = React.useMemo(() => {
    return routes
      .map((r, index) => {
        const coord = parseMapCoordinate(r.coordinat || (r as any).coordinate);
        return {
          route: r,
          index,
          order: r.pivot?.order ?? index + 1,
          stateAt: r.pivot?.state_at || (index === 0 ? 'loading_in' : 'loading_out'),
          coord,
        };
      })
      .filter((item): item is typeof item & { coord: MapCoordinate } => item.coord !== null);
  }, [routes]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    if (validRoutePoints.length === 0) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const initMap = async () => {
      if (!containerRef.current) return;

      try {
        const imported = (await import(/* webpackMode: "eager" */ 'leaflet')) as any;
        const L = imported.default ?? imported;
        if (cancelled || !containerRef.current) return;

        // Clean up previous map if exists
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
        });
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const latLngs: [number, number][] = validRoutePoints.map((p) => [p.coord.lat, p.coord.lng]);

        // Draw connecting polyline
        if (latLngs.length > 1) {
          L.polyline(latLngs, {
            color: '#f97316',
            weight: 4,
            opacity: 0.85,
            dashArray: '6, 8',
          }).addTo(map);
        }

        // Add markers for each route point
        validRoutePoints.forEach((point) => {
          const isOrigin = point.stateAt === 'loading_in';
          const isDestination = point.stateAt === 'loading_out';
          const badgeColor = isOrigin
            ? 'bg-blue-600 text-white border-white'
            : isDestination
            ? 'bg-emerald-600 text-white border-white'
            : 'bg-amber-600 text-white border-white';

          const markerHtml = `
            <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:12px;font-weight:700;border:2px solid #fff;" class="${badgeColor}">
              ${point.order}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-route-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14],
          });

          const popupContent = `
            <div style="font-family:inherit;min-width:160px;padding:2px;">
              <div style="font-weight:700;font-size:13px;color:#0f172a;">${point.order}. ${point.route.name}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${
                isOrigin ? 'Loading In (Muat)' : isDestination ? 'Loading Out (Bongkar)' : 'Transit'
              }</div>
              ${point.route.address ? `<div style="font-size:11px;color:#334155;margin-top:4px;">${point.route.address}</div>` : ''}
              <div style="font-family:monospace;font-size:10px;color:#94a3b8;margin-top:4px;">${point.coord.lat.toFixed(5)}, ${point.coord.lng.toFixed(5)}</div>
            </div>
          `;

          L.marker([point.coord.lat, point.coord.lng], { icon: customIcon })
            .bindPopup(popupContent)
            .addTo(map);
        });

        // Fit map bounds to show all markers
        if (latLngs.length === 1) {
          map.setView(latLngs[0], 14);
        } else if (latLngs.length > 1) {
          map.fitBounds(latLngs, { padding: [40, 40] });
        }

        window.setTimeout(() => map.invalidateSize(), 100);

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => map.invalidateSize());
          resizeObserver.observe(containerRef.current);
        }
      } catch (err) {
        console.error('Failed to initialize route map:', err);
        if (!cancelled) setLoadError(true);
      }
    };

    void initMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [validRoutePoints]);

  if (validRoutePoints.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center', className)}>
        <MapPin className="h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-700">Visualisasi Peta Belum Tersedia</p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Titik rute belum memiliki koordinat lokasi yang valid. Tambahkan koordinat pada Master Data Rute untuk menampilkan visualisasi rute pada peta.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative h-72 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100', className)}>
      <div ref={containerRef} className="h-full w-full" aria-label="Visualisasi peta rute tarif" />
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 p-4 text-xs text-red-600">
          Gagal memuat peta visualisasi rute.
        </div>
      )}
    </div>
  );
}
