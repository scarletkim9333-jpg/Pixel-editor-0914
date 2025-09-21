// Storage configuration for different user tiers
export interface StorageTier {
  name: string;
  storage: 'localStorage' | 'supabase' | 'cloudStorage';
  limit: number;           // Maximum number of items
  duration: string;        // Retention period
  features: string[];      // Available features
  maxFileSize: number;     // Maximum file size in bytes
}

export const STORAGE_TIERS: Record<string, StorageTier> = {
  temporary: {
    name: 'Temporary',
    storage: 'localStorage',
    limit: 10,
    duration: '24h',
    features: ['basic_save', 'local_access'],
    maxFileSize: 5 * 1024 * 1024 // 5MB
  },

  registered: {
    name: 'Registered User',
    storage: 'supabase',
    limit: 20,
    duration: '30d',
    features: ['cloud_save', 'cross_device', 'basic_share'],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },

  premium: {
    name: 'Premium',
    storage: 'cloudStorage',
    limit: 100,
    duration: 'permanent',
    features: ['unlimited_save', 'advanced_share', 'community_gallery', 'priority_support'],
    maxFileSize: 50 * 1024 * 1024 // 50MB
  }
};

// Environment-based configuration
export const STORAGE_CONFIG = {
  // Debug mode
  debug: import.meta.env.VITE_DEBUG_MODE === 'true',

  // Current tier (can be overridden by user auth status)
  defaultTier: (import.meta.env.VITE_STORAGE_TIER as keyof typeof STORAGE_TIERS) || 'temporary',

  // Compression settings
  compression: {
    quality: parseInt(import.meta.env.VITE_COMPRESSION_QUALITY || '85'),
    format: 'webp' as const,
    thumbnailSize: parseInt(import.meta.env.VITE_THUMBNAIL_SIZE || '200')
  },

  // Auto cleanup settings
  cleanup: {
    checkInterval: 60 * 60 * 1000, // 1 hour
    expiredItemsLimit: 100
  }
};

export type StorageTierKey = keyof typeof STORAGE_TIERS;