import { OfflineStorageService } from './OfflineStorageService';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  isSlowConnection: boolean;
}

export class NetworkService {
  private static listeners: Array<(status: NetworkStatus) => void> = [];
  private static currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    isSlowConnection: false
  };

  /**
   * Initialize network monitoring
   */
  static initialize(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Check initial network status
    this.updateNetworkStatus();

    // Try to get connection info if available
    this.detectConnectionType();
  }

  /**
   * Add a listener for network status changes
   */
  static addListener(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current status
    callback(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current network status
   */
  static getCurrentStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if device is online
   */
  static isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Check if connection is slow (useful for data-saving features)
   */
  static isSlowConnection(): boolean {
    return this.currentStatus.isSlowConnection;
  }

  /**
   * Test network connectivity with a simple request
   */
  static async testConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const isOnline = response.ok;
      await this.updateNetworkStatus(isOnline);
      
      return isOnline;
    } catch (error) {
      console.log('Network test failed:', error);
      await this.updateNetworkStatus(false);
      return false;
    }
  }

  /**
   * Attempt to sync data when online
   */
  static async syncWhenOnline(): Promise<boolean> {
    if (!this.isOnline()) {
      return false;
    }

    try {
      // Test actual connectivity
      const isConnected = await this.testConnectivity();
      if (!isConnected) {
        return false;
      }

      // Perform sync operations
      await OfflineStorageService.syncWhenOnline();
      
      // Notify listeners that sync completed
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }

  /**
   * Handle online event
   */
  private static async handleOnline(): Promise<void> {
    console.log('Network: Online event detected');
    
    // Wait a bit before testing connectivity
    setTimeout(async () => {
      const isConnected = await this.testConnectivity();
      if (isConnected) {
        await this.syncWhenOnline();
      }
    }, 1000);
  }

  /**
   * Handle offline event
   */
  private static async handleOffline(): Promise<void> {
    console.log('Network: Offline event detected');
    await this.updateNetworkStatus(false);
  }

  /**
   * Update network status
   */
  private static async updateNetworkStatus(isOnline?: boolean): Promise<void> {
    const newStatus: NetworkStatus = {
      isOnline: isOnline !== undefined ? isOnline : navigator.onLine,
      connectionType: this.getConnectionType(),
      isSlowConnection: this.detectSlowConnection()
    };

    const statusChanged = 
      newStatus.isOnline !== this.currentStatus.isOnline ||
      newStatus.connectionType !== this.currentStatus.connectionType ||
      newStatus.isSlowConnection !== this.currentStatus.isSlowConnection;

    this.currentStatus = newStatus;

    // Store network status
    await OfflineStorageService.setNetworkStatus(newStatus.isOnline ? 'online' : 'offline');

    if (statusChanged) {
      this.notifyListeners();
    }
  }

  /**
   * Detect connection type
   */
  private static getConnectionType(): 'wifi' | 'cellular' | 'none' | 'unknown' {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const type = connection.effectiveType || connection.type;
      
      if (type === 'wifi') return 'wifi';
      if (type === 'cellular' || type === '4g' || type === '3g' || type === '2g') return 'cellular';
      if (type === 'none') return 'none';
    }
    
    return 'unknown';
  }

  /**
   * Detect slow connection
   */
  private static detectSlowConnection(): boolean {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      // Consider 2G or slow-2g as slow
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return true;
      }
      
      // Consider very low bandwidth as slow
      const downlink = connection.downlink;
      if (downlink && downlink < 1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect connection type using heuristics
   */
  private static detectConnectionType(): void {
    // This is a fallback method for browsers that don't support Network Information API
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        this.updateNetworkStatus();
      });
    }
  }

  /**
   * Notify all listeners about status changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Cleanup network monitoring
   */
  static cleanup(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }
}
