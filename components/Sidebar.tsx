import React, { useState } from 'react';

export type SidebarMode = 'create' | 'edit' | 'chat' | 'character' | 'bulk';

interface SidebarModeOption {
  id: SidebarMode;
  label: string;
  icon: string;
  description: string;
}

interface SidebarProps {
  activeMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
}

const SIDEBAR_MODES: SidebarModeOption[] = [
  {
    id: 'create',
    label: '새 이미지',
    icon: '✨',
    description: '새로운 이미지 생성'
  },
  {
    id: 'edit',
    label: '이미지 편집',
    icon: '✏️',
    description: '기존 이미지 편집'
  },
  {
    id: 'chat',
    label: 'Chat to Edit',
    icon: '💬',
    description: '채팅으로 편집'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`hidden lg:flex bg-gray-50 text-gray-700 transition-all duration-300 flex-col border-r border-gray-200 sticky top-0 h-screen ${
        isOpen ? 'w-48' : 'w-14'
      }`}
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isOpen && (
            <h2 className="text-lg font-bold font-neodgm text-gray-800">픽셀 에디터</h2>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-800 ${
              !isOpen ? 'mx-auto' : ''
            }`}
            aria-label={isOpen ? "사이드바 접기" : "사이드바 펼치기"}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <div className="flex-1 p-3">
        <div className="space-y-1">
          {SIDEBAR_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`w-full transition-all duration-200 text-left flex items-center font-neodgm relative ${
                isOpen
                  ? 'p-3 rounded-lg gap-3'
                  : 'p-2 justify-center'
              } ${
                activeMode === mode.id
                  ? isOpen
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-blue-100 text-blue-700'
                  : isOpen
                    ? 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
              title={!isOpen ? mode.label : undefined}
            >
              <span className={`text-xl flex-shrink-0 ${!isOpen ? 'mx-auto' : ''}`}>
                {mode.icon}
              </span>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{mode.label}</div>
                  <div className="text-xs text-gray-500 truncate">{mode.description}</div>
                </div>
              )}
              {!isOpen && activeMode === mode.id && (
                <div className="absolute -right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-l"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 푸터 */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400 text-center">
            v1.0.0 • 8-bit Pixel Art
          </div>
        </div>
      )}
    </div>
  );
};