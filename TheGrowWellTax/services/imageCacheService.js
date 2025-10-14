import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './api';

class ImageCacheService {
  constructor() {
    this.cacheKey = 'document_images_cache';
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB max cache size
    this.compressionQuality = 0.8; // 80% quality for compression
  }

  /**
   * Get cached image data for a document
   */
  async getCachedImage(documentId) {
    try {
      const cache = await this.getCache();
      return cache[documentId] || null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Cache decrypted image data
   */
  async cacheImage(documentId, imageData, metadata = {}) {
    try {
      const cache = await this.getCache();
      
      // Add image to cache
      cache[documentId] = {
        data: imageData,
        timestamp: Date.now(),
        metadata: {
          size: imageData.length,
          ...metadata
        }
      };

      // Save cache and cleanup if needed
      await this.saveCache(cache);
      await this.cleanupCache();
      
      console.log(`📸 Cached image for document: ${documentId}`);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  /**
   * Check if image is cached and not expired
   */
  async isImageCached(documentId, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const cache = await this.getCache();
      const cached = cache[documentId];
      
      if (!cached) return false;
      
      const age = Date.now() - cached.timestamp;
      return age < maxAge;
    } catch (error) {
      console.error('Error checking cache status:', error);
      return false;
    }
  }

  /**
   * Download and decrypt image from backend
   */
  async downloadAndDecryptImage(documentId, decryptionUrl, token) {
    try {
      console.log(`🔄 Downloading image: ${documentId}`);
      
      const response = await fetch(decryptionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'image/*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);
      
      console.log(`✅ Downloaded and decrypted image: ${documentId}`);
      return base64;
    } catch (error) {
      console.error(`❌ Error downloading image ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Pre-load images for documents in background
   */
  async preloadImages(documents, token, onProgress = null) {
    const imageDocuments = documents.filter(doc => 
      doc.type?.startsWith('image/') || 
      doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );

    console.log(`🚀 Starting preload for ${imageDocuments.length} images`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };

    // Process images in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < imageDocuments.length; i += batchSize) {
      const batch = imageDocuments.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (doc) => {
        try {
          // Check if already cached
          if (await this.isImageCached(doc.id)) {
            console.log(`⏭️ Skipping cached image: ${doc.name}`);
            results.skipped++;
            return;
          }

          // Download and cache
          const imageData = await this.downloadAndDecryptImage(doc.id, doc.publicUrl, token);
          await this.cacheImage(doc.id, imageData, {
            name: doc.name,
            type: doc.type,
            size: doc.size
          });
          
          results.success++;
          console.log(`✅ Preloaded image: ${doc.name}`);
        } catch (error) {
          results.failed++;
          console.error(`❌ Failed to preload ${doc.name}:`, error);
        }
      });

      await Promise.all(batchPromises);
      
      // Report progress
      if (onProgress) {
        onProgress({
          completed: i + batch.length,
          total: imageDocuments.length,
          results
        });
      }

      // Small delay between batches to prevent overwhelming
      if (i + batchSize < imageDocuments.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🎉 Preload complete: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);
    return results;
  }

  /**
   * Get all cached images
   */
  async getAllCachedImages() {
    try {
      const cache = await this.getCache();
      return Object.keys(cache).map(documentId => ({
        documentId,
        ...cache[documentId]
      }));
    } catch (error) {
      console.error('Error getting all cached images:', error);
      return [];
    }
  }

  /**
   * Clear cache for specific document
   */
  async clearImageCache(documentId) {
    try {
      const cache = await this.getCache();
      delete cache[documentId];
      await this.saveCache(cache);
      console.log(`🗑️ Cleared cache for document: ${documentId}`);
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clearAllCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
      console.log('🗑️ Cleared all image cache');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Get cache size in bytes
   */
  async getCacheSize() {
    try {
      const cache = await this.getCache();
      let totalSize = 0;
      
      Object.values(cache).forEach(item => {
        totalSize += item.metadata?.size || 0;
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Get cache from AsyncStorage
   */
  async getCache() {
    try {
      const cacheData = await AsyncStorage.getItem(this.cacheKey);
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      console.error('Error getting cache:', error);
      return {};
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  async saveCache(cache) {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  /**
   * Cleanup old cache entries if size exceeds limit
   */
  async cleanupCache() {
    try {
      const cache = await this.getCache();
      const cacheSize = await this.getCacheSize();
      
      if (cacheSize <= this.maxCacheSize) {
        return; // No cleanup needed
      }

      console.log(`🧹 Cache size (${cacheSize} bytes) exceeds limit, cleaning up...`);

      // Sort by timestamp (oldest first)
      const entries = Object.entries(cache).sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      let currentSize = cacheSize;
      const entriesToRemove = [];

      // Remove oldest entries until we're under the limit
      for (const [documentId, data] of entries) {
        if (currentSize <= this.maxCacheSize * 0.8) break; // Leave some buffer
        
        entriesToRemove.push(documentId);
        currentSize -= data.metadata?.size || 0;
      }

      // Remove old entries
      entriesToRemove.forEach(documentId => {
        delete cache[documentId];
      });

      await this.saveCache(cache);
      console.log(`🧹 Cleaned up ${entriesToRemove.length} old cache entries`);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Use Buffer for React Native compatibility
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(binary, 'binary').toString('base64');
    }
    // Fallback for environments without Buffer
    return this.binaryToBase64(binary);
  }

  /**
   * Fallback base64 encoding for environments without Buffer
   */
  binaryToBase64(binary) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < binary.length) {
      const a = binary.charCodeAt(i++);
      const b = i < binary.length ? binary.charCodeAt(i++) : 0;
      const c = i < binary.length ? binary.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const cache = await this.getCache();
      const totalSize = await this.getCacheSize();
      const entryCount = Object.keys(cache).length;
      
      return {
        entryCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxSizeMB: (this.maxCacheSize / (1024 * 1024)).toFixed(2),
        usagePercent: ((totalSize / this.maxCacheSize) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

export default new ImageCacheService();
