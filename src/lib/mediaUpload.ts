import { supabase } from './supabase';

type UploadedImage = { url: string; storagePath?: string };

/** ImgBB first (its API key is public in browser builds), then configured public image storage fallbacks. */
export async function uploadPublicImage(file: File, path: string): Promise<UploadedImage> {
  const configuredImgBBKey = import.meta.env.VITE_IMGBB_API_KEY || '';
  const imgbbKey = configuredImgBBKey.startsWith('YOUR_') ? '' : configuredImgBBKey;
  if (imgbbKey) {
    if (file.size > 32 * 1024 * 1024) throw new Error('ImgBB nhận ảnh tối đa 32 MB.');
    const body = new FormData();
    body.append('key', imgbbKey);
    body.append('image', file);
    body.append('name', file.name);
    const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
    const result = await response.json() as { success?: boolean; data?: { url?: string }; error?: { message?: string } };
    if (!response.ok || !result.success || !result.data?.url) throw new Error(result.error?.message || 'Không thể tải ảnh lên ImgBB.');
    return { url: result.data.url };
  }

  const configuredCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const cloudName = configuredCloudName.startsWith('YOUR_') ? '' : configuredCloudName;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (cloudName && uploadPreset) {
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', uploadPreset);
    body.append('folder', 'eduhub');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: 'POST', body });
    const result = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Không thể tải ảnh lên Cloudinary.');
    return { url: result.secure_url };
  }
  if (!supabase) throw new Error('Cấu hình VITE_IMGBB_API_KEY hoặc Supabase Storage để tải ảnh lên.');
  const { error } = await supabase.storage.from('eduhub-assets').upload(path, file, { upsert: false });
  if (error) throw error;
  return { url: supabase.storage.from('eduhub-assets').getPublicUrl(path).data.publicUrl, storagePath: path };
}
