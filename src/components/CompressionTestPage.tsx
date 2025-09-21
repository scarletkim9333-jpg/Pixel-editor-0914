import React, { useState, useCallback } from 'react';
import { ArrowLeftIcon, PhotoIcon, DocumentArrowDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useImageCompression } from '../hooks/useImageCompression';
import { CompressionOptions } from '../services/compressionService';

const CompressionTestPage: React.FC = () => {
  const {
    isCompressing,
    compressionProgress,
    error,
    results,
    compress,
    generateThumbnail,
    optimizeFileSize,
    clearResults,
    clearError,
    formatFileSize,
    isSupported
  } = useImageCompression();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    quality: 85,
    maxWidth: undefined,
    maxHeight: undefined,
    format: 'jpeg'
  });
  const [targetFileSize, setTargetFileSize] = useState<number>(500); // KB
  const [testMode, setTestMode] = useState<'compress' | 'thumbnail' | 'optimize'>('compress');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const supportedFiles = files.filter(file => isSupported(file));

    if (supportedFiles.length !== files.length) {
      alert('일부 파일이 지원되지 않는 형식입니다.');
    }

    setSelectedFiles(supportedFiles);
    clearResults();
    clearError();
  }, [isSupported, clearResults, clearError]);

  const handleCompress = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      await compress(selectedFiles, compressionOptions);
    } catch (err) {
      console.error('압축 실패:', err);
    }
  }, [selectedFiles, compressionOptions, compress]);

  const handleThumbnail = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        await generateThumbnail(file, {
          size: 200,
          quality: 80
        });
      }
    } catch (err) {
      console.error('썸네일 생성 실패:', err);
    }
  }, [selectedFiles, generateThumbnail]);

  const handleOptimize = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        await optimizeFileSize(file, targetFileSize);
      }
    } catch (err) {
      console.error('파일 크기 최적화 실패:', err);
    }
  }, [selectedFiles, targetFileSize, optimizeFileSize]);

  const handleDownload = useCallback((result: any) => {
    const url = URL.createObjectURL(result.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-neodgm">
      {/* 헤더 */}
      <header className="bg-white border-b-3 border-black shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 border-2 border-black hover:bg-gray-200 transition-colors"
              title="뒤로 가기"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>뒤로</span>
            </button>

            <h1 className="text-2xl font-bold text-center">
              🧪 이미지 압축 테스트
            </h1>

            <div className="w-20"></div> {/* 균형 맞추기 */}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측: 설정 패널 */}
          <div className="space-y-6">
            {/* 파일 선택 */}
            <div className="pixel-panel">
              <div className="pixel-panel-header">
                <h2 className="flex items-center space-x-2">
                  <PhotoIcon className="w-5 h-5" />
                  <span>파일 선택</span>
                </h2>
              </div>
              <div className="pixel-panel-content">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">선택된 파일 ({selectedFiles.length}개):</h3>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-600">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 테스트 모드 선택 */}
            <div className="pixel-panel">
              <div className="pixel-panel-header">
                <h2 className="flex items-center space-x-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  <span>테스트 모드</span>
                </h2>
              </div>
              <div className="pixel-panel-content">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setTestMode('compress')}
                    className={`p-2 text-sm border-2 transition-all ${
                      testMode === 'compress'
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    압축
                  </button>
                  <button
                    onClick={() => setTestMode('thumbnail')}
                    className={`p-2 text-sm border-2 transition-all ${
                      testMode === 'thumbnail'
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    썸네일
                  </button>
                  <button
                    onClick={() => setTestMode('optimize')}
                    className={`p-2 text-sm border-2 transition-all ${
                      testMode === 'optimize'
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    크기 최적화
                  </button>
                </div>

                {/* 압축 설정 */}
                {testMode === 'compress' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        품질 ({compressionOptions.quality}%)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={compressionOptions.quality || 85}
                        onChange={(e) => setCompressionOptions(prev => ({
                          ...prev,
                          quality: parseInt(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">최대 너비 (px)</label>
                        <input
                          type="number"
                          placeholder="제한없음"
                          value={compressionOptions.maxWidth || ''}
                          onChange={(e) => setCompressionOptions(prev => ({
                            ...prev,
                            maxWidth: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">최대 높이 (px)</label>
                        <input
                          type="number"
                          placeholder="제한없음"
                          value={compressionOptions.maxHeight || ''}
                          onChange={(e) => setCompressionOptions(prev => ({
                            ...prev,
                            maxHeight: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">출력 포맷</label>
                      <select
                        value={compressionOptions.format || 'jpeg'}
                        onChange={(e) => setCompressionOptions(prev => ({
                          ...prev,
                          format: e.target.value as 'jpeg' | 'png'
                        }))}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="jpeg">JPEG (더 작은 파일 크기)</option>
                        <option value="png">PNG (투명도 지원)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 파일 크기 최적화 설정 */}
                {testMode === 'optimize' && (
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      목표 파일 크기 ({targetFileSize} KB)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="2000"
                      step="50"
                      value={targetFileSize}
                      onChange={(e) => setTargetFileSize(parseInt(e.target.value))}
                      className="w-full mb-2"
                    />
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      value={targetFileSize}
                      onChange={(e) => setTargetFileSize(parseInt(e.target.value) || 500)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                )}

                {/* 실행 버튼 */}
                <button
                  onClick={testMode === 'compress' ? handleCompress : testMode === 'thumbnail' ? handleThumbnail : handleOptimize}
                  disabled={selectedFiles.length === 0 || isCompressing}
                  className="w-full mt-4 pixel-button py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompressing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      <span>처리중... {compressionProgress}%</span>
                    </div>
                  ) : (
                    `${testMode === 'compress' ? '압축' : testMode === 'thumbnail' ? '썸네일 생성' : '크기 최적화'} 시작`
                  )}
                </button>

                {/* 클리어 버튼 */}
                {results.length > 0 && (
                  <button
                    onClick={clearResults}
                    className="w-full mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    결과 지우기
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 결과 패널 */}
          <div className="pixel-panel">
            <div className="pixel-panel-header">
              <h2 className="flex items-center space-x-2">
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span>결과 ({results.length}개)</span>
              </h2>
            </div>
            <div className="pixel-panel-content">
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  <div className="flex justify-between items-start">
                    <span>{error}</span>
                    <button
                      onClick={clearError}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {results.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>파일을 선택하고 처리를 시작하세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      {/* 파일 정보 */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-sm truncate">{result.file.name}</h3>
                        <button
                          onClick={() => handleDownload(result)}
                          className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          title="다운로드"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 압축 정보 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-bold">원본 크기:</span><br />
                          <span className="text-gray-600">{formatFileSize(result.originalSize)}</span>
                        </div>
                        <div>
                          <span className="font-bold">압축 후:</span><br />
                          <span className="text-green-600">{formatFileSize(result.compressedSize)}</span>
                        </div>
                        <div>
                          <span className="font-bold">압축률:</span><br />
                          <span className="text-blue-600">{result.compressionRatio}% 감소</span>
                        </div>
                        <div>
                          <span className="font-bold">품질:</span><br />
                          <span className="text-purple-600">{result.quality}%</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold">해상도:</span><br />
                          <span className="text-gray-600">{result.dimensions.width} × {result.dimensions.height}px</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 디버깅 정보 */}
        {import.meta.env.VITE_DEBUG_MODE === 'true' && (
          <div className="mt-8 pixel-panel">
            <div className="pixel-panel-header">
              <h2>🐛 디버깅 정보</h2>
            </div>
            <div className="pixel-panel-content">
              <div className="text-sm space-y-2">
                <p><strong>압축 중:</strong> {isCompressing ? '예' : '아니오'}</p>
                <p><strong>진행률:</strong> {compressionProgress}%</p>
                <p><strong>선택된 파일:</strong> {selectedFiles.length}개</p>
                <p><strong>결과:</strong> {results.length}개</p>
                <p><strong>테스트 모드:</strong> {testMode}</p>
                <p><strong>compressionService</strong>가 window 객체에 노출되었습니다. 개발자 도구에서 <code>window.compressionService</code>로 접근할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompressionTestPage;