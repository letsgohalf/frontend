import apiClient from './client'  ;

export interface Advert {
  id: string;
  text: string;
  link: string | null;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertData {
  text: string;
  link?: string;
  isActive?: boolean;
  position?: number;
}

export interface UpdateAdvertData {
  text?: string;
  link?: string | null;
  isActive?: boolean;
  position?: number;
}

const advertsApi = {
  /** Get active adverts for marquee (public) */
  getActive: () =>
    apiClient.get<Advert[]>('/adverts'),

  admin: {
    /** Get all adverts (admin only) */
    getAll: () =>
      apiClient.get<Advert[]>('/adverts/admin/all'),

    /** Create a new advert (admin only) */
    create: (data: CreateAdvertData) =>
      apiClient.post<Advert>('/adverts/admin', data),

    /** Update an advert (admin only) */
    update: (id: string, data: UpdateAdvertData) =>
      apiClient.patch<Advert>(`/adverts/admin/${id}`, data),

    /** Delete an advert (admin only) */
    remove: (id: string) =>
      apiClient.delete<void>(`/adverts/admin/${id}`),

    /** Reorder adverts (admin only) */
    reorder: (ids: string[]) =>
      apiClient.put<void>('/adverts/admin/reorder', { ids }),
  },
};

export default advertsApi;
