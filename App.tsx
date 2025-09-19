
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Layout/Header';
import { InputPanel } from './components/Panels/InputPanel';
import { OutputPanel } from './components/Panels/OutputPanel';
import './styles/pixel-theme.css';
import { LogoIcon, QuestionMarkCircleIcon, PixelTokenIcon } from './components/Icons';
import { HelpModal } from './components/HelpModal';
import { HistoryPanel } from './components/HistoryPanel';
import { TokenPurchaseModal } from './src/components/TokenPurchaseModal';
import { PaymentCallback } from './src/components/PaymentCallback';
import { editImageWithGemini, getPromptSuggestion, getModelTokenCost, getTotalTokenCost } from './services/geminiService';
import * as historyService from './services/historyService';
import { fileToDataURL, dataURLtoFile } from './utils';
import type { GenerateImageRequest, TokenUsage, HistoryItem, Preset, AspectRatio, ModelId, Resolution } from './types';
import { useTranslations, LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { Translation } from './translations';
import TokenBalance from './src/components/TokenBalance';
import { useTokens } from './src/lib/tokenApi';




const AppContent: React.FC = () => {
  // 최소한의 상태만 사용
  const [currentMode, setCurrentMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user, refreshBalance]);

  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
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
  const [isDrawingCanvasOpen, setIsDrawingCanvasOpen] = useState(false);
  const [skeletonCount, setSkeletonCount] = useState(1);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTokenPurchaseModalOpen, setIsTokenPurchaseModalOpen] = useState(false);
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [paymentCallbackType, setPaymentCallbackType] = useState<'success' | 'fail' | null>(null);

  // State for Controls (lifted up)
  const [prompt, setPrompt] = useState('');
  const [creativity, setCreativity] = useState(0.5);
  const [selectedPresets, setSelectedPresets] = useState<Preset[]>([]);
  const [selectedPresetOptionIds, setSelectedPresetOptionIds] = useState<string[]>([]);
  const [numberOfOutputs, setNumberOfOutputs] = useState(1);
  const [model, setModel] = useState<ModelId>('nanobanana');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [resolution, setResolution] = useState<Resolution>('1k');

  // State for History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'history'>('results');

  // State for Mode (replaced sidebar)
  const [currentMode, setCurrentMode] = useState<'create' | 'edit'>('create');
  
  const isCancelledRef = useRef(false);


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
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Don't interfere with pasting into modals
      if (isHelpModalOpen || isDrawingCanvasOpen) {
        return;
      }
      
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Create a new File object to give it a unique name
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
  }, [isHelpModalOpen, isDrawingCanvasOpen]);

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
  

  const handleSuggestion = useCallback(async (currentPrompt: string): Promise<string> => {
    if (!user) {
      setError(t.errorLogin);
      return currentPrompt;
    }
    setIsLoading(true);
    setError(null);
    try {
        const mainImage = images[0] || null;
        const referenceImages = images.slice(1);
        const suggestion = await getPromptSuggestion(currentPrompt, mainImage, referenceImages, language);
        return suggestion;
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'errorSuggestion';
        setError(t[errorMessage as keyof Translation] || t.errorSuggestion);
        return currentPrompt;
    } finally {
        setIsLoading(false);
    }
  }, [images, user, t, language]);
  
  const handleSaveDrawing = (file: File) => {
      setImages(prev => [...prev, file]);
  };
  
  const handleResetSessionUsage = () => {
    setSessionTokenUsage({ promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });
  };

  const handleDeleteHistory = useCallback(async (id: number) => {
    try {
        await historyService.deleteGeneration(id);
        setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
        console.error("Failed to delete history item:", err);
        setError(t.errorDeleteHistory);
    }
  }, [t.errorDeleteHistory]);
  
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

  const handleUpscale = useCallback(async (imageUrl: string) => {
      // 업스케일 비용 고정 5토큰
      const upscaleCost = 5;

      // 토큰 잔액 확인
      if (balance === null || balance < upscaleCost) {
        setError(`업스케일에 필요한 픽셀 토큰이 부족합니다. (필요: ${upscaleCost}, 보유: ${balance || 0})`);
        setRequiredTokens(upscaleCost);
        setIsTokenPurchaseModalOpen(true);
        return;
      }

      try {
        // 토큰 차감
        await useTokensFunction(upscaleCost, `이미지 업스케일 (${resolution})`);

        // 업스케일 정보 별도 저장
        setLastUpscaleInfo(prev => prev ? {
          model: 'Topaz',
          cost: prev.cost + upscaleCost,
          count: prev.count + 1
        } : {
          model: 'Topaz',
          cost: upscaleCost,
          count: 1
        });

        alert(`✅ 업스케일 완료! (비용: ${upscaleCost} 🪙)\n대상: ${resolution.toUpperCase()}`);
        console.log(`Upscaling image: ${imageUrl} to ${resolution} with aspect ratio: ${aspectRatio}`);
      } catch (err) {
        console.error('Upscale failed:', err);
        setError('업스케일에 실패했습니다.');
      }
  }, [aspectRatio, resolution, balance, useTokensFunction, setError, setRequiredTokens, setIsTokenPurchaseModalOpen]);

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


  const disabledReason = !user ? t.disabledReasonLogin : (currentMode === 'edit' && images.length === 0) ? t.disabledReasonImage : null;

  // 토큰 비용 계산
  useEffect(() => {
    const cost = getTotalTokenCost(model, aspectRatio, numberOfOutputs);
    setRequiredTokens(cost);
  }, [model, aspectRatio, numberOfOutputs]);

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

    const preset = request.selectedPresets[0];
    if (preset?.id === 'figurine') {
        setSkeletonCount(request.selectedPresetOptionIds.length > 0 ? request.selectedPresetOptionIds.length : 1);
    } else {
        setSkeletonCount(request.numberOfOutputs);
    }

    try {
      // 먼저 이미지 생성 시도
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

        // API 오류시 사용자 친화적 메시지
        let errorMessage = t.errorUnknown;

        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as any).response;
          if (response?.status === 402) {
            errorMessage = '픽셀 토큰이 부족합니다. 충전 후 다시 시도해주세요.';
            setRequiredTokens(getTotalTokenCost(request.model, request.aspectRatio, request.numberOfOutputs));
            setIsTokenPurchaseModalOpen(true);
          } else if (response?.status === 401) {
            errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
          } else if (response?.status >= 500) {
            errorMessage = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
          } else {
            errorMessage = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
        } else if (err instanceof Error) {
          // 네트워크 오류 등 처리
          if (err.message.includes('network') || err.message.includes('Network')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [images, balance, user, t, useTokensFunction, currentMode, loadHistory]);

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
            <p>사용자: {user ? '로그인됨' : '로그인 안됨'}</p>
            <p>토큰 잔액: {balance}</p>
            <p>로딩 상태: {isLoading ? '로딩 중' : '대기'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


// 토큰 애니메이션을 위한 별도 컴포넌트
const FlyingToken: React.FC<{ startRef: React.RefObject<HTMLElement>, endRef: React.RefObject<HTMLElement> }> = ({ startRef, endRef }) => {
  const [position, setPosition] = useState({ top: -999, left: -999 });

  useEffect(() => {
    if (startRef.current && endRef.current) {
      const startRect = startRef.current.getBoundingClientRect();
      const endRect = endRef.current.getBoundingClientRect();

      // 시작 위치: 토큰 잔액 아이콘 중앙
      const startTop = startRect.top + startRect.height / 2;
      const startLeft = startRect.left + startRect.width / 4;

      // 종료 위치: 생성 버튼 중앙
      const endTop = endRect.top + endRect.height / 2;
      const endLeft = endRect.left + endRect.width / 2;

      // CSS 변수로 위치 전달
      document.documentElement.style.setProperty('--token-start-top', `${startTop}px`);
      document.documentElement.style.setProperty('--token-start-left', `${startLeft}px`);
      document.documentElement.style.setProperty('--token-end-top', `${endTop}px`);
      document.documentElement.style.setProperty('--token-end-left', `${endLeft}px`);

      setPosition({top: startTop, left: startLeft});
    }
  }, [startRef, endRef]);

  if (position.top === -999) return null;

  return (
    <>
      <div className="fixed flying-token z-50" style={{ top: 0, left: 0 }}>
        <PixelTokenIcon className="w-8 h-8" />
      </div>
      <style>{`
        @keyframes fly {
          0% {
            transform: translate(var(--token-start-left), var(--token-start-top)) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--token-end-left), var(--token-end-top)) scale(0.5);
            opacity: 0;
          }
        }
        .flying-token {
          animation: fly 1s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

// 이미지 생성 기능 테스트 버전
const SimpleAppContent: React.FC = () => {
  const { language, setLanguage, t } = useTranslations();

  // 상태 관리
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [creativity, setCreativity] = useState(0.7);
  const [numberOfOutputs, setNumberOfOutputs] = useState(1);
  const [model, setModel] = useState<ModelId>('nanobanana');

  // 이미지 생성 함수
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const mainImage = images[0] || null;
      const referenceImages = images.slice(1);

      const result = await editImageWithGemini({
        mainImage,
        referenceImages,
        prompt,
        creativity,
        numberOfOutputs,
        model,
        aspectRatio: '1:1',
        resolution: '1024x1024'
      });

      setGeneratedImages(result.images || []);
      console.log('생성 완료:', result);
    } catch (err) {
      console.error('생성 실패:', err);
      setError(err instanceof Error ? err.message : '이미지 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#90EE90]">
      {/* Header */}
      <header className="bg-white border-b-4 border-black shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="font-neodgm text-lg md:text-xl text-black flex items-center gap-1">
                <span>PIXEL-EDITOR</span>
                <span className="ml-2 text-xs bg-black text-[#90EE90] px-2 py-0.5">{t.dev}</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                  className="py-1 px-3 text-sm font-semibold border-2 border-black bg-transparent hover:bg-gray-200 transition-colors"
                >
                  {language === 'ko' ? 'English' : '한국어'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Controls */}
          <div className="bg-white border-4 border-black shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">이미지 생성 테스트</h2>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">이미지 업로드 (선택):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImages([file]);
                  }
                }}
                className="w-full p-2 border-2 border-black"
              />
              {images.length > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  업로드됨: {images[0].name}
                </p>
              )}
            </div>

            {/* Prompt Input */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">프롬프트:</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 border-2 border-black"
                rows={3}
                placeholder="생성하고 싶은 이미지를 설명해주세요..."
              />
              <p className="text-xs text-gray-600 mt-1">
                이미지를 업로드하면 편집, 업로드하지 않으면 새 이미지 생성
              </p>
            </div>

            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">모델:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelId)}
                className="w-full p-2 border-2 border-black"
              >
                <option value="nanobanana">NanoBanana</option>
                <option value="seedance">Seedance</option>
              </select>
            </div>

            {/* Creativity */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">창의성: {creativity}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={creativity}
                onChange={(e) => setCreativity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 px-4 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? '생성 중...' : '이미지 생성'}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white border-4 border-black shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">생성 결과</h2>

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full"></div>
                <p className="mt-2">이미지 생성 중...</p>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="space-y-4">
                {generatedImages.map((imageUrl, index) => (
                  <div key={index} className="border-2 border-black">
                    <img
                      src={imageUrl}
                      alt={`Generated ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && generatedImages.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                생성된 이미지가 여기에 표시됩니다
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
