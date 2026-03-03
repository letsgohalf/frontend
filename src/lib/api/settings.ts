import apiClient from './client';

export interface AdminSettings {
  notifyUsersOnNewPosts: boolean;
  broadcastSponsoredPosts: boolean;
  premiumEnabledWeb: boolean;
  premiumEnabledMobile: boolean;
  updatedAt: string;
}

export interface UpdateSettingsResponse extends AdminSettings {
  message: string;
}

export interface ListingsTableRow {
  postId: string;
  name: string;
  location: string;
  description: string;
  price: string;
  postType: string;
}

export interface BannerConfig {
  bannerEnabled: boolean;
  bannerMode: 'marquee' | 'listings-table';
  listingsTableData: {
    rows: ListingsTableRow[];
    generatedAt: string;
    postCount: number;
  } | null;
}

const settingsApi = {
  /** Get banner configuration (public) */
  getBannerConfig: () =>
    apiClient.get<BannerConfig>('/settings/banner'),

  admin: {
    /** Get current app settings (admin only) */
    getSettings: () =>
      apiClient.get<AdminSettings>('/settings/admin'),

    /** Update app settings (admin only) */
    updateSettings: (data: Partial<Pick<AdminSettings, 'notifyUsersOnNewPosts' | 'broadcastSponsoredPosts'>>) =>
      apiClient.patch<UpdateSettingsResponse>('/settings/admin', data),

    /** Toggle new post email notifications (admin only) */
    toggleNewPostNotifications: (enabled: boolean) =>
      apiClient.patch<UpdateSettingsResponse>('/settings/admin/new-post-notifications', { enabled }),

    /** Toggle broadcast sponsored posts as notifications (admin only) */
    toggleBroadcastSponsored: (enabled: boolean) =>
      apiClient.patch<UpdateSettingsResponse>('/settings/admin/broadcast-sponsored', { enabled }),

    /** Set banner mode (admin only) */
    setBannerMode: (mode: 'marquee' | 'listings-table') =>
      apiClient.patch<{ bannerMode: string; message: string }>('/settings/admin/banner-mode', { mode }),

    /** Generate listings table from active posts using AI (admin only) */
    generateListingsTable: () =>
      apiClient.post<BannerConfig & { message: string }>('/settings/admin/generate-listings-table'),

    /** Enable or disable the announcement banner (admin only) */
    setBannerEnabled: (enabled: boolean) =>
      apiClient.patch<{ bannerEnabled: boolean; message: string }>('/settings/admin/banner-enabled', { enabled }),

    /** Toggle premium features on/off for a specific platform (admin only) */
    togglePremiumEnabled: (platform: 'web' | 'mobile', enabled: boolean) =>
      apiClient.patch<{ premiumEnabledWeb: boolean; premiumEnabledMobile: boolean; message: string }>('/settings/admin/premium-enabled', { platform, enabled }),
  },
};

export default settingsApi;
