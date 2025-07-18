import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QiblaService } from '../../../services/QiblaService';
import { Location } from '../../../types';

describe('QiblaService', () => {
  let qiblaService: QiblaService;

  beforeEach(() => {
    qiblaService = new QiblaService();
    // Mock Device API
    vi.mock('@capacitor/device', () => ({
      Device: {
        getInfo: vi.fn().mockResolvedValue({ platform: 'web' })
      }
    }));
  });

  afterEach(() => {
    qiblaService.stopWatchingOrientation();
    vi.clearAllMocks();
  });

  describe('calculateQiblaDirection', () => {
    it('should calculate correct Qibla direction for New York', () => {
      const newYork: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA'
      };

      const result = QiblaService.calculateQiblaDirection(newYork);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.direction).toBeCloseTo(58.48, 1); // Expected Qibla direction for NYC
      expect(result.result!.distance).toBeCloseTo(10306, 0); // Expected distance to Mecca in km
    });

    it('should calculate correct Qibla direction for London', () => {
      const london: Location = {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country: 'UK'
      };

      const result = QiblaService.calculateQiblaDirection(london);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.direction).toBeCloseTo(118.99, 1); // Expected Qibla direction for London
      expect(result.result!.distance).toBeCloseTo(4794, 0); // Expected distance to Mecca in km
    });

    it('should calculate correct Qibla direction for Jakarta', () => {
      const jakarta: Location = {
        latitude: -6.2088,
        longitude: 106.8456,
        city: 'Jakarta',
        country: 'Indonesia'
      };

      const result = QiblaService.calculateQiblaDirection(jakarta);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.direction).toBeCloseTo(295.18, 1); // Expected Qibla direction for Jakarta
      expect(result.result!.distance).toBeCloseTo(7920, 0); // Expected distance to Mecca in km
    });

    it('should calculate correct Qibla direction for Sydney', () => {
      const sydney: Location = {
        latitude: -33.8688,
        longitude: 151.2093,
        city: 'Sydney',
        country: 'Australia'
      };

      const result = QiblaService.calculateQiblaDirection(sydney);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.direction).toBeCloseTo(277.50, 1); // Expected Qibla direction for Sydney
      expect(result.result!.distance).toBeCloseTo(13236, 0); // Expected distance to Mecca in km
    });

    it('should calculate correct Qibla direction for Cairo', () => {
      const cairo: Location = {
        latitude: 30.0444,
        longitude: 31.2357,
        city: 'Cairo',
        country: 'Egypt'
      };

      const result = QiblaService.calculateQiblaDirection(cairo);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.direction).toBeCloseTo(136.14, 1); // Expected Qibla direction for Cairo
      expect(result.result!.distance).toBeCloseTo(1287, 0); // Expected distance to Mecca in km
    });

    it('should calculate correct Qibla direction for Tokyo', () => {
      const tokyo: Location = {
        latitude: 35.6762,
        longitude: 139.6503,
        city: 'Tokyo',
        country: 'Japan'
      };

      const result = QiblaService.calculateQiblaDirection(tokyo);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.direction).toBeCloseTo(293.02, 1); // Expected Qibla direction for Tokyo
      expect(result.result!.distance).toBeCloseTo(9472, 0); // Expected distance to Mecca in km
    });

    it('should return 0 degrees and 0 distance for Mecca itself', () => {
      const mecca: Location = {
        latitude: 21.4225,
        longitude: 39.8262,
        city: 'Mecca',
        country: 'Saudi Arabia'
      };

      const result = QiblaService.calculateQiblaDirection(mecca);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.distance).toBeCloseTo(0, 1); // Should be very close to 0
    });

    it('should handle invalid latitude', () => {
      const invalidLocation: Location = {
        latitude: 91, // Invalid latitude
        longitude: 0,
        city: 'Invalid',
        country: 'Test'
      };

      const result = QiblaService.calculateQiblaDirection(invalidLocation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid location coordinates');
    });

    it('should handle invalid longitude', () => {
      const invalidLocation: Location = {
        latitude: 0,
        longitude: 181, // Invalid longitude
        city: 'Invalid',
        country: 'Test'
      };

      const result = QiblaService.calculateQiblaDirection(invalidLocation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid location coordinates');
    });

    it('should handle NaN coordinates', () => {
      const invalidLocation: Location = {
        latitude: NaN,
        longitude: 0,
        city: 'Invalid',
        country: 'Test'
      };

      const result = QiblaService.calculateQiblaDirection(invalidLocation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid location coordinates');
    });
  });

  describe('getDistanceToMecca', () => {
    it('should calculate correct distance for various locations', () => {
      const testCases = [
        {
          location: { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' },
          expectedDistance: 10306
        },
        {
          location: { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
          expectedDistance: 4794
        },
        {
          location: { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta', country: 'Indonesia' },
          expectedDistance: 7920
        }
      ];

      testCases.forEach(({ location, expectedDistance }) => {
        const distance = QiblaService.getDistanceToMecca(location);
        expect(distance).toBeCloseTo(expectedDistance, -1); // Within 10km tolerance
      });
    });

    it('should return 0 distance for Mecca', () => {
      const mecca: Location = {
        latitude: 21.4225,
        longitude: 39.8262,
        city: 'Mecca',
        country: 'Saudi Arabia'
      };

      const distance = QiblaService.getDistanceToMecca(mecca);
      expect(distance).toBeCloseTo(0, 1);
    });

    it('should throw error for invalid coordinates', () => {
      const invalidLocation: Location = {
        latitude: 91,
        longitude: 0,
        city: 'Invalid',
        country: 'Test'
      };

      expect(() => QiblaService.getDistanceToMecca(invalidLocation)).toThrow();
    });
  });

  describe('calculateCompassBearing', () => {
    it('should calculate correct compass bearing', () => {
      // If Qibla is at 90 degrees and device is pointing at 45 degrees,
      // compass should show 45 degrees (90 - 45)
      const compassBearing = QiblaService.calculateCompassBearing(90, 45);
      expect(compassBearing).toBe(45);
    });

    it('should handle negative compass bearings', () => {
      // If Qibla is at 30 degrees and device is pointing at 60 degrees,
      // compass should show 330 degrees (30 - 60 + 360)
      const compassBearing = QiblaService.calculateCompassBearing(30, 60);
      expect(compassBearing).toBe(330);
    });

    it('should handle compass bearings over 360', () => {
      // If Qibla is at 350 degrees and device is pointing at 320 degrees,
      // compass should show 30 degrees (350 - 320)
      const compassBearing = QiblaService.calculateCompassBearing(350, 320);
      expect(compassBearing).toBe(30);
    });

    it('should normalize to 0-360 range', () => {
      const testCases = [
        { qibla: 0, device: 0, expected: 0 },
        { qibla: 180, device: 90, expected: 90 },
        { qibla: 45, device: 315, expected: 90 },
        { qibla: 315, device: 45, expected: 270 }
      ];

      testCases.forEach(({ qibla, device, expected }) => {
        const result = QiblaService.calculateCompassBearing(qibla, device);
        expect(result).toBe(expected);
      });
    });
  });

  describe('isPointingTowardsQibla', () => {
    it('should return true when pointing towards Qibla within tolerance', () => {
      // Device pointing exactly towards Qibla
      expect(QiblaService.isPointingTowardsQibla(90, 90, 5)).toBe(true);
      
      // Device pointing within tolerance
      expect(QiblaService.isPointingTowardsQibla(90, 93, 5)).toBe(true);
      expect(QiblaService.isPointingTowardsQibla(90, 87, 5)).toBe(true);
    });

    it('should return false when not pointing towards Qibla', () => {
      // Device pointing away from Qibla
      expect(QiblaService.isPointingTowardsQibla(90, 100, 5)).toBe(false);
      expect(QiblaService.isPointingTowardsQibla(90, 80, 5)).toBe(false);
    });

    it('should handle edge cases around 0/360 degrees', () => {
      // Qibla at 2 degrees, device at 358 degrees (should be within 5 degree tolerance)
      expect(QiblaService.isPointingTowardsQibla(2, 358, 5)).toBe(true);
      
      // Qibla at 358 degrees, device at 2 degrees (should be within 5 degree tolerance)
      expect(QiblaService.isPointingTowardsQibla(358, 2, 5)).toBe(true);
    });

    it('should respect custom tolerance values', () => {
      // With 1 degree tolerance
      expect(QiblaService.isPointingTowardsQibla(90, 92, 1)).toBe(false);
      expect(QiblaService.isPointingTowardsQibla(90, 91, 1)).toBe(true);
      
      // With 10 degree tolerance
      expect(QiblaService.isPointingTowardsQibla(90, 100, 10)).toBe(true);
      expect(QiblaService.isPointingTowardsQibla(90, 101, 10)).toBe(false);
    });
  });

  describe('device orientation tracking', () => {
    beforeEach(() => {
      // Mock DeviceOrientationEvent
      global.DeviceOrientationEvent = class MockDeviceOrientationEvent extends Event {
        alpha: number | null = null;
        beta: number | null = null;
        gamma: number | null = null;
        
        constructor(type: string, eventInitDict?: DeviceOrientationEventInit) {
          super(type);
          if (eventInitDict) {
            this.alpha = eventInitDict.alpha || null;
            this.beta = eventInitDict.beta || null;
            this.gamma = eventInitDict.gamma || null;
          }
        }
      } as any;

      // Mock window.addEventListener
      global.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      } as any;
    });

    it('should start watching device orientation on web platform', async () => {
      const callback = vi.fn();
      
      const result = await qiblaService.watchDeviceOrientation(callback);
      
      expect(result).toBe(true);
      expect(window.addEventListener).toHaveBeenCalledWith('deviceorientation', expect.any(Function));
    });

    it('should stop watching device orientation', async () => {
      const callback = vi.fn();
      
      // First start watching
      await qiblaService.watchDeviceOrientation(callback);
      
      // Then stop watching
      qiblaService.stopWatchingOrientation();
      
      expect(window.removeEventListener).toHaveBeenCalledWith('deviceorientation', expect.any(Function));
    });

    it('should return last known orientation', () => {
      const initialOrientation = qiblaService.getLastKnownOrientation();
      expect(initialOrientation).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle locations at extreme latitudes', () => {
      const northPole: Location = {
        latitude: 90,
        longitude: 0,
        city: 'North Pole',
        country: 'Arctic'
      };

      const result = QiblaService.calculateQiblaDirection(northPole);
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should handle locations at extreme longitudes', () => {
      const dateLine: Location = {
        latitude: 0,
        longitude: 180,
        city: 'International Date Line',
        country: 'Pacific'
      };

      const result = QiblaService.calculateQiblaDirection(dateLine);
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should handle locations very close to Mecca', () => {
      const nearMecca: Location = {
        latitude: 21.4226, // Very close to Mecca
        longitude: 39.8263,
        city: 'Near Mecca',
        country: 'Saudi Arabia'
      };

      const result = QiblaService.calculateQiblaDirection(nearMecca);
      expect(result.success).toBe(true);
      expect(result.result!.distance).toBeLessThan(1); // Should be less than 1km
    });
  });
});