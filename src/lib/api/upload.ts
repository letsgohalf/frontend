import apiClient from './client';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export const uploadApi = {
  // Upload an image file
  uploadImage: (file: File, folder?: string): Promise<UploadResult> => {
    return apiClient.uploadFile('/upload/image', file, folder ? { folder } : undefined);
  },

  // Upload avatar
  uploadAvatar: (file: File): Promise<UploadResult> => {
    return apiClient.uploadFile('/upload/avatar', file);
  },

  // Upload base64 image
  uploadBase64: (base64Data: string, folder?: string): Promise<UploadResult> => {
    return apiClient.post('/upload/base64', { image: base64Data, folder });
  },

  // Upload avatar as base64
  uploadAvatarBase64: (base64Data: string): Promise<UploadResult> => {
    return apiClient.post('/upload/avatar/base64', { image: base64Data });
  },
};

export default uploadApi;
