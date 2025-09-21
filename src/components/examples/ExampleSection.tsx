import React from 'react';
import { SparklesIcon, PencilIcon } from '@heroicons/react/24/outline';
import { EXAMPLES, getExamplesByMode, getExampleTitle, getExampleDescription, type ExampleConfig } from '../../config/examples.config';
import { useTranslations } from '../../../contexts/LanguageContext';
import { LazyImage } from '../gallery/LazyImage';

interface ExampleSectionProps {
  onExampleClick: (example: ExampleConfig) => void;
}

const ExampleCard: React.FC<{
  example: ExampleConfig;
  language: 'ko' | 'en';
  onClick: () => void;
}> = ({ example, language, onClick }) => {
  const title = getExampleTitle(example, language);
  const description = getExampleDescription(example, language);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="pixel-border bg-white rounded-lg overflow-hidden hover:shadow-[4px_4px_0_0_#f472b6] transition-all duration-200">
        {/* 이미지 영역 */}
        <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
          {example.images.thumbnail ? (
            <LazyImage
              src={example.images.thumbnail}
              alt={title}
              width={300}
              height={200}
              className="w-full h-full"
              objectFit="cover"
              fallbackSrc={undefined}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Preview</span>
            </div>
          )}

          {/* 모드 뱃지 */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-bold rounded border-2 border-black ${
              example.mode === 'create'
                ? 'bg-green-200 text-green-800'
                : 'bg-blue-200 text-blue-800'
            }`}>
              {example.mode === 'create' ? 'CREATE' : 'EDIT'}
            </span>
          </div>

          {/* 프리셋 뱃지 (Edit 모드에서 프리셋이 있을 때) */}
          {example.mode === 'edit' && example.preset && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 text-xs font-bold rounded border-2 border-black bg-purple-200 text-purple-800">
                PRESET
              </span>
            </div>
          )}

          {/* 호버 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white rounded-full p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
                {example.mode === 'create' ? (
                  <SparklesIcon className="w-6 h-6 text-black" />
                ) : (
                  <PencilIcon className="w-6 h-6 text-black" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-4">
          <h3 className="font-bold text-sm mb-2 text-black">{title}</h3>
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{description}</p>

          {/* 설정 정보 */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">모델:</span>
              <span className="font-semibold">{example.settings.model.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">비율:</span>
              <span className="font-semibold">{example.settings.aspectRatio}</span>
            </div>
            {example.preset && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">프리셋:</span>
                <span className="font-semibold text-purple-600">
                  {example.preset.id === 'angle_changer' ? '멀티앵글' : '피규어화'}
                </span>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="mt-4">
            <button className="w-full py-2 px-3 bg-pink-100 hover:bg-pink-200 border-2 border-black text-black text-xs font-bold transition-colors">
              이 예시로 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExampleSection: React.FC<ExampleSectionProps> = ({ onExampleClick }) => {
  const { language } = useTranslations();

  const createExamples = getExamplesByMode('create');
  const editExamples = getExamplesByMode('edit');

  return (
    <section className="py-12 bg-gradient-to-r from-pink-50 to-purple-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4 flex items-center justify-center space-x-3">
            <SparklesIcon className="w-8 h-8 text-pink-500" />
            <span>예시로 시작하기</span>
            <SparklesIcon className="w-8 h-8 text-pink-500" />
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            다양한 스타일과 기법을 미리 체험해보세요. 클릭 한 번으로 설정이 자동으로 적용됩니다.
          </p>
        </div>

        {/* Create 모드 예시 */}
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-6 h-6 text-green-600" />
              <h3 className="text-2xl font-bold text-black">CREATE 모드</h3>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-green-300 to-transparent rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createExamples.map((example) => (
              <ExampleCard
                key={example.id}
                example={example}
                language={language}
                onClick={() => onExampleClick(example)}
              />
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            새로운 이미지를 처음부터 생성합니다. 프롬프트만으로 원하는 이미지를 만들어보세요.
          </p>
        </div>

        {/* Edit 모드 예시 */}
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex items-center space-x-2">
              <PencilIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-black">EDIT 모드</h3>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-blue-300 to-transparent rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editExamples.map((example) => (
              <ExampleCard
                key={example.id}
                example={example}
                language={language}
                onClick={() => onExampleClick(example)}
              />
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            기존 이미지를 편집하고 변환합니다. 멀티 앵글, 피규어화 등 다양한 프리셋을 활용해보세요.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExampleSection;