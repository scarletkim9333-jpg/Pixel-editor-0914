/**
 * 저장소 서비스
 * 티어별 저장 시스템을 추상화하여 관리합니다.
 */

import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { compressionService } from './compressionService';
import { STORAGE_CONFIG, STORAGE_TIERS, StorageTier } from '../config/storage.config';

// ==================== 타입 정의 ====================

export interface StorageItem {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  model: string;
  settings: any;
  createdAt: Date;
  expiresAt?: Date;
  size: number;
  userId?: string;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface StorageUsage {
  used: number;      // 사용된 용량 (bytes)
  limit: number;     // 제한 용량 (bytes)
  count: number;     // 저장된 아이템 수
  maxCount: number;  // 최대 아이템 수
}

export interface StorageAdapter {
  save(item: Omit<StorageItem, 'id' | 'createdAt'>): Promise<string>;
  load(id: string): Promise<StorageItem | null>;
  delete(id: string): Promise<void>;
  list(options?: ListOptions): Promise<StorageItem[]>;
  getUsage(): Promise<StorageUsage>;
  clear?(): Promise<void>;
}

// ==================== LocalStorage 어댑터 ====================

class LocalStorageAdapter implements StorageAdapter {
  private readonly STORAGE_KEY = 'pixel-editor-gallery';
  private readonly MAX_ITEMS = STORAGE_TIERS.temporary.limit;
  private readonly MAX_SIZE = STORAGE_TIERS.temporary.maxFileSize;
  private readonly RETENTION_HOURS = 24;

  constructor() {
    this.cleanupExpiredItems();
  }

  async save(item: Omit<StorageItem, 'id' | 'createdAt'>): Promise<string> {
    const items = this.getAllItems();

    // 용량 체크
    if (items.length >= this.MAX_ITEMS) {
      throw new Error(`최대 ${this.MAX_ITEMS}개까지 저장 가능합니다.`);
    }

    // 파일 크기 체크
    if (item.size > this.MAX_SIZE) {
      throw new Error(`파일 크기가 너무 큽니다. (최대 ${this.MAX_SIZE / 1024 / 1024}MB)`);
    }

    const newItem: StorageItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.RETENTION_HOURS * 60 * 60 * 1000)
    };

    items.push(newItem);
    this.saveToStorage(items);

    if (STORAGE_CONFIG.debug) {
      console.log('LocalStorage: 아이템 저장됨', newItem.id);
    }

    return newItem.id;
  }

  async load(id: string): Promise<StorageItem | null> {
    const items = this.getAllItems();
    const item = items.find(i => i.id === id);

    if (!item) return null;

    // 만료 체크
    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
      await this.delete(id);
      return null;
    }

    return item;
  }

  async delete(id: string): Promise<void> {
    const items = this.getAllItems();
    const filteredItems = items.filter(i => i.id !== id);
    this.saveToStorage(filteredItems);

    if (STORAGE_CONFIG.debug) {
      console.log('LocalStorage: 아이템 삭제됨', id);
    }
  }

  async list(options: ListOptions = {}): Promise<StorageItem[]> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = options;

    let items = this.getAllItems();

    // 만료된 아이템 필터링
    const now = new Date();
    items = items.filter(item => {
      if (item.expiresAt && new Date(item.expiresAt) < now) {
        return false;
      }
      return true;
    });

    // 검색
    if (search) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.prompt.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 정렬
    items.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'createdAt':
        default:
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    // 페이지네이션
    return items.slice(offset, offset + limit);
  }

  async getUsage(): Promise<StorageUsage> {
    const items = this.getAllItems();
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return {
      used: totalSize,
      limit: this.MAX_SIZE * this.MAX_ITEMS, // 전체 용량 제한
      count: items.length,
      maxCount: this.MAX_ITEMS
    };
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    if (STORAGE_CONFIG.debug) {
      console.log('LocalStorage: 모든 아이템 삭제됨');
    }
  }

  // Private methods

  private getAllItems(): StorageItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const items = JSON.parse(data);
      // Date 객체로 변환
      return items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
      }));
    } catch (error) {
      console.error('LocalStorage 읽기 실패:', error);
      return [];
    }
  }

  private saveToStorage(items: StorageItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw new Error('브라우저 저장 공간이 부족합니다.');
      }
      throw error;
    }
  }

  private generateId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupExpiredItems(): void {
    const items = this.getAllItems();
    const now = new Date();
    const validItems = items.filter(item => {
      if (!item.expiresAt) return true;
      return new Date(item.expiresAt) > now;
    });

    if (items.length !== validItems.length) {
      this.saveToStorage(validItems);
      if (STORAGE_CONFIG.debug) {
        console.log(`LocalStorage: ${items.length - validItems.length}개 만료 아이템 정리됨`);
      }
    }
  }
}

// ==================== Supabase Storage 어댑터 ====================

class SupabaseStorageAdapter implements StorageAdapter {
  private readonly BUCKET_NAME = 'user-gallery';
  private readonly MAX_ITEMS = STORAGE_TIERS.registered.limit;
  private readonly MAX_SIZE = STORAGE_TIERS.registered.maxFileSize;
  private readonly RETENTION_DAYS = 30;

  async save(item: Omit<StorageItem, 'id' | 'createdAt'>): Promise<string> {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase가 구성되지 않았습니다.');
    }

    // 사용자 인증 체크
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 용량 체크
    const usage = await this.getUsage();
    if (usage.count >= this.MAX_ITEMS) {
      throw new Error(`최대 ${this.MAX_ITEMS}개까지 저장 가능합니다.`);
    }

    if (item.size > this.MAX_SIZE) {
      throw new Error(`파일 크기가 너무 큽니다. (최대 ${this.MAX_SIZE / 1024 / 1024}MB)`);
    }

    const id = this.generateId();
    const filePath = `${user.id}/${id}.jpg`;
    const thumbnailPath = `${user.id}/thumbnails/${id}.jpg`;

    try {
      // 이미지 업로드
      const imageBlob = await this.dataUrlToBlob(item.imageUrl);
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, imageBlob);

      if (uploadError) throw uploadError;

      // 썸네일 업로드 (있는 경우)
      if (item.thumbnailUrl) {
        const thumbBlob = await this.dataUrlToBlob(item.thumbnailUrl);
        await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(thumbnailPath, thumbBlob);
      }

      // 메타데이터 저장
      const { error: dbError } = await supabase
        .from('gallery_items')
        .insert({
          id,
          user_id: user.id,
          name: item.name,
          prompt: item.prompt,
          model: item.model,
          settings: item.settings,
          file_path: filePath,
          thumbnail_path: item.thumbnailUrl ? thumbnailPath : null,
          size: item.size,
          expires_at: new Date(Date.now() + this.RETENTION_DAYS * 24 * 60 * 60 * 1000)
        });

      if (dbError) throw dbError;

      if (STORAGE_CONFIG.debug) {
        console.log('Supabase: 아이템 저장됨', id);
      }

      return id;

    } catch (error) {
      console.error('Supabase 저장 실패:', error);
      // 실패 시 업로드된 파일 정리
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath, thumbnailPath]);
      throw new Error('이미지 저장에 실패했습니다.');
    }
  }

  async load(id: string): Promise<StorageItem | null> {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase가 구성되지 않았습니다.');
    }

    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // 만료 체크
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await this.delete(id);
      return null;
    }

    // Storage URL 생성
    const { data: imageUrlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(data.file_path);

    const { data: thumbUrlData } = data.thumbnail_path
      ? supabase.storage.from(this.BUCKET_NAME).getPublicUrl(data.thumbnail_path)
      : { data: null };

    return {
      id: data.id,
      name: data.name,
      imageUrl: imageUrlData.publicUrl,
      thumbnailUrl: thumbUrlData?.publicUrl,
      prompt: data.prompt,
      model: data.model,
      settings: data.settings,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      size: data.size,
      userId: data.user_id
    };
  }

  async delete(id: string): Promise<void> {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase가 구성되지 않았습니다.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 메타데이터 가져오기
    const { data } = await supabase
      .from('gallery_items')
      .select('file_path, thumbnail_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (data) {
      // Storage에서 파일 삭제
      const filesToRemove = [data.file_path];
      if (data.thumbnail_path) {
        filesToRemove.push(data.thumbnail_path);
      }

      await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filesToRemove);

      // DB에서 삭제
      await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (STORAGE_CONFIG.debug) {
        console.log('Supabase: 아이템 삭제됨', id);
      }
    }
  }

  async list(options: ListOptions = {}): Promise<StorageItem[]> {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase가 구성되지 않았습니다.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const {
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = options;

    let query = supabase
      .from('gallery_items')
      .select('*')
      .eq('user_id', user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // 검색
    if (search) {
      query = query.or(`name.ilike.%${search}%,prompt.ilike.%${search}%`);
    }

    // 정렬
    const orderColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase 목록 조회 실패:', error);
      return [];
    }

    // StorageItem 형태로 변환
    const items = await Promise.all(data.map(async (item) => {
      const { data: imageUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(item.file_path);

      const { data: thumbUrlData } = item.thumbnail_path
        ? supabase.storage.from(this.BUCKET_NAME).getPublicUrl(item.thumbnail_path)
        : { data: null };

      return {
        id: item.id,
        name: item.name,
        imageUrl: imageUrlData.publicUrl,
        thumbnailUrl: thumbUrlData?.publicUrl,
        prompt: item.prompt,
        model: item.model,
        settings: item.settings,
        createdAt: new Date(item.created_at),
        expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
        size: item.size,
        userId: item.user_id
      };
    }));

    return items;
  }

  async getUsage(): Promise<StorageUsage> {
    if (!hasSupabaseConfig()) {
      return {
        used: 0,
        limit: this.MAX_SIZE * this.MAX_ITEMS,
        count: 0,
        maxCount: this.MAX_ITEMS
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        used: 0,
        limit: this.MAX_SIZE * this.MAX_ITEMS,
        count: 0,
        maxCount: this.MAX_ITEMS
      };
    }

    const { data, error } = await supabase
      .from('gallery_items')
      .select('size')
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase 사용량 조회 실패:', error);
      return {
        used: 0,
        limit: this.MAX_SIZE * this.MAX_ITEMS,
        count: 0,
        maxCount: this.MAX_ITEMS
      };
    }

    const totalSize = data.reduce((sum, item) => sum + (item.size || 0), 0);

    return {
      used: totalSize,
      limit: this.MAX_SIZE * this.MAX_ITEMS,
      count: data.length,
      maxCount: this.MAX_ITEMS
    };
  }

  // Private methods

  private generateId(): string {
    return `supabase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }
}

// ==================== Cloud Storage 어댑터 (향후 구현) ====================

class CloudStorageAdapter implements StorageAdapter {
  async save(item: Omit<StorageItem, 'id' | 'createdAt'>): Promise<string> {
    throw new Error('CloudStorage는 아직 구현되지 않았습니다.');
  }

  async load(id: string): Promise<StorageItem | null> {
    throw new Error('CloudStorage는 아직 구현되지 않았습니다.');
  }

  async delete(id: string): Promise<void> {
    throw new Error('CloudStorage는 아직 구현되지 않았습니다.');
  }

  async list(options?: ListOptions): Promise<StorageItem[]> {
    throw new Error('CloudStorage는 아직 구현되지 않았습니다.');
  }

  async getUsage(): Promise<StorageUsage> {
    return {
      used: 0,
      limit: STORAGE_TIERS.premium.maxFileSize * STORAGE_TIERS.premium.limit,
      count: 0,
      maxCount: STORAGE_TIERS.premium.limit
    };
  }
}

// ==================== Storage Manager ====================

export class StorageManager {
  private adapter: StorageAdapter;
  private currentTier: keyof typeof STORAGE_TIERS;

  constructor(tier?: keyof typeof STORAGE_TIERS) {
    this.currentTier = tier || STORAGE_CONFIG.defaultTier;
    this.adapter = this.createAdapter(this.currentTier);
  }

  private createAdapter(tier: keyof typeof STORAGE_TIERS): StorageAdapter {
    const tierConfig = STORAGE_TIERS[tier];

    switch (tierConfig.storage) {
      case 'localStorage':
        return new LocalStorageAdapter();
      case 'supabase':
        return new SupabaseStorageAdapter();
      case 'cloudStorage':
        return new CloudStorageAdapter();
      default:
        return new LocalStorageAdapter();
    }
  }

  // 티어 변경
  async switchTier(newTier: keyof typeof STORAGE_TIERS): Promise<void> {
    if (this.currentTier === newTier) return;

    // 마이그레이션이 필요한 경우 처리
    if (this.shouldMigrate(this.currentTier, newTier)) {
      await this.migrateData(this.currentTier, newTier);
    }

    this.currentTier = newTier;
    this.adapter = this.createAdapter(newTier);

    if (STORAGE_CONFIG.debug) {
      console.log(`Storage tier switched: ${this.currentTier} → ${newTier}`);
    }
  }

  // 현재 티어 정보
  getCurrentTier(): StorageTier {
    return STORAGE_TIERS[this.currentTier];
  }

  // Adapter 메서드들을 프록시
  async save(item: Omit<StorageItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      // 이미지 압축 (필요한 경우)
      if (item.size > this.getCurrentTier().maxFileSize) {
        const compressedResult = await compressionService.optimizeFileSize(
          await this.dataUrlToFile(item.imageUrl, item.name),
          this.getCurrentTier().maxFileSize / 1024 // KB 단위로 변환
        );

        item.imageUrl = await this.fileToDataUrl(compressedResult.file);
        item.size = compressedResult.compressedSize;
      }

      // 썸네일 생성 (없는 경우)
      if (!item.thumbnailUrl && item.imageUrl) {
        const file = await this.dataUrlToFile(item.imageUrl, item.name);
        const thumbnail = await compressionService.generateThumbnail(file);
        item.thumbnailUrl = await this.fileToDataUrl(thumbnail.file);
      }

      return await this.adapter.save(item);
    } catch (error) {
      console.error('저장 실패:', error);
      throw error;
    }
  }

  async load(id: string): Promise<StorageItem | null> {
    return this.adapter.load(id);
  }

  async delete(id: string): Promise<void> {
    return this.adapter.delete(id);
  }

  async list(options?: ListOptions): Promise<StorageItem[]> {
    return this.adapter.list(options);
  }

  async getUsage(): Promise<StorageUsage> {
    return this.adapter.getUsage();
  }

  async clear(): Promise<void> {
    if (this.adapter.clear) {
      return this.adapter.clear();
    }
  }

  // Private helper methods

  private shouldMigrate(from: string, to: string): boolean {
    // localStorage → Supabase 마이그레이션 지원
    return from === 'temporary' && to === 'registered';
  }

  private async migrateData(from: string, to: string): Promise<void> {
    if (from === 'temporary' && to === 'registered') {
      console.log('LocalStorage → Supabase 마이그레이션 시작...');

      const oldAdapter = new LocalStorageAdapter();
      const newAdapter = new SupabaseStorageAdapter();

      try {
        const items = await oldAdapter.list({ limit: 100 });
        let migrated = 0;

        for (const item of items) {
          try {
            // id와 createdAt 제외하고 전달
            const { id, createdAt, ...itemData } = item;
            await newAdapter.save(itemData);
            await oldAdapter.delete(id);
            migrated++;
          } catch (error) {
            console.error(`아이템 ${item.id} 마이그레이션 실패:`, error);
          }
        }

        console.log(`${migrated}개 아이템 마이그레이션 완료`);
      } catch (error) {
        console.error('마이그레이션 실패:', error);
      }
    }
  }

  private async dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 디버깅용
  exposeToWindow(): void {
    if (STORAGE_CONFIG.debug && typeof window !== 'undefined') {
      (window as any).storageManager = this;
      console.log('storageManager가 window.storageManager로 노출되었습니다');
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const storageService = new StorageManager();

// 디버깅 모드에서 window에 노출
storageService.exposeToWindow();

export default storageService;