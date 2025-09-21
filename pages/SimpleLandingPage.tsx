import React from 'react';

const SimpleLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🎨 Pixel Editor</h1>
        <p className="text-xl mb-8">AI 기반 이미지 생성 및 편집 도구</p>
        <div className="space-y-4">
          <div>
            <a
              href="/app"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              에디터로 이동
            </a>
          </div>
          <div>
            <a
              href="/test/compression"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🧪 압축 테스트 (Session 1)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLandingPage;