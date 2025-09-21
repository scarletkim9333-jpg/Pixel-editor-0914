/**
 * 가상 스크롤링 갤러리 컴포넌트 (임시 간단 버전)
 * Session 7: 성능 최적화
 */

import React from 'react';
import { GalleryItem } from './GalleryItem';
import type { GalleryItem as GalleryItemType } from '../../services/galleryService';

// ==================== 타입 정의 ====================

interface VirtualGalleryProps {
  items: GalleryItemType[];
  columnCount: number;
  rowHeight: number;
  height: number;
  onImageSelect: (item: GalleryItemType) => void;
  onImageLoad?: (item: GalleryItemType) => void;
  layout?: 'grid' | 'list';
}

// ==================== 컴포넌트 ====================

export const VirtualGallery: React.FC<VirtualGalleryProps> = ({
  items,
  columnCount,
  onImageSelect,
  onImageLoad = () => {},
  layout = 'grid'
}) => {
  return (
    <div className={`grid gap-2 ${
      columnCount === 1 ? 'grid-cols-1' :
      columnCount === 2 ? 'grid-cols-2' :
      columnCount === 3 ? 'grid-cols-3' :
      'grid-cols-4'
    }`}>
      {items.map((item) => (
        <GalleryItem
          key={item.id}
          item={item}
          layout={layout}
          onImageSelect={onImageSelect}
          onImageLoad={onImageLoad}
        />
      ))}
    </div>
  );
};

// 반응형 가상 갤러리 (사용하지 않음)
export const ResponsiveVirtualGallery: React.FC<Omit<VirtualGalleryProps, 'columnCount'>> = (props) => {
  return <VirtualGallery {...props} columnCount={3} />;
};

// 모니터링 가상 갤러리 (사용하지 않음)
export const MonitoredVirtualGallery: React.FC<VirtualGalleryProps> = (props) => {
  return <VirtualGallery {...props} />;
};

export default VirtualGallery;