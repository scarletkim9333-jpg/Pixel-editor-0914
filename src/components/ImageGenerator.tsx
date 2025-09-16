import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTokens } from '../lib/tokenApi'
import TokenBalance from './TokenBalance'

const ImageGenerator: React.FC = () => {
  const { user } = useAuth()
  const { balance, useTokens, loading: tokenLoading } = useTokens()

  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TOKEN_COST_PER_IMAGE = 10 // 이미지 1개당 10토큰

  const generateImage = async () => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요.')
      return
    }

    // 토큰 잔액 확인
    if (balance === null || balance < TOKEN_COST_PER_IMAGE) {
      setError(`토큰이 부족합니다. 이미지 생성에는 ${TOKEN_COST_PER_IMAGE}토큰이 필요합니다.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. 먼저 토큰 차감
      await useTokens(TOKEN_COST_PER_IMAGE, `이미지 생성: ${prompt.substring(0, 50)}...`)

      // 2. 이미지 생성 API 호출
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        // 이미지 생성 실패 시 토큰 환불 로직을 여기에 추가할 수 있습니다
        throw new Error('이미지 생성에 실패했습니다.')
      }

      const data = await response.json()
      setGeneratedImage(data.imageUrl)

    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">AI 이미지 생성기</h2>
          <p className="text-gray-600">로그인이 필요합니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">AI 이미지 생성기</h2>

        {/* 토큰 잔액 표시 */}
        <TokenBalance showUsage={true} className="mb-4" />

        {/* 비용 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-blue-800 text-sm">
              이미지 1개 생성 시 <strong>{TOKEN_COST_PER_IMAGE}토큰</strong>이 소모됩니다.
            </span>
          </div>
        </div>
      </div>

      {/* 프롬프트 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이미지 설명 (프롬프트)
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="생성하고 싶은 이미지를 자세히 설명해주세요..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          disabled={loading || tokenLoading}
        />
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={generateImage}
        disabled={
          loading ||
          tokenLoading ||
          !prompt.trim() ||
          (balance !== null && balance < TOKEN_COST_PER_IMAGE)
        }
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          loading || tokenLoading || !prompt.trim() || (balance !== null && balance < TOKEN_COST_PER_IMAGE)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>이미지 생성 중...</span>
          </div>
        ) : (
          `이미지 생성 (${TOKEN_COST_PER_IMAGE}토큰 사용)`
        )}
      </button>

      {/* 토큰 부족 경고 */}
      {balance !== null && balance < TOKEN_COST_PER_IMAGE && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-800 text-sm">
              토큰이 부족합니다. 이미지 생성을 위해서는 최소 {TOKEN_COST_PER_IMAGE}토큰이 필요합니다.
            </span>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* 생성된 이미지 */}
      {generatedImage && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">생성된 이미지</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-auto"
            />
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p><strong>프롬프트:</strong> {prompt}</p>
            <p><strong>토큰 사용:</strong> {TOKEN_COST_PER_IMAGE}토큰</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGenerator