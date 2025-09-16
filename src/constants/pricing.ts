// 토큰 가격 정책 상수
export const TOKEN_PRICING = {
  // API 비용 (토큰 단위)
  API_COSTS: {
    NANOBANANA_EDIT: 2,
    NANOBANANA_UPSCALE: 1,
    SEEDREAM: 3.5,
    TOPAZ_UPSCALE: 5,
  },

  // 토큰 패키지
  PACKAGES: [
    {
      id: 'basic',
      name: '기본',
      tokens: 100,
      price: 1000,
      pricePerToken: 10,
      popular: false,
    },
    {
      id: 'popular',
      name: '인기',
      tokens: 550,
      price: 5000,
      pricePerToken: 9.1,
      popular: true,
      discount: 9,
    },
    {
      id: 'recommended',
      name: '추천',
      tokens: 1200,
      price: 10000,
      pricePerToken: 8.3,
      popular: false,
      discount: 17,
    },
    {
      id: 'premium',
      name: '프리미엄',
      tokens: 3000,
      price: 20000,
      pricePerToken: 6.7,
      popular: false,
      discount: 33,
    },
  ],

  // 무료 토큰 정책
  FREE_TOKENS: {
    SIGNUP_BONUS: 100,
    FIRST_PURCHASE_BONUS: 50, // 고려중
  },

  // 기타 설정
  TOKEN_USD_VALUE: 0.005, // 1토큰 = $0.005
  TOKEN_KRW_VALUE: 7, // 1토큰 = 약 7원
} as const;

export type TokenPackage = typeof TOKEN_PRICING.PACKAGES[number];