import { Device } from '@capacitor/device';
import { Location } from '../types';

export interface QiblaResult {
  direction: number; // Qibla direction in degrees (0-360)
  distance: number; // Distance to Mecca in kilometers
}

export interface DeviceOrientationResult {
  success: boolean;
  orientation?: number; // Device orientation in degrees
  error?: string;
}

export interface QiblaServiceResult {
  success: boolean;
  result?: QiblaResult;
  error?: string;
}

export class QiblaService {
  // Mecca coordinates (Kaaba)
  private static readonly MECCA_LATITUDE = 21.4225;
  private static readonly MECCA_LONGITUDE = 39.8262;
  private static readonly EARTH_RADIUS_KM = 6371;

  private orientationWatchId: number | null = null;
  private lastKnownOrientation: number = 0;

  /**
   * Calculate Qibla direction from user location to Mecca using great circle calculations
   */
  static calculateQiblaDirection(userLocation: Location): QiblaServiceResult {
    try {
      // Validate input coordinates
      if (!this.isValidLocation(userLocation)) {
        return {
          success: false,
          error: 'Invalid location coordinates provided'
        };
      }

      // Convert degrees to radians
      const userLatRad = this.degreesToRadians(userLocation.latitude);
      const userLngRad = this.degreesToRadians(userLocation.longitude);
      const meccaLatRad = this.degreesToRadians(this.MECCA_LATITUDE);
      const meccaLngRad = this.degreesToRadians(this.MECCA_LONGITUDE);

      // Calculate the difference in longitude
      const deltaLng = meccaLngRad - userLngRad;

      // Calculate bearing using great circle formula
      const y = Math.sin(deltaLng) * Math.cos(meccaLatRad);
      const x = Math.cos(userLatRad) * Math.sin(meccaLatRad) - 
                Math.sin(userLatRad) * Math.cos(meccaLatRad) * Math.cos(deltaLng);

      // Calculate initial bearing
      let bearing = Math.atan2(y, x);

      // Convert from radians to degrees
      bearing = this.radiansToDegrees(bearing);

      // Normalize to 0-360 degrees
      const qiblaDirection = (bearing + 360) % 360;

      // Calculate distance to Mecca
      const distance = this.calculateDistanceToMecca(userLocation);

      return {
        success: true,
        result: {
          direction: Math.round(qiblaDirection * 100) / 100, // Round to 2 decimal places
          distance: Math.round(distance * 100) / 100
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate Qibla direction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate distance from user location to Mecca using Haversine formula
   */
  static getDistanceToMecca(userLocation: Location): number {
    try {
      if (!this.isValidLocation(userLocation)) {
        throw new Error('Invalid location coordinates provided');
      }

      return this.calculateDistanceToMecca(userLocation);
    } catch (error) {
      throw new Error(`Failed to calculate distance to Mecca: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start watching device orientation for compass functionality
   */
  async watchDeviceOrientation(callback: (result: DeviceOrientationResult) => void): Promise<boolean> {
    try {
      // Check if device orientation is supported
      const info = await Device.getInfo();
      
      if (info.platform === 'web') {
        // For web platform, use DeviceOrientationEvent if available
        if (typeof DeviceOrientationEvent !== 'undefined') {
          return this.watchWebOrientation(callback);
        } else {
          callback({
            success: false,
            error: 'Device orientation not supported on this browser'
          });
          return false;
        }
      } else {
        // For mobile platforms, we'll need to implement native orientation tracking
        // For now, return a mock implementation
        callback({
          success: false,
          error: 'Device orientation tracking not yet implemented for mobile platforms'
        });
        return false;
      }

    } catch (error) {
      callback({
        success: false,
        error: `Failed to start orientation tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  }

  /**
   * Stop watching device orientation
   */
  stopWatchingOrientation(): void {
    if (this.orientationWatchId !== null) {
      // Remove event listener for web
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('deviceorientation', this.handleOrientationChange);
      }
      this.orientationWatchId = null;
    }
  }

  /**
   * Get last known device orientation
   */
  getLastKnownOrientation(): number {
    return this.lastKnownOrientation;
  }

  /**
   * Calculate compass bearing adjusted for device orientation
   */
  static calculateCompassBearing(qiblaDirection: number, deviceOrientation: number): number {
    // Adjust Qibla direction based on device orientation
    let compassBearing = qiblaDirection - deviceOrientation;
    
    // Normalize to 0-360 degrees
    if (compassBearing < 0) {
      compassBearing += 360;
    } else if (compassBearing >= 360) {
      compassBearing -= 360;
    }
    
    return Math.round(compassBearing * 100) / 100;
  }

  /**
   * Check if the device is pointing towards Qibla (within tolerance)
   */
  static isPointingTowardsQibla(
    qiblaDirection: number, 
    deviceOrientation: number, 
    tolerance: number = 5
  ): boolean {
    const compassBearing = this.calculateCompassBearing(qiblaDirection, deviceOrientation);
    
    // Check if compass bearing is within tolerance of 0 degrees (pointing towards Qibla)
    return Math.abs(compassBearing) <= tolerance || Math.abs(compassBearing - 360) <= tolerance;
  }

  // Private helper methods

  /**
   * Watch orientation on web platform using DeviceOrientationEvent
   */
  private watchWebOrientation(callback: (result: DeviceOrientationResult) => void): boolean {
    try {
      // Request permission for iOS 13+ devices
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              this.startWebOrientationListener(callback);
            } else {
              callback({
                success: false,
                error: 'Device orientation permission denied'
              });
            }
          })
          .catch((error: Error) => {
            callback({
              success: false,
              error: `Failed to request orientation permission: ${error.message}`
            });
          });
      } else {
        // For other browsers, start listening directly
        this.startWebOrientationListener(callback);
      }
      
      return true;
    } catch (error) {
      callback({
        success: false,
        error: `Failed to setup web orientation tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  }

  /**
   * Start listening to device orientation events on web
   */
  private startWebOrientationListener(callback: (result: DeviceOrientationResult) => void): void {
    this.handleOrientationChange = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // Alpha represents the rotation around the z-axis (compass heading)
        let orientation = event.alpha;
        
        // Normalize to 0-360 degrees
        if (orientation < 0) {
          orientation += 360;
        }
        
        this.lastKnownOrientation = orientation;
        
        callback({
          success: true,
          orientation: Math.round(orientation * 100) / 100
        });
      } else {
        callback({
          success: false,
          error: 'Device orientation data not available'
        });
      }
    };

    window.addEventListener('deviceorientation', this.handleOrientationChange);
    this.orientationWatchId = 1; // Simple flag to indicate listening is active
  }

  /**
   * Handle device orientation change event
   */
  private handleOrientationChange = (event: DeviceOrientationEvent) => {
    // This will be bound in startWebOrientationListener
  };

  /**
   * Calculate distance using Haversine formula
   */
  private static calculateDistanceToMecca(userLocation: Location): number {
    const userLatRad = this.degreesToRadians(userLocation.latitude);
    const userLngRad = this.degreesToRadians(userLocation.longitude);
    const meccaLatRad = this.degreesToRadians(this.MECCA_LATITUDE);
    const meccaLngRad = this.degreesToRadians(this.MECCA_LONGITUDE);

    const deltaLat = meccaLatRad - userLatRad;
    const deltaLng = meccaLngRad - userLngRad;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(userLatRad) * Math.cos(meccaLatRad) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Validate location coordinates
   */
  private static isValidLocation(location: Location): boolean {
    return (
      location &&
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180 &&
      !isNaN(location.latitude) &&
      !isNaN(location.longitude)
    );
  }

  /**
   * Convert degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

// Export singleton instance
export const qiblaService = new QiblaService();