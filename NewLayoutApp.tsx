import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LanguageProvider, useTranslations } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/pixel-theme.css';
import TokenBalance from './src/components/TokenBalance';
import { useTokens } from './src/lib/tokenApi';
import { editImageWithGemini, getPromptSuggestion, getModelTokenCost, getTotalTokenCost } from './services/geminiService';
import * as historyService from './services/historyService';
import { fileToDataURL, dataURLtoFile } from './utils';
import type { GenerateImageRequest, TokenUsage, HistoryItem, Preset, AspectRatio, ModelId, Resolution } from './types';
import type { Translation } from './translations';
import { getPresets } from './translations';
import { HelpModal } from './components/HelpModal';
import { TokenPurchaseModal } from './src/components/TokenPurchaseModal';
import { PaymentCallback } from './src/components/PaymentCallback';
import { ImageUploader } from './components/ImageUploader';

const NewLayoutAppContent: React.FC = () => {
  const { t, language, toggleLanguage } = useTranslations();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { balance, refreshBalance, useTokens: useTokensFunction } = useTokens();

  // 모드 및 기본 상태
  const [currentMode, setCurrentMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');

  // 모드 변경 시 프리셋 초기화
  const handleModeChange = (mode: 'create' | 'edit') => {
    setCurrentMode(mode);
    if (mode === 'create') {
      // Create 모드로 변경 시 프리셋 초기화
      setSelectedPresets([]);
      setSelectedPresetOptionIds([]);
      setNumberOfOutputs(1);
    }
  };

  // 이미지 관련 상태
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscalingImageIndex, setUpscalingImageIndex] = useState<number | null>(null);

  // 토큰 관련 상태
  const [lastTokenUsage, setLastTokenUsage] = useState<TokenUsage | null>(null);
  const [sessionTokenUsage, setSessionTokenUsage] = useState<TokenUsage>({ promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });
  const [lastGenerationInfo, setLastGenerationInfo] = useState<{
    model: string;
    iterations: number;
    cost: number;
  } | null>(null);
  const [lastUpscaleInfo, setLastUpscaleInfo] = useState<{
    model: string;
    cost: number;
    count: number;
  } | null>(null);

  // UI 상태
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTokenPurchaseModalOpen, setIsTokenPurchaseModalOpen] = useState(false);
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [paymentCallbackType, setPaymentCallbackType] = useState<'success' | 'fail' | null>(null);

  // 제어 관련 상태
  const [creativity, setCreativity] = useState(0.5);
  const [selectedPresets, setSelectedPresets] = useState<Preset[]>([]);
  const [selectedPresetOptionIds, setSelectedPresetOptionIds] = useState<string[]>([]);
  const [numberOfOutputs, setNumberOfOutputs] = useState(1);
  const [model, setModel] = useState<ModelId>('nanobanana');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [resolution, setResolution] = useState<Resolution>('1k');

  // 히스토리 관련 상태
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'history'>('results');

  const isCancelledRef = useRef(false);

  // 토큰 잔액 새로고침
  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    try {
        const items = await historyService.getAllGenerations();
        setHistory(items);
    } catch (err) {
        console.error("Failed to load history:", err);
        setError(t.errorLoadHistory);
    }
  }, [t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 결제 콜백 URL 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    if (path === '/payment/success') {
      setPaymentCallbackType('success');
    } else if (path === '/payment/fail') {
      setPaymentCallbackType('fail');
    }
  }, []);

  // ESC 키로 취소
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isLoading) {
            isCancelledRef.current = true;
            setIsLoading(false);
            setError(t.errorCancelled);
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, t.errorCancelled]);

  // 클립보드 이미지 붙여넣기
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const extension = file.type.split('/')[1] || 'png';
            const renamedFile = new File([file], `pasted-image-${Date.now()}.${extension}`, { type: file.type });
            imageFiles.push(renamedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault();
        setImages(prevImages => [...prevImages, ...imageFiles]);
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  // 프리셋 데이터
  const PRESETS = getPresets(t);

  // 프리셋 옵션 클릭 핸들러
  const handleOptionClick = (optionId: string) => {
    const selectedPreset = selectedPresets[0];

    if (selectedPreset?.id === 'angle_changer') {
      // 멀티 앵글도 피규어화처럼 다중 선택
      setSelectedPresetOptionIds(prev => {
        let newIds;
        if (prev.includes(optionId)) {
          newIds = prev.filter(id => id !== optionId);
        } else {
          newIds = [...prev, optionId];
        }

        // 선택된 앵글 수만큼 출력 수량 설정 (최대 6개)
        setNumberOfOutputs(Math.min(6, Math.max(1, newIds.length)));
        return newIds;
      });
    } else if (selectedPreset?.id === 'figurine') {
      // 피규어화는 다중 선택
      setSelectedPresetOptionIds(prev => {
        let newIds;
        if (prev.includes(optionId)) {
          newIds = prev.filter(id => id !== optionId);
        } else {
          newIds = [...prev, optionId];
        }

        // 선택된 스타일 수만큼 출력 수량 설정
        setNumberOfOutputs(Math.max(1, newIds.length));
        return newIds;
      });
    }
  };

  // 토큰 비용 계산
  useEffect(() => {
    const cost = getTotalTokenCost(model, aspectRatio, numberOfOutputs);
    setRequiredTokens(cost);
  }, [model, aspectRatio, numberOfOutputs]);

  // 로그인/로그아웃 함수
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setError(t.errorLogin || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 이미지 생성/편집 함수
  const handleGenerateNew = useCallback(async (request: GenerateImageRequest) => {
    const mainImage = request.mainImage || images[0] || null;
    const referenceImages = request.referenceImages || images.slice(1);

    if (!user) {
      setError(t.errorLogin);
      return;
    }
    if (currentMode === 'edit' && !mainImage) {
      setError(t.errorMainImage);
      return;
    }

    // 모델별 토큰 잔액 확인 (Aspect Ratio 추가 비용 포함)
    const tokensRequired = getTotalTokenCost(request.model, request.aspectRatio, request.numberOfOutputs);

    console.log(`토큰 소모 계산 - 모델: ${request.model}, 비율: ${request.aspectRatio}, 출력수: ${request.numberOfOutputs}, 총 필요: ${tokensRequired}토큰`);

    // 토큰 부족시 명확한 안내
    if (balance === null || balance < tokensRequired) {
      setError(`픽셀 토큰이 부족합니다. (필요: ${tokensRequired}, 보유: ${balance || 0})`);
      setRequiredTokens(tokensRequired);
      setIsTokenPurchaseModalOpen(true);
      return;
    }

    isCancelledRef.current = false;
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setLastTokenUsage(null);
    setActiveTab('results');

    try {
      // 이미지 생성 시도
      const result = await editImageWithGemini({ ...request, mainImage, referenceImages });

      if (isCancelledRef.current) {
        console.log("Generation was cancelled. Ignoring results.");
        return;
      }

      setGeneratedImages(result.images);
      setLastTokenUsage(result.usage);

      // 생성 성공 후에만 토큰 차감
      console.log(`실제 토큰 차감 - ${tokensRequired}토큰 소모`);
      await useTokensFunction(tokensRequired, `이미지 생성: ${request.prompt.substring(0, 50)}...`);

      // 생성 정보 저장
      setLastGenerationInfo({
        model: request.model,
        iterations: request.numberOfOutputs,
        cost: tokensRequired
      });

      if(result.text) {
        console.log("Model Text Output:", result.text);
      }
      if (result.usage) {
        setSessionTokenUsage(prevUsage => ({
          promptTokenCount: prevUsage.promptTokenCount + (result.usage?.promptTokenCount || 0),
          candidatesTokenCount: prevUsage.candidatesTokenCount + (result.usage?.candidatesTokenCount || 0),
          totalTokenCount: prevUsage.totalTokenCount + (result.usage?.totalTokenCount || 0),
        }));
      }

      // Save to history
      if (mainImage) {
        const mainImageB64 = await fileToDataURL(mainImage);
        const referenceImagesB64 = await Promise.all(referenceImages.map(f => fileToDataURL(f)));

        await historyService.addGeneration({
          timestamp: Date.now(),
          request,
          images: result.images,
          mainImage: mainImageB64,
          referenceImages: referenceImagesB64
        });
        await loadHistory();
      }

    } catch (err) {
      if (!isCancelledRef.current) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'errorGenerate';
        setError(t[errorMessage as keyof Translation] || t.errorGenerate);
      }
    } finally {
      setIsLoading(false);
    }
  }, [images, user, t, currentMode, balance, numberOfOutputs, model, aspectRatio, loadHistory]);

  // 히스토리 아이템 로드
  const handleLoadHistory = useCallback((item: HistoryItem) => {
    const mainImageFile = dataURLtoFile(item.mainImage, 'main-image.png');
    const referenceImageFiles = item.referenceImages.map((data, i) => dataURLtoFile(data, `ref-${i}.png`));

    setImages([mainImageFile, ...referenceImageFiles]);

    setPrompt(item.request.prompt);
    setCreativity(item.request.creativity);
    setSelectedPresets(item.request.selectedPresets);
    setNumberOfOutputs(item.request.numberOfOutputs);
    setModel(item.request.model || 'nanobanana');
    setAspectRatio(item.request.aspectRatio || '1:1');
    setResolution(item.request.resolution || '1k');

    // Handle loading of multiple preset option IDs, with backward compatibility
    const oldRequest = item.request as any;
    const idsToLoad = oldRequest.selectedPresetOptionIds || (oldRequest.selectedPresetOptionId ? [oldRequest.selectedPresetOptionId] : []);
    setSelectedPresetOptionIds(idsToLoad);

    setGeneratedImages(item.images);
    setLastTokenUsage(null);

    setActiveTab('results');
    setError(null);
    window.scrollTo(0, 0);
  }, []);

  // 이미지 편집 준비
  const handleEditImage = useCallback(async (imageUrl: string) => {
    try {
      // URL에서 이미지 다운로드
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'edited-image.png', { type: blob.type });

      // 이미지 설정
      setImages([file]);

      // Edit 모드로 전환
      handleModeChange('edit');

      // 탭을 results로 설정
      setActiveTab('results');
    } catch (err) {
      console.error('Failed to load image for editing:', err);
      setError('이미지를 불러올 수 없습니다');
    }
  }, []);

  // 업스케일 핸들러
  const handleUpscale = useCallback(async (imageUrl: string, imageIndex: number) => {
    if (!user) {
      setError(t.errorLogin);
      return;
    }

    // 업스케일 비용: 1토큰
    const upscaleCost = 1;

    if (balance === null || balance < upscaleCost) {
      setError(`업스케일을 위한 토큰이 부족합니다. (필요: ${upscaleCost}, 보유: ${balance || 0})`);
      setRequiredTokens(upscaleCost);
      setIsTokenPurchaseModalOpen(true);
      return;
    }

    setIsUpscaling(true);
    setUpscalingImageIndex(imageIndex);
    setError(null);

    try {
      // 여기서 실제 업스케일 API를 호출해야 합니다
      // 현재는 데모용으로 원본 이미지를 그대로 반환합니다
      console.log('업스케일 시작:', imageUrl);

      // 실제 구현에서는 geminiService.ts에 업스케일 함수를 추가하고 호출해야 합니다
      // const upscaledResult = await upscaleImageWithGemini(imageUrl);

      // 데모용: 2초 대기 후 원본 이미지 반환
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 업스케일 성공 후 토큰 차감
      await useTokensFunction(upscaleCost, '이미지 업스케일');

      // 업스케일 정보 저장
      setLastUpscaleInfo({
        model: 'KIE NanoBanana Upscale',
        cost: upscaleCost,
        count: 1
      });

      // 실제로는 업스케일된 이미지 URL로 교체해야 합니다
      // 데모용으로는 원본 이미지 유지
      console.log('업스케일 완료');

    } catch (err) {
      console.error('업스케일 실패:', err);
      setError('업스케일에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpscaling(false);
      setUpscalingImageIndex(null);
    }
  }, [user, balance, t, useTokensFunction]);

  // 이미지 생성 버튼 클릭 핸들러
  const handleGenerate = () => {
    const request: GenerateImageRequest = {
      prompt,
      creativity,
      selectedPresets,
      selectedPresetOptionIds,
      numberOfOutputs,
      model,
      aspectRatio,
      resolution
    };
    handleGenerateNew(request);
  };

  return (
    <div className="min-h-screen bg-white font-neodgm">
      {/* 헤더 */}
      <header className="bg-white border-b-4 border-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 영역 */}
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-black">PIXEL EDITOR</h1>
            </div>

            {/* 중앙 탭 영역 */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg border-2 border-black">
              <button
                onClick={() => handleModeChange('create')}
                className={`px-4 py-2 text-sm font-semibold rounded transition-all flex items-center space-x-2 ${
                  currentMode === 'create'
                    ? 'bg-white border-2 border-black shadow-md text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
                title={t.createImage}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">{t.createImage}</span>
              </button>
              <button
                onClick={() => handleModeChange('edit')}
                className={`px-4 py-2 text-sm font-semibold rounded transition-all flex items-center space-x-2 ${
                  currentMode === 'edit'
                    ? 'bg-white border-2 border-black shadow-md text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
                title={t.editImage}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">{t.editImage}</span>
              </button>
            </div>

            {/* 우측 유틸리티 영역 */}
            <div className="flex items-center space-x-4">
              {/* 토큰 잔액 */}
              <TokenBalance />

              {/* 언어 전환 */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-1 text-sm border-2 border-black rounded bg-blue-100 hover:bg-blue-200 transition-colors"
              >
                {language === 'ko' ? 'EN' : '한'}
              </button>

              {/* 로그인/로그아웃 버튼 */}
              <button
                onClick={user ? handleLogout : handleLogin}
                className={`p-2 border-2 border-black rounded transition-colors flex items-center space-x-2 ${
                  user
                    ? 'bg-green-100 hover:bg-green-200 text-green-700'
                    : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                }`}
                title={user ? t.logout : t.login}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="hidden lg:inline">{user ? t.logout : t.login}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <main className="flex flex-col md:flex-row min-h-screen pt-16">
        {/* 좌측 Input 패널 */}
        <div className="w-full md:w-1/2 p-4 h-screen md:h-auto">
          <div className="pixel-panel h-full md:h-[calc(100vh-6rem)] flex flex-col">
            {/* 패널 헤더 */}
            <div className="pixel-panel-header">
              <h2 className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>INPUT</span>
              </h2>
            </div>

            <div className="pixel-panel-content flex-1 overflow-y-auto">
              {/* 프롬프트 입력 영역 */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                  {t.prompt}
                </label>
                <div className="speech-bubble">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={currentMode === 'create' ? t.promptPlaceholder : t.editPromptPlaceholder}
                    className="pixel-input w-full h-24 resize-none border-0 bg-transparent"
                  />
                </div>
              </div>

              {/* 이미지 업로드 영역 (Edit 모드) */}
              {currentMode === 'edit' && (
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">
                    {t.uploadImage}
                  </label>
                  <div className="pixel-border p-4 rounded-lg">
                    <ImageUploader
                      images={images}
                      onImagesChange={setImages}
                      maxImages={5}
                    />
                  </div>
                </div>
              )}

              {/* 기본 설정 */}
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {/* 모델 선택 */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      {t.model}
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as ModelId)}
                      className="pixel-dropdown w-full"
                    >
                      <option value="nanobanana">NanoBanana (2토큰 기본)</option>
                      <option value="seedream">Seedream (4토큰 기본)</option>
                    </select>
                  </div>

                  {/* 프리셋 선택 (Edit 모드에서만 표시) */}
                  {currentMode === 'edit' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        {t.presetsLabel || '프리셋'}
                      </label>
                      <select
                        value={selectedPresets[0]?.id || ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            setSelectedPresets([]);
                            setSelectedPresetOptionIds([]);
                            setNumberOfOutputs(1);
                          } else {
                            const preset = PRESETS.find(p => p.id === e.target.value);
                            if (preset) {
                              setSelectedPresets([preset]);
                              setSelectedPresetOptionIds([]);
                              setNumberOfOutputs(1);
                            }
                          }
                        }}
                        className="pixel-dropdown w-full"
                      >
                        <option value="">프리셋 없음</option>
                        {PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 프리셋 옵션 (선택된 프리셋이 있을 때만 표시) */}
                  {currentMode === 'edit' && selectedPresets.length > 0 && selectedPresets[0].options && (
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        {selectedPresets[0].id === 'angle_changer' ? '앵글 선택' : (t.styleLabel || '스타일 선택')}
                        {selectedPresets[0].id === 'angle_changer' && ` (${selectedPresetOptionIds.length}/6)`}
                      </label>
                      <div className={`grid gap-2 ${
                        selectedPresets[0].id === 'angle_changer' ? 'grid-cols-3' : 'grid-cols-2'
                      }`}>
                        {selectedPresets[0].options.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleOptionClick(option.id)}
                            className={`p-2 border-2 border-black rounded text-xs transition-all text-left ${
                              selectedPresetOptionIds.includes(option.id)
                                ? 'bg-green-200 shadow-[1px_1px_0_0_#000]'
                                : 'bg-white hover:bg-gray-50 shadow-[1px_1px_0_0_#ccc]'
                            }`}
                          >
                            <span className="font-semibold">
                              {t[option.nameKey as keyof typeof t] || option.nameKey}
                            </span>
                          </button>
                        ))}
                      </div>
                      {selectedPresetOptionIds.length === 0 && (
                        <p className="text-xs text-red-600 mt-2">
                          {selectedPresets[0].id === 'angle_changer'
                            ? '앵글을 선택하세요'
                            : (t.figurineNoStyleSelected || '스타일을 선택하세요')
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* 종횡비 선택 */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      {t.aspectRatioLabel || '종횡비'}
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                      className="pixel-dropdown w-full"
                    >
                      <option value="auto">{t.outputSizeAuto} (기본)</option>
                      <option value="1:1">
                        {t.outputSizeSquare} (1:1)
                        {model === 'nanobanana' && ' +2토큰'}
                      </option>
                      <option value="3:4">
                        {t.outputSizePortrait} (3:4)
                        {model === 'nanobanana' && ' +2토큰'}
                      </option>
                      <option value="4:3">
                        {t.outputSizeLandscape} (4:3)
                        {model === 'nanobanana' && ' +2토큰'}
                      </option>
                      <option value="9:16">
                        세로 모바일 (9:16)
                        {model === 'nanobanana' && ' +2토큰'}
                      </option>
                      <option value="16:9">
                        가로 와이드 (16:9)
                        {model === 'nanobanana' && ' +2토큰'}
                      </option>
                    </select>
                  </div>

                  {/* 해상도 선택 */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      {t.resolutionLabel || '해상도'}
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as Resolution)}
                      className="pixel-dropdown w-full"
                    >
                      <option value="1k">1K (1024px) - 기본</option>
                      {model === 'seedream' && (
                        <>
                          <option value="2k">2K (2048px) - 고해상도</option>
                          <option value="4k">4K (4096px) - 최고화질</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 출력 수량 */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      출력 수량
                    </label>
                    <select
                      value={numberOfOutputs}
                      onChange={(e) => setNumberOfOutputs(parseInt(e.target.value))}
                      className="pixel-dropdown w-full"
                      disabled={selectedPresets.length > 0}
                    >
                      <option value={1}>1개 이미지</option>
                      <option value={2}>2개 이미지</option>
                      <option value={3}>3개 이미지</option>
                      <option value={4}>4개 이미지</option>
                    </select>
                    {selectedPresets.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        프리셋 선택 시 출력 수량이 자동 설정됩니다
                      </p>
                    )}
                  </div>
                </div>


                {/* 토큰 비용 요약 */}
                <div className="pixel-border p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-bold mb-2">🪙 토큰 비용 계산</div>
                    <div className="space-y-1 text-xs">
                      <div>• 모델 기본 비용: {model === 'nanobanana' ? '2' : '4'}토큰</div>
                      {aspectRatio !== 'auto' && model === 'nanobanana' && (
                        <div>• 종횡비 추가 비용: +2토큰</div>
                      )}
                      <div>• 출력 수량: ×{numberOfOutputs}</div>
                      {selectedPresets.length > 0 && (
                        <div className="text-blue-600">
                          • 프리셋: {selectedPresets[0].name}
                          {selectedPresets[0].id === 'figurine' && selectedPresetOptionIds.length > 0 && (
                            <span> ({selectedPresetOptionIds.length}개 스타일)</span>
                          )}
                        </div>
                      )}
                      <div className="border-t pt-1 font-bold">
                        총 필요 토큰: {requiredTokens}토큰
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 생성 버튼 */}
              <div className="mt-auto pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={
                    !prompt.trim() ||
                    isLoading ||
                    !user ||
                    (currentMode === 'edit' && images.length === 0) ||
                    (currentMode === 'edit' && selectedPresets.length > 0 && selectedPresetOptionIds.length === 0)
                  }
                  className="pixel-button w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <span className="animate-spin">⚙️</span>
                        <span>{t.generating}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5 7-5v10z" />
                        </svg>
                        <span>
                          {currentMode === 'create' ? t.generateImage : t.editImage}
                          {' ('}{requiredTokens} {t.tokens}{')'}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 Output 패널 */}
        <div className="w-full md:w-1/2 p-4 h-screen md:h-auto">
          <div className="pixel-panel h-full md:h-[calc(100vh-6rem)] flex flex-col">
            {/* 패널 헤더 */}
            <div className="pixel-panel-header">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>OUTPUT</span>
                </h2>

                {/* 탭 전환 */}
                <div className="flex space-x-1 bg-white bg-opacity-30 p-1 rounded">
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`px-3 py-1 text-sm font-semibold rounded ${
                      activeTab === 'results'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white hover:bg-white hover:bg-opacity-20'
                    }`}
                  >
                    {t.results}
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 text-sm font-semibold rounded ${
                      activeTab === 'history'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white hover:bg-white hover:bg-opacity-20'
                    }`}
                  >
                    {t.history}
                  </button>
                </div>
              </div>
            </div>

            <div className="pixel-panel-content flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'results' ? (
                    generatedImages.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="pixel-border p-4 rounded-lg bg-white">
                            <img
                              src={imageUrl}
                              alt={`Generated ${index + 1}`}
                              className="w-full rounded-lg shadow-md"
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleEditImage(imageUrl)}
                                className="flex-1 pixel-button text-sm py-2"
                              >
                                {t.edit}
                              </button>
                              <button
                                onClick={() => handleUpscale(imageUrl, index)}
                                disabled={isUpscaling}
                                className="flex-1 pixel-button text-sm py-2 disabled:opacity-50"
                              >
                                {isUpscaling && upscalingImageIndex === index ? (
                                  <div className="flex items-center justify-center space-x-1">
                                    <span className="animate-spin">⚙️</span>
                                    <span>업스케일 중...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    <span>업스케일 (1토큰)</span>
                                  </div>
                                )}
                              </button>
                              <a
                                href={imageUrl}
                                download={`pixel-editor-${Date.now()}.png`}
                                className="flex-1 pixel-button text-sm py-2 text-center"
                              >
                                다운로드
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-16 h-16 mb-4 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h3 className="text-xl font-bold mb-2">
                            {t.noImagesYet}
                          </h3>
                          <p className="text-gray-600">
                            {t.enterPromptHint}
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="pixel-border p-3 rounded-lg bg-white cursor-pointer hover:bg-gray-50" onClick={() => handleLoadHistory(item)}>
                          <div className="flex gap-3">
                            <img src={item.images[0]} alt="History" className="w-16 h-16 rounded object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-bold truncate">{item.request.prompt}</p>
                              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 에러 메시지 */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div className="pixel-border bg-red-100 border-red-500 p-4 rounded-lg max-w-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-neodgm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달들 */}
      {isHelpModalOpen && (
        <HelpModal onClose={() => setIsHelpModalOpen(false)} />
      )}

      {isTokenPurchaseModalOpen && (
        <TokenPurchaseModal
          onClose={() => setIsTokenPurchaseModalOpen(false)}
          requiredTokens={requiredTokens}
        />
      )}

      {paymentCallbackType && (
        <PaymentCallback
          type={paymentCallbackType}
          onClose={() => setPaymentCallbackType(null)}
        />
      )}
    </div>
  );
};

const NewLayoutApp: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NewLayoutAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default NewLayoutApp;