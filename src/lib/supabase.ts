import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  display_name: string;
  avatar_url: string;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
};

export type UserFile = {
  id: string;
  user_id: string;
  filename: string;
  display_name: string;
  file_type: 'json' | 'image' | 'pdf';
  mime_type: string;
  storage_path: string;
  bucket_name: string;
  file_size_bytes: number;
  compressed_size_bytes: number;
  is_compressed: boolean;
  compression_ratio: number;
  metadata: Record<string, any>;
  tags: string[];
  is_public: boolean;
  public_token: string | null;
  download_count: number;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  email_confirmed_at?: string;
};
