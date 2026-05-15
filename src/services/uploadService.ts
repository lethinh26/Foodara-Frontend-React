import { env } from "../config/env";

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', env.uploadPreset);
  
  try {
    const response = await fetch(env.apiUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error('Upload thất bại');
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};