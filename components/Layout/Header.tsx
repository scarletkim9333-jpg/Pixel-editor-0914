import React from 'react';
import { LogoIcon, PixelTokenIcon } from '../Icons';
import TokenBalance from '../../src/components/TokenBalance';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../contexts/LanguageContext';

interface HeaderProps {
  activeMode: 'create' | 'edit';
  onModeChange: (mode: 'create' | 'edit') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeMode, onModeChange }) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { language, setLanguage, t } = useTranslations();

  return (
    <header className="bg-white border-b-4 border-black shadow-lg font-neodgm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 영역 */}
          <div className="flex items-center space-x-3">
            <LogoIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-black">PIXEL EDITOR</h1>
          </div>

          {/* 중앙 탭 영역 */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg border-2 border-black">
            <button
              onClick={() => onModeChange('create')}
              className={`px-6 py-2 text-sm font-semibold rounded transition-all ${
                activeMode === 'create'
                  ? 'bg-white border-2 border-black shadow-md text-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {t('createImage')}
            </button>
            <button
              onClick={() => onModeChange('edit')}
              className={`px-6 py-2 text-sm font-semibold rounded transition-all ${
                activeMode === 'edit'
                  ? 'bg-white border-2 border-black shadow-md text-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {t('editImage')}
            </button>
          </div>

          {/* 우측 유틸리티 영역 */}
          <div className="flex items-center space-x-4">
            {/* 토큰 잔액 */}
            {user && (
              <div className="flex items-center space-x-2 bg-pink-100 px-3 py-1 rounded-full border-2 border-black">
                <PixelTokenIcon className="w-5 h-5 text-pink-600" />
                <TokenBalance />
              </div>
            )}

            {/* 언어 전환 */}
            <button
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="px-3 py-1 text-sm border-2 border-black rounded bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              {language === 'ko' ? 'EN' : '한'}
            </button>

            {/* 사용자 프로필 */}
            {user ? (
              <div className="relative">
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 px-3 py-1 text-sm border-2 border-black rounded bg-green-100 hover:bg-green-200 transition-colors"
                >
                  <img
                    src={user.user_metadata?.avatar_url}
                    alt="Profile"
                    className="w-6 h-6 rounded-full border border-black"
                  />
                  <span className="hidden sm:block">{t('signOut')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 text-sm font-semibold border-2 border-black rounded bg-yellow-100 hover:bg-yellow-200 transition-colors"
              >
                {t('signIn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};