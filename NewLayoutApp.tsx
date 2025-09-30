import React, { useState, useCallback, useEffect, useRef } from 'react';
import { XMarkIcon, Cog6ToothIcon, SparklesIcon, CurrencyDollarIcon, GlobeAltIcon, LockClosedIcon, CheckCircleIcon, PencilIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
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
import PaymentCallback from './src/components/PaymentCallback';
import { ImageUploader } from './components/ImageUploader';
import { DrawingCanvas } from './components/DrawingCanvas';
import ExampleSection from './src/components/examples/ExampleSection';
import { useExamples } from './src/hooks/useExamples';
import type { ExampleConfig } from './src/config/examples.config';
import { GalleryModal } from './src/components/gallery/GalleryModal';
import { useGallery } from './src/hooks/useGallery';
import type { GalleryItem } from './src/services/galleryService';

// 상태 표시용 작은 점 컴포넌트 (픽셀 스타일)
const StatusDot: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <div
    className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white ${className}`}
    style={{
      backgroundColor: color,
      borderRadius: '0', // 픽셀 스타일에 맞게 각진 모양
      boxShadow: '1px 1px 0 0 rgba(0, 0, 0, 0.3)' // 픽셀 그림자 효과
    }}
  />
);

const NewLayoutAppContent: React.FC = () => {
  const { t, language, toggleLanguage } = useTranslations();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { balance, refreshBalance, useTokens: useTokensFunction } = useTokens();
  const { applyExample } = useExamples();
  const { saveImage } = useGallery();

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
  const [selectedImageForModal, setSelectedImageForModal] = useState<string | null>(null);
  const [isDrawingCanvasOpen, setIsDrawingCanvasOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

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

  // 토큰 잔액 새로고침 (refreshBalance 의존성 제거하여 무한 루프 방지)
  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, [user]);

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
  }, []); // 한 번만 실행

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

      console.log(`이미지 생성 결과 - 총 ${result.images.length}개 이미지 받음:`, result.images);
      setGeneratedImages(result.images);
      setLastTokenUsage(result.usage);

      // 갤러리에 자동 저장 (첫 번째 이미지만)
      if (result.images.length > 0 && user) {
        try {
          const imageName = `Generated-${Date.now()}`;
          const settings = {
            model: request.model,
            aspectRatio: request.aspectRatio,
            resolution: request.resolution,
            creativity,
            presets: selectedPresets.map(p => p.name).join(', '),
            numberOfOutputs: request.numberOfOutputs
          };

          await saveImage(
            imageName,
            result.images[0], // 첫 번째 이미지만 저장
            request.prompt,
            request.model,
            settings
          );

          console.log('갤러리에 자동 저장 완료:', imageName);
        } catch (saveError) {
          console.warn('갤러리 자동 저장 실패:', saveError);
          // 저장 실패는 에러로 표시하지 않음 (생성은 성공했으므로)
        }
      }

      // 생성 성공 후에만 토큰 차감
      console.log(`실제 토큰 차감 - ${tokensRequired}토큰 소모`);
      const tokenResult = await useTokensFunction(tokensRequired, `이미지 생성: ${request.prompt.substring(0, 50)}...`);
      console.log('토큰 사용 결과:', tokenResult);

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

  // 이미지 편집 팝업 열기
  const handleEditImage = useCallback((imageUrl: string) => {
    setSelectedImageForModal(imageUrl);
  }, []);

  // 예시 클릭 핸들러
  const handleExampleClick = useCallback(async (example: ExampleConfig) => {
    try {
      await applyExample(example, {
        setCurrentMode,
        setPrompt,
        setCreativity,
        setModel,
        setAspectRatio,
        setResolution,
        setNumberOfOutputs,
        setSelectedPresets,
        setSelectedPresetOptionIds,
        setImages,
        scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' })
      });

      // 설정 적용 후 Results 탭으로 전환
      setActiveTab('results');
    } catch (error) {
      console.error('예시 적용 실패:', error);
      setError('예시 설정을 적용하는데 실패했습니다.');
    }
  }, [
    applyExample,
    setCurrentMode,
    setPrompt,
    setCreativity,
    setModel,
    setAspectRatio,
    setResolution,
    setNumberOfOutputs,
    setSelectedPresets,
    setSelectedPresetOptionIds,
    setImages
  ]);

  // 실제 이미지를 Input으로 설정하는 함수
  const handleSetImageAsInput = useCallback(async (imageUrl: string) => {
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

      // 모달 닫기
      setSelectedImageForModal(null);
    } catch (err) {
      console.error('Failed to load image for editing:', err);
      setError('이미지를 불러올 수 없습니다');
    }
  }, []);

  // 업스케일 핸들러
  // 그리기 기능
  const handleDrawClick = () => {
    setIsDrawingCanvasOpen(true);
  };

  const handleDrawingSave = (file: File) => {
    setImages(prev => [file, ...prev]);
    setIsDrawingCanvasOpen(false);
  };

  // 갤러리에서 이미지 불러오기
  const handleGalleryImageSelect = async (galleryItem: GalleryItem) => {
    try {
      // 이미지 URL을 File 객체로 변환
      const response = await fetch(galleryItem.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], galleryItem.name, { type: 'image/png' });

      // 이미지를 현재 이미지 목록에 추가
      setImages(prev => [file, ...prev]);

      // 관련 설정들 적용
      if (galleryItem.settings) {
        if (galleryItem.settings.model) setModel(galleryItem.settings.model);
        if (galleryItem.settings.aspectRatio) setAspectRatio(galleryItem.settings.aspectRatio);
        if (galleryItem.settings.resolution) setResolution(galleryItem.settings.resolution);
        if (galleryItem.settings.creativity !== undefined) setCreativity(galleryItem.settings.creativity);
      }

      // 프롬프트 설정
      setPrompt(galleryItem.prompt);

      // Edit 모드로 전환
      setCurrentMode('edit');

      // 갤러리 모달 닫기
      setIsGalleryModalOpen(false);

      console.log('갤러리 이미지 로드 완료:', galleryItem.name);
    } catch (error) {
      console.error('갤러리 이미지 로드 실패:', error);
      setError('이미지를 불러오는데 실패했습니다.');
    }
  };

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

      // 갤러리에 업스케일된 이미지 자동 저장
      if (user) {
        try {
          const imageName = `Upscaled-${Date.now()}`;
          const settings = {
            model: 'KIE NanoBanana Upscale',
            originalModel: model, // 원본 이미지의 모델
            upscaleRatio: '4x'
          };

          await saveImage(
            imageName,
            imageUrl, // 실제로는 업스케일된 이미지 URL
            `Upscaled version of image`, // 업스케일 설명
            'KIE NanoBanana Upscale',
            settings
          );

          console.log('업스케일된 이미지 갤러리 저장 완료:', imageName);
        } catch (saveError) {
          console.warn('업스케일 이미지 갤러리 저장 실패:', saveError);
        }
      }

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
    <div className="min-h-screen pixel-bg font-neodgm">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b-3 shadow-lg" style={{
        background: 'linear-gradient(to right in oklab, rgb(255, 222, 229), rgb(255, 202, 212))',
        borderBottomColor: '#2C3E50',
        borderBottomWidth: '3px'
      }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 영역 */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer group"
              title="홈으로 이동"
            >
              <svg className="w-8 h-8 text-pink-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-black group-hover:text-gray-700 transition-colors">PIXEL EDITOR</h1>
            </button>

            {/* 중앙 탭 영역 */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleModeChange('create')}
                className={`px-4 py-2 text-sm font-semibold transition-all flex items-center space-x-2 border-3 ${
                  currentMode === 'create'
                    ? 'border-pink-400 bg-white shadow-[3px_3px_0_0_#f472b6] text-black'
                    : 'border-black bg-white text-gray-600 hover:text-black shadow-[2px_2px_0_0_#000]'
                }`}
                title={t.createImage}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">CREATE</span>
              </button>
              <button
                onClick={() => handleModeChange('edit')}
                className={`px-4 py-2 text-sm font-semibold transition-all flex items-center space-x-2 border-3 ${
                  currentMode === 'edit'
                    ? 'border-pink-400 bg-white shadow-[3px_3px_0_0_#f472b6] text-black'
                    : 'border-black bg-white text-gray-600 hover:text-black shadow-[2px_2px_0_0_#000]'
                }`}
                title={t.editImage}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">EDIT</span>
              </button>
            </div>

            {/* 우측 유틸리티 영역 */}
            <div className="flex items-center space-x-4">

              {/* 갤러리 버튼 */}
              <button
                onClick={() => setIsGalleryModalOpen(true)}
                className="relative w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 transition-all"
                title="내 갤러리"
              >
                <Squares2X2Icon className="w-6 h-6 text-black" />
              </button>

              {/* 토큰 잔액 */}
              <TokenBalance />

              {/* 언어 전환 */}
              <button
                onClick={toggleLanguage}
                className="relative w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 transition-all"
                title={language === 'ko' ? 'Switch to English' : '한국어로 변경'}
              >
                <GlobeAltIcon
                  className="w-8 h-8 text-black"
                />
                <StatusDot color={language === 'ko' ? '#2563eb' : '#dc2626'} />
              </button>

              {/* 로그인/로그아웃 상태 버튼 */}
              <button
                onClick={user ? handleLogout : handleLogin}
                className="relative w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 transition-all"
                title={user ? `${user.email} - 로그아웃하려면 클릭` : '로그인이 필요합니다'}
              >
                {user ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                ) : (
                  <LockClosedIcon className="w-8 h-8 text-red-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <main className="flex justify-center min-h-screen pt-12">
        <div className="w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 좌측 Input 패널 */}
            <div className="w-full md:w-1/2 h-screen md:h-auto">
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
                <div className="pb-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={currentMode === 'create' ? t.promptPlaceholder : t.editPromptPlaceholder}
                    className="speech-bubble w-full h-24 resize-none"
                  />
                </div>
              </div>

              {/* 이미지 업로드 영역 (Edit 모드) */}
              {currentMode === 'edit' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold">
                      {t.uploadImage}
                    </label>
                    <button
                      onClick={handleDrawClick}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      title={t.draw || 'Draw'}
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Draw</span>
                    </button>
                  </div>
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
                    <div className="font-bold mb-2 flex items-center space-x-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-yellow-600" />
                      <span>토큰 비용 계산</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>• 모델 기본 비용: {model === 'nanobanana' ? '2' : '4'}토큰</div>
                      {aspectRatio !== 'auto' && model === 'nanobanana' && (
                        <div>• 종횡비 추가 비용: +2토큰</div>
                      )}
                      <div className="flex items-center space-x-1">
                        <span>• 출력 수량:</span>
                        <XMarkIcon className="w-3 h-3" />
                        <span>{numberOfOutputs}</span>
                      </div>
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
                        <Cog6ToothIcon className="w-5 h-5 animate-spin" />
                        <span>{t.generating}</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
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
            <div className="w-full md:w-1/2 h-screen md:h-auto">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="pixel-border p-4 rounded-lg" style={{backgroundColor: 'var(--panel-bg)'}}>
                            <div className="image-container">
                              <img
                                src={imageUrl}
                                alt={`Generated ${index + 1}`}
                                className="w-full rounded-lg shadow-md"
                              />
                              <div className="image-overlay">
                                <button
                                  onClick={() => handleEditImage(imageUrl)}
                                  className="overlay-button"
                                  title="이미지 편집"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <a
                                  href={imageUrl}
                                  download={`pixel-editor-${Date.now()}.png`}
                                  className="overlay-button"
                                  title="다운로드"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              </div>
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
                        <div key={item.id} className="pixel-border p-3 rounded-lg cursor-pointer hover:opacity-90" style={{backgroundColor: 'var(--panel-bg)'}} onClick={() => handleLoadHistory(item)}>
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
          </div>
        </div>

        {/* 예시 섹션 */}
        <ExampleSection onExampleClick={handleExampleClick} />
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

      {/* 이미지 편집 팝업 모달 */}
      {selectedImageForModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="border-3 border-black shadow-[4px_4px_0_0_#000] max-w-2xl w-full max-h-[90vh] overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-dark)' }}>
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">이미지 작업</h3>
                <button
                  onClick={() => setSelectedImageForModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 이미지 뷰어 */}
              <div className="mb-6">
                <img
                  src={selectedImageForModal}
                  alt="Selected"
                  className="w-full max-h-[50vh] object-contain rounded-lg"
                />
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleSetImageAsInput(selectedImageForModal)}
                  className="flex-1 pixel-button py-3 text-sm font-bold"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>이 이미지를 Input으로</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const index = generatedImages.indexOf(selectedImageForModal);
                    if (index !== -1) {
                      handleUpscale(selectedImageForModal, index);
                      setSelectedImageForModal(null);
                    }
                  }}
                  disabled={isUpscaling}
                  className="flex-1 pixel-button py-3 text-sm font-bold disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>업스케일 (1토큰)</span>
                  </div>
                </button>
                <a
                  href={selectedImageForModal}
                  download={`pixel-editor-${Date.now()}.png`}
                  className="flex-1 pixel-button py-3 text-sm font-bold text-center"
                  onClick={() => setSelectedImageForModal(null)}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>다운로드</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DrawingCanvas 모달 */}
      <DrawingCanvas
        isOpen={isDrawingCanvasOpen}
        onClose={() => setIsDrawingCanvasOpen(false)}
        onSave={handleDrawingSave}
      />

      {/* 갤러리 모달 */}
      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onImageSelect={handleGalleryImageSelect}
        title="내 갤러리"
      />

      {/* Footer */}
      <footer className="mt-12 py-8 border-t-3 border-black" style={{
        background: 'linear-gradient(to right in oklab, rgb(255, 222, 229), rgb(255, 202, 212))',
        borderTopColor: '#2C3E50'
      }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-700 mb-4 font-neodgm text-sm">
              © 2024 Pixel Editor AI. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors font-neodgm">
                개인정보처리방침
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors font-neodgm">
                이용약관
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors font-neodgm">
                문의하기
              </a>
            </div>
          </div>
        </div>
      </footer>
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