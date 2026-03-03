'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationResult {
  name: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  value?: LocationResult | null;
  onChange: (location: LocationResult | null) => void;
  placeholder?: string;
  label?: string;
  subtitle?: string;
  className?: string;
  /** When true, accepts manual text without requiring a dropdown selection (no coordinates) */
  allowManualEntry?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = 'Search for a location...',
  label,
  subtitle,
  className,
  allowManualEntry = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query with value prop changes
  useEffect(() => {
    if (value?.name) {
      setQuery(value.name);
    }
  }, [value?.name]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&countrycodes=ng&limit=5`,
        {
          headers: {
            'User-Agent': 'LetsGoHalf/1.0',
          },
        }
      );
      const data: NominatimResult[] = await response.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
    } catch (error) {
      console.error('Location search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear selection when user types
    if (value) {
      onChange(null);
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  // When user leaves the input without selecting, accept manual text as fallback
  const handleBlur = useCallback(() => {
    // Small delay to allow click on suggestion to fire first
    setTimeout(() => {
      if (allowManualEntry && query.trim().length >= 2 && !value) {
        onChange({
          name: query.trim(),
          latitude: 0,
          longitude: 0,
        });
      }
    }, 200);
  }, [allowManualEntry, query, value, onChange]);

  const handleSelect = (result: NominatimResult) => {
    // Format the display name to be shorter
    const parts = result.display_name.split(',');
    const shortName = parts.slice(0, 3).map(s => s.trim()).join(', ');

    setQuery(shortName);
    setIsOpen(false);
    setSuggestions([]);
    onChange({
      name: shortName,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onChange(null);
    setLocationError(null);
  };

  // Get user's current location using device GPS
  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);
    setIsOpen(false);
    setSuggestions([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'LetsGoHalf/1.0',
              },
            }
          );
          const data = await response.json();

          if (data && data.display_name) {
            // Format the display name to be shorter
            const parts = data.display_name.split(',');
            const shortName = parts.slice(0, 3).map((s: string) => s.trim()).join(', ');

            setQuery(shortName);
            onChange({
              name: shortName,
              latitude,
              longitude,
            });
          } else {
            // If reverse geocoding fails, still set the coordinates with a generic name
            const genericName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            setQuery(genericName);
            onChange({
              name: genericName,
              latitude,
              longitude,
            });
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still set coordinates even if reverse geocoding fails
          const genericName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setQuery(genericName);
          onChange({
            name: genericName,
            latitude,
            longitude,
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('Unable to get your location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  }, [onChange]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
          <MapPin className="w-4 h-4 inline mr-1" />
          {label}
        </label>
      )}
      {subtitle && (
        <p className="text-xs text-neutral-500 mb-2">{subtitle}</p>
      )}

      {/* Use Current Location Button */}
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={isDetectingLocation}
        className={cn(
          "w-full mb-3 py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all",
          isDetectingLocation
            ? "border-[var(--teal-400)] bg-[var(--teal-100)]/30 dark:bg-[var(--teal-500)]/10"
            : "border-[var(--teal-300)] dark:border-[var(--teal-600)] hover:border-[var(--teal-500)] hover:bg-[var(--teal-50)] dark:hover:bg-[var(--teal-500)]/10"
        )}
      >
        {isDetectingLocation ? (
          <>
            <Loader2 className="w-5 h-5 text-[var(--teal-500)] animate-spin" />
            <span className="text-sm font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)]">
              Detecting your location...
            </span>
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 text-[var(--teal-500)]" />
            <span className="text-sm font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)]">
              Use Current Location
            </span>
          </>
        )}
      </button>

      {/* Error message */}
      {locationError && (
        <p className="text-xs text-[var(--pink-500)] mb-2">{locationError}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
        <span className="text-xs text-neutral-400">or search manually</span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 focus-within:ring-2 focus-within:ring-[var(--teal-400)] transition-all">
          <MapPin className="w-5 h-5 text-[var(--teal-500)] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-[16px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin flex-shrink-0" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
        </div>

        {/* Selected indicator */}
        {value && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--teal-600)] dark:text-[var(--teal-400)]">
            <MapPin className="w-3 h-3" />
            <span>Location set</span>
          </div>
        )}

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 py-1 rounded-xl bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-60 overflow-y-auto">
            {suggestions.map((result) => {
              const parts = result.display_name.split(',');
              const primary = parts.slice(0, 2).map(s => s.trim()).join(', ');
              const secondary = parts.slice(2, 4).map(s => s.trim()).join(', ');

              return (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700/50 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-[var(--teal-500)] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {primary}
                    </p>
                    {secondary && (
                      <p className="text-xs text-neutral-500 truncate">
                        {secondary}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
