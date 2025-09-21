import React from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import {
  CpuChipIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  PaintBrushIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Feature {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: CpuChipIcon,
    titleKey: 'aiModels',
    descriptionKey: 'aiModelsDesc',
    gradient: 'from-pink-400 to-purple-500'
  },
  {
    icon: SparklesIcon,
    titleKey: 'multiAngle',
    descriptionKey: 'multiAngleDesc',
    gradient: 'from-blue-400 to-cyan-500'
  },
  {
    icon: CurrencyDollarIcon,
    titleKey: 'tokenSystem',
    descriptionKey: 'tokenSystemDesc',
    gradient: 'from-yellow-400 to-orange-500'
  },
  {
    icon: PhotoIcon,
    titleKey: 'highResolution',
    descriptionKey: 'highResolutionDesc',
    gradient: 'from-green-400 to-emerald-500'
  },
  {
    icon: PaintBrushIcon,
    titleKey: 'drawingCanvas',
    descriptionKey: 'drawingCanvasDesc',
    gradient: 'from-purple-400 to-pink-500'
  },
  {
    icon: ClockIcon,
    titleKey: 'historyManagement',
    descriptionKey: 'historyManagementDesc',
    gradient: 'from-indigo-400 to-blue-500'
  }
];

const FeaturesGrid: React.FC = () => {
  const { language } = useTranslations();

  const featureTexts = {
    ko: {
      title: '🚀 강력한 기능들',
      subtitle: 'AI 기반 이미지 생성의 모든 것',
      aiModels: 'AI 모델',
      aiModelsDesc: 'NanoBanana와 Seedream 모델로 다양한 스타일의 이미지 생성',
      multiAngle: '멀티 앵글',
      multiAngleDesc: '6가지 앵글과 피규어화 프리셋으로 다각도 이미지 생성',
      tokenSystem: '토큰 시스템',
      tokenSystemDesc: '투명한 비용으로 AI 생성을 경제적으로 관리',
      highResolution: '고해상도',
      highResolutionDesc: '1K부터 4K까지 다양한 해상도로 고품질 이미지 생성',
      drawingCanvas: '그리기 도구',
      drawingCanvasDesc: '내장된 캔버스로 직접 그리고 AI로 편집',
      historyManagement: '히스토리 관리',
      historyManagementDesc: '생성 기록 저장 및 불러오기로 작업 연속성 보장'
    },
    en: {
      title: '🚀 Powerful Features',
      subtitle: 'Everything you need for AI-powered image generation',
      aiModels: 'AI Models',
      aiModelsDesc: 'Generate diverse style images with NanoBanana and Seedream models',
      multiAngle: 'Multi-Angle',
      multiAngleDesc: 'Create multi-perspective images with 6 angles and figurine presets',
      tokenSystem: 'Token System',
      tokenSystemDesc: 'Manage AI generation economically with transparent pricing',
      highResolution: 'High Resolution',
      highResolutionDesc: 'Create high-quality images from 1K to 4K resolution',
      drawingCanvas: 'Drawing Tools',
      drawingCanvasDesc: 'Draw directly on built-in canvas and edit with AI',
      historyManagement: 'History Management',
      historyManagementDesc: 'Save and restore generation history for work continuity'
    }
  };

  const texts = featureTexts[language];

  return (
    <section id="features-section" className="features-section py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            {texts.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {texts.subtitle}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="feature-card pixel-border group hover:shadow-lg transition-all duration-300 p-6 bg-white hover:transform hover:scale-105"
              >
                {/* Icon with gradient background */}
                <div className={`icon-wrapper w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} p-4 mb-6 group-hover:rotate-6 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Feature title */}
                <h3 className="text-xl font-bold mb-3 text-gray-800 font-neodgm">
                  {texts[feature.titleKey as keyof typeof texts]}
                </h3>

                {/* Feature description */}
                <p className="text-gray-600 leading-relaxed font-neodgm">
                  {texts[feature.descriptionKey as keyof typeof texts]}
                </p>

                {/* Hover decoration */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-block pixel-border bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-none">
            <p className="text-lg font-bold text-gray-800 mb-2 font-neodgm">
              {language === 'ko' ? '🎁 신규 사용자 혜택' : '🎁 New User Bonus'}
            </p>
            <p className="text-gray-600 font-neodgm">
              {language === 'ko'
                ? '지금 가입하고 100토큰을 무료로 받아보세요!'
                : 'Sign up now and get 100 free tokens!'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;