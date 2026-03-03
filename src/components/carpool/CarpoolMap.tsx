'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Post } from '@/lib/api/posts';

// Lagos center fallback
const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];

interface CarpoolMapProps {
  posts: Post[];
  viewerLat?: number | null;
  viewerLng?: number | null;
  mode: 'find' | 'offer';
  onPostClick?: (postId: string) => void;
}

// Car icon for offers (driver posts)
function createCarIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#0ea5e9;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

// Person icon for requests (rider posts)
function createPersonIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="5"/>
        <path d="M20 21a8 8 0 0 0-16 0"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

// Auto-fit bounds component
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
      return;
    }
    const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, positions]);

  return null;
}

export default function CarpoolMap({
  posts,
  viewerLat,
  viewerLng,
  mode,
  onPostClick,
}: CarpoolMapProps) {
  const icon = useMemo(
    () => (mode === 'find' ? createCarIcon() : createPersonIcon()),
    [mode]
  );

  const center: [number, number] =
    viewerLat != null && viewerLng != null
      ? [viewerLat, viewerLng]
      : LAGOS_CENTER;

  const positions: [number, number][] = useMemo(() => {
    const pts: [number, number][] = [];
    if (viewerLat != null && viewerLng != null) {
      pts.push([viewerLat, viewerLng]);
    }
    for (const post of posts) {
      if (post.carpoolOriginLat != null && post.carpoolOriginLng != null) {
        pts.push([post.carpoolOriginLat, post.carpoolOriginLng]);
      }
    }
    return pts;
  }, [posts, viewerLat, viewerLng]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: '280px' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds positions={positions} />

      {/* Viewer position */}
      {viewerLat != null && viewerLng != null && (
        <CircleMarker
          center={[viewerLat, viewerLng]}
          radius={8}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
            weight: 3,
          }}
        >
          <Popup>
            <span className="text-sm font-medium">Your location</span>
          </Popup>
        </CircleMarker>
      )}

      {/* Post markers */}
      {posts.map((post) => {
        if (post.carpoolOriginLat == null || post.carpoolOriginLng == null) return null;
        const name = post.author?.name?.split(' ')[0] || 'Someone';
        const route = `${post.carpoolOrigin || '?'} → ${post.carpoolDestination || '?'}`;
        const time = post.carpoolDepartureTime
          ? new Date(post.carpoolDepartureTime).toLocaleTimeString('en-NG', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : 'Now';

        return (
          <Marker
            key={post.id}
            position={[post.carpoolOriginLat, post.carpoolOriginLng]}
            icon={icon}
            eventHandlers={{
              click: () => onPostClick?.(post.id),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{route}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{time}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
