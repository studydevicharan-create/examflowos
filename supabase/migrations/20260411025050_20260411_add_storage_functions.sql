/*
  # Add Storage Management Functions

  1. Functions
    - increment_storage: Track storage usage when files are uploaded
    - decrement_storage: Track storage usage when files are deleted
    - get_user_storage_usage: Get current storage usage for a user
*/

CREATE OR REPLACE FUNCTION increment_storage(user_id uuid, bytes bigint)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + bytes
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_storage(user_id uuid, bytes bigint)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET storage_used_bytes = GREATEST(COALESCE(storage_used_bytes, 0) - bytes, 0)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id uuid)
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE(
    (SELECT storage_used_bytes FROM profiles WHERE id = user_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
