import { supabase, UserFile } from './supabase';

const STORAGE_BUCKETS = {
  images: 'user-images',
  documents: 'user-documents',
  json: 'user-data',
};

const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,
  json: 10 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
};

async function compressImage(file: File): Promise<{ blob: Blob; ratio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not available'));

        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            const ratio = file.size / blob.size;
            resolve({ blob, ratio });
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(
  userId: string,
  file: File,
  fileType: 'json' | 'image' | 'pdf',
  displayName: string,
  tags: string[] = []
) {
  if (file.size > MAX_FILE_SIZES[fileType]) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZES[fileType] / 1024 / 1024}MB`);
  }

  let uploadBlob = file;
  let compressedSize = file.size;
  let isCompressed = false;
  let compressionRatio = 1.0;

  if (fileType === 'image' && file.type.startsWith('image/')) {
    const { blob, ratio } = await compressImage(file);
    uploadBlob = new File([blob], file.name, { type: 'image/webp' });
    compressedSize = blob.size;
    isCompressed = true;
    compressionRatio = ratio;
  }

  const bucket = STORAGE_BUCKETS[fileType === 'json' ? 'json' : fileType === 'image' ? 'images' : 'documents'];
  const storagePath = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, uploadBlob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: insertData, error: dbError } = await supabase
    .from('user_files')
    .insert({
      user_id: userId,
      filename: file.name,
      display_name: displayName,
      file_type: fileType,
      mime_type: uploadBlob.type,
      storage_path: storagePath,
      bucket_name: bucket,
      file_size_bytes: file.size,
      compressed_size_bytes: compressedSize,
      is_compressed: isCompressed,
      compression_ratio: compressionRatio,
      tags,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })
    .select()
    .maybeSingle();

  if (dbError) {
    await supabase.storage.from(bucket).remove([storagePath]);
    throw dbError;
  }

  await supabase
    .from('profiles')
    .update({
      storage_used_bytes: supabase.rpc('increment_storage', {
        user_id: userId,
        bytes: compressedSize,
      }),
    })
    .eq('id', userId);

  return insertData as UserFile;
}

export async function getUserFiles(userId: string): Promise<UserFile[]> {
  const { data, error } = await supabase
    .from('user_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as UserFile[];
}

export async function deleteFile(fileId: string): Promise<void> {
  const { data: file, error: fetchError } = await supabase
    .from('user_files')
    .select('*')
    .eq('id', fileId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!file) throw new Error('File not found');

  const { error: storageError } = await supabase.storage
    .from(file.bucket_name)
    .remove([file.storage_path]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase.from('user_files').delete().eq('id', fileId);

  if (dbError) throw dbError;

  await supabase
    .from('profiles')
    .update({
      storage_used_bytes: supabase.rpc('decrement_storage', {
        user_id: file.user_id,
        bytes: file.compressed_size_bytes,
      }),
    })
    .eq('id', file.user_id);
}

export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const { data: file, error } = await supabase
    .from('user_files')
    .select('bucket_name, storage_path')
    .eq('id', fileId)
    .maybeSingle();

  if (error) throw error;
  if (!file) throw new Error('File not found');

  const { data } = supabase.storage.from(file.bucket_name).getPublicUrl(file.storage_path);

  return data.publicUrl;
}

export async function updateFileMetadata(
  fileId: string,
  updates: { display_name?: string; tags?: string[]; metadata?: Record<string, any> }
): Promise<UserFile> {
  const { data, error } = await supabase
    .from('user_files')
    .update(updates)
    .eq('id', fileId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as UserFile;
}
