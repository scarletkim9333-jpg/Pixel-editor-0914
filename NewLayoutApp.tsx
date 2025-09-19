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

  // 이미지 관련 상태
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

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
      setCurrentMode('edit');

      // 탭을 results로 설정
      setActiveTab('results');
    } catch (err) {
      console.error('Failed to load image for editing:', err);
      setError('이미지를 불러올 수 없습니다');
    }
  }, []);

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
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="bg-white border-b-4 border-black shadow-lg font-neodgm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 영역 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-500 border-2 border-black"></div>
              <h1 className="text-2xl font-bold text-black">PIXEL EDITOR</h1>
            </div>

            {/* 중앙 탭 영역 */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg border-2 border-black">
              <button
                onClick={() => setCurrentMode('create')}
                className={`px-6 py-2 text-sm font-semibold rounded transition-all ${
                  currentMode === 'create'
                    ? 'bg-white border-2 border-black shadow-md text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {t.createImage}
              </button>
              <button
                onClick={() => setCurrentMode('edit')}
                className={`px-6 py-2 text-sm font-semibold rounded transition-all ${
                  currentMode === 'edit'
                    ? 'bg-white border-2 border-black shadow-md text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {t.editImage}
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
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold border-2 border-black rounded bg-yellow-100 hover:bg-yellow-200 transition-colors"
                >
                  {t.logout}
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-sm font-semibold border-2 border-black rounded bg-yellow-100 hover:bg-yellow-200 transition-colors"
                >
                  {t.login}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <main className="flex h-screen pt-16">
        {/* 좌측 Input 패널 */}
        <div className="w-1/2 p-4">
          <div className="pixel-panel h-full flex flex-col">
            {/* 패널 헤더 */}
            <div className="pixel-panel-header">
              <h2>📝 INPUT</h2>
            </div>

            <div className="pixel-panel-content flex-1 overflow-y-auto">
              {/* 프롬프트 입력 영역 */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 font-neodgm">
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
                  <label className="block text-sm font-bold mb-2 font-neodgm">
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* 모델 선택 */}
                  <div>
                    <label className="block text-sm font-bold mb-2 font-neodgm">
                      {t.model}
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as ModelId)}
                      className="pixel-dropdown w-full"
                    >
                      <option value="nanobanana">NanoBanana</option>
                      <option value="seedream">Seedream</option>
                    </select>
                  </div>

                  {/* 출력 크기 */}
                  <div>
                    <label className="block text-sm font-bold mb-2 font-neodgm">
                      {t.outputSize}
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                      className="pixel-dropdown w-full"
                    >
                      <option value="auto">{t.outputSizeAuto}</option>
                      <option value="1:1">{t.outputSizeSquare}</option>
                      <option value="3:4">{t.outputSizePortrait}</option>
                      <option value="4:3">{t.outputSizeLandscape}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 생성 버튼 */}
              <div className="mt-auto pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isLoading || !user || (currentMode === 'edit' && images.length === 0)}
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
                        <span>🎨</span>
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
        <div className="w-1/2 p-4">
          <div className="pixel-panel h-full flex flex-col">
            {/* 패널 헤더 */}
            <div className="pixel-panel-header">
              <div className="flex items-center justify-between">
                <h2>🖼️ OUTPUT</h2>

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
                          <div className="text-6xl mb-4">🎨</div>
                          <h3 className="text-xl font-bold mb-2 font-neodgm">
                            {t.noImagesYet}
                          </h3>
                          <p className="text-gray-600 font-neodgm">
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
                              <p className="font-neodgm text-sm font-bold truncate">{item.request.prompt}</p>
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