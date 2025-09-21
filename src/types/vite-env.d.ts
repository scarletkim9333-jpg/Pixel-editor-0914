/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TOSS_CLIENT_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_FAL_KEY: string
  readonly VITE_SUPABASE_ENABLED: string
  readonly VITE_TOSS_ENABLED: string
  readonly VITE_AI_ENABLED: string
  readonly VITE_DEBUG_LEVEL: string
  readonly VITE_DEBUG_PERFORMANCE: string
  readonly VITE_DEBUG_ANALYTICS: string
  readonly VITE_ENABLE_SW: string
  readonly VITE_ENABLE_CACHE: string
  readonly VITE_COMPRESSION_QUALITY: string
  readonly VITE_THUMBNAIL_SIZE: string
  readonly VITE_LAZY_LOADING: string
  readonly VITE_VIRTUAL_SCROLL_THRESHOLD: string
  readonly VITE_FEATURE_GALLERY: string
  readonly VITE_FEATURE_SHARING: string
  readonly VITE_FEATURE_COMPRESSION: string
  readonly VITE_FEATURE_ANALYTICS: string
  readonly VITE_FEATURE_MONITORING: string
  readonly VITE_FEATURE_ERROR_REPORTING: string
  readonly VITE_ENABLE_CSP: string
  readonly VITE_ENABLE_HSTS: string
  readonly VITE_SECURE_COOKIES: string
  readonly VITE_STORAGE_TIER: string
  readonly MODE: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}