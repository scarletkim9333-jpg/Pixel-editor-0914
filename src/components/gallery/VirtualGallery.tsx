/**
 * 가상 스크롤링 갤러리 컴포넌트
 * react-window를 사용하여 대량의 이미지를 효율적으로 렌더링
 * Session 7: 성능 최적화
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import type { GridChildComponentProps } from 'react-window';
import { GalleryItem } from './GalleryItem';
import type { GalleryItem as GalleryItemType } from '../../services/galleryService';

// ==================== 타입 정의 ====================

interface VirtualGalleryProps {
  items: GalleryItemType[];
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onShare?: (item: GalleryItemType) => void;
  onLoad?: (item: GalleryItemType) => void;
  onView?: (item: GalleryItemType) => void;
  showActions?: boolean;
  itemSize?: number;
  gap?: number;
  overscanCount?: number;
}

interface ItemData {
  items: GalleryItemType[];
  columnCount: number;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onShare?: (item: GalleryItemType) => void;
  onLoad?: (item: GalleryItemType) => void;
  onView?: (item: GalleryItemType) => void;
  showActions?: boolean;
  itemSize: number;
  gap: number;
}

// ==================== 가상화된 갤러리 셀 ====================

const VirtualGalleryCell: React.FC<GridChildComponentProps<ItemData>> = ({
  columnIndex,
  rowIndex,
  style,
  data
}) => {
  const {
    items,
    columnCount,
    onDelete,
    onDuplicate,
    onShare,
    onLoad,
    onView,
    showActions,
    itemSize,
    gap
  } = data;

  const itemIndex = rowIndex * columnCount + columnIndex;
  const item = items[itemIndex];

  // 범위를 벗어난 인덱스는 빈 셀로 렌더링
  if (!item) {
    return <div style={style} />;
  }

  // 셀 내부 스타일 (gap 고려)
  const cellStyle: React.CSSProperties = {
    ...style,
    left: (style.left as number) + gap / 2,
    top: (style.top as number) + gap / 2,
    width: (style.width as number) - gap,
    height: (style.height as number) - gap,
  };

  return (
    <div style={cellStyle}>
      <GalleryItem
        item={item}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onShare={onShare}
        onLoad={onLoad}
        onView={onView}
        layout="grid"
        showActions={showActions}
      />
    </div>
  );
};

// ==================== 메인 컴포넌트 ====================

export const VirtualGallery: React.FC<VirtualGalleryProps> = ({
  items,
  onDelete,
  onDuplicate,
  onShare,
  onLoad,
  onView,
  showActions = true,
  itemSize = 220,
  gap = 16,
  overscanCount = 5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 컨테이너 크기 측정
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 반응형 열 개수 계산
  const columnCount = useMemo(() => {
    if (containerSize.width === 0) return 1;
    const availableWidth = containerSize.width - gap;
    const itemWithGap = itemSize + gap;
    const columns = Math.floor(availableWidth / itemWithGap);
    return Math.max(1, columns);
  }, [containerSize.width, itemSize, gap]);

  // 행 개수 계산
  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columnCount);
  }, [items.length, columnCount]);

  // Grid에 전달할 데이터
  const itemData: ItemData = useMemo(() => ({
    items,
    columnCount,
    onDelete,
    onDuplicate,
    onShare,
    onLoad,
    onView,
    showActions,
    itemSize,
    gap
  }), [
    items,
    columnCount,
    onDelete,
    onDuplicate,
    onShare,
    onLoad,
    onView,
    showActions,
    itemSize,
    gap
  ]);

  // 빈 상태 처리
  if (items.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-64 text-gray-500"
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-lg font-medium">갤러리가 비어있습니다</p>
          <p className="text-sm mt-2">이미지를 생성하면 여기에 표시됩니다</p>
        </div>
      </div>
    );
  }

  // 로딩 상태 처리
  if (containerSize.width === 0 || containerSize.height === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-64"
      >
        <div className="pixel-spinner">
          <div className="w-8 h-8 border-3 border-pink-300 border-t-pink-500 rounded-sm animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="virtual-gallery-container h-full w-full"
      style={{ padding: gap / 2 }}
    >
      <Grid
        columnCount={columnCount}
        columnWidth={itemSize + gap}
        height={containerSize.height - gap}
        width={containerSize.width}
        rowCount={rowCount}
        rowHeight={itemSize + gap}
        itemData={itemData}
        overscanRowCount={overscanCount}
        overscanColumnCount={overscanCount}
      >
        {VirtualGalleryCell}
      </Grid>
    </div>
  );
};

// ==================== 유틸리티 컴포넌트 ====================

// 성능 모니터링을 위한 래퍼
export const MonitoredVirtualGallery: React.FC<VirtualGalleryProps & {
  onPerformanceUpdate?: (metrics: {
    itemCount: number;
    renderTime: number;
    memoryUsage?: number;
  }) => void;
}> = ({ onPerformanceUpdate, ...props }) => {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    onPerformanceUpdate?.({
      itemCount: props.items.length,
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    });
  }, [props.items.length, onPerformanceUpdate]);

  return <VirtualGallery {...props} />;
};

// 다양한 크기 지원을 위한 프리셋
export const ResponsiveVirtualGallery: React.FC<Omit<VirtualGalleryProps, 'itemSize'> & {
  size?: 'sm' | 'md' | 'lg';
}> = ({ size = 'md', ...props }) => {
  const sizeMap = {
    sm: 160,
    md: 220,
    lg: 280
  };

  return <VirtualGallery {...props} itemSize={sizeMap[size]} />;
};