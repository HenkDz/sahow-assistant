import { Location, Mosque, PrayerTimes } from '../types';
import { locationService } from './LocationService';
import { OfflineStorageService } from './OfflineStorageService';

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

// Environment configuration for API keys
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
const USE_REAL_API = import.meta.env.VITE_USE_REAL_MOSQUE_API === 'true';

export class MosqueService {
  private expandedMockMosques: Mosque[] = [
    // New York Area
    {
      id: '1',
      name: 'Islamic Cultural Center of New York',
      address: '1711 3rd Avenue, New York, NY 10128',
      location: {
        latitude: 40.7831,
        longitude: -73.9712,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-212-722-5234',
        email: 'info@iccny.org',
        website: 'https://iccny.org'
      },
      specialEvents: ['Friday Khutbah at 1:15 PM', 'Islamic Education Classes', 'Community Events']
    },
    {
      id: '2',
      name: 'Masjid Malcolm Shabazz',
      address: '102 W 116th St, New York, NY 10026',
      location: {
        latitude: 40.8017,
        longitude: -73.9504,
        city: 'New York',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-212-662-2200'
      },
      specialEvents: ['Friday Prayer at 1:30 PM', 'Community Outreach Programs']
    },
    {
      id: '3',
      name: 'Masjid Al-Farah',
      address: '166-26 89th Ave, Jamaica, NY 11432',
      location: {
        latitude: 40.7057,
        longitude: -73.7967,
        city: 'Jamaica',
        country: 'USA'
      },
      contactInfo: {
        phone: '+1-718-658-3045'
      },
      specialEvents: ['Daily prayers', 'Quran classes for children']
    },
    // London Area
    {
      id: '4',
      name: 'Central London Mosque & Islamic Cultural Centre',
      address: '146 Park Rd, London NW8 7RG, UK',
      location: {
        latitude: 51.5355,
        longitude: -0.1725,
        city: 'London',
        country: 'UK'
      },
      contactInfo: {
        phone: '+44-20-7724-3363',
        email: 'admin@iccuk.org',
        website: 'https://www.iccuk.org'
      },
      specialEvents: ['Friday Prayer at 1:15 PM', 'Islamic Education', 'Community Services']
    },
    {
      id: '5',
      name: 'East London Mosque',
      address: '82-92 Whitechapel Rd, London E1 1JQ, UK',
      location: {
        latitude: 51.5188,
        longitude: -0.0608,
        city: 'London',
        country: 'UK'
      },
      contactInfo: {
        phone: '+44-20-7650-3000',
        website: 'https://www.eastlondonmosque.org.uk'
      },
      specialEvents: ['Friday Prayer', 'Educational Programs', 'Community Events']
    },
    // Dubai Area
    {
      id: '6',
      name: 'Jumeirah Mosque',
      address: 'Jumeirah Rd, Dubai, UAE',
      location: {
        latitude: 25.2312,
        longitude: 55.2663,
        city: 'Dubai',
        country: 'UAE'
      },
      contactInfo: {
        phone: '+971-4-353-6666'
      },
      specialEvents: ['Open House Tours', 'Cultural Understanding Programs']
    },
    {
      id: '7',
      name: 'Grand Mosque Sheikh Zayed Road',
      address: 'Sheikh Zayed Rd, Dubai, UAE',
      location: {
        latitude: 25.2285,
        longitude: 55.2750,
        city: 'Dubai',
        country: 'UAE'
      },
      contactInfo: {
        phone: '+971-4-398-8888'
      },
      specialEvents: ['Daily prayers', 'Ramadan programs']
    },
    // Toronto Area
    {
      id: '8',
      name: 'Islamic Society of North America Canada',
      address: '2200 South Sheridan Way, Mississauga, ON L5J 2M4, Canada',
      location: {
        latitude: 43.5890,
        longitude: -79.6441,
        city: 'Mississauga',
        country: 'Canada'
      },
      contactInfo: {
        phone: '+1-905-403-8406',
        email: 'info@isnacanada.com',
        website: 'https://www.isnacanada.com'
      },
      specialEvents: ['Friday Prayer', 'Educational Programs', 'Community Services']
    },
    {
      id: '9',
      name: 'Toronto and Region Islamic Congregation',
      address: '200 Nugget Ave, Scarborough, ON M1S 3A3, Canada',
      location: {
        latitude: 43.7849,
        longitude: -79.2620,
        city: 'Toronto',
        country: 'Canada'
      },
      contactInfo: {
        phone: '+1-416-321-0909',
        website: 'https://www.taric.ca'
      },
      specialEvents: ['Friday Prayer at 1:15 PM', 'Youth Programs', 'Community Events']
    },
    // Jakarta Area
    {
      id: '10',
      name: 'Istiqlal Mosque',
      address: 'Jl. Taman Wijaya Kusuma, Ps. Baru, Central Jakarta, Indonesia',
      location: {
        latitude: -6.1701,
        longitude: 106.8294,
        city: 'Jakarta',
        country: 'Indonesia'
      },
      contactInfo: {
        phone: '+62-21-3811708'
      },
      specialEvents: ['Friday Prayer', 'National Islamic Events', 'Tours Available']
    }
  ];

  /**
   * Search for nearby mosques with caching support
   */
  async searchNearbyMosquesWithCache(options: MosqueSearchOptions): Promise<MosqueServiceResult & { isFromCache: boolean }> {
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

      // Try to get from cache first
      const cachedMosques = await OfflineStorageService.getCachedMosques(location, radius);
      if (cachedMosques && cachedMosques.length > 0) {
        // Apply distance filter on cached results if needed
        const filteredMosques = cachedMosques
          .filter((mosque: Mosque) => !mosque.distance || mosque.distance <= radius)
          .slice(0, limit);

        return {
          success: true,
          mosques: filteredMosques,
          isFromCache: true
        };
      }

      // Get fresh data
      const result = await this.searchNearbyMosques(options);
      
      // Cache the results if successful
      if (result.success && result.mosques && result.mosques.length > 0) {
        await OfflineStorageService.cacheMosques(result.mosques, location, radius);
      }

      return {
        ...result,
        isFromCache: false
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 1,
          message: error.message || 'Failed to search for nearby mosques'
        },
        isFromCache: false
      };
    }
  }

  /**
   * Search for nearby mosques using Google Places API with OpenStreetMap fallback
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

      // Try real API first if enabled and API key is available
      if (USE_REAL_API && GOOGLE_PLACES_API_KEY) {
        try {
          const realResults = await this.searchMosquesWithGooglePlaces(location, radius, limit);
          if (realResults.success && realResults.mosques && realResults.mosques.length > 0) {
            return realResults;
          }
        } catch (error) {
          console.warn('Google Places API failed, falling back to OpenStreetMap:', error);
        }
      }

      // Try OpenStreetMap as fallback
      if (USE_REAL_API) {
        try {
          const osmResults = await this.searchMosquesWithOpenStreetMap(location, radius, limit);
          if (osmResults.success && osmResults.mosques && osmResults.mosques.length > 0) {
            return osmResults;
          }
        } catch (error) {
          console.warn('OpenStreetMap API failed, falling back to mock data:', error);
        }
      }

      // Fallback to enhanced mock data
      return this.searchMosquesFromMockData(location, radius, limit);

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
   * Search mosques using Google Places API
   */
  private async searchMosquesWithGooglePlaces(
    location: Location,
    radius: number,
    limit: number
  ): Promise<MosqueServiceResult> {
    const radiusInMeters = radius * 1000;
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    
    url.searchParams.append('location', `${location.latitude},${location.longitude}`);
    url.searchParams.append('radius', radiusInMeters.toString());
    url.searchParams.append('type', 'place_of_worship');
    url.searchParams.append('keyword', 'mosque masjid islamic');
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const mosques: Mosque[] = data.results
      .slice(0, limit)
      .map((place: any) => {
        const mosqueLocation: Location = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          city: location.city,
          country: location.country
        };

        return {
          id: place.place_id,
          name: place.name,
          address: place.formatted_address || place.vicinity || 'Address not available',
          location: mosqueLocation,
          distance: this.calculateDistance(location, mosqueLocation),
          contactInfo: {
            // Note: Details like phone would require a separate Places Details API call
          },
          specialEvents: []
        };
      });

         return {
       success: true,
       mosques: mosques.sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0))
     };
  }

  /**
   * Search mosques using OpenStreetMap Overpass API
   */
  private async searchMosquesWithOpenStreetMap(
    location: Location,
    radius: number,
    limit: number
  ): Promise<MosqueServiceResult> {
    const radiusInMeters = radius * 1000;
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusInMeters},${location.latitude},${location.longitude});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusInMeters},${location.latitude},${location.longitude});
        relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusInMeters},${location.latitude},${location.longitude});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenStreetMap API error: ${response.status}`);
    }

    const data = await response.json();
    
    const mosques: Mosque[] = data.elements
      .slice(0, limit)
      .map((element: any) => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        if (!lat || !lon) return null;

        const mosqueLocation: Location = {
          latitude: lat,
          longitude: lon,
          city: location.city,
          country: location.country
        };

        const name = element.tags?.name || 
                    element.tags?.['name:en'] || 
                    element.tags?.['name:ar'] || 
                    'Mosque';

        const address = this.buildAddressFromOSMTags(element.tags) || 'Address not available';

        return {
          id: `osm_${element.type}_${element.id}`,
          name,
          address,
          location: mosqueLocation,
          distance: this.calculateDistance(location, mosqueLocation),
          contactInfo: {
            phone: element.tags?.phone,
            website: element.tags?.website
          },
          specialEvents: []
        };
      })
      .filter((mosque: Mosque | null): mosque is Mosque => mosque !== null) // Remove null entries
      .sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));

    return {
      success: true,
      mosques
    };
  }

  /**
   * Build address from OpenStreetMap tags
   */
  private buildAddressFromOSMTags(tags: any): string {
    const parts = [];
    
    // Build address in logical order
    if (tags?.['addr:housenumber'] && tags?.['addr:street']) {
      parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
    } else if (tags?.['addr:street']) {
      parts.push(tags['addr:street']);
    }
    
    if (tags?.['addr:suburb']) parts.push(tags['addr:suburb']);
    if (tags?.['addr:city']) parts.push(tags['addr:city']);
    if (tags?.['addr:state']) parts.push(tags['addr:state']);
    if (tags?.['addr:postcode']) parts.push(tags['addr:postcode']);
    if (tags?.['addr:country']) parts.push(tags['addr:country']);
    
    // If no structured address, try to use name or other fields
    if (parts.length === 0) {
      if (tags?.name) return `${tags.name} area`;
      if (tags?.place) return `${tags.place} area`;
    }
    
    return parts.length > 0 ? parts.join(', ') : '';
  }

  /**
   * Search from enhanced mock data as fallback
   */
  private searchMosquesFromMockData(
    location: Location,
    radius: number,
    limit: number
  ): MosqueServiceResult {
    const mosquesWithDistance = this.expandedMockMosques
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
  }

  /**
   * Get detailed information about a specific mosque
   */
  async getMosqueDetails(mosqueId: string): Promise<MosqueDetailResult> {
    try {
      // Check if it's a Google Places ID
      if (GOOGLE_PLACES_API_KEY && !mosqueId.startsWith('osm_') && mosqueId.length > 10) {
        try {
          const details = await this.getMosqueDetailsFromGooglePlaces(mosqueId);
          if (details.success) {
            return details;
          }
        } catch (error) {
          console.warn('Failed to get Google Places details:', error);
        }
      }

      // Fallback to mock data
      const mosque = this.expandedMockMosques.find(m => m.id === mosqueId);
      
      if (!mosque) {
        return {
          success: false,
          error: {
            code: 404,
            message: 'Mosque not found'
          }
        };
      }

      const detailedMosque: Mosque = {
        ...mosque,
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
   * Get mosque details from Google Places API
   */
  private async getMosqueDetailsFromGooglePlaces(placeId: string): Promise<MosqueDetailResult> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', 'name,formatted_address,formatted_phone_number,website,opening_hours,geometry');
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places Details API error: ${data.status}`);
    }

    const place = data.result;
    const mosque: Mosque = {
      id: placeId,
      name: place.name,
      address: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        city: '', // Would need geocoding to get city
        country: ''
      },
      contactInfo: {
        phone: place.formatted_phone_number,
        website: place.website
      },
      specialEvents: []
    };

    return {
      success: true,
      mosque
    };
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
   * Search mosques by text with caching support
   */
  async searchMosquesByTextWithCache(query: string, userLocation?: Location): Promise<MosqueServiceResult & { isFromCache: boolean }> {
    try {
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) {
        return {
          success: true,
          mosques: [],
          isFromCache: false
        };
      }

      // Try to get from cache first (using a 50km default radius for text searches)
      if (userLocation) {
        const cachedMosques = await OfflineStorageService.getCachedMosques(userLocation, 50, searchTerm);
        if (cachedMosques && cachedMosques.length > 0) {
          return {
            success: true,
            mosques: cachedMosques,
            isFromCache: true
          };
        }
      }

      // Get fresh data
      const result = await this.searchMosquesByText(query, userLocation);
      
      // Cache the results if successful and we have a location
      if (result.success && result.mosques && result.mosques.length > 0 && userLocation) {
        await OfflineStorageService.cacheMosques(result.mosques, userLocation, 50, searchTerm);
      }

      return {
        ...result,
        isFromCache: false
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 1,
          message: error.message || 'Failed to search mosques by text'
        },
        isFromCache: false
      };
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

      // Try Google Places Text Search if available
      if (USE_REAL_API && GOOGLE_PLACES_API_KEY) {
        try {
          const realResults = await this.searchMosquesByTextWithGooglePlaces(searchTerm, userLocation);
          if (realResults.success && realResults.mosques && realResults.mosques.length > 0) {
            return realResults;
          }
        } catch (error) {
          console.warn('Google Places text search failed, using mock data:', error);
        }
      }

      // Fallback to mock data search
      let filteredMosques = this.expandedMockMosques.filter(mosque => 
        mosque.name.toLowerCase().includes(searchTerm) ||
        mosque.address.toLowerCase().includes(searchTerm) ||
        mosque.location.city.toLowerCase().includes(searchTerm)
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
   * Search mosques by text using Google Places API
   */
  private async searchMosquesByTextWithGooglePlaces(
    query: string,
    userLocation?: Location
  ): Promise<MosqueServiceResult> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', `${query} mosque masjid`);
    url.searchParams.append('type', 'place_of_worship');
    if (userLocation) {
      url.searchParams.append('location', `${userLocation.latitude},${userLocation.longitude}`);
      url.searchParams.append('radius', '50000'); // 50km radius for text search
    }
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Places Text Search API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places Text Search API error: ${data.status}`);
    }

    const mosques: Mosque[] = data.results.map((place: any) => {
      const mosqueLocation: Location = {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        city: userLocation?.city || '',
        country: userLocation?.country || ''
      };

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || 'Address not available',
        location: mosqueLocation,
        distance: userLocation ? this.calculateDistance(userLocation, mosqueLocation) : undefined,
        contactInfo: {},
        specialEvents: []
      };
    });

    return {
      success: true,
      mosques: mosques.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    };
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

  /**
   * Clear cached mosque data to force fresh results
   */
  async clearMosqueCache(): Promise<void> {
    await OfflineStorageService.clearCachedMosques();
  }

  /**
   * Check if mosque cache is valid for given parameters
   */
  async isCacheValid(location: Location, radius: number, query?: string): Promise<boolean> {
    return await OfflineStorageService.isMosqueCacheValid(location, radius, query);
  }
}

// Export singleton instance
export const mosqueService = new MosqueService();