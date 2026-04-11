/*
  # Update RLS Policies for File Vault

  1. Security
    - Enable RLS on all tables (already enabled)
    - Add policies for users to manage their own files
    - Add policies for profile access and updates
*/

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own files" ON public.user_files;
  DROP POLICY IF EXISTS "Users can insert own files" ON public.user_files;
  DROP POLICY IF EXISTS "Users can update own files" ON public.user_files;
  DROP POLICY IF EXISTS "Users can delete own files" ON public.user_files;
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can manage own file shares" ON public.file_shares;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view own files"
  ON public.user_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON public.user_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON public.user_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON public.user_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own file shares"
  ON public.file_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can insert file shares"
  ON public.file_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete file shares"
  ON public.file_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by);
