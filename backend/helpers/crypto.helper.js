const CryptoJS = require('crypto-js');
const config = require('../config/environment');

class CryptoHelper {
  constructor() {
    this.secretKey = config.encryption.key || 'default_32_char_encryption_key__';
  }

  /**
   * Encrypt a string
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted string
   */
  encrypt(text) {
    if (!text) return null;

    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string
   * @param {string} encryptedText - Encrypted text to decrypt
   * @returns {string} Decrypted string
   */
  decrypt(encryptedText) {
    if (!encryptedText) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a string using SHA256
   * @param {string} text - Text to hash
   * @returns {string} Hashed string
   */
  hash(text) {
    return CryptoJS.SHA256(text).toString();
  }

  /**
   * Generate a random token
   * @param {number} length - Length of the token
   * @returns {string} Random token
   */
  generateToken(length = 32) {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    return CryptoJS.enc.Hex.stringify(randomBytes);
  }

  /**
   * Encrypt an object
   * @param {Object} obj - Object to encrypt
   * @returns {string} Encrypted object as string
   */
  encryptObject(obj) {
    try {
      const jsonString = JSON.stringify(obj);
      return this.encrypt(jsonString);
    } catch (error) {
      console.error('Object encryption error:', error);
      throw new Error('Failed to encrypt object');
    }
  }

  /**
   * Decrypt an object
   * @param {string} encryptedText - Encrypted text
   * @returns {Object} Decrypted object
   */
  decryptObject(encryptedText) {
    try {
      const decryptedString = this.decrypt(encryptedText);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Object decryption error:', error);
      throw new Error('Failed to decrypt object');
    }
  }

  /**
   * Create a secure session token
   * @param {string} userId - User ID
   * @returns {Object} Token and expiry
   */
  createSessionToken(userId) {
    const token = this.generateToken(64);
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const payload = {
      userId,
      token,
      expiry: expiry.toISOString(),
    };

    return {
      token: this.encryptObject(payload),
      expiry,
    };
  }

  /**
   * Verify a session token
   * @param {string} encryptedToken - Encrypted session token
   * @returns {Object|null} Payload if valid, null otherwise
   */
  verifySessionToken(encryptedToken) {
    try {
      const payload = this.decryptObject(encryptedToken);
      const now = new Date();
      const expiry = new Date(payload.expiry);

      if (expiry < now) {
        return null; // Token expired
      }

      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }
}

module.exports = new CryptoHelper();