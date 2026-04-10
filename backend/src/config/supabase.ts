

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) throw new Error('❌ SUPABASE_URL is missing in environment variables');
if (!supabaseAnonKey) throw new Error('❌ SUPABASE_ANON_KEY is missing in environment variables');
if (!supabaseServiceKey) throw new Error('❌ SUPABASE_SECRET_KEY is missing in environment variables');

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);


export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);


export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  
  DIGITAL_PRODUCTS: 'digital-products',
  
  AVATARS: 'avatars',
} as const;


export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}


export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600 
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage  
  .from(bucket)
  .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('❌ Error creating signed URL:', error.message);
      return null;
    }

    return data.signedUrl;
  } catch (error: any) {
    console.error('❌ Signed URL generation failed:', error.message);
    return null;
  }
}
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error deleting file:', error.message);
      return false;
    }

    console.log('✅ File deleted successfully:', filePath);
    return true;
  } catch (error: any) {
    console.error('❌ File deletion failed:', error.message);
    return false;
  }
}
export async function uploadFile(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ File uploaded successfully:', data.path);
    return { success: true, path: data.path };
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    return { success: false, error: error.message };
  }
}
export async function listFiles(
  bucket: string,
  folderPath: string = ''
): Promise<any[] | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(folderPath);

    if (error) {
      console.error('❌ Error listing files:', error.message);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('❌ Failed to list files:', error.message);
    return null;
  }
}
export async function getFileInfo(
  bucket: string,
  filePath: string
): Promise<any | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });

    if (error || !data || data.length === 0) {
      console.error('❌ File not found:', filePath);
      return null;
    }

    return data[0];
  } catch (error: any) {
    console.error('❌ Failed to get file info:', error.message);
    return null;
  }
}


export const StorageUtils = {
  getPublicUrl,
  getSignedUrl,
  deleteFile,
  uploadFile,
  listFiles,
  getFileInfo,
};

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];