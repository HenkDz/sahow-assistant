import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MosqueService } from '../../../services/MosqueService';
import { Location } from '../../../types';

// Mock the LocationService
vi.mock('../../../services/LocationService', () => ({
  locationService: {
    getCurrentLocation: vi.fn(),
    getLastKnownLocation: vi.fn()
  }
}));

describe('MosqueService', () => {
  let mosqueService: MosqueService;
  let mockUserLocation: Location;

  beforeEach(() => {
    mosqueService = new MosqueService();
    mockUserLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA'
    };
  });

  describe('searchNearbyMosques', () => {
    it('should return nearby mosques within specified radius', async () => {
      const result = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 10,
        limit: 5
      });

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      expect(result.mosques!.length).toBeGreaterThan(0);
      expect(result.mosques!.length).toBeLessThanOrEqual(5);
      
      // Check that all mosques have distance calculated
      result.mosques!.forEach(mosque => {
        expect(mosque.distance).toBeDefined();
        expect(mosque.distance!).toBeLessThanOrEqual(10);
      });
    });

    it('should sort mosques by distance', async () => {
      const result = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 50
      });

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      
      // Check that mosques are sorted by distance
      for (let i = 1; i < result.mosques!.length; i++) {
        expect(result.mosques![i].distance!).toBeGreaterThanOrEqual(result.mosques![i - 1].distance!);
      }
    });

    it('should respect the limit parameter', async () => {
      const result = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 50,
        limit: 2
      });

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      expect(result.mosques!.length).toBeLessThanOrEqual(2);
    });

    it('should filter out mosques beyond radius', async () => {
      const result = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 0.1 // Very small radius
      });

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      
      // All returned mosques should be within the radius
      result.mosques!.forEach(mosque => {
        expect(mosque.distance!).toBeLessThanOrEqual(0.1);
      });
    });

    it('should handle errors gracefully', async () => {
      // Test with invalid location
      const result = await mosqueService.searchNearbyMosques({
        location: {
          latitude: NaN,
          longitude: NaN,
          city: '',
          country: ''
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getMosqueDetails', () => {
    it('should return detailed mosque information for valid ID', async () => {
      const result = await mosqueService.getMosqueDetails('1');

      expect(result.success).toBe(true);
      expect(result.mosque).toBeDefined();
      expect(result.mosque!.id).toBe('1');
      expect(result.mosque!.name).toBeDefined();
      expect(result.mosque!.address).toBeDefined();
      expect(result.mosque!.location).toBeDefined();
    });

    it('should return error for invalid mosque ID', async () => {
      const result = await mosqueService.getMosqueDetails('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(404);
      expect(result.error!.message).toBe('Mosque not found');
    });

    it('should include contact information when available', async () => {
      const result = await mosqueService.getMosqueDetails('1');

      expect(result.success).toBe(true);
      expect(result.mosque!.contactInfo).toBeDefined();
      expect(result.mosque!.contactInfo!.phone).toBeDefined();
      expect(result.mosque!.contactInfo!.email).toBeDefined();
    });
  });

  describe('searchMosquesByText', () => {
    it('should find mosques by name', async () => {
      const result = await mosqueService.searchMosquesByText('Central');

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      expect(result.mosques!.length).toBeGreaterThan(0);
      expect(result.mosques![0].name.toLowerCase()).toContain('central');
    });

    it('should find mosques by address', async () => {
      const result = await mosqueService.searchMosquesByText('Main Street');

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      expect(result.mosques!.length).toBeGreaterThan(0);
      expect(result.mosques![0].address.toLowerCase()).toContain('main street');
    });

    it('should return empty array for no matches', async () => {
      const result = await mosqueService.searchMosquesByText('NonexistentMosque');

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      expect(result.mosques!.length).toBe(0);
    });

    it('should return empty array for empty query', async () => {
      const result = await mosqueService.searchMosquesByText('');

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      expect(result.mosques!.length).toBe(0);
    });

    it('should include distances when user location is provided', async () => {
      const result = await mosqueService.searchMosquesByText('Mosque', mockUserLocation);

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      
      result.mosques!.forEach(mosque => {
        expect(mosque.distance).toBeDefined();
        expect(typeof mosque.distance).toBe('number');
      });
    });
  });

  describe('distance calculation', () => {
    it('should calculate distance correctly', async () => {
      const location1: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA'
      };

      const location2: Location = {
        latitude: 40.7589,
        longitude: -73.9851,
        city: 'New York',
        country: 'USA'
      };

      const result = await mosqueService.searchNearbyMosques({
        location: location1,
        radius: 50
      });

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      
      // Find mosque at location2 and check distance
      const mosque = result.mosques!.find(m => 
        Math.abs(m.location.latitude - location2.latitude) < 0.001 &&
        Math.abs(m.location.longitude - location2.longitude) < 0.001
      );
      
      if (mosque) {
        expect(mosque.distance).toBeGreaterThan(0);
        expect(mosque.distance).toBeLessThan(10); // Should be reasonable distance
      }
    });
  });

  describe('utility methods', () => {
    it('should detect contact information availability', () => {
      const mosqueWithContact = {
        id: '1',
        name: 'Test Mosque',
        address: 'Test Address',
        location: mockUserLocation,
        contactInfo: {
          phone: '+1-555-0123'
        }
      };

      const mosqueWithoutContact = {
        id: '2',
        name: 'Test Mosque 2',
        address: 'Test Address 2',
        location: mockUserLocation
      };

      expect(mosqueService.hasContactInfo(mosqueWithContact)).toBe(true);
      expect(mosqueService.hasContactInfo(mosqueWithoutContact)).toBe(false);
    });

    it('should format contact information correctly', () => {
      const mosque = {
        id: '1',
        name: 'Test Mosque',
        address: 'Test Address',
        location: mockUserLocation,
        contactInfo: {
          phone: '+1-555-0123',
          email: 'test@mosque.org',
          website: 'https://mosque.org'
        }
      };

      const formatted = mosqueService.formatContactInfo(mosque);
      
      expect(formatted).toContain('Phone: +1-555-0123');
      expect(formatted).toContain('Email: test@mosque.org');
      expect(formatted).toContain('Website: https://mosque.org');
    });

    it('should format distance correctly', () => {
      expect(mosqueService.formatDistance(0.5)).toBe('500m');
      expect(mosqueService.formatDistance(1.2)).toBe('1.2km');
      expect(mosqueService.formatDistance(10.567)).toBe('10.6km');
    });
  });

  describe('navigation integration', () => {
    it('should handle maps navigation without errors', async () => {
      const mosque = {
        id: '1',
        name: 'Test Mosque',
        address: '123 Test Street, Test City',
        location: mockUserLocation
      };

      // Mock window.open to avoid actual navigation during tests
      const originalOpen = window.open;
      window.open = vi.fn();

      await mosqueService.openMapsForNavigation(mosque);

      expect(window.open).toHaveBeenCalled();
      
      // Restore original window.open
      window.open = originalOpen;
    });
  });
});