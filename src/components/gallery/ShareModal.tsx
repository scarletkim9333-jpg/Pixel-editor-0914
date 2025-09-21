/**
 * 공유 모달 컴포넌트
 * 갤러리 이미지를 다양한 방법으로 공유할 수 있는 모달
 * Session 6: 공유 기능 구현
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  LinkIcon,
  ClipboardIcon,
  CheckIcon,
  QrCodeIcon,
  GlobeAltIcon,
  EyeSlashIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';
import { useShare } from '../../hooks/useShare';
import type { GalleryItem } from '../../services/galleryService';
import type { ShareSettings } from '../../services/shareService';
import { useLanguage } from '../../contexts/LanguageContext';

// ==================== 타입 정의 ====================

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryItem: GalleryItem;
}

// ==================== 메인 컴포넌트 ====================

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  galleryItem
}) => {
  const { t } = useLanguage();
  const { createShare, generateSocialUrls, copyToClipboard, isLoading } = useShare();

  // 상태 관리
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareCode, setShareCode] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    title: galleryItem.name,
    description: galleryItem.prompt,
    isPublic: true,
    allowDownload: true
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // 번역
  const translations = {
    ko: {
      shareImage: '이미지 공유',
      shareUrl: '공유 링크',
      copyLink: '링크 복사',
      copied: '복사됨!',
      socialShare: 'SNS 공유',
      embedCode: '임베드 코드',
      qrCode: 'QR 코드',
      settings: '공유 설정',
      title: '제목',
      description: '설명',
      public: '공개',
      private: '비공개',
      allowDownload: '다운로드 허용',
      expiresIn: '만료 시간',
      never: '무제한',
      hour: '1시간',
      day: '1일',
      week: '1주일',
      month: '1개월',
      createShare: '공유 링크 생성',
      shareOn: '공유하기: ',
      twitter: '트위터',
      facebook: '페이스북',
      kakao: '카카오',
      instagram: '인스타그램',
      close: '닫기'
    },
    en: {
      shareImage: 'Share Image',
      shareUrl: 'Share URL',
      copyLink: 'Copy Link',
      copied: 'Copied!',
      socialShare: 'Social Share',
      embedCode: 'Embed Code',
      qrCode: 'QR Code',
      settings: 'Share Settings',
      title: 'Title',
      description: 'Description',
      public: 'Public',
      private: 'Private',
      allowDownload: 'Allow Download',
      expiresIn: 'Expires In',
      never: 'Never',
      hour: '1 Hour',
      day: '1 Day',
      week: '1 Week',
      month: '1 Month',
      createShare: 'Create Share Link',
      shareOn: 'Share on ',
      twitter: 'Twitter',
      facebook: 'Facebook',
      kakao: 'Kakao',
      instagram: 'Instagram',
      close: 'Close'
    }
  };

  const tt = translations[t.language as keyof typeof translations];

  // 공유 링크 생성
  const handleCreateShare = async () => {
    const result = await createShare(galleryItem.id, shareSettings);
    if (result) {
      setShareUrl(result.shareUrl);
      setShareCode(result.shareCode);

      // QR 코드 생성
      try {
        const qrUrl = await QRCode.toDataURL(result.shareUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#333333',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('QR 코드 생성 실패:', error);
      }
    }
  };

  // 클립보드 복사
  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  // 소셜 공유 URL 생성
  const socialUrls = shareCode ? generateSocialUrls(shareCode, shareSettings.title, shareSettings.description) : null;

  // 임베드 코드 생성
  const embedCode = shareUrl ? `<img src="${shareUrl}/image" alt="${shareSettings.title}" style="max-width: 100%; height: auto;" />` : '';

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // 외부 클릭 닫기
  const handleOutsideClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  // 만료 시간 옵션
  const expirationOptions = [
    { value: undefined, label: tt.never },
    { value: 60 * 60 * 1000, label: tt.hour }, // 1시간
    { value: 24 * 60 * 60 * 1000, label: tt.day }, // 1일
    { value: 7 * 24 * 60 * 60 * 1000, label: tt.week }, // 1주일
    { value: 30 * 24 * 60 * 60 * 1000, label: tt.month } // 1개월
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleOutsideClick}>
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          border: '3px solid rgba(255, 182, 193, 0.8)',
          fontFamily: 'Neo둥근모, -apple-system, BlinkMacSystemFont, sans-serif'
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-pink-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-pink-500" />
            {tt.shareImage}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-pink-50 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 공유 설정 토글 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-700">{tt.settings}</h3>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <CogIcon className="w-4 h-4" />
              {showSettings ? '숨기기' : '설정'}
            </button>
          </div>

          {/* 공유 설정 패널 */}
          {showSettings && (
            <div className="bg-pink-50 rounded-lg p-4 space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tt.title}
                </label>
                <input
                  type="text"
                  value={shareSettings.title || ''}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder={galleryItem.name}
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tt.description}
                </label>
                <textarea
                  value={shareSettings.description || ''}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent resize-none"
                  placeholder={galleryItem.prompt}
                />
              </div>

              {/* 공개/비공개 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {shareSettings.isPublic ? (
                    <GlobeAltIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {shareSettings.isPublic ? tt.public : tt.private}
                  </span>
                </div>
                <button
                  onClick={() => setShareSettings(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    shareSettings.isPublic ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      shareSettings.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 다운로드 허용 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{tt.allowDownload}</span>
                <button
                  onClick={() => setShareSettings(prev => ({ ...prev, allowDownload: !prev.allowDownload }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    shareSettings.allowDownload ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      shareSettings.allowDownload ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 만료 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  {tt.expiresIn}
                </label>
                <select
                  value={shareSettings.expiresIn || ''}
                  onChange={(e) => setShareSettings(prev => ({
                    ...prev,
                    expiresIn: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                >
                  {expirationOptions.map((option) => (
                    <option key={option.value || 'never'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 공유 링크 생성 버튼 */}
          {!shareUrl && (
            <button
              onClick={handleCreateShare}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  생성 중...
                </div>
              ) : (
                tt.createShare
              )}
            </button>
          )}

          {/* 공유 링크 표시 */}
          {shareUrl && (
            <div className="space-y-4">
              {/* 공유 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tt.shareUrl}
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => handleCopy(shareUrl, 'url')}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                  >
                    {copiedStates.url ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        {tt.copied}
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-4 h-4" />
                        {tt.copyLink}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SNS 공유 버튼 */}
              {socialUrls && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tt.socialShare}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <a
                      href={socialUrls.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                    <a
                      href={socialUrls.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                    <a
                      href={socialUrls.kakao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      <span className="text-sm font-medium">Kakao</span>
                    </a>
                    <button
                      onClick={() => handleCopy(socialUrls.clipboard, 'social')}
                      className="flex items-center justify-center gap-2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {copiedStates.social ? tt.copied : 'URL'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* QR 코드와 임베드 코드 */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* QR 코드 */}
                {qrCodeUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <QrCodeIcon className="w-4 h-4 inline mr-1" />
                      {tt.qrCode}
                    </label>
                    <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                    </div>
                  </div>
                )}

                {/* 임베드 코드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DocumentDuplicateIcon className="w-4 h-4 inline mr-1" />
                    {tt.embedCode}
                  </label>
                  <div className="relative">
                    <textarea
                      value={embedCode}
                      readOnly
                      rows={4}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono resize-none"
                    />
                    <button
                      onClick={() => handleCopy(embedCode, 'embed')}
                      className="absolute top-2 right-2 p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      {copiedStates.embed ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <ClipboardIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t border-pink-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {tt.close}
          </button>
        </div>
      </div>
    </div>
  );
};