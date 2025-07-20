import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Location } from '../types';

export interface LocationError {
  code: number;
  message: string;
}

export interface LocationServiceResult {
  success: boolean;
  location?: Location;
  error?: LocationError;
}

export interface WatchPositionCallback {
  (result: LocationServiceResult): void;
}

export class LocationService {
  private watchId: string | null = null;
  private lastKnownLocation: Location | null = null;

  /**
   * Get current location using device GPS
   */
  async getCurrentLocation(): Promise<LocationServiceResult> {
    try {
      // Check permissions first
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          return {
            success: false,
            error: {
              code: 1, // PERMISSION_DENIED
              message: 'Location permission denied. Please enable location services in your device settings.'
            }
          };
        }
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      const position: Position = await Geolocation.getCurrentPosition(options);
      
      // Perform reverse geocoding to get city and country
      const reverseGeocodingResult = await this.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city: reverseGeocodingResult.city || 'Unknown',
        country: reverseGeocodingResult.country || 'Unknown'
      };

      this.lastKnownLocation = location;

      return {
        success: true,
        location
      };

    } catch (error: any) {
      return this.handleLocationError(error);
    }
  }

  /**
   * Watch position changes and call callback with updates
   */
  async watchPosition(callback: WatchPositionCallback): Promise<string | null> {
    try {
      // Check permissions first
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          callback({
            success: false,
            error: {
              code: 1, // PERMISSION_DENIED
              message: 'Location permission denied. Please enable location services in your device settings.'
            }
          });
          return null;
        }
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      };

      this.watchId = await Geolocation.watchPosition(options, (position, error) => {
        if (error) {
          callback(this.handleLocationError(error));
          return;
        }

        if (position) {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: 'Unknown',
            country: 'Unknown'
          };

          this.lastKnownLocation = location;

          callback({
            success: true,
            location
          });
        }
      });

      return this.watchId;

    } catch (error: any) {
      callback(this.handleLocationError(error));
      return null;
    }
  }

  /**
   * Stop watching position changes
   */
  async clearWatch(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  /**
   * Get last known location if available
   */
  getLastKnownLocation(): Location | null {
    return this.lastKnownLocation;
  }

  /**
   * Set manual location as fallback
   */
  setManualLocation(location: Location): void {
    this.lastKnownLocation = location;
  }

  /**
   * Validate manual location input
   */
  validateManualLocation(city: string, country: string, latitude?: number, longitude?: number): boolean {
    // Basic validation
    if (!city.trim() || !country.trim()) {
      return false;
    }

    if (latitude !== undefined && longitude !== undefined) {
      return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }

    return true;
  }

  /**
   * Create manual location object
   */
  createManualLocation(city: string, country: string, latitude?: number, longitude?: number): Location {
    return {
      latitude: latitude || 0, // Will need geocoding service to resolve
      longitude: longitude || 0,
      city: city.trim(),
      country: country.trim()
    };
  }

  /**
   * Handle location errors and provide appropriate error messages
   */
  private handleLocationError(error: any): LocationServiceResult {
    let errorCode = 0;
    let errorMessage = 'Unknown location error occurred.';

    if (error.code !== undefined) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorCode = 1;
          errorMessage = 'Location permission denied. Please enable location services in your device settings.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorCode = 2;
          errorMessage = 'Location unavailable. Please check your GPS settings or try manual location input.';
          break;
        case 3: // TIMEOUT
          errorCode = 3;
          errorMessage = 'Location request timed out. Please try again or use manual location input.';
          break;
        default:
          errorCode = 0;
          errorMessage = error.message || 'Unknown location error occurred.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    };
  }

  /**
   * Check if location services are available
   */
  async isLocationAvailable(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Reverse geocode coordinates to get city and country
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SahowAssistant/1.0' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Extract city (try multiple possible fields)
        const city = address.city || 
                    address.town || 
                    address.village || 
                    address.municipality || 
                    address.county || 
                    address.state_district ||
                    'Unknown';
        
        // Extract country
        const country = address.country || 'Unknown';
        
        return { city, country };
      }
      
      return { city: 'Unknown', country: 'Unknown' };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return { city: 'Unknown', country: 'Unknown' };
    }
  }

  /**
   * Get fallback action based on error type
   */
  getFallbackAction(error: LocationError): 'manual_input' | 'retry' | 'use_last_known' {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'manual_input';
      case 2: // POSITION_UNAVAILABLE
        return this.lastKnownLocation ? 'use_last_known' : 'manual_input';
      case 3: // TIMEOUT
        return 'retry';
      default:
        return 'manual_input';
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();