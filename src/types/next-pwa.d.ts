declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: any[];
    fallbacks?: Record<string, string>;
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
  }

  function withPWAInit(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWAInit;
}
