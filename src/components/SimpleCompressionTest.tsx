import React, { useState, useCallback } from 'react';

const SimpleCompressionTest: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{
    original: File;
    compressed: string;
    originalSize: number;
    compressedSize: number;
    quality: number;
  }>>([]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setResults([]);
  }, []);

  const compressImage = useCallback(async (file: File, quality: number = 0.8): Promise<{
    compressed: string;
    compressedSize: number;
  }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({
                compressed: url,
                compressedSize: blob.size
              });
            }
          }, 'image/jpeg', quality);
        }
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleCompress = useCallback(async () => {
    if (!selectedFiles) return;

    setIsProcessing(true);
    const newResults = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const { compressed, compressedSize } = await compressImage(file, 0.85);

      newResults.push({
        original: file,
        compressed,
        originalSize: file.size,
        compressedSize,
        quality: 85
      });
    }

    setResults(newResults);
    setIsProcessing(false);
  }, [selectedFiles, compressImage]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionRatio = (original: number, compressed: number): number => {
    return Math.round((1 - compressed / original) * 100);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>
            🧪 이미지 압축 테스트
          </h1>
          <p style={{ color: '#666' }}>Session 1: JPEG 압축 서비스 테스트</p>
        </div>

        {/* 파일 선택 */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginBottom: '15px' }}>파일 선택</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginBottom: '15px', width: '100%' }}
          />

          {selectedFiles && selectedFiles.length > 0 && (
            <div>
              <p><strong>선택된 파일:</strong> {selectedFiles.length}개</p>
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{file.name}</span>
                  <span style={{ color: '#666' }}>{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 압축 버튼 */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={handleCompress}
            disabled={!selectedFiles || selectedFiles.length === 0 || isProcessing}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: isProcessing ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? '처리 중...' : 'JPEG 압축 시작'}
          </button>
        </div>

        {/* 결과 */}
        {results.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginBottom: '20px' }}>압축 결과</h3>
            {results.map((result, index) => (
              <div key={index} style={{
                marginBottom: '30px',
                padding: '15px',
                border: '1px solid #eee',
                borderRadius: '5px'
              }}>
                <h4 style={{ marginBottom: '10px' }}>{result.original.name}</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <strong>원본 크기:</strong> {formatFileSize(result.originalSize)}
                  </div>
                  <div>
                    <strong>압축 후:</strong> {formatFileSize(result.compressedSize)}
                  </div>
                  <div>
                    <strong>압축률:</strong> {getCompressionRatio(result.originalSize, result.compressedSize)}% 감소
                  </div>
                  <div>
                    <strong>품질:</strong> {result.quality}%
                  </div>
                </div>

                <div>
                  <a
                    href={result.compressed}
                    download={`compressed_${result.original.name.replace(/\.[^/.]+$/, '')}.jpg`}
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    다운로드
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 홈으로 돌아가기 */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleCompressionTest;