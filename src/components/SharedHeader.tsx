'use client';

import { useState, useEffect } from 'react';
import MarqueeBanner from '@/components/MarqueeBanner';
import { AdvertItem, DEFAULT_ADVERTS } from '@/lib/constants/adverts';
import advertsApi from '@/lib/api/adverts';

interface SharedHeaderProps {
  children: React.ReactNode;
  adverts?: AdvertItem[];
  showMarquee?: boolean;
  marqueeSpeed?: 'slow' | 'normal' | 'fast';
  marqueeVariant?: 'gradient' | 'subtle';
  dismissible?: boolean;
}

export default function SharedHeader({
  children,
  adverts,
  showMarquee = true,
  marqueeSpeed = 'normal',
  marqueeVariant = 'gradient',
  dismissible = false,
}: SharedHeaderProps) {
  const [liveAdverts, setLiveAdverts] = useState<AdvertItem[]>(adverts ?? DEFAULT_ADVERTS);

  useEffect(() => {
    // If adverts were passed as props, use those
    if (adverts) return;

    // Otherwise fetch from API
    advertsApi.getActive()
      .then((data) => {
        if (data && data.length > 0) {
          setLiveAdverts(data.map(a => ({
            id: a.id,
            text: a.text,
            link: a.link || undefined,
          })));
        }
        // If empty, keep DEFAULT_ADVERTS
      })
      .catch(() => {
        // Silently fall back to defaults
      });
  }, [adverts]);

  return (
    <div>
      {showMarquee && liveAdverts.length > 0 && (
        <MarqueeBanner
          items={liveAdverts}
          speed={marqueeSpeed}
          variant={marqueeVariant}
          dismissible={dismissible}
        />
      )}
      {children}
    </div>
  );
}
