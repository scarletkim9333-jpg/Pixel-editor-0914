import React, { useState } from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface ExampleItem {
  id: string;
  beforeImage: string;
  afterImage: string;
  titleKey: string;
  descriptionKey: string;
  preset: string;
  model: string;
}

// Placeholder 이미지로 작동하도록 수정
const createPlaceholderImage = (text: string, color: string) =>
  `data:image/svg+xml;base64,${btoa(`<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">${text}</text></svg>`)}`;

const examples: ExampleItem[] = [
  {
    id: 'multiangle1',
    beforeImage: createPlaceholderImage('Original Portrait', '#6B7280'),
    afterImage: createPlaceholderImage('Multi-Angle Result', '#10B981'),
    titleKey: 'multiAnglePortrait',
    descriptionKey: 'multiAnglePortraitDesc',
    preset: 'Multi-Angle',
    model: 'NanoBanana'
  },
  {
    id: 'figurine1',
    beforeImage: createPlaceholderImage('Character Photo', '#6B7280'),
    afterImage: createPlaceholderImage('Figurine Style', '#8B5CF6'),
    titleKey: 'figurineCharacter',
    descriptionKey: 'figurineCharacterDesc',
    preset: 'Figurine',
    model: 'Seedream'
  },
  {
    id: 'landscape1',
    beforeImage: createPlaceholderImage('Simple Landscape', '#6B7280'),
    afterImage: createPlaceholderImage('Fantasy World', '#F59E0B'),
    titleKey: 'fantasyLandscape',
    descriptionKey: 'fantasyLandscapeDesc',
    preset: 'Create Mode',
    model: 'NanoBanana'
  },
  {
    id: 'character1',
    beforeImage: createPlaceholderImage('Concept Sketch', '#6B7280'),
    afterImage: createPlaceholderImage('Fantasy Character', '#EF4444'),
    titleKey: 'fantasyCharacter',
    descriptionKey: 'fantasyCharacterDesc',
    preset: 'Create Mode',
    model: 'Seedream'
  }
];

const ExampleShowcase: React.FC = () => {
  const { language } = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string>('');

  const exampleTexts = {
    ko: {
      title: '🎨 놀라운 변화를 확인하세요',
      subtitle: 'AI가 만들어낸 실제 결과물들',
      before: '변환 전',
      after: '변환 후',
      preset: '프리셋',
      model: '모델',
      viewLarge: '크게 보기',
      multiAnglePortrait: '멀티 앵글 포트레이트',
      multiAnglePortraitDesc: '한 장의 인물 사진을 6가지 각도로 변환',
      figurineCharacter: '피규어 캐릭터',
      figurineCharacterDesc: '캐릭터를 3D 피규어 스타일로 변환',
      fantasyLandscape: '판타지 풍경',
      fantasyLandscapeDesc: '평범한 풍경을 환상적인 세계로 변환',
      fantasyCharacter: '판타지 캐릭터',
      fantasyCharacterDesc: '새로운 판타지 캐릭터를 AI로 생성'
    },
    en: {
      title: '🎨 See Amazing Transformations',
      subtitle: 'Real results created by AI',
      before: 'Before',
      after: 'After',
      preset: 'Preset',
      model: 'Model',
      viewLarge: 'View Large',
      multiAnglePortrait: 'Multi-Angle Portrait',
      multiAnglePortraitDesc: 'Transform one portrait into 6 different angles',
      figurineCharacter: 'Figurine Character',
      figurineCharacterDesc: 'Convert character into 3D figurine style',
      fantasyLandscape: 'Fantasy Landscape',
      fantasyLandscapeDesc: 'Transform ordinary landscape into fantastic world',
      fantasyCharacter: 'Fantasy Character',
      fantasyCharacterDesc: 'Generate new fantasy character with AI'
    }
  };

  const texts = exampleTexts[language];
  const currentExample = examples[currentIndex];

  const nextExample = () => {
    setCurrentIndex((prev) => (prev + 1) % examples.length);
  };

  const prevExample = () => {
    setCurrentIndex((prev) => (prev - 1 + examples.length) % examples.length);
  };

  const openModal = (imageSrc: string) => {
    setModalImage(imageSrc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage('');
  };

  return (
    <section className="example-showcase py-20 px-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 font-neodgm">
            {texts.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-neodgm">
            {texts.subtitle}
          </p>
        </div>

        {/* Main showcase */}
        <div className="showcase-container pixel-border bg-white p-8 relative">
          {/* Navigation arrows */}
          <button
            onClick={prevExample}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 pixel-button-icon p-3 hover:scale-110 transition-transform"
            aria-label="Previous example"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={nextExample}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 pixel-button-icon p-3 hover:scale-110 transition-transform"
            aria-label="Next example"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          {/* Before/After comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before image */}
            <div className="image-container group">
              <div className="relative">
                <img
                  src={currentExample.beforeImage}
                  alt={`${texts.before} - ${texts[currentExample.titleKey as keyof typeof texts]}`}
                  className="w-full h-80 object-cover pixel-border cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onClick={() => openModal(currentExample.beforeImage)}
                  onError={(e) => {
                    // Fallback to placeholder
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJlZm9yZSBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="pixel-badge bg-red-500 text-white px-3 py-1 text-sm font-bold">
                    {texts.before}
                  </span>
                </div>
                <button
                  onClick={() => openModal(currentExample.beforeImage)}
                  className="absolute top-2 right-2 pixel-button-icon p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white"
                  aria-label={texts.viewLarge}
                >
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* After image */}
            <div className="image-container group">
              <div className="relative">
                <img
                  src={currentExample.afterImage}
                  alt={`${texts.after} - ${texts[currentExample.titleKey as keyof typeof texts]}`}
                  className="w-full h-80 object-cover pixel-border cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onClick={() => openModal(currentExample.afterImage)}
                  onError={(e) => {
                    // Fallback to placeholder
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFmdGVyIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="pixel-badge bg-green-500 text-white px-3 py-1 text-sm font-bold">
                    {texts.after}
                  </span>
                </div>
                <button
                  onClick={() => openModal(currentExample.afterImage)}
                  className="absolute top-2 right-2 pixel-button-icon p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white"
                  aria-label={texts.viewLarge}
                >
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Example info */}
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-bold mb-2 text-gray-800 font-neodgm">
              {texts[currentExample.titleKey as keyof typeof texts]}
            </h3>
            <p className="text-gray-600 mb-4 font-neodgm max-w-2xl mx-auto">
              {texts[currentExample.descriptionKey as keyof typeof texts]}
            </p>

            {/* Meta info */}
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">{texts.preset}:</span>
                <span className="pixel-badge bg-blue-100 text-blue-800 px-2 py-1">
                  {currentExample.preset}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">{texts.model}:</span>
                <span className="pixel-badge bg-purple-100 text-purple-800 px-2 py-1">
                  {currentExample.model}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail navigation */}
        <div className="flex justify-center mt-8 gap-4 overflow-x-auto pb-4 thumbnail-nav">
          {examples.map((example, index) => (
            <button
              key={example.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 pixel-border overflow-hidden transition-all duration-300 ${
                index === currentIndex
                  ? 'ring-4 ring-primary scale-110'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img
                src={example.afterImage}
                alt={`Example ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4ke2luZGV4ICsgMX08L3RleHQ+PC9zdmc+';
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Modal for enlarged view */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 modal-overlay"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full modal-content">
            <img
              src={modalImage}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain pixel-border"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 pixel-button-icon p-2 bg-black/50 text-white hover:bg-black/70"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExampleShowcase;