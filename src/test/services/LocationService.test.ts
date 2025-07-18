import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocationService } from '../../../services/LocationService';
import { Geolocation } from '@capacitor/geolocation';

// Mock Capacitor Geolocation
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
}));

describe('LocationService', () => {
  let locationService: LocationService;
  const mockGeolocation = vi.mocked(Geolocation);

  beforeEach(() => {
    locationService = new LocationService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await locationService.clearWatch();
  });

  describe('getCurrentLocation', () => {
    it('should return location when permissions are granted and GPS works', async () => {
      // Mock successful permission check
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });

      // Mock successful position retrieval
      mockGeolocation.getCurrentPosition.mockResolvedValue({
        coords: {
          latitude: 21.4225,
          longitude: 39.8262,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(true);
      expect(result.location).toEqual({
        latitude: 21.4225,
        longitude: 39.8262,
        city: 'Unknown',
        country: 'Unknown'
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle permission denied error', async () => {
      // Mock permission denied
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'denied',
        coarseLocation: 'denied'
      });

      mockGeolocation.requestPermissions.mockResolvedValue({
        location: 'denied',
        coarseLocation: 'denied'
      });

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 1,
        message: 'Location permission denied. Please enable location services in your device settings.'
      });
    });

    it('should handle position unavailable error', async () => {
      // Mock successful permissions
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });

      // Mock position unavailable error
      const positionError = new Error('Position unavailable');
      (positionError as any).code = 2;
      mockGeolocation.getCurrentPosition.mockRejectedValue(positionError);

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 2,
        message: 'Location unavailable. Please check your GPS settings or try manual location input.'
      });
    });

    it('should handle timeout error', async () => {
      // Mock successful permissions
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });

      // Mock timeout error
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 3;
      mockGeolocation.getCurrentPosition.mockRejectedValue(timeoutError);

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 3,
        message: 'Location request timed out. Please try again or use manual location input.'
      });
    });
  });

  describe('watchPosition', () => {
    it('should start watching position and call callback with location updates', async () => {
      const callback = vi.fn();
      const mockWatchId = 'watch-123';

      // Mock successful permissions
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });

      // Mock successful watch position
      mockGeolocation.watchPosition.mockImplementation((options, callback) => {
        // Simulate position update
        setTimeout(() => {
          callback({
            coords: {
              latitude: 21.4225,
              longitude: 39.8262,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          }, null);
        }, 100);
        return Promise.resolve(mockWatchId);
      });

      const watchId = await locationService.watchPosition(callback);

      expect(watchId).toBe(mockWatchId);
      
      // Wait for callback to be called
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(callback).toHaveBeenCalledWith({
        success: true,
        location: {
          latitude: 21.4225,
          longitude: 39.8262,
          city: 'Unknown',
          country: 'Unknown'
        }
      });
    });

    it('should handle permission denied in watch position', async () => {
      const callback = vi.fn();

      // Mock permission denied
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'denied',
        coarseLocation: 'denied'
      });

      mockGeolocation.requestPermissions.mockResolvedValue({
        location: 'denied',
        coarseLocation: 'denied'
      });

      const watchId = await locationService.watchPosition(callback);

      expect(watchId).toBeNull();
      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 1,
          message: 'Location permission denied. Please enable location services in your device settings.'
        }
      });
    });
  });

  describe('manual location functionality', () => {
    it('should validate manual location input correctly', () => {
      expect(locationService.validateManualLocation('Mecca', 'Saudi Arabia')).toBe(true);
      expect(locationService.validateManualLocation('Mecca', 'Saudi Arabia', 21.4225, 39.8262)).toBe(true);
      expect(locationService.validateManualLocation('', 'Saudi Arabia')).toBe(false);
      expect(locationService.validateManualLocation('Mecca', '')).toBe(false);
      expect(locationService.validateManualLocation('Mecca', 'Saudi Arabia', 91, 0)).toBe(false); // Invalid latitude
      expect(locationService.validateManualLocation('Mecca', 'Saudi Arabia', 0, 181)).toBe(false); // Invalid longitude
    });

    it('should create manual location object correctly', () => {
      const location = locationService.createManualLocation('Mecca', 'Saudi Arabia', 21.4225, 39.8262);
      
      expect(location).toEqual({
        latitude: 21.4225,
        longitude: 39.8262,
        city: 'Mecca',
        country: 'Saudi Arabia'
      });
    });

    it('should create manual location with default coordinates when not provided', () => {
      const location = locationService.createManualLocation('Mecca', 'Saudi Arabia');
      
      expect(location).toEqual({
        latitude: 0,
        longitude: 0,
        city: 'Mecca',
        country: 'Saudi Arabia'
      });
    });

    it('should set and get manual location', () => {
      const manualLocation = {
        latitude: 21.4225,
        longitude: 39.8262,
        city: 'Mecca',
        country: 'Saudi Arabia'
      };

      locationService.setManualLocation(manualLocation);
      expect(locationService.getLastKnownLocation()).toEqual(manualLocation);
    });
  });

  describe('error handling and fallback actions', () => {
    it('should provide correct fallback action for permission denied', () => {
      const error = { code: 1, message: 'Permission denied' };
      expect(locationService.getFallbackAction(error)).toBe('manual_input');
    });

    it('should provide correct fallback action for position unavailable with last known location', async () => {
      // Set a last known location first
      const lastKnownLocation = {
        latitude: 21.4225,
        longitude: 39.8262,
        city: 'Mecca',
        country: 'Saudi Arabia'
      };
      locationService.setManualLocation(lastKnownLocation);

      const error = { code: 2, message: 'Position unavailable' };
      expect(locationService.getFallbackAction(error)).toBe('use_last_known');
    });

    it('should provide correct fallback action for timeout', () => {
      const error = { code: 3, message: 'Timeout' };
      expect(locationService.getFallbackAction(error)).toBe('retry');
    });
  });

  describe('location availability check', () => {
    it('should return true when location permission is granted', async () => {
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });

      const isAvailable = await locationService.isLocationAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when location permission is denied', async () => {
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'denied',
        coarseLocation: 'denied'
      });

      const isAvailable = await locationService.isLocationAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when permission check fails', async () => {
      mockGeolocation.checkPermissions.mockRejectedValue(new Error('Permission check failed'));

      const isAvailable = await locationService.isLocationAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe('clearWatch', () => {
    it('should clear watch when watch ID exists', async () => {
      // Mock watch position to return a watch ID
      mockGeolocation.checkPermissions.mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });

      const mockWatchId = 'watch-123';
      mockGeolocation.watchPosition.mockResolvedValue(mockWatchId);

      const callback = vi.fn();
      await locationService.watchPosition(callback);
      
      await locationService.clearWatch();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith({ id: mockWatchId });
    });

    it('should not call clearWatch when no watch ID exists', async () => {
      await locationService.clearWatch();
      expect(mockGeolocation.clearWatch).not.toHaveBeenCalled();
    });
  });
});