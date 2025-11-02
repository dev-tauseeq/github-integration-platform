import { Injectable } from '@angular/core';
import { IStorage } from '../interfaces/storage.interface';

/**
 * Storage service that provides abstraction over browser storage
 *
 * @description Implements IStorage interface and provides a testable,
 * swappable storage mechanism. Defaults to localStorage but can be
 * configured to use sessionStorage or custom storage implementations
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService implements IStorage {
  private readonly storage: Storage;
  private readonly prefix = 'github_app_'; // Prefix to avoid key collisions

  constructor() {
    this.storage = localStorage; // Can be injected for testing
  }

  /**
   * Store a value with automatic prefix
   */
  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(this.getPrefixedKey(key), value);
    } catch (error) {
      console.error(`Error storing item with key "${key}":`, error);
      throw new Error(`Storage failed for key: ${key}`);
    }
  }

  /**
   * Retrieve a value by key
   */
  getItem(key: string): string | null {
    try {
      return this.storage.getItem(this.getPrefixedKey(key));
    } catch (error) {
      console.error(`Error retrieving item with key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove an item by key
   */
  removeItem(key: string): void {
    try {
      this.storage.removeItem(this.getPrefixedKey(key));
    } catch (error) {
      console.error(`Error removing item with key "${key}":`, error);
    }
  }

  /**
   * Clear all application-specific items (with prefix)
   */
  clear(): void {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.removeItem(key));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if a key exists
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Get all application-specific keys
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
    } catch (error) {
      console.error('Error getting all keys:', error);
    }
    return keys;
  }

  /**
   * Store an object as JSON
   */
  setObject<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieve and parse an object from JSON
   */
  getObject<T>(key: string): T | null {
    const item = this.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing JSON for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Add prefix to key
   */
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
