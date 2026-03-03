'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  isLoading: boolean;
  error: string | null;
  dismissed: boolean;
}

const CACHE_KEY = 'carpool-geolocation';

function getCached(): GeolocationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function setCache(state: GeolocationState) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {}
}

export function useGeolocation() {
  const { user } = useAuth();
  const [state, setState] = useState<GeolocationState>(() => {
    const cached = getCached();
    if (cached) return cached;
    return {
      latitude: null,
      longitude: null,
      locationName: null,
      isLoading: false,
      error: null,
      dismissed: false,
    };
  });

  // Fall back to user's home location if no geolocation
  const latitude = state.latitude ?? user?.homeLatitude ?? null;
  const longitude = state.longitude ?? user?.homeLongitude ?? null;
  const locationName = state.locationName ?? (user?.homeLocationName || null);
  const hasLocation = latitude != null && longitude != null;

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const newState: GeolocationState = {
        ...state,
        error: 'Geolocation is not supported by your browser',
        isLoading: false,
      };
      setState(newState);
      setCache(newState);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        let name: string | null = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'LetsGoHalf/1.0' } }
          );
          const data = await response.json();
          if (data?.display_name) {
            const parts = data.display_name.split(',');
            name = parts.slice(0, 3).map((s: string) => s.trim()).join(', ');
          }
        } catch {}

        if (!name) {
          name = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }

        const newState: GeolocationState = {
          latitude: lat,
          longitude: lng,
          locationName: name,
          isLoading: false,
          error: null,
          dismissed: false,
        };
        setState(newState);
        setCache(newState);
      },
      (error) => {
        let errorMsg = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        const newState: GeolocationState = {
          ...state,
          isLoading: false,
          error: errorMsg,
        };
        setState(newState);
        setCache(newState);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [state, user]);

  const dismissPrompt = useCallback(() => {
    const newState: GeolocationState = { ...state, dismissed: true };
    setState(newState);
    setCache(newState);
  }, [state]);

  return {
    latitude,
    longitude,
    locationName,
    hasLocation,
    isLoading: state.isLoading,
    error: state.error,
    dismissed: state.dismissed,
    hasExplicitLocation: state.latitude != null,
    requestLocation,
    dismissPrompt,
  };
}
