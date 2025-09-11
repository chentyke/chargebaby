import { useEffect } from 'react';
import { ChargeBaby } from '@/types/chargebaby';

interface PreloadResult {
  preloaded: number;
  alreadyCached: number;
  failed: number;
}

export function useImagePreloader(chargeBabies: ChargeBaby[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !chargeBabies.length) return;

    // 延迟预加载，避免阻塞首页渲染
    const preloadTimer = setTimeout(() => {
      preloadImages(chargeBabies);
    }, 2000); // 2秒后开始预加载

    return () => clearTimeout(preloadTimer);
  }, [chargeBabies, enabled]);
}

async function preloadImages(chargeBabies: ChargeBaby[]): Promise<PreloadResult | null> {
  try {
    // 提取所有图片URL，优先选择高质量图片
    const imageUrls = chargeBabies
      .slice(0, 12) // 只预加载前12个产品的图片
      .map(product => product.finalImageUrl || product.imageUrl)
      .filter(Boolean) // 移除空值
      .filter((url, index, array) => array.indexOf(url) === index); // 去重

    if (imageUrls.length === 0) {
      console.log('📷 No images to preload');
      return null;
    }

    console.log(`🚀 Starting smart preload for ${imageUrls.length} unique images`);

    const response = await fetch('/api/preload-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls }),
    });

    if (!response.ok) {
      throw new Error(`Preload request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Smart preload completed:', result.summary);
      return result.summary as PreloadResult;
    } else {
      console.error('❌ Smart preload failed:', result.error);
      return null;
    }

  } catch (error) {
    console.error('❌ Smart preload error:', error);
    return null;
  }
}

// 手动预加载特定图片
export async function preloadSpecificImages(imageUrls: string[]): Promise<PreloadResult | null> {
  if (imageUrls.length === 0) return null;
  
  try {
    const response = await fetch('/api/preload-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.success ? result.summary : null;
    }
    
    return null;
  } catch (error) {
    console.error('Manual preload error:', error);
    return null;
  }
}
