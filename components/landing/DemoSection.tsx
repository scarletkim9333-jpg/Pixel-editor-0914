import React, { useState } from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { PlayIcon, ArrowRightIcon, StarIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface DemoImage {
  id: string;
  title: string;
  before: string;
  after: string;
  prompt: string;
  model: string;
  rating: number;
}

const DemoSection: React.FC = () => {
  const { language } = useTranslations();
  const [selectedDemo, setSelectedDemo] = useState<string>('demo1');

  const demoTexts = {
    ko: {
      title: '실제 생성 예시',
      subtitle: '사용자들이 만든 놀라운 AI 아트를 확인해보세요',
      beforeAfter: 'Before → After',
      prompt: '프롬프트',
      model: '모델',
      rating: '평점',
      tryNow: '지금 시도하기',
      viewMore: '더 많은 예시 보기'
    },
    en: {
      title: 'Real Generation Examples',
      subtitle: 'Check out amazing AI art created by our users',
      beforeAfter: 'Before → After',
      prompt: 'Prompt',
      model: 'Model',
      rating: 'Rating',
      tryNow: 'Try Now',
      viewMore: 'View More Examples'
    }
  };

  const texts = demoTexts[language];

  // Sample demo data - in real app, this would come from an API
  const demoImages: DemoImage[] = [
    {
      id: 'demo1',
      title: language === 'ko' ? '픽셀 아트 캐릭터' : 'Pixel Art Character',
      before: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9yaWdpbmFsPC90ZXh0Pjwvc3ZnPg==',
      after: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZiNmMxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFJIEdlbmVyYXRlZDwvdGV4dD48L3N2Zz4=',
      prompt: language === 'ko' ? 'cyberpunk 스타일의 8-bit 픽셀 캐릭터, 네온 컬러' : 'cyberpunk style 8-bit pixel character, neon colors',
      model: 'NanoBanana',
      rating: 4.9
    },
    {
      id: 'demo2',
      title: language === 'ko' ? '환상적인 풍경' : 'Fantasy Landscape',
      before: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9yaWdpbmFsPC90ZXh0Pjwvc3ZnPg==',
      after: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGY3YWZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjRLIEZhbnRhc3k8L3RleHQ+PC9zdmc+',
      prompt: language === 'ko' ? '마법의 숲, 4K 고해상도, 판타지 아트 스타일' : 'magical forest, 4K high resolution, fantasy art style',
      model: 'Seedream',
      rating: 4.8
    },
    {
      id: 'demo3',
      title: language === 'ko' ? '피규어화 컬렉션' : 'Figurine Collection',
      before: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9yaWdpbmFsPC90ZXh0Pjwvc3ZnPg==',
      after: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZkNDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZpZ3VyaW5lPC90ZXh0Pjwvc3ZnPg==',
      prompt: language === 'ko' ? '책상 위 피규어, 4가지 앵글, 컬렉션 스타일' : 'desk figurine, 4 angles, collection style',
      model: 'NanoBanana',
      rating: 4.7
    }
  ];

  const selectedDemoData = demoImages.find(demo => demo.id === selectedDemo) || demoImages[0];

  return (
    <section className="demo-section py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 font-neodgm flex items-center justify-center gap-4">
            <SparklesIcon className="w-10 h-10 md:w-12 md:h-12 text-purple-500" />
            <span>{texts.title}</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-neodgm">
            {texts.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo selector */}
          <div className="demo-selector">
            <div className="space-y-4">
              {demoImages.map((demo) => (
                <div
                  key={demo.id}
                  onClick={() => setSelectedDemo(demo.id)}
                  className={`demo-item p-4 border-3 cursor-pointer transition-all duration-300 ${
                    selectedDemo === demo.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-gray-300 bg-white hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg font-neodgm">{demo.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 font-neodgm">
                        {demo.model} • {texts.rating}: {demo.rating}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(demo.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <PlayIcon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo viewer */}
          <div className="demo-viewer">
            <div className="pixel-border bg-white p-6">
              {/* Before/After comparison */}
              <div className="before-after-container mb-6">
                <h3 className="text-xl font-bold mb-4 font-neodgm flex items-center">
                  {texts.beforeAfter}
                  <ArrowRightIcon className="w-5 h-5 mx-2 text-primary" />
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Before image */}
                  <div className="before-image">
                    <div className="aspect-square border-2 border-gray-300 overflow-hidden">
                      <img
                        src={selectedDemoData.before}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2 font-neodgm">Before</p>
                  </div>

                  {/* After image */}
                  <div className="after-image">
                    <div className="aspect-square border-2 border-primary overflow-hidden shadow-lg">
                      <img
                        src={selectedDemoData.after}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-center text-sm text-primary font-bold mt-2 font-neodgm">After</p>
                  </div>
                </div>
              </div>

              {/* Demo details */}
              <div className="demo-details space-y-3 mb-6">
                <div>
                  <span className="font-bold text-gray-700 font-neodgm">{texts.prompt}: </span>
                  <span className="text-gray-600 italic font-neodgm">"{selectedDemoData.prompt}"</span>
                </div>

                <div>
                  <span className="font-bold text-gray-700 font-neodgm">{texts.model}: </span>
                  <span className="inline-flex items-center px-2 py-1 bg-primary/20 text-primary font-bold text-sm font-neodgm">
                    {selectedDemoData.model}
                  </span>
                </div>
              </div>

              {/* Try now button */}
              <button className="pixel-button w-full flex items-center justify-center space-x-2">
                <PlayIcon className="w-5 h-5" />
                <span>{texts.tryNow}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="pixel-button-secondary px-8 py-3">
            {texts.viewMore}
          </button>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;