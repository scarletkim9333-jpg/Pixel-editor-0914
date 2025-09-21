import React from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './pages/LandingPage';
import MainApp from './pages/MainApp';
import StorageTest from './src/components/StorageTest';
import { SharedPage } from './pages/SharedPage';

// 압축 테스트 컴포넌트 (Session 1에서 구현된 기능 유지)
const CompressionTest: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [results, setResults] = React.useState<Array<{
    original: File;
    compressed: string;
    originalSize: number;
    compressedSize: number;
    quality: number;
  }>>([]);

  const handleFileSelect = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setResults([]);
  }, []);

  const compressImage = React.useCallback(async (file: File, quality: number = 0.85): Promise<{
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
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
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

  const handleCompress = React.useCallback(async () => {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            🧪 이미지 압축 테스트
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Session 1: JPEG 압축 서비스 (85% 품질)</p>
        </div>

        {/* 파일 선택 */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>📁 파일 선택</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{
              marginBottom: '20px',
              width: '100%',
              padding: '10px',
              border: '2px dashed #007bff',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa'
            }}
          />

          {selectedFiles && selectedFiles.length > 0 && (
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>
                ✅ 선택된 파일: {selectedFiles.length}개
              </p>
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  marginBottom: '5px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <span style={{ fontWeight: '500' }}>{file.name}</span>
                  <span style={{ color: '#666' }}>{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 압축 버튼 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button
            onClick={handleCompress}
            disabled={!selectedFiles || selectedFiles.length === 0 || isProcessing}
            style={{
              padding: '20px 40px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: isProcessing ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (!isProcessing && selectedFiles && selectedFiles.length > 0) {
                e.currentTarget.style.backgroundColor = '#0056b3';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#007bff';
                e.currentTarget.style.transform = 'translateY(0px)';
              }
            }}
          >
            {isProcessing ? '🔄 처리 중...' : '🚀 JPEG 압축 시작'}
          </button>
        </div>

        {/* 결과 */}
        {results.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '25px', color: '#333' }}>📊 압축 결과</h3>
            {results.map((result, index) => (
              <div key={index} style={{
                marginBottom: '30px',
                padding: '20px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>{result.original.name}</h4>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <strong>📏 원본 크기:</strong><br />
                    <span style={{ fontSize: '1.1rem', color: '#007bff' }}>{formatFileSize(result.originalSize)}</span>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <strong>📦 압축 후:</strong><br />
                    <span style={{ fontSize: '1.1rem', color: '#28a745' }}>{formatFileSize(result.compressedSize)}</span>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <strong>📉 압축률:</strong><br />
                    <span style={{ fontSize: '1.1rem', color: '#dc3545' }}>{getCompressionRatio(result.originalSize, result.compressedSize)}% 감소</span>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <strong>⭐ 품질:</strong><br />
                    <span style={{ fontSize: '1.1rem', color: '#ffc107' }}>{result.quality}%</span>
                  </div>
                </div>

                <div>
                  <a
                    href={result.compressed}
                    download={`compressed_${result.original.name.replace(/\.[^/.]+$/, '')}.jpg`}
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#218838';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#28a745';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    💾 다운로드
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 홈으로 돌아가기 */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            ← 🏠 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
};

// 간단한 라우팅 시스템
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<'landing' | 'app' | 'compression' | 'storage' | 'share'>(() => {
    const path = window.location.pathname;
    if (path === '/app' || path === '/editor') return 'app';
    if (path === '/test/compression') return 'compression';
    if (path === '/test/storage') return 'storage';
    if (path.startsWith('/share/')) return 'share';
    return 'landing';
  });

  const [shareCode, setShareCode] = React.useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      return path.replace('/share/', '');
    }
    return '';
  });

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/app' || path === '/editor') setCurrentPage('app');
      else if (path === '/test/compression') setCurrentPage('compression');
      else if (path === '/test/storage') setCurrentPage('storage');
      else if (path.startsWith('/share/')) {
        setCurrentPage('share');
        setShareCode(path.replace('/share/', ''));
      }
      else setCurrentPage('landing');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    // 링크 클릭 처리
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.href && target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const url = new URL(target.href);
        window.history.pushState({}, '', url.pathname);

        const path = url.pathname;
        if (path === '/app' || path === '/editor') setCurrentPage('app');
        else if (path === '/test/compression') setCurrentPage('compression');
        else if (path === '/test/storage') setCurrentPage('storage');
        else if (path.startsWith('/share/')) {
          setCurrentPage('share');
          setShareCode(path.replace('/share/', ''));
        }
        else setCurrentPage('landing');
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  // 홈으로 이동 함수
  const handleNavigateHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentPage('landing');
  };

  // 페이지 렌더링
  if (currentPage === 'app') return <MainApp />;
  if (currentPage === 'compression') return <CompressionTest />;
  if (currentPage === 'storage') return <StorageTest />;
  if (currentPage === 'share') return <SharedPage shareCode={shareCode} onNavigateHome={handleNavigateHome} />;
  return <LandingPage />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);