import { Location, Mosque, PrayerTimes } from '../types';
import { locationService } from './LocationService';

export interface MosqueSearchOptions {
  location: Location;
  radius?: number; // in kilometers, default 10km
  limit?: number; // max results, default 20
}

export interface MosqueServiceResult {
  success: boolean;
  mosques?: Mosque[];
  error?: {
    code: number;
    message: string;
  };
}

export interface MosqueDetailResult {
  success: boolean;
  mosque?: Mosque;
  error?: {
    code: number;
    message: string;
  };
}

export class MosqueService {
  private mockMosques: Mosque[] = [
    {
      id: '1',
      name: 'Central Mosque',
      address: '123 Main Street, Downtown',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0123',
        email: 'info@centralmosque.org',
        website: 'https://centralmosque.org'
      },
      specialEvents: ['Friday Khutbah at 1:30 PM', 'Quran Study Circle - Sundays 10 AM']
    },
    {
      id: '2',
      name: 'Islamic Center of Peace',
      address: '456 Oak Avenue, Midtown',
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0456',
        email: 'contact@islamicpeace.org'
      },
      specialEvents: ['Community Iftar during Ramadan', 'Islamic Education Classes']
    },
    {
      id: '3',
      name: 'Masjid Al-Noor',
      address: '789 Pine Street, Uptown',
      location: {
        latitude: 40.7831,
        longitude: -73.9712,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0789',
        website: 'https://masjidalnoor.com'
      },
      specialEvents: ['Youth Programs - Saturdays', 'Arabic Language Classes']
    },
    {
      id: '4',
      name: 'Grand Mosque',
      address: '321 Elm Street, Westside',
      location: {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0321',
        email: 'admin@grandmosque.org',
        website: 'https://grandmosque.org'
      },
      specialEvents: ['Daily Tafseer after Maghrib', 'Women\'s Study Circle - Thursdays']
    },
    {
      id: '5',
      name: 'Masjid As-Salam',
      address: '654 Maple Drive, Eastside',
      location: {
        latitude: 40.7282,
        longitude: -73.7949,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-555-0654',
        email: 'info@masjidassalam.org'
      },
      specialEvents: ['Community Dinner - First Friday of each month']
    }
  ];

  /**
   * Search for nearby mosques based on location
   */
  async searchNearbyMosques(options: MosqueSearchOptions): Promise<MosqueServiceResult> {
    try {
      const { location, radius = 10, limit = 20 } = options;

      // Validate location
      if (!location || 
          typeof location.latitude !== 'number' || 
          typeof location.longitude !== 'number' ||
          isNaN(location.latitude) || 
          isNaN(location.longitude)) {
        throw new Error('Invalid location provided');
      }

      // Calculate distances and filter by radius
      const mosquesWithDistance = this.mockMosques
        .map(mosque => ({
          ...mosque,
          distance: this.calculateDistance(location, mosque.location)
        }))
        .filter(mosque => mosque.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      return {
        success: true,
        mosques: mosquesWithDistance
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 1,
          message: error.message || 'Failed to search for nearby mosques'
        }
      };
    }
  }

  /**
   * Get detailed information about a specific mosque
   */
  async getMosqueDetails(mosqueId: string): Promise<MosqueDetailResult> {
    try {
      const mosque = this.mockMosques.find(m => m.id === mosqueId);
      
      if (!mosque) {
        return {
          success: false,
          error: {
            code: 404,
            message: 'Mosque not found'
          }
        };
      }

      // In a real implementation, this would fetch additional details from an API
      const detailedMosque: Mosque = {
        ...mosque,
        // Add prayer times if available (mock data)
        prayerTimes: await this.getMosquePrayerTimes(mosque.location)
      };

      return {
        success: true,
        mosque: detailedMosque
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 1,
          message: error.message || 'Failed to get mosque details'
        }
      };
    }
  }

  /**
   * Get prayer times for a specific mosque location
   */
  private async getMosquePrayerTimes(location: Location): Promise<PrayerTimes | undefined> {
    try {
      // In a real implementation, this would use the PrayerTimesService
      // For now, return undefined to indicate prayer times are not available
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Calculate distance between two locations using Haversine formula
   */
  private calculateDistance(location1: Location, location2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(location2.latitude - location1.latitude);
    const dLon = this.toRadians(location2.longitude - location1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(location1.latitude)) * 
      Math.cos(this.toRadians(location2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Open device maps for navigation to mosque
   */
  async openMapsForNavigation(mosque: Mosque): Promise<void> {
    const { latitude, longitude } = mosque.location;
    const encodedAddress = encodeURIComponent(mosque.address);
    
    // Try to open native maps app
    const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15`;
    const appleMapsUrl = `http://maps.apple.com/?q=${encodedAddress}&ll=${latitude},${longitude}`;
    
    try {
      // Check if we're on iOS or Android and open appropriate maps app
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        window.open(appleMapsUrl, '_system');
      } else {
        window.open(mapsUrl, '_system');
      }
    } catch (error) {
      // Fallback to Google Maps in browser
      window.open(mapsUrl, '_blank');
    }
  }

  /**
   * Search mosques by name or address
   */
  async searchMosquesByText(query: string, userLocation?: Location): Promise<MosqueServiceResult> {
    try {
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) {
        return {
          success: true,
          mosques: []
        };
      }

      let filteredMosques = this.mockMosques.filter(mosque => 
        mosque.name.toLowerCase().includes(searchTerm) ||
        mosque.address.toLowerCase().includes(searchTerm)
      );

      // Add distances if user location is provided
      if (userLocation) {
        filteredMosques = filteredMosques.map(mosque => ({
          ...mosque,
          distance: this.calculateDistance(userLocation, mosque.location)
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      return {
        success: true,
        mosques: filteredMosques
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 1,
          message: error.message || 'Failed to search mosques by text'
        }
      };
    }
  }

  /**
   * Get user's current location for mosque search
   */
  async getCurrentLocationForSearch(): Promise<Location | null> {
    const result = await locationService.getCurrentLocation();
    
    if (result.success && result.location) {
      return result.location;
    }
    
    // Try to use last known location as fallback
    return locationService.getLastKnownLocation();
  }

  /**
   * Check if mosque has contact information
   */
  hasContactInfo(mosque: Mosque): boolean {
    return !!(mosque.contactInfo?.phone || mosque.contactInfo?.email || mosque.contactInfo?.website);
  }

  /**
   * Format mosque contact information for display
   */
  formatContactInfo(mosque: Mosque): string[] {
    const contactInfo: string[] = [];
    
    if (mosque.contactInfo?.phone) {
      contactInfo.push(`Phone: ${mosque.contactInfo.phone}`);
    }
    
    if (mosque.contactInfo?.email) {
      contactInfo.push(`Email: ${mosque.contactInfo.email}`);
    }
    
    if (mosque.contactInfo?.website) {
      contactInfo.push(`Website: ${mosque.contactInfo.website}`);
    }
    
    return contactInfo;
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }
}

// Export singleton instance
export const mosqueService = new MosqueService();