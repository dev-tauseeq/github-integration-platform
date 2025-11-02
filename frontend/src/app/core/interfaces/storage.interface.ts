/**
 * Storage interface for abstracting storage mechanisms
 *
 * @description Provides a contract for storage implementations (localStorage, sessionStorage, etc.)
 * This abstraction allows for easy testing and swapping of storage mechanisms
 */
export interface IStorage {
  /**
   * Store a value with the given key
   */
  setItem(key: string, value: string): void;

  /**
   * Retrieve a value by key
   */
  getItem(key: string): string | null;

  /**
   * Remove an item by key
   */
  removeItem(key: string): void;

  /**
   * Clear all items from storage
   */
  clear(): void;

  /**
   * Check if a key exists in storage
   */
  hasItem(key: string): boolean;

  /**
   * Get all keys in storage
   */
  getAllKeys(): string[];
}
