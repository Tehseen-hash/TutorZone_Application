import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@tutor_connect_cache_";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const cacheService = {
  // Set cache with expiry
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  },

  // Get cache if not expired
  async get<T>(key: string): Promise<T | null> {
    try {
      const itemString = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!itemString) return null;

      const item: CacheItem<T> = JSON.parse(itemString);
      const now = Date.now();

      // Check if expired
      if (now - item.timestamp > CACHE_EXPIRY) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error("Error getting cache:", error);
      return null;
    }
  },

  // Remove cache
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error("Error removing cache:", error);
    }
  },

  // Clear all cache
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  },
};





