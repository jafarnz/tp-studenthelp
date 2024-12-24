import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface FileUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  isSignup?: boolean;
}

export default function FileUpload({ onUpload, currentImage, isSignup = false }: FileUploadProps) {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  // Allow upload if it's signup or user is authenticated
  const canUpload = isSignup || !!session;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      if (isSignup) {
        formData.append('isSignup', 'true');
      }

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  }, [onUpload, currentImage, isSignup]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading || !canUpload
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative w-full h-40 border-2 border-dashed rounded-lg
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${uploading ? 'opacity-50' : 'hover:border-primary'}
          transition-all duration-200
        `}
      >
        <input {...getInputProps()} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {preview ? (
            <div className="relative w-32 h-32">
              <Image
                src={preview}
                alt="Profile preview"
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
            </div>
          ) : (
            <>
              <div className="text-4xl mb-2">📸</div>
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: 5MB
              </p>
            </>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
