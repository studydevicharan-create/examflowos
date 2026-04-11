import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Trash2, Download, File, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getUserFiles, uploadFile, deleteFile, updateFileMetadata } from '@/lib/fileStorage';
import { UserFile } from '@/lib/supabase';

export default function VaultPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadFiles();
  }, [user]);

  async function loadFiles() {
    if (!user) return;
    try {
      const userFiles = await getUserFiles(user.id);
      setFiles(userFiles);
    } catch (error: any) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!user || !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    const fileType = selectedFile.type.startsWith('image/')
      ? 'image'
      : selectedFile.type === 'application/pdf'
        ? 'pdf'
        : selectedFile.type === 'application/json'
          ? 'json'
          : null;

    if (!fileType) {
      toast.error('Unsupported file type. Upload JSON, images, or PDFs');
      return;
    }

    setUploading(true);
    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const newFile = await uploadFile(user.id, selectedFile, fileType as any, displayName, tagArray);
      setFiles([newFile, ...files]);
      setSelectedFile(null);
      setDisplayName('');
      setTags('');
      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteFile(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
      toast.success('File deleted');
    } catch (error: any) {
      toast.error('Failed to delete file');
    }
  }

  function getFileIcon(fileType: string) {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'json':
        return <File className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  if (loading) {
    return <div className="p-4 text-center">Loading files...</div>;
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold mb-2">File Vault</h1>
        <p className="text-slate-600">Upload and manage your files securely</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>JSON, images (JPG, PNG), or PDFs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">File</label>
            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={uploading}
              accept=".json,.jpg,.jpeg,.png,.webp,.pdf"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My important document"
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <Input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, important, 2024"
              disabled={uploading}
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-3">Your Files</h2>
        {files.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No files yet. Upload your first file!</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-slate-600">{getFileIcon(file.file_type)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{file.display_name}</p>
                      <p className="text-sm text-slate-600">
                        {formatBytes(file.file_size_bytes)}
                        {file.is_compressed && ` (compressed: ${Math.round(file.compression_ratio * 100)}%)`}
                      </p>
                      {file.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {file.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="Download">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
