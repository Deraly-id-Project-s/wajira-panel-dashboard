import React from 'react';
import { Activity, Gauge, LocateFixed, MapPinned, Navigation, Route, Satellite } from 'lucide-react';
import type { DoEkspedisi, DoEkspedisiExpeditionTrack } from '@/@types/do-ekspedisi.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { ShowMapLeaflet, type MapCoordinate } from '@/components/ui/show-map-leaflet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SocketStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed' | 'missing-config';

const MAP_LAYER_OPTIONS = [
  {
    value: 'street',
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  {
    value: 'topographic',
    label: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, &copy; OpenTopoMap',
  },
  {
    value: 'humanitarian',
    label: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
  },
  {
    value: 'transport',
    label: 'Transport',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Tiles style by CyclOSM',
  },
] as const;

const VEHICLE_MARKER_HTML = `
  <span aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 17h1" />
      <path d="M15 6h4l3 5v6h-3" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  </span>
`;

interface DriverPosition extends MapCoordinate {
  speed: number | null;
  course: number | null;
  accuracy: number | null;
  altitude: number | null;
  positionAt: string | null;
}

interface TraccarPositionPayload {
  deviceId?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  speed?: number | string;
  course?: number | string;
  accuracy?: number | string;
  altitude?: number | string;
  fixTime?: string | null;
  deviceTime?: string | null;
  serverTime?: string | null;
}

interface DOEkspedisiRealtimeTrackingProps {
  data: DoEkspedisi;
}

const toFiniteNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidCoordinate = (lat: number | null, lng: number | null) =>
  lat != null
  && lng != null
  && Math.abs(lat) <= 90
  && Math.abs(lng) <= 180;

const getInitialPosition = (track: DoEkspedisiExpeditionTrack): DriverPosition | null => {
  const lat = toFiniteNumber(track.lastLatitude);
  const lng = toFiniteNumber(track.lastLongitude);
  if (!isValidCoordinate(lat, lng) || lat == null || lng == null) return null;

  return {
    lat,
    lng,
    speed: toFiniteNumber(track.lastSpeed),
    course: toFiniteNumber(track.lastCourse),
    accuracy: toFiniteNumber(track.lastAccuracy),
    altitude: toFiniteNumber(track.lastAltitude),
    positionAt: track.lastPositionAt,
  };
};

const buildTraccarSocketUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_TRACCAR_URL?.trim();
  if (!baseUrl) return null;

  try {
    const socketUrl = new URL('/api/socket', baseUrl);
    socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return socketUrl.toString();
  } catch {
    return null;
  }
};

const extractPositions = (payload: unknown): TraccarPositionPayload[] => {
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.positions)) return data.positions as TraccarPositionPayload[];
  if (data.position && typeof data.position === 'object') return [data.position as TraccarPositionPayload];
  if ('deviceId' in data && 'latitude' in data && 'longitude' in data) return [data as TraccarPositionPayload];
  return [];
};

const mapTraccarPosition = (payload: TraccarPositionPayload): DriverPosition | null => {
  const lat = toFiniteNumber(payload.latitude);
  const lng = toFiniteNumber(payload.longitude);
  if (!isValidCoordinate(lat, lng) || lat == null || lng == null) return null;

  return {
    lat,
    lng,
    speed: toFiniteNumber(payload.speed),
    course: toFiniteNumber(payload.course),
    accuracy: toFiniteNumber(payload.accuracy),
    altitude: toFiniteNumber(payload.altitude),
    positionAt: payload.fixTime ?? payload.deviceTime ?? payload.serverTime ?? null,
  };
};

const formatNumber = (value: number | null, suffix = '') => {
  if (value == null) return '-';
  return `${Number(value.toFixed(2))}${suffix}`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getStatusLabel = (status: SocketStatus) => {
  switch (status) {
    case 'connecting':
      return 'Menghubungkan';
    case 'connected':
      return 'Realtime aktif';
    case 'error':
      return 'Koneksi bermasalah';
    case 'closed':
      return 'Koneksi tertutup';
    case 'missing-config':
      return 'Konfigurasi Traccar belum ada';
    default:
      return 'Aktif';
  }
};

const getStatusClassName = (status: SocketStatus) => {
  switch (status) {
    case 'connected':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'connecting':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'missing-config':
    case 'error':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

function TrackingMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

export function DOEkspedisiRealtimeTracking({ data }: DOEkspedisiRealtimeTrackingProps) {
  const track = data.expeditionTrack;
  const trackingActive = String(data.status).toLowerCase() === 'process' && Boolean(track?.isActive);
  const initialPosition = React.useMemo(() => (track ? getInitialPosition(track) : null), [track]);
  const [position, setPosition] = React.useState<DriverPosition | null>(initialPosition);
  const [socketStatus, setSocketStatus] = React.useState<SocketStatus>('idle');
  const [selectedLayerValue, setSelectedLayerValue] = React.useState<(typeof MAP_LAYER_OPTIONS)[number]['value']>('street');
  const [recenterKey, setRecenterKey] = React.useState(0);
  const selectedLayer = MAP_LAYER_OPTIONS.find((item) => item.value === selectedLayerValue) ?? MAP_LAYER_OPTIONS[0];

  React.useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  React.useEffect(() => {
    if (!trackingActive || !track?.traccarDeviceId) {
      setSocketStatus('idle');
      return undefined;
    }

    const socketUrl = buildTraccarSocketUrl();
    if (!socketUrl) {
      setSocketStatus('missing-config');
      return undefined;
    }

    let closedByCleanup = false;
    const socket = new WebSocket(socketUrl);
    setSocketStatus('connecting');

    socket.onopen = () => setSocketStatus('connected');
    socket.onerror = () => setSocketStatus('error');
    socket.onclose = () => {
      if (!closedByCleanup) setSocketStatus('closed');
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const matchedPosition = extractPositions(payload).find(
          (item) => Number(item.deviceId) === Number(track.traccarDeviceId),
        );
        if (!matchedPosition) return;

        const nextPosition = mapTraccarPosition(matchedPosition);
        if (nextPosition) setPosition(nextPosition);
      } catch {
        setSocketStatus('error');
      }
    };

    return () => {
      closedByCleanup = true;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    };
  }, [track?.traccarDeviceId, trackingActive]);

  if (!trackingActive || !track) return null;

  return (
    <CollapsibleBox
      title="Posisi driver"
      description="Realtime Driver Tracking"
      icon={MapPinned}
      defaultExpanded
      actions={(
        <Badge variant="outline" className={cn('rounded-full px-3 py-1', getStatusClassName(socketStatus))}>
          {getStatusLabel(socketStatus)}
        </Badge>
      )}
    >
      <div className="space-y-4">
        <div className="min-h-[360px] overflow-hidden rounded-md border border-slate-200 bg-slate-100">
          {position ? (
            <div className="relative">
              <ShowMapLeaflet
                value={position}
                className="h-[420px] min-h-[360px] border-0"
                ariaLabel={`Posisi realtime driver ${data.driver?.name || data.doCode || ''}`}
                zoom={16}
                tileLayerUrl={selectedLayer.url}
                tileLayerAttribution={selectedLayer.attribution}
                markerClassName="leaflet-vehicle-marker"
                markerHtml={VEHICLE_MARKER_HTML}
                markerIconAnchor={[20, 20]}
                markerIconSize={[40, 40]}
                recenterKey={recenterKey}
              />

              <div className="absolute left-3 right-3 top-3 z-[400] flex flex-col gap-2 sm:left-auto sm:right-3 sm:w-[260px]">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start border border-slate-200 bg-white/95 text-slate-800 shadow-sm backdrop-blur hover:bg-white"
                  onClick={() => setRecenterKey((value) => value + 1)}
                >
                  <LocateFixed className="h-4 w-4" />
                  Move to driver location
                </Button>

                <Select value={selectedLayerValue} onValueChange={(value) => setSelectedLayerValue(value as typeof selectedLayerValue)}>
                  <SelectTrigger className="h-10 border-slate-200 bg-white/95 shadow-sm backdrop-blur">
                    <SelectValue placeholder="Pilih style map" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAP_LAYER_OPTIONS.map((layer) => (
                      <SelectItem key={layer.value} value={layer.value}>
                        {layer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="flex h-[420px] min-h-[360px] items-center justify-center px-4 text-center text-sm text-slate-500">
              Menunggu posisi pertama dari perangkat Traccar.
            </div>
          )}
        </div>

        {socketStatus === 'missing-config' ? (
          <Alert variant="destructive">
            <Satellite className="h-4 w-4" />
            <AlertTitle>URL Traccar belum dikonfigurasi</AlertTitle>
            <AlertDescription>
              Isi `NEXT_PUBLIC_TRACCAR_URL` agar tracking realtime dapat terhubung ke `/api/socket`.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <TrackingMetric
            label="Koordinat"
            icon={Navigation}
            value={position ? `${formatNumber(position.lat)}, ${formatNumber(position.lng)}` : '-'}
          />
          <TrackingMetric
            label="Kecepatan"
            icon={Gauge}
            value={formatNumber(position?.speed ?? null)}
          />
          <TrackingMetric
            label="Arah"
            icon={Activity}
            value={formatNumber(position?.course ?? null, ' deg')}
          />
          <TrackingMetric
            label="Akurasi"
            icon={Satellite}
            value={formatNumber(position?.accuracy ?? null, ' m')}
          />
          <TrackingMetric
            label="Altitude"
            icon={MapPinned}
            value={formatNumber(position?.altitude ?? null, ' m')}
          />
          <TrackingMetric
            label="Update Terakhir"
            icon={Activity}
            value={formatDateTime(position?.positionAt ?? null)}
          />
          <TrackingMetric
            label="Device ID"
            icon={Satellite}
            value={track.traccarDeviceId || '-'}
          />
          <TrackingMetric
            label="Unique ID"
            icon={Route}
            value={track.traccarUniqueId || '-'}
          />
        </div>
      </div>
    </CollapsibleBox>
  );
}
