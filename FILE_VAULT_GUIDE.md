# File Vault Implementation Guide

## Architecture Overview

This application implements a secure, scalable file storage and management system with Supabase, optimized for efficient storage usage.

## System Architecture

```
Frontend (React)
    ↓
Supabase Auth (JWT)
    ↓
Supabase PostgreSQL (Metadata)
    ↓
Supabase Storage (Files) + Edge Functions (Compression)
```

## Key Components

### 1. Authentication System (`src/lib/auth.ts`, `src/lib/authContext.tsx`)

**Implementation:**
- Supabase Email/Password authentication
- JWT-based session management
- `onAuthStateChange` listener for real-time auth state

**Features:**
- Sign up with email, password, and display name
- Sign in with email/password
- Sign out
- Password reset support
- Automatic profile creation on signup

**Usage:**
```typescript
import { useAuth } from '@/lib/authContext';

function MyComponent() {
  const { user, loading } = useAuth();

  if (!user) return <Navigate to="/login" />;
  return <div>Welcome, {user.email}</div>;
}
```

### 2. File Storage Service (`src/lib/fileStorage.ts`)

**Storage Buckets:**
- `user-images`: Images (WebP, optimized)
- `user-documents`: PDFs
- `user-data`: JSON files

**Compression Strategy:**

| File Type | Strategy | Optimization |
|-----------|----------|--------------|
| **Images** | Client-side conversion to WebP | ~30% reduction, max 1920x1080 |
| **PDFs** | Stored as-is | Size tracked in metadata |
| **JSON** | Stored in database as JSONB | Optional compression via metadata |

**Upload Function:**
```typescript
await uploadFile(userId, file, fileType, displayName, tags);
```

**Key Features:**
- Automatic image compression to WebP
- File size validation
- Storage usage tracking
- Metadata storage (tags, custom fields)
- Error handling with automatic cleanup

**File Size Limits:**
- Images: 5MB
- JSON: 10MB
- PDFs: 25MB

### 3. Database Schema

**Tables:**

#### `profiles`
- User metadata and storage quota
- Columns: `id`, `display_name`, `storage_used_bytes`, timestamps

#### `user_files`
- File metadata and tracking
- Columns:
  - `id`: UUID primary key
  - `user_id`: Foreign key to auth.users
  - `filename`, `display_name`: File names
  - `file_type`: 'json' | 'image' | 'pdf'
  - `storage_path`, `bucket_name`: Location info
  - `file_size_bytes`, `compressed_size_bytes`: Size tracking
  - `is_compressed`, `compression_ratio`: Compression info
  - `metadata`: JSONB for custom data
  - `tags`: Array of strings
  - `is_public`, `public_token`: Public sharing
  - Timestamps: `created_at`, `updated_at`

#### `file_shares`
- Share tokens for public access
- Columns: `id`, `file_id`, `shared_by`, `share_token`, `expires_at`, `access_count`, `created_at`

### 4. Row-Level Security (RLS) Policies

**Active Policies:**
1. Users can view/insert/update/delete only their own files
2. Users can view/update only their own profile
3. Users can manage only their own file shares
4. All access requires `auth.uid()` verification

### 5. Storage Management Functions

**Database Functions:**
- `increment_storage(user_id, bytes)`: Track upload
- `decrement_storage(user_id, bytes)`: Track deletion
- `get_user_storage_usage(user_id)`: Get current usage

## Pages

### Login & Register
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`
- Email/password authentication
- Form validation
- Error handling with toast notifications

### File Vault
- `src/pages/VaultPage.tsx`
- Upload files with display name and tags
- View all user files with compression info
- Delete files with confirmation
- Download support
- Storage usage display

### Profile Management
- `src/pages/ProfilePage.tsx`
- Update display name
- Change password
- View storage usage with progress bar
- Logout button

## Cost Optimization Strategies

### 1. Free Tier Optimization
- **Database**: 500MB (tracks file metadata only)
- **Storage**: 1GB (compressed files)
- **Monthly cost**: $0 (Supabase free tier)

### 2. Storage Reduction Techniques

**Images:**
- Automatic WebP conversion (30-40% smaller)
- Max dimension: 1920x1080
- Compression ratio tracked per file
- Thumbnail generation possible (future feature)

**JSON:**
- Store minified in database
- Optional gzip compression via edge function
- Deduplicate common structures
- Archive old data to external storage if needed

**PDFs:**
- Compress on upload (optional future feature)
- Track compression ratio
- Deduplicate repeated pages
- Store only essential metadata

### 3. Scaling Beyond Free Tier

**When approaching limits:**
1. Archive old files to S3/GCS for cost savings
2. Implement tiered storage (hot/cold)
3. Enable auto-compression for large files
4. Set storage quotas per user
5. Implement retention policies

**Cost Breakdown (Supabase Pro):**
- Storage: $0.024/GB/month
- Bandwidth: $0.09/GB
- Database: $25/month base + $0.125/GB over 8GB

## Security Features

### Authentication
- Supabase managed authentication
- Email verification optional (disabled for free tier)
- Password hashing with bcrypt
- JWT token management

### Authorization
- Row-Level Security on all tables
- User can only access own data
- File sharing via secure tokens
- Expiring share links possible

### Data Protection
- All data encrypted in transit (HTTPS)
- Database encryption at rest
- Storage bucket isolation by user
- CORS headers configured for edge functions

## Implementation Checklist

- [x] Database schema with RLS
- [x] Supabase authentication setup
- [x] File upload service with compression
- [x] File management dashboard
- [x] Profile management page
- [x] Storage usage tracking
- [x] Edge functions for compression
- [x] Protected routes with auth guard
- [x] Error handling throughout
- [x] Toast notifications for feedback

## Future Enhancements

1. **Thumbnail Generation**
   - Generate image thumbnails for faster loading
   - Store thumbnail references in metadata

2. **Advanced Search**
   - Full-text search on metadata
   - Tag-based filtering
   - Date range filtering

3. **Sharing & Collaboration**
   - Generate public share tokens
   - Set expiration dates on shares
   - Track download counts

4. **Version Control**
   - Keep file versions
   - Compare different versions
   - Restore previous versions

5. **Analytics**
   - Track storage trends
   - File upload/download statistics
   - Popular files and tags

6. **Automated Compression**
   - Server-side PDF compression
   - Batch compression jobs
   - Compression scheduling

## Environment Variables

Required `.env` file:
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

These are automatically configured in your Supabase project.

## Testing the System

1. **Sign up**: Create account with email/password
2. **Upload files**: Test each file type (JSON, image, PDF)
3. **Verify compression**: Check compression ratios for images
4. **View storage**: Check profile page for storage usage
5. **Manage files**: Test download and delete operations
6. **Edit metadata**: Update display names and tags

## Troubleshooting

**Auth not working:**
- Check Supabase credentials in `.env`
- Verify email/password are correct
- Clear browser cache and try again

**File uploads failing:**
- Check file size limits
- Verify file type is supported
- Check storage permissions in Supabase

**Storage not updating:**
- Run migrations: `mcp__supabase__apply_migration`
- Check RLS policies are enabled
- Verify user_id matches auth.uid()

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
