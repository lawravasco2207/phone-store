// Storage service for handling file uploads (abstraction over local and S3)
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';

/**
 * Abstract storage service that can be implemented for different backends
 */
class StorageService {
  /**
   * Store a file
   * @param {Buffer|string} content - File content
   * @param {string} filename - Original filename
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The URL where the file is stored
   */
  async storeFile(content, filename, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get a file from storage
   * @param {string} url - The URL of the file
   * @returns {Promise<Buffer>} The file content
   */
  async getFile(url) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete a file from storage
   * @param {string} url - The URL of the file
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteFile(url) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate a signed URL for temporary access to a file
   * @param {string} url - The URL of the file
   * @param {number} expiresIn - Expiry time in seconds
   * @returns {Promise<string>} The signed URL
   */
  async getSignedUrl(url, expiresIn = 60 * 60) {
    throw new Error('Method not implemented');
  }
}

/**
 * Local file system implementation of StorageService
 */
export class LocalStorageService extends StorageService {
  constructor(options = {}) {
    super();
    this.baseDir = options.baseDir || path.join(process.cwd(), 'uploads');
    this.baseUrl = options.baseUrl || '/uploads';
    
    // Ensure the base directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Store a file in the local filesystem
   * @param {Buffer|string} content - File content
   * @param {string} filename - Original filename
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The URL where the file is stored
   */
  async storeFile(content, filename, options = {}) {
    const { folder = 'general' } = options;
    
    // Create hash of the content for deduplication
    const hash = crypto.createHash('md5')
      .update(Buffer.isBuffer(content) ? content : Buffer.from(content))
      .digest('hex');
    
    // Get extension from original filename
    const ext = path.extname(filename);
    
    // Create safe filename using content hash and original extension
    const safeFilename = `${hash}${ext}`;
    
    // Create folder path
    const folderPath = path.join(this.baseDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Full path to the file
    const filePath = path.join(folderPath, safeFilename);
    
    // Write the file
    await fsPromises.writeFile(filePath, content);
    
    // Return the URL
    return `${this.baseUrl}/${folder}/${safeFilename}`;
  }

  /**
   * Get a file from local storage
   * @param {string} url - The URL of the file
   * @returns {Promise<Buffer>} The file content
   */
  async getFile(url) {
    const relativePath = url.replace(this.baseUrl, '');
    const filePath = path.join(this.baseDir, relativePath);
    return fsPromises.readFile(filePath);
  }

  /**
   * Delete a file from local storage
   * @param {string} url - The URL of the file
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteFile(url) {
    try {
      const relativePath = url.replace(this.baseUrl, '');
      const filePath = path.join(this.baseDir, relativePath);
      await fsPromises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get signed URL (not needed for local storage, just returns the URL)
   * @param {string} url - The URL of the file
   * @returns {Promise<string>} The URL
   */
  async getSignedUrl(url) {
    return url;
  }
}

/**
 * Factory function to create the appropriate storage service based on environment
 */
export function createStorageService() {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd && process.env.S3_BUCKET) {
    // In production with S3 configured, we would return an S3StorageService
    // This is a placeholder for future implementation
    console.log('Using S3 storage service');
    return new LocalStorageService(); // Replace with S3 implementation in production
  }
  
  // Default to local storage for development
  console.log('Using local storage service');
  return new LocalStorageService();
}

// Export default instance
export const storageService = createStorageService();
