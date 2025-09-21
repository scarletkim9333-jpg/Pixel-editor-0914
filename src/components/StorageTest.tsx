/**
 * Storage Test Component
 * 저장소 기능을 테스트할 수 있는 컴포넌트
 */

import React, { useState, useRef } from 'react';
import { useStorage, useStorageItem } from '../hooks/useStorage';
import { StorageItem } from '../services/storageService';
import storageUtils from '../utils/storageUtils';
import { compressionService } from '../services/compressionService';

const StorageTest: React.FC = () => {
  const {
    items,
    loading,
    error,
    usage,
    currentTier,
    save,
    deleteItem,
    refresh,
    clearAll,
    canSave,
    remainingSpace,
    remainingItems
  } = useStorage({ tier: 'temporary' }); // 테스트용으로 temporary 사용

  const [testItemId, setTestItemId] = useState<string | null>(null);
  const { item: loadedItem, loading: itemLoading } = useStorageItem(testItemId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [testLog, setTestLog] = useState<string[]>([]);

  // 로그 추가 함수
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 테스트 이미지 생성
  const generateTestImage = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas context not available');

    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);

    // 텍스트 추가
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Test Image', 200, 150);
    ctx.fillText(new Date().toLocaleTimeString(), 200, 180);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // 파일 업로드 테스트
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog(`파일 업로드 시작: ${file.name} (${storageUtils.formatFileSize(file.size)})`);

    try {
      // 이미지 압축
      const compressed = await compressionService.compressImage(file);
      addLog(`압축 완료: ${compressed.compressionRatio}% 압축됨`);

      // 썸네일 생성
      const thumbnail = await compressionService.generateThumbnail(file);
      addLog(`썸네일 생성 완료: ${storageUtils.formatFileSize(thumbnail.compressedSize)}`);

      // Data URL 변환
      const imageUrl = await storageUtils.blobToDataUrl(compressed.file);
      const thumbnailUrl = await storageUtils.blobToDataUrl(thumbnail.file);

      // 저장
      const item: Omit<StorageItem, 'id' | 'createdAt'> = {
        name: file.name,
        imageUrl,
        thumbnailUrl,
        prompt: `Uploaded file: ${file.name}`,
        model: 'File Upload',
        settings: {
          originalSize: file.size,
          compressedSize: compressed.compressedSize,
          thumbnailSize: thumbnail.compressedSize
        },
        size: compressed.compressedSize
      };

      const savedId = await save(item);
      if (savedId) {
        addLog(`저장 성공: ID=${savedId}`);
        setTestItemId(savedId);
      } else {
        addLog('저장 실패');
      }
    } catch (error) {
      addLog(`에러: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 테스트 아이템 생성
  const createTestItem = async () => {
    addLog('테스트 아이템 생성 시작...');

    try {
      const imageUrl = await generateTestImage();
      const imageBlob = await storageUtils.dataUrlToBlob(imageUrl);

      const item: Omit<StorageItem, 'id' | 'createdAt'> = {
        name: `Test Item ${Date.now()}`,
        imageUrl,
        prompt: 'A test image with gradient background and timestamp',
        model: 'Test Generator',
        settings: {
          testData: true,
          timestamp: new Date().toISOString()
        },
        size: imageBlob.size
      };

      const savedId = await save(item);
      if (savedId) {
        addLog(`테스트 아이템 저장 성공: ID=${savedId}`);
        setTestItemId(savedId);
      }
    } catch (error) {
      addLog(`테스트 아이템 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 성능 테스트
  const runPerformanceTest = async () => {
    addLog('성능 테스트 시작...');

    const timer = new storageUtils.StorageTimer('Performance Test');
    timer.start();

    try {
      // 여러 아이템 생성
      const promises = Array.from({ length: 5 }, async (_, i) => {
        const imageUrl = await generateTestImage();
        const imageBlob = await storageUtils.dataUrlToBlob(imageUrl);

        return save({
          name: `Perf Test ${i + 1}`,
          imageUrl,
          prompt: `Performance test item ${i + 1}`,
          model: 'Performance Test',
          settings: { testIndex: i },
          size: imageBlob.size
        });
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(id => id).length;

      const elapsed = timer.end();
      addLog(`성능 테스트 완료: ${successCount}/5 성공, ${elapsed.toFixed(2)}ms`);
    } catch (error) {
      addLog(`성능 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 데이터 내보내기/가져오기 테스트
  const exportData = () => {
    try {
      const exported = storageUtils.exportStorageData(items);
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `storage-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
      addLog('데이터 내보내기 완료');
    } catch (error) {
      addLog(`내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 로그 지우기
  const clearLogs = () => {
    setTestLog([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🧪 Storage System Test</h1>

        {/* 상태 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Current Tier</h3>
            <p className="text-xl text-blue-600">{currentTier}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Storage Usage</h3>
            {usage && (
              <div>
                <p className="text-lg text-green-600">
                  {storageUtils.formatFileSize(usage.used)} / {storageUtils.formatFileSize(usage.limit)}
                </p>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${storageUtils.calculateUsagePercentage(usage)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Items & Save Status</h3>
            {usage && (
              <div>
                <p className="text-lg text-purple-600">
                  {usage.count} / {usage.maxCount}
                </p>
                <p className="text-sm text-purple-500">
                  Can Save: {canSave ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-purple-500">
                  Remaining: {remainingItems} items
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 테스트 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={createTestItem}
            disabled={!canSave}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            테스트 아이템 생성
          </button>

          <button
            onClick={runPerformanceTest}
            disabled={!canSave}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            성능 테스트
          </button>

          <button
            onClick={exportData}
            disabled={items.length === 0}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            데이터 내보내기
          </button>

          <button
            onClick={clearAll}
            disabled={items.length === 0}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            전체 삭제
          </button>
        </div>

        {/* 파일 업로드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            파일 업로드 테스트
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* 선택된 아이템 정보 */}
        {loadedItem && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">선택된 아이템 (ID: {testItemId})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {loadedItem.name}</p>
                <p><strong>Model:</strong> {loadedItem.model}</p>
                <p><strong>Size:</strong> {storageUtils.formatFileSize(loadedItem.size)}</p>
                <p><strong>Created:</strong> {storageUtils.formatRelativeTime(loadedItem.createdAt)}</p>
                {loadedItem.expiresAt && (
                  <p><strong>Expires:</strong> {storageUtils.getTimeUntilExpiry(loadedItem.expiresAt)}</p>
                )}
              </div>
              <div>
                {loadedItem.imageUrl && (
                  <img
                    src={loadedItem.imageUrl}
                    alt={loadedItem.name}
                    className="w-full max-w-xs rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 아이템 목록 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">저장된 아이템 ({items.length})</h2>
          <button
            onClick={refresh}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            새로고침
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                testItemId === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTestItemId(item.id)}
            >
              {item.thumbnailUrl && (
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
              <p className="text-sm text-gray-600 truncate">{item.model}</p>
              <p className="text-xs text-gray-500">{storageUtils.formatFileSize(item.size)}</p>
              <p className="text-xs text-gray-500">{storageUtils.formatRelativeTime(item.createdAt)}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id);
                }}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            저장된 아이템이 없습니다. 테스트 아이템을 생성해보세요.
          </div>
        )}
      </div>

      {/* 로그 출력 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">테스트 로그</h2>
          <button
            onClick={clearLogs}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            로그 지우기
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
          {testLog.length === 0 ? (
            <div className="text-gray-500">로그가 없습니다.</div>
          ) : (
            testLog.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageTest;