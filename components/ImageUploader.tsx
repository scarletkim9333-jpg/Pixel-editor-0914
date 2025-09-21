
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  files?: File[];
  images?: File[];
  onFilesChange?: (files: File[]) => void;
  onImagesChange?: (images: File[]) => void;
  multiple?: boolean;
  maxImages?: number;
  label: string;
  variant?: 'main' | 'reference';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  files,
  images,
  onFilesChange,
  onImagesChange,
  multiple = true,
  maxImages = 10,
  label,
  variant = 'main'
}) => {
  const currentFiles = files || images || [];
  const handleChange = onFilesChange || onImagesChange || (() => {});
  const { t } = useTranslations();
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Prevent memory leaks by revoking old object URLs
    const oldPreviews = [...imagePreviews];
    const newPreviews = currentFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);

    return () => {
        [...oldPreviews, ...newPreviews].forEach(url => URL.revokeObjectURL(url));
    };
  // We only want to run this when the files prop changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFiles]);


  const handleFileAdd = useCallback((addedFiles: FileList | null) => {
    if (!addedFiles) return;
    const fileArray = Array.from(addedFiles);

    let newFiles: File[];
    if (multiple) {
      newFiles = [...currentFiles, ...fileArray];
      if (maxImages && newFiles.length > maxImages) {
        newFiles = newFiles.slice(0, maxImages);
      }
    } else {
      newFiles = fileArray.slice(0, 1);
    }

    handleChange(newFiles);
  }, [handleChange, multiple, currentFiles, maxImages]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileAdd(e.dataTransfer.files);
  };
  
  const handleRemoveImage = (index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    handleChange(updatedFiles);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-none cursor-pointer transition-colors duration-200
          ${isDragging ? 'border-black bg-gray-200' : 'border-black hover:bg-gray-100'}`}
      >
        <ArrowUpTrayIcon className="w-8 h-8 text-gray-500 mb-2" />
        <p className="text-base text-gray-700 text-center">{label}</p>
        <p className="text-sm text-gray-500">{t.uploaderFileTypes}</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          multiple={multiple}
          onChange={(e) => handleFileAdd(e.target.files)}
          // Reset the input value to allow uploading the same file again
          onClick={(e) => (e.currentTarget.value = '')}
        />
      </div>

      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img src={preview} alt={`preview ${index}`} className="w-full h-24 object-cover border border-black" />
              <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering file input
                    handleRemoveImage(index);
                }}
                className="absolute top-1 right-1 bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t.removeImage}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};