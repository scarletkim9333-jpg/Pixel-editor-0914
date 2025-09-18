import React, { useEffect } from 'react';
import { useTranslations } from '../contexts/LanguageContext';

interface CreateModeProps {
  onImageCreated: (imageFile: File) => void;
  isDrawingCanvasOpen: boolean;
  setIsDrawingCanvasOpen: (open: boolean) => void;
}

export const CreateMode: React.FC<CreateModeProps> = ({
  onImageCreated,
  isDrawingCanvasOpen,
  setIsDrawingCanvasOpen
}) => {
  const { t } = useTranslations();

  useEffect(() => {
    // Create 모드 진입시 자동으로 빈 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'blank-canvas.png', { type: 'image/png' });
        onImageCreated(file);
      }
    });
  }, [onImageCreated]);

  return null; // Create 모드에서는 별도 UI 없이 프롬프트 입력창만 사용
};