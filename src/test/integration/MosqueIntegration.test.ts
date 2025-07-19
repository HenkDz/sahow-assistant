import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mosqueService } from '../../../services/MosqueService';
import { locationService } from '../../../services/LocationService';
import { Location } from '../../../types';

describe('Mosque Integration Tests', () => {
  let mockUserLocation: Location;

  beforeEach(() => {
    mockUserLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA'
    };

    // Reset any mocks
    vi.clearAllMocks();
  });

  describe('End-to-End Mosque Search Flow', () => {
    it('should complete full mosque search workflow', async () => {
      // Step 1: Get user location
      vi.spyOn(locationService, 'getCurrentLocation').mockResolvedValue({
        success: true,
        location: mockUserLocation
      });

      const userLocation = await mosqueService.getCurrentLocationForSearch();
      expect(userLocation).toEqual(mockUserLocation);

      // Step 2: Search for nearby mosques
      const searchResult = await mosqueService.searchNearbyMosques({
        location: userLocation!,
        radius: 10,
        limit: 5
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.mosques).toBeDefined();
      expect(searchResult.mosques!.length).toBeGreaterThan(0);

      // Step 3: Get details for first mosque
      const firstMosque = searchResult.mosques![0];
      const detailsResult = await mosqueService.getMosqueDetails(firstMosque.id);

      expect(detailsResult.success).toBe(true);
      expect(detailsResult.mosque).toBeDefined();
      expect(detailsResult.mosque!.id).toBe(firstMosque.id);

      // Step 4: Verify mosque has required information
      expect(detailsResult.mosque!.name).toBeDefined();
      expect(detailsResult.mosque!.address).toBeDefined();
      expect(detailsResult.mosque!.location).toBeDefined();
      // Note: distance is only available in search results, not in details
      expect(firstMosque.distance).toBeDefined();
    });

    it('should handle location permission denied gracefully', async () => {
      // Mock location service to return permission denied
      vi.spyOn(locationService, 'getCurrentLocation').mockResolvedValue({
        success: false,
        error: {
          code: 1,
          message: 'Location permission denied'
        }
      });

      vi.spyOn(locationService, 'getLastKnownLocation').mockReturnValue(null);

      const userLocation = await mosqueService.getCurrentLocationForSearch();
      expect(userLocation).toBeNull();

      // Should still be able to search with manual location
      const manualLocation: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA'
      };

      const searchResult = await mosqueService.searchNearbyMosques({
        location: manualLocation,
        radius: 10
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.mosques).toBeDefined();
    });

    it('should handle offline scenario with cached data', async () => {
      // Simulate offline scenario - service should still work with mock data
      const searchResult = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 20
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.mosques).toBeDefined();
      expect(searchResult.mosques!.length).toBeGreaterThan(0);

      // Verify that distances are calculated correctly
      searchResult.mosques!.forEach(mosque => {
        expect(mosque.distance).toBeDefined();
        expect(mosque.distance!).toBeGreaterThanOrEqual(0);
        expect(mosque.distance!).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('Search Functionality Integration', () => {
    it('should integrate text search with location-based sorting', async () => {
      // Search for mosques by text
      const textSearchResult = await mosqueService.searchMosquesByText('Mosque', mockUserLocation);

      expect(textSearchResult.success).toBe(true);
      expect(textSearchResult.mosques).toBeDefined();
      expect(textSearchResult.mosques!.length).toBeGreaterThan(0);

      // Verify that results include distances and are sorted
      for (let i = 1; i < textSearchResult.mosques!.length; i++) {
        const current = textSearchResult.mosques![i];
        const previous = textSearchResult.mosques![i - 1];
        
        expect(current.distance).toBeDefined();
        expect(previous.distance).toBeDefined();
        expect(current.distance!).toBeGreaterThanOrEqual(previous.distance!);
      }
    });

    it('should handle combined search criteria', async () => {
      // First get nearby mosques
      const nearbyResult = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 15
      });

      expect(nearbyResult.success).toBe(true);
      
      // Then search within those results by text
      const combinedResults = nearbyResult.mosques!.filter(mosque =>
        mosque.name.toLowerCase().includes('mosque') ||
        mosque.address.toLowerCase().includes('street')
      );

      expect(combinedResults.length).toBeGreaterThan(0);
      
      // Verify all results are within radius and match text criteria
      combinedResults.forEach(mosque => {
        expect(mosque.distance!).toBeLessThanOrEqual(15);
        expect(
          mosque.name.toLowerCase().includes('mosque') ||
          mosque.address.toLowerCase().includes('street')
        ).toBe(true);
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across operations', async () => {
      // Get mosque from search
      const searchResult = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 10
      });

      expect(searchResult.success).toBe(true);
      const searchMosque = searchResult.mosques![0];

      // Get same mosque from details
      const detailsResult = await mosqueService.getMosqueDetails(searchMosque.id);

      expect(detailsResult.success).toBe(true);
      const detailsMosque = detailsResult.mosque!;

      // Verify core data is consistent
      expect(detailsMosque.id).toBe(searchMosque.id);
      expect(detailsMosque.name).toBe(searchMosque.name);
      expect(detailsMosque.address).toBe(searchMosque.address);
      expect(detailsMosque.location.latitude).toBe(searchMosque.location.latitude);
      expect(detailsMosque.location.longitude).toBe(searchMosque.location.longitude);
    });

    it('should validate mosque data structure', async () => {
      const searchResult = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 50
      });

      expect(searchResult.success).toBe(true);
      
      searchResult.mosques!.forEach(mosque => {
        // Required fields
        expect(mosque.id).toBeDefined();
        expect(typeof mosque.id).toBe('string');
        expect(mosque.name).toBeDefined();
        expect(typeof mosque.name).toBe('string');
        expect(mosque.address).toBeDefined();
        expect(typeof mosque.address).toBe('string');
        
        // Location validation
        expect(mosque.location).toBeDefined();
        expect(typeof mosque.location.latitude).toBe('number');
        expect(typeof mosque.location.longitude).toBe('number');
        expect(mosque.location.latitude).toBeGreaterThanOrEqual(-90);
        expect(mosque.location.latitude).toBeLessThanOrEqual(90);
        expect(mosque.location.longitude).toBeGreaterThanOrEqual(-180);
        expect(mosque.location.longitude).toBeLessThanOrEqual(180);
        
        // Distance validation (should be present in search results)
        expect(mosque.distance).toBeDefined();
        expect(typeof mosque.distance).toBe('number');
        expect(mosque.distance!).toBeGreaterThanOrEqual(0);
        
        // Optional fields validation
        if (mosque.contactInfo) {
          if (mosque.contactInfo.phone) {
            expect(typeof mosque.contactInfo.phone).toBe('string');
          }
          if (mosque.contactInfo.email) {
            expect(typeof mosque.contactInfo.email).toBe('string');
            expect(mosque.contactInfo.email).toMatch(/\S+@\S+\.\S+/);
          }
          if (mosque.contactInfo.website) {
            expect(typeof mosque.contactInfo.website).toBe('string');
            expect(mosque.contactInfo.website).toMatch(/^https?:\/\//);
          }
        }
        
        if (mosque.specialEvents) {
          expect(Array.isArray(mosque.specialEvents)).toBe(true);
          mosque.specialEvents.forEach(event => {
            expect(typeof event).toBe('string');
          });
        }
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large radius searches efficiently', async () => {
      const startTime = Date.now();
      
      const result = await mosqueService.searchNearbyMosques({
        location: mockUserLocation,
        radius: 1000, // Very large radius
        limit: 100
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        mosqueService.searchNearbyMosques({
          location: {
            ...mockUserLocation,
            latitude: mockUserLocation.latitude + (i * 0.01) // Slightly different locations
          },
          radius: 10
        })
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.mosques).toBeDefined();
      });
    });

    it('should handle edge cases gracefully', async () => {
      // Test with extreme coordinates
      const extremeLocation: Location = {
        latitude: 89.9,
        longitude: 179.9,
        city: 'North Pole',
        country: 'Arctic'
      };

      const result = await mosqueService.searchNearbyMosques({
        location: extremeLocation,
        radius: 10
      });

      expect(result.success).toBe(true);
      expect(result.mosques).toBeDefined();
      // Should return empty array since no mosques are near the North Pole
      expect(result.mosques!.length).toBe(0);
    });
  });
});