import React from 'react';
import { ImageUploader } from './ImageUploader';
import { useTranslations } from '../contexts/LanguageContext';

interface EditModeProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  onOpenDrawing?: () => void;
}

export const EditMode: React.FC<EditModeProps> = ({
  images,
  onImagesChange,
  onOpenDrawing
}) => {
  const { t } = useTranslations();

  return (
    <div className="space-y-3">
      {/* 이미지 업로더 */}
      <div className="border-2 border-black bg-[#FFFBF2] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">이미지 업로드 (최대 9장)</span>
          {onOpenDrawing && (
            <button
              onClick={onOpenDrawing}
              className="flex items-center gap-1 text-sm text-[#2E7D73] hover:underline transition-colors font-neodgm"
            >
              <span>✏️</span>
              <span>그리기</span>
            </button>
          )}
        </div>
        <ImageUploader
          images={images}
          onImagesChange={onImagesChange}
          maxImages={9}
          label="이미지를 업로드하세요"
          multiple={true}
        />
      </div>
    </div>
  );
};