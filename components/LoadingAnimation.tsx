import React, { useState, useEffect } from 'react';

interface LoadingAnimationProps {
  model: string;
  progress?: number;
}

const MODEL_TIMES = {
  nanobanana: 15,
  'nanobanana-upscale': 8,
  seedream: 30,
  'topaz-upscale': 20,
} as const;

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  model,
  progress
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  const estimatedTime = MODEL_TIMES[model as keyof typeof MODEL_TIMES] || 20;
  const currentProgress = progress ?? (elapsedTime / estimatedTime) * 100;
  const actualProgress = Math.min(currentProgress, 95); // 95%까지만 표시

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center p-8">
      {/* 프로그레스 바 */}
      <div className="mb-6">
        <div className="w-full max-w-md mx-auto">
          {/* 외부 컨테이너 */}
          <div className="h-8 bg-gray-200 border-2 border-black relative overflow-hidden">
            {/* 진행 바 */}
            <div
              className="h-full bg-[#2E7D73] transition-all duration-1000 ease-out flex items-center justify-center"
              style={{ width: `${actualProgress}%` }}
            >
              {actualProgress > 10 && (
                <span className="text-white font-bold text-sm font-neodgm">
                  {Math.round(actualProgress)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className="mb-4">
        <div className="text-2xl font-bold font-neodgm text-black mb-2">
          {Math.round(actualProgress)}%
        </div>
        <div className="text-sm text-gray-600">
          AI가 열심히 작업 중입니다...
        </div>
      </div>

      {/* 시간 정보 */}
      <div className="bg-gray-100 border-2 border-black p-3 rounded-none font-neodgm">
        <div className="flex justify-between text-sm">
          <span>경과 시간:</span>
          <span className="font-bold">{formatTime(elapsedTime)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>예상 시간:</span>
          <span className="font-bold">{formatTime(estimatedTime)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>모델:</span>
          <span className="font-bold">{model.toUpperCase()}</span>
        </div>
      </div>

      {/* 팁 메시지 */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="bg-blue-50 border border-blue-200 p-2 rounded">
          💡 <strong>팁:</strong> 복잡한 프롬프트일수록 처리 시간이 길어집니다
        </div>
      </div>

    </div>
  );
};