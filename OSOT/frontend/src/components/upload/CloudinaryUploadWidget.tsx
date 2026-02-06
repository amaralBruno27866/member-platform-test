import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  buttonText?: string;
  folder?: string;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  buttonText = 'Upload Image',
  folder = 'products',
}: CloudinaryUploadWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a valid image file (PNG, JPG, GIF, WebP, AVIF, SVG)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      
      console.log('[Cloudinary] Starting upload...', {
        cloudName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder
      });
      
      if (!cloudName || cloudName === 'your-cloud-name-here') {
        toast({
          title: 'Cloudinary not configured',
          description: 'Please set VITE_CLOUDINARY_CLOUD_NAME in .env.local file',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'products_upload');
      formData.append('folder', folder);

      console.log('[Cloudinary] Sending request to:', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('[Cloudinary] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Cloudinary] Upload error:', errorData);
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('[Cloudinary] Upload success:', data.secure_url);
      
      toast({
        title: 'Upload successful!',
        description: 'Image uploaded to Cloudinary',
      });

      onUploadSuccess(data.secure_url);
    } catch (error) {
      console.error('[Cloudinary] Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    </>
  );
}
