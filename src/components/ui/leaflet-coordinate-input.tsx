import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  parseMapCoordinate,
  serializeMapCoordinate,
  ShowMapLeaflet,
  type MapCoordinate,
} from '@/components/ui/show-map-leaflet';
import { cn } from '@/lib/utils';

interface LeafletCoordinateInputProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  mapClassName?: string;
  id?: string;
}

interface LocationSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function LeafletCoordinateInput({
  value,
  onChange,
  disabled = false,
  className,
  mapClassName,
  id,
}: LeafletCoordinateInputProps) {
  const [locationName, setLocationName] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState('');
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerOverInputRef = useRef(false);
  const lastSearchQueryRef = useRef('');

  useEffect(() => () => {
    searchAbortRef.current?.abort();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }, []);

  const commitCoordinate = (coordinate: MapCoordinate) => {
    const serialized = serializeMapCoordinate(coordinate);
    setLocationError('');
    onChange(serialized);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung akses lokasi.');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationName('Lokasi saya');
        setSearchResults([]);
        commitCoordinate({ lat: coords.latitude, lng: coords.longitude });
      },
      () => setLocationError('Lokasi tidak dapat diakses. Periksa izin lokasi browser.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3 || query === lastSearchQueryRef.current) return;

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearching(true);
    setLocationError('');
    setSearchResults([]);
    lastSearchQueryRef.current = query;

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json', 'Accept-Language': 'id' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Pencarian lokasi gagal');

      const results = await response.json() as LocationSearchResult[];
      setSearchResults(results);
      if (results.length === 0) setLocationError('Lokasi tidak ditemukan. Coba gunakan kata kunci yang lebih spesifik.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      lastSearchQueryRef.current = '';
      setLocationError('Lokasi gagal dicari. Silakan coba lagi.');
    } finally {
      if (searchAbortRef.current === controller) setIsSearching(false);
    }
  };

  const scheduleLocationSearch = (rawQuery = locationName) => {
    const query = rawQuery.trim();
    if (query.length < 3 || query === lastSearchQueryRef.current) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => void searchLocation(query), 500);
  };

  const selectSearchResult = (result: LocationSearchResult) => {
    const coordinate = parseMapCoordinate({ lat: Number(result.lat), lng: Number(result.lon) });
    if (!coordinate) return;

    setLocationName(result.display_name);
    setSearchResults([]);
    commitCoordinate(coordinate);
  };

  const resetMapData = () => {
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = null;
    lastSearchQueryRef.current = '';
    setLocationName('');
    setSearchResults([]);
    setLocationError('');
    setIsSearching(false);
    onChange(null);
  };

  const parsedCoordinate = parseMapCoordinate(value);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id={id}
              value={locationName}
              disabled={disabled}
              onChange={(event) => {
                const nextValue = event.target.value;
                setLocationName(nextValue);
                setSearchResults([]);
                setLocationError('');
                lastSearchQueryRef.current = '';
                if (!nextValue.trim()) onChange(null);
                if (pointerOverInputRef.current) scheduleLocationSearch(nextValue);
              }}
              onMouseEnter={() => {
                pointerOverInputRef.current = true;
                scheduleLocationSearch();
              }}
              onMouseMove={() => scheduleLocationSearch()}
              onMouseLeave={() => {
                pointerOverInputRef.current = false;
              }}
              onFocus={() => scheduleLocationSearch()}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                void searchLocation(locationName.trim());
              }}
              placeholder="Input nama tempat"
              aria-label="Nama lokasi atau tempat"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="px-3"
            disabled={disabled}
            aria-label="Gunakan lokasi saya"
            title="Gunakan lokasi saya"
            onClick={useCurrentLocation}
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            aria-label="Bersihkan data map"
            title="Bersihkan data map"
            onClick={resetMapData}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isSearching && <p className="text-xs text-slate-500" role="status">Mencari lokasi...</p>}

        {searchResults.length > 0 && (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div role="listbox" aria-label="Hasil pencarian lokasi">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  disabled={disabled}
                  onClick={() => selectSearchResult(result)}
                  className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  <span>{result.display_name}</span>
                </button>
              ))}
            </div>
            <p className="bg-slate-50 px-3 py-1.5 text-right text-[10px] text-slate-500">
              Data pencarian © OpenStreetMap contributors
            </p>
          </div>
        )}
      </div>
      {locationError && <p className="text-xs text-red-600">{locationError}</p>}

      <ShowMapLeaflet
        value={parsedCoordinate}
        onCoordinateChange={disabled ? undefined : commitCoordinate}
        className={cn('h-60', disabled && 'pointer-events-none opacity-75', mapClassName)}
        ariaLabel={disabled ? 'Pratinjau koordinat pada peta' : 'Pilih koordinat dengan mengklik peta'}
      />
      <p className="text-xs text-slate-500">
        Arahkan pointer ke input setelah mengetik minimal 3 karakter, pilih hasil lokasi, klik peta, atau gunakan lokasi perangkat.
      </p>
    </div>
  );
}
