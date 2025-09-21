// Debug utilities for development mode
export interface DebugPanelApi {
  showImageStats: (image: string) => void;
  testCompression: (quality: number) => Promise<void>;
  clearGallery: () => void;
  loadMockData: () => void;
  logStorageInfo: () => void;
  simulateNetworkError: () => void;
  toggleDebugMode: () => void;
}

class DebugPanel {
  private debugMode: boolean;

  constructor() {
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  }

  showImageStats = (image: string) => {
    if (!this.debugMode) return;

    const img = new Image();
    img.onload = () => {
      console.group('🖼️ Image Stats');
      console.log('Dimensions:', `${img.width}x${img.height}`);
      console.log('Aspect Ratio:', (img.width / img.height).toFixed(2));
      console.log('Data URL Length:', image.length);
      console.log('Estimated Size:', `${(image.length * 0.75 / 1024 / 1024).toFixed(2)} MB`);
      console.groupEnd();
    };
    img.src = image;
  };

  testCompression = async (quality: number = 85) => {
    if (!this.debugMode) return;

    console.group('🗜️ Compression Test');
    console.log('Testing compression with quality:', quality);

    // Create test canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Draw test pattern
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(512, 0, 512, 512);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 512, 512, 512);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(512, 512, 512, 512);

    const originalDataUrl = canvas.toDataURL('image/png');
    const compressedDataUrl = canvas.toDataURL('image/webp', quality / 100);

    console.log('Original PNG size:', `${(originalDataUrl.length * 0.75 / 1024).toFixed(2)} KB`);
    console.log('Compressed WebP size:', `${(compressedDataUrl.length * 0.75 / 1024).toFixed(2)} KB`);
    console.log('Compression ratio:', `${((1 - compressedDataUrl.length / originalDataUrl.length) * 100).toFixed(1)}%`);
    console.groupEnd();
  };

  clearGallery = () => {
    if (!this.debugMode) return;

    console.warn('🗑️ Clearing gallery data...');
    localStorage.removeItem('pixelEditor_gallery');
    localStorage.removeItem('pixelEditor_galleryMeta');
    console.log('Gallery cleared');
  };

  loadMockData = () => {
    if (!this.debugMode) return;

    console.log('📋 Loading mock gallery data...');
    const mockData = {
      items: [
        {
          id: 'mock_1',
          title: 'Test Image 1',
          prompt: 'A beautiful landscape',
          model: 'nanobanana',
          createdAt: new Date().toISOString(),
          thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Nb2NrIDE8L3RleHQ+PC9zdmc+'
        },
        {
          id: 'mock_2',
          title: 'Test Image 2',
          prompt: 'A cute cat',
          model: 'seedream',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2JiYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Nb2NrIDI8L3RleHQ+PC9zdmc+'
        }
      ]
    };

    localStorage.setItem('pixelEditor_gallery', JSON.stringify(mockData));
    console.log('Mock data loaded:', mockData);
  };

  logStorageInfo = () => {
    if (!this.debugMode) return;

    console.group('💾 Storage Info');

    // Calculate localStorage usage
    let localStorageSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length;
      }
    }

    console.log('LocalStorage used:', `${(localStorageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('LocalStorage limit:', '~5-10 MB (browser dependent)');

    // List pixel editor keys
    const pixelKeys = Object.keys(localStorage).filter(key => key.startsWith('pixelEditor_'));
    console.log('Pixel Editor keys:', pixelKeys);

    pixelKeys.forEach(key => {
      const size = localStorage[key].length;
      console.log(`  ${key}: ${(size / 1024).toFixed(2)} KB`);
    });

    console.groupEnd();
  };

  simulateNetworkError = () => {
    if (!this.debugMode) return;

    console.warn('🌐 Simulating network error...');
    // This would be implemented in actual network calls
    // by checking for a debug flag and throwing an error
    window.dispatchEvent(new CustomEvent('debugNetworkError', {
      detail: { message: 'Simulated network error for testing' }
    }));
  };

  toggleDebugMode = () => {
    this.debugMode = !this.debugMode;
    console.log('🔧 Debug mode:', this.debugMode ? 'ON' : 'OFF');

    // Update localStorage for persistence
    localStorage.setItem('pixelEditor_debugMode', String(this.debugMode));
  };

  // Log helper with timestamp
  log = (message: string, data?: any) => {
    if (!this.debugMode) return;

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`, data || '');
  };

  // Performance measurement
  time = (label: string) => {
    if (!this.debugMode) return;
    console.time(`⏱️ ${label}`);
  };

  timeEnd = (label: string) => {
    if (!this.debugMode) return;
    console.timeEnd(`⏱️ ${label}`);
  };
}

// Create singleton instance
export const debugPanel = new DebugPanel();

// Expose to window in development mode
if (import.meta.env.DEV) {
  (window as any).pixelDebug = debugPanel;
}

// Debug event listener setup
export const setupDebugEvents = () => {
  if (!import.meta.env.DEV) return;

  // Listen for debug events
  window.addEventListener('debugNetworkError', ((e: CustomEvent) => {
    console.error('Network Error (Debug):', e.detail.message);
  }) as EventListener);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D: Toggle debug mode
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      debugPanel.toggleDebugMode();
    }

    // Ctrl+Shift+C: Clear gallery
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      debugPanel.clearGallery();
    }

    // Ctrl+Shift+M: Load mock data
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      debugPanel.loadMockData();
    }

    // Ctrl+Shift+S: Show storage info
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      debugPanel.logStorageInfo();
    }
  });

  console.log('🔧 Debug shortcuts enabled:');
  console.log('  Ctrl+Shift+D: Toggle debug mode');
  console.log('  Ctrl+Shift+C: Clear gallery');
  console.log('  Ctrl+Shift+M: Load mock data');
  console.log('  Ctrl+Shift+S: Show storage info');
};