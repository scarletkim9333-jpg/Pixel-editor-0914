/**
 * 공유 서비스
 * 갤러리 이미지의 공유 기능을 관리합니다.
 * Session 6: 공유 기능 구현
 */

import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { galleryService } from './galleryService';
import type { GalleryItem } from './galleryService';

// ==================== 타입 정의 ====================

export interface SharedItem {
  id: string;
  itemId: string;
  userId: string;
  shareCode: string;
  title?: string;
  description?: string;
  isPublic: boolean;
  allowDownload: boolean;
  expiresAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareSettings {
  title?: string;
  description?: string;
  isPublic?: boolean;
  allowDownload?: boolean;
  expiresIn?: number; // 밀리초, null이면 무제한
}

export interface ShareStats {
  totalShares: number;
  totalViews: number;
  activeShares: number;
  expiredShares: number;
}

export interface SocialShareUrls {
  twitter: string;
  facebook: string;
  instagram: string;
  kakao: string;
  clipboard: string;
  embed: string;
}

// ==================== 공유 서비스 클래스 ====================

class ShareService {
  private readonly LOCAL_STORAGE_KEY = 'pixel_shared_items';
  private readonly SHARE_BASE_URL = window.location.origin + '/share/';

  /**
   * 공유 링크 생성
   */
  async createShareLink(
    itemId: string,
    settings: ShareSettings = {}
  ): Promise<{ shareCode: string; shareUrl: string } | null> {
    try {
      // 갤러리 아이템 존재 확인
      const galleryItem = await galleryService.loadImage(itemId);
      if (!galleryItem) {
        throw new Error('갤러리 아이템을 찾을 수 없습니다.');
      }

      const shareCode = this.generateShareCode();
      const shareUrl = this.SHARE_BASE_URL + shareCode;

      if (hasSupabaseConfig()) {
        // Supabase 사용
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('로그인이 필요합니다.');
        }

        const expiresAt = settings.expiresIn
          ? new Date(Date.now() + settings.expiresIn)
          : null;

        const { data, error } = await supabase
          .from('shared_items')
          .insert({
            item_id: itemId,
            user_id: user.user.id,
            share_code: shareCode,
            title: settings.title || galleryItem.name,
            description: settings.description || galleryItem.prompt,
            is_public: settings.isPublic ?? true,
            allow_download: settings.allowDownload ?? true,
            expires_at: expiresAt?.toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase 공유 생성 실패:', error);
          throw new Error('공유 링크 생성에 실패했습니다.');
        }

        console.log('공유 링크 생성 완료:', shareCode);
      } else {
        // 로컬 스토리지 사용 (개발 모드)
        const localShares = this.getLocalShares();
        const newShare: SharedItem = {
          id: crypto.randomUUID(),
          itemId,
          userId: 'local-user',
          shareCode,
          title: settings.title || galleryItem.name,
          description: settings.description || galleryItem.prompt,
          isPublic: settings.isPublic ?? true,
          allowDownload: settings.allowDownload ?? true,
          expiresAt: settings.expiresIn ? new Date(Date.now() + settings.expiresIn) : undefined,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        localShares.push(newShare);
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(localShares));
        console.log('로컬 공유 링크 생성 완료:', shareCode);
      }

      return { shareCode, shareUrl };
    } catch (error) {
      console.error('공유 링크 생성 실패:', error);
      return null;
    }
  }

  /**
   * 공유된 아이템 조회
   */
  async getSharedItem(shareCode: string): Promise<{ sharedItem: SharedItem; galleryItem: GalleryItem } | null> {
    try {
      if (hasSupabaseConfig()) {
        // Supabase 사용
        const { data: sharedItem, error } = await supabase
          .from('shared_items')
          .select('*')
          .eq('share_code', shareCode)
          .eq('is_public', true)
          .single();

        if (error || !sharedItem) {
          console.error('공유 아이템 조회 실패:', error);
          return null;
        }

        // 만료 확인
        if (sharedItem.expires_at && new Date(sharedItem.expires_at) < new Date()) {
          console.warn('만료된 공유 링크:', shareCode);
          return null;
        }

        // 조회수 증가
        await this.incrementViewCount(shareCode);

        // 갤러리 아이템 로드
        const galleryItem = await galleryService.loadImage(sharedItem.item_id);
        if (!galleryItem) {
          throw new Error('갤러리 아이템을 찾을 수 없습니다.');
        }

        return {
          sharedItem: this.convertDbToSharedItem(sharedItem),
          galleryItem
        };
      } else {
        // 로컬 스토리지 사용
        const localShares = this.getLocalShares();
        const sharedItem = localShares.find(item => item.shareCode === shareCode);

        if (!sharedItem || !sharedItem.isPublic) {
          return null;
        }

        // 만료 확인
        if (sharedItem.expiresAt && sharedItem.expiresAt < new Date()) {
          return null;
        }

        // 조회수 증가 (로컬)
        sharedItem.viewCount++;
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(localShares));

        // 갤러리 아이템 로드
        const galleryItem = await galleryService.loadImage(sharedItem.itemId);
        if (!galleryItem) {
          throw new Error('갤러리 아이템을 찾을 수 없습니다.');
        }

        return { sharedItem, galleryItem };
      }
    } catch (error) {
      console.error('공유 아이템 조회 실패:', error);
      return null;
    }
  }

  /**
   * 공유 설정 업데이트
   */
  async updateShareSettings(shareCode: string, settings: ShareSettings): Promise<boolean> {
    try {
      if (hasSupabaseConfig()) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('로그인이 필요합니다.');
        }

        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (settings.title !== undefined) updateData.title = settings.title;
        if (settings.description !== undefined) updateData.description = settings.description;
        if (settings.isPublic !== undefined) updateData.is_public = settings.isPublic;
        if (settings.allowDownload !== undefined) updateData.allow_download = settings.allowDownload;
        if (settings.expiresIn !== undefined) {
          updateData.expires_at = settings.expiresIn
            ? new Date(Date.now() + settings.expiresIn).toISOString()
            : null;
        }

        const { error } = await supabase
          .from('shared_items')
          .update(updateData)
          .eq('share_code', shareCode)
          .eq('user_id', user.user.id);

        if (error) {
          console.error('공유 설정 업데이트 실패:', error);
          return false;
        }

        console.log('공유 설정 업데이트 완료:', shareCode);
        return true;
      } else {
        // 로컬 스토리지 사용
        const localShares = this.getLocalShares();
        const shareIndex = localShares.findIndex(item => item.shareCode === shareCode);

        if (shareIndex === -1) {
          return false;
        }

        const share = localShares[shareIndex];
        if (settings.title !== undefined) share.title = settings.title;
        if (settings.description !== undefined) share.description = settings.description;
        if (settings.isPublic !== undefined) share.isPublic = settings.isPublic;
        if (settings.allowDownload !== undefined) share.allowDownload = settings.allowDownload;
        if (settings.expiresIn !== undefined) {
          share.expiresAt = settings.expiresIn ? new Date(Date.now() + settings.expiresIn) : undefined;
        }
        share.updatedAt = new Date();

        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(localShares));
        return true;
      }
    } catch (error) {
      console.error('공유 설정 업데이트 실패:', error);
      return false;
    }
  }

  /**
   * 공유 링크 삭제
   */
  async deleteShareLink(shareCode: string): Promise<boolean> {
    try {
      if (hasSupabaseConfig()) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('로그인이 필요합니다.');
        }

        const { error } = await supabase
          .from('shared_items')
          .delete()
          .eq('share_code', shareCode)
          .eq('user_id', user.user.id);

        if (error) {
          console.error('공유 링크 삭제 실패:', error);
          return false;
        }

        console.log('공유 링크 삭제 완료:', shareCode);
        return true;
      } else {
        // 로컬 스토리지 사용
        const localShares = this.getLocalShares();
        const filteredShares = localShares.filter(item => item.shareCode !== shareCode);
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(filteredShares));
        return true;
      }
    } catch (error) {
      console.error('공유 링크 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 사용자의 공유 목록 조회
   */
  async getUserShares(): Promise<SharedItem[]> {
    try {
      if (hasSupabaseConfig()) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          return [];
        }

        const { data: shares, error } = await supabase
          .from('shared_items')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('사용자 공유 목록 조회 실패:', error);
          return [];
        }

        return shares.map(this.convertDbToSharedItem);
      } else {
        // 로컬 스토리지 사용
        return this.getLocalShares().sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      }
    } catch (error) {
      console.error('사용자 공유 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 공유 통계 조회
   */
  async getShareStats(): Promise<ShareStats> {
    try {
      const shares = await this.getUserShares();
      const now = new Date();

      const stats: ShareStats = {
        totalShares: shares.length,
        totalViews: shares.reduce((sum, share) => sum + share.viewCount, 0),
        activeShares: shares.filter(share =>
          share.isPublic && (!share.expiresAt || share.expiresAt > now)
        ).length,
        expiredShares: shares.filter(share =>
          share.expiresAt && share.expiresAt <= now
        ).length
      };

      return stats;
    } catch (error) {
      console.error('공유 통계 조회 실패:', error);
      return {
        totalShares: 0,
        totalViews: 0,
        activeShares: 0,
        expiredShares: 0
      };
    }
  }

  /**
   * 소셜 공유 URL 생성
   */
  generateSocialShareUrls(shareCode: string, title?: string, description?: string): SocialShareUrls {
    const shareUrl = this.SHARE_BASE_URL + shareCode;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title || 'Amazing AI Art');
    const encodedDescription = encodeURIComponent(description || 'Check out this amazing AI-generated image!');

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      instagram: shareUrl, // Instagram은 직접 공유 불가, URL만 제공
      kakao: `https://story.kakao.com/share?url=${encodedUrl}`,
      clipboard: shareUrl,
      embed: `<img src="${shareUrl}/image" alt="${title || 'AI Art'}" style="max-width: 100%; height: auto;" />`
    };
  }

  /**
   * 조회수 증가
   */
  private async incrementViewCount(shareCode: string): Promise<void> {
    try {
      if (hasSupabaseConfig()) {
        await supabase.rpc('increment_share_view', { p_share_code: shareCode });
      }
      // 로컬 스토리지는 getSharedItem에서 처리
    } catch (error) {
      console.error('조회수 증가 실패:', error);
    }
  }

  /**
   * 6자리 공유 코드 생성
   */
  private generateShareCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 로컬 스토리지에서 공유 목록 가져오기
   */
  private getLocalShares(): SharedItem[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
      }));
    } catch (error) {
      console.error('로컬 공유 목록 로드 실패:', error);
      return [];
    }
  }

  /**
   * DB 데이터를 SharedItem으로 변환
   */
  private convertDbToSharedItem(dbItem: any): SharedItem {
    return {
      id: dbItem.id,
      itemId: dbItem.item_id,
      userId: dbItem.user_id,
      shareCode: dbItem.share_code,
      title: dbItem.title,
      description: dbItem.description,
      isPublic: dbItem.is_public,
      allowDownload: dbItem.allow_download,
      expiresAt: dbItem.expires_at ? new Date(dbItem.expires_at) : undefined,
      viewCount: dbItem.view_count,
      createdAt: new Date(dbItem.created_at),
      updatedAt: new Date(dbItem.updated_at)
    };
  }
}

// ==================== 서비스 인스턴스 내보내기 ====================

export const shareService = new ShareService();
export default shareService;