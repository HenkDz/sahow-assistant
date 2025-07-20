import { describe, it, expect } from 'vitest';
import { QiblaService } from '../../../services/QiblaService';

describe('QiblaService - Compass Mode Preferences Integration', () => {

  describe('compass mode preferences integration', () => {
    it('should have compass mode preference methods available', () => {
      expect(typeof QiblaService.getCompassModePreference).toBe('function');
      expect(typeof QiblaService.setCompassModePreference).toBe('function');
      expect(typeof QiblaService.getPreferManualWhenSensorsFail).toBe('function');
      expect(typeof QiblaService.setPreferManualWhenSensorsFail).toBe('function');
    });

    it('should have automatic mode support detection method', () => {
      expect(typeof QiblaService.isAutomaticModeSupported).toBe('function');
    });

    it('should have static Qibla direction calculation method', () => {
      expect(typeof QiblaService.calculateStaticQiblaDirection).toBe('function');
    });
  });
});