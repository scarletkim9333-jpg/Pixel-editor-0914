import React, { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

const TestApp: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'create' | 'edit'>('create');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 테스트 헤더 */}
      <div className="bg-white border-b-2 border-black p-4">
        <h1 className="text-2xl font-bold">PIXEL EDITOR - 테스트</h1>
        <p>현재 모드: {currentMode}</p>
      </div>

      {/* 테스트 컨텐츠 */}
      <div className="p-8">
        <div className="bg-white border-2 border-black p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">UI 테스트</h2>
          <p className="mb-4">이 텍스트가 보이면 React가 정상 작동하고 있습니다.</p>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCurrentMode('create')}
              className={`px-4 py-2 border-2 border-black ${
                currentMode === 'create' ? 'bg-blue-200' : 'bg-white'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setCurrentMode('edit')}
              className={`px-4 py-2 border-2 border-black ${
                currentMode === 'edit' ? 'bg-blue-200' : 'bg-white'
              }`}
            >
              Edit
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>상태 변경이 정상 작동하는지 테스트</p>
            <p>선택된 모드: <strong>{currentMode}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <TestApp />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;