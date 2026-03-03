'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import paymentsApi from '@/lib/api/payments';

interface PremiumContextType {
  premiumEnabled: boolean;
  isLoading: boolean;
}

const PremiumContext = createContext<PremiumContextType>({
  premiumEnabled: false,
  isLoading: true,
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getPremiumStatus()
      .then((status) => setPremiumEnabled(status.premiumEnabledWeb))
      .catch(() => setPremiumEnabled(false))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <PremiumContext.Provider value={{ premiumEnabled, isLoading }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
