import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: (url: string) => void;
  existingFiles?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
}

export function FileUpload({
  bucket,
  folder,
  onUploadComplete,
  onRemove,
  existingFiles = [],
  maxFiles = 5,
  maxSizeMB = 10,
  accept = 'image/*,.pdf,.doc,.docx',
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, deleteFile, isUploading, uploadProgress } = useFileUpload();
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check total files limit
    if (existingFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
        return;
      }
    }

    // Upload files
    for (const file of files) {
      setUploadingFiles(prev => [...prev, file.name]);
      
      const url = await uploadFile(file, bucket, folder);
      
      if (url) {
        onUploadComplete(url);
      }
      
      setUploadingFiles(prev => prev.filter(name => name !== file.name));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (url: string) => {
    // Extract file path from URL
    const urlParts = url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get folder/filename
    
    const success = await deleteFile(bucket, filePath);
    if (success && onRemove) {
      onRemove(url);
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return '🖼️';
    }
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    return '📎';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || existingFiles.length >= maxFiles}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || existingFiles.length >= maxFiles}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files ({existingFiles.length}/{maxFiles})
            </>
          )}
        </Button>
        {isUploading && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="mt-2" />
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxSizeMB}MB per file. Accepted: images, PDF, documents
        </p>
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((fileName) => (
            <div
              key={fileName}
              className="flex items-center gap-2 p-2 rounded-lg border bg-secondary/50"
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{fileName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Existing Files List */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card group"
            >
              <span className="text-xl">{getFileIcon(url)}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-accent transition-colors truncate block"
                >
                  {getFileName(url)}
                </a>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

