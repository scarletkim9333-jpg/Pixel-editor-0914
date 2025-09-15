
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Controls } from './components/Controls';
import { OutputViewer } from './components/OutputViewer';
import { ImageUploader } from './components/ImageUploader';
import { DrawingCanvas } from './components/DrawingCanvas';
import { LogoIcon, QuestionMarkCircleIcon } from './components/Icons';
import { HelpModal } from './components/HelpModal';
import { HistoryPanel } from './components/HistoryPanel';
import { editImageWithGemini, getPromptSuggestion } from './services/geminiService';
import * as historyService from './services/historyService';
import { fileToDataURL, dataURLtoFile } from './utils';
import type { GenerateImageRequest, TokenUsage, HistoryItem, Preset, AspectRatio, ModelId, Resolution } from './types';
import { useTranslations } from './contexts/LanguageContext';
import type { Translation } from './translations';


const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 text-lg font-semibold transition-colors focus:outline-none ${
      isActive
        ? 'border-b-4 border-black text-black'
        : 'text-gray-500 hover:text-black'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {label}
  </button>
);


const App: React.FC = () => {
  const { language, setLanguage, t } = useTranslations();
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [lastTokenUsage, setLastTokenUsage] = useState<TokenUsage | null>(null);
  const [sessionTokenUsage, setSessionTokenUsage] = useState<TokenUsage>({ promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });
  const [isDrawingCanvasOpen, setIsDrawingCanvasOpen] = useState(false);
  const [skeletonCount, setSkeletonCount] = useState(1);
  const [user, setUser] = useState<object | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // State for Controls (lifted up)
  const [prompt, setPrompt] = useState('');
  const [creativity, setCreativity] = useState(0.5);
  const [selectedPresets, setSelectedPresets] = useState<Preset[]>([]);
  const [selectedPresetOptionIds, setSelectedPresetOptionIds] = useState<string[]>([]);
  const [numberOfOutputs, setNumberOfOutputs] = useState(1);
  const [model, setModel] = useState<ModelId>('nanobanana');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resolution, setResolution] = useState<Resolution>('1k');

  // State for History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'history'>('results');
  
  const isCancelledRef = useRef(false);

  const mainImage = images[0] || null;
  const referenceImages = images.slice(1);

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

  const handleLogin = () => {
    // This is a placeholder for a real Google Sign-In flow
    setUser({ name: 'Test User' });
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const handleGenerate = useCallback(async () => {
    const request: GenerateImageRequest = {
        prompt,
        creativity,
        selectedPresets,
        numberOfOutputs,
        selectedPresetOptionIds,
        model,
        aspectRatio,
        resolution,
    };

    if (!user) {
      setError(t.errorLogin);
      return;
    }
    if (!mainImage) {
      setError(t.errorMainImage);
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
      const result = await editImageWithGemini({ ...request, mainImage, referenceImages });
      
      if (isCancelledRef.current) {
        console.log("Generation was cancelled. Ignoring results.");
        return;
      }

      setGeneratedImages(result.images);
      setLastTokenUsage(result.usage);
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

    } catch (err) {
      if (!isCancelledRef.current) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'errorUnknown';
        setError(t[errorMessage as keyof Translation] || t.errorUnknown);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, mainImage, referenceImages, prompt, creativity, selectedPresets, numberOfOutputs, selectedPresetOptionIds, model, aspectRatio, resolution, loadHistory, t]);

  const handleSuggestion = useCallback(async (currentPrompt: string): Promise<string> => {
    if (!user) {
      setError(t.errorLogin);
      return currentPrompt;
    }
    setIsLoading(true);
    setError(null);
    try {
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
  }, [mainImage, referenceImages, user, t, language]);
  
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
  
  const handleUpscale = useCallback(async (imageUrl: string) => {
      // Placeholder for Fal.ai or other upscaling service integration
      // This would typically involve a backend call
      alert(`${t.upscaleWip} (Target: ${resolution.toUpperCase()})`);
      console.log(`Upscaling image: ${imageUrl} to ${resolution} with aspect ratio: ${aspectRatio}`);
  }, [aspectRatio, resolution, t.upscaleWip]);

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


  const disabledReason = !user ? t.disabledReasonLogin : images.length === 0 ? t.disabledReasonImage : null;

  return (
    <div className="min-h-screen bg-[#FDF6E3] text-[#212121] flex flex-col">
      <header className="bg-[#FDF6E3] border-b-2 border-black sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <LogoIcon />
              <h1 className="font-press-start text-lg md:text-xl text-black flex items-center gap-1">
                <span>PIXEL-EDITOR</span>
                <span className="ml-2 text-xs bg-black text-[#90EE90] px-2 py-0.5">{t.dev}</span>
              </h1>
            </div>
            <div className="flex items-center space-x-1">
               <button
                  onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                  className="py-1 px-3 text-sm font-semibold border-2 border-black bg-transparent hover:bg-gray-200 transition-colors whitespace-nowrap"
                  aria-label={t.languageToggle}
                >
                  {language === 'ko' ? 'English' : '한국어'}
                </button>
               <button
                onClick={() => setIsHelpModalOpen(true)}
                className="flex items-center justify-center h-10 w-10 text-black hover:bg-gray-200 transition-colors"
                aria-label={t.help}
              >
                <QuestionMarkCircleIcon className="w-6 h-6" />
              </button>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="relative flex items-center justify-center h-10 w-10 text-black hover:bg-gray-200 transition-colors"
                  aria-label={t.logout}
                >
                  <span className="text-xl" role="img" aria-hidden="true">🔑</span>
                  <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#FDF6E3] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="relative flex items-center justify-center h-10 w-10 text-black hover:bg-gray-200 transition-colors"
                  aria-label={t.login}
                >
                  <span className="text-xl" role="img" aria-hidden="true">🔑</span>
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#FDF6E3]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="p-6 border-2 border-black shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-black">{t.uploadTitle}</h2>
                 <button onClick={() => setIsDrawingCanvasOpen(true)} className="flex items-center gap-1.5 text-base text-[#2E7D73] hover:underline transition-colors" aria-label={t.openCanvas}>
                    <span role="img" aria-label="Pencil" className="text-lg">✏️</span>
                    <span>{t.draw}</span>
                </button>
              </div>
              <ImageUploader
                files={images}
                onFilesChange={setImages}
                multiple={true}
                label={t.uploaderLabel}
              />
              <p className="text-sm text-gray-700 mt-3">{t.uploaderDescription}</p>
            </div>
            <div className="p-6 border-2 border-black shadow-[4px_4px_0_0_#000] sticky top-20">
               <h2 className="text-xl font-semibold text-black mb-4">{t.editTitle}</h2>
              <Controls 
                onGenerate={handleGenerate} 
                onSuggest={handleSuggestion} 
                isLoading={isLoading}
                disabledReason={disabledReason}
                prompt={prompt}
                setPrompt={setPrompt}
                creativity={creativity}
                setCreativity={setCreativity}
                selectedPresets={selectedPresets}
                setSelectedPresets={setSelectedPresets}
                numberOfOutputs={numberOfOutputs}
                setNumberOfOutputs={setNumberOfOutputs}
                selectedPresetOptionIds={selectedPresetOptionIds}
                setSelectedPresetOptionIds={setSelectedPresetOptionIds}
                model={model}
                setModel={setModel}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                resolution={resolution}
                setResolution={setResolution}
              />
            </div>
          </div>

          <div className="lg:w-2/3">
            <div className="p-6 border-2 border-black shadow-[4px_4px_0_0_#000] min-h-[600px] sticky top-20 flex flex-col">
               <div className="flex border-b-2 border-black mb-4">
                <TabButton
                  label={t.resultsTab}
                  isActive={activeTab === 'results'}
                  onClick={() => setActiveTab('results')}
                />
                <TabButton
                  label={`${t.historyTab} (${history.length})`}
                  isActive={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                />
              </div>
              <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                 {activeTab === 'results' ? (
                    <OutputViewer
                      isLoading={isLoading}
                      images={generatedImages}
                      error={error}
                      tokenUsage={lastTokenUsage}
                      sessionTokenUsage={sessionTokenUsage}
                      onResetSessionUsage={handleResetSessionUsage}
                      onUpscale={handleUpscale}
                      skeletonCount={skeletonCount}
                    />
                  ) : (
                    <HistoryPanel
                      history={history}
                      onLoad={handleLoadHistory}
                      onDelete={handleDeleteHistory}
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <DrawingCanvas 
        isOpen={isDrawingCanvasOpen}
        onClose={() => setIsDrawingCanvasOpen(false)}
        onSave={handleSaveDrawing}
      />
      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default App;
