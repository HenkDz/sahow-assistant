import { create } from 'zustand';
import { Location } from '../types';

interface LocationState {
  currentLocation: Location | null;
  isGpsEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  setLocation: (location: Location) => void;
  setGpsEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLocation: () => void;
  updateLocationFromGps: (latitude: number, longitude: number, city?: string, country?: string) => void;
  setManualLocation: (city: string, country: string, latitude: number, longitude: number) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isGpsEnabled: false,
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  setLocation: (location) =>
    set({
      currentLocation: location,
      lastUpdated: new Date(),
      error: null,
    }),
  
  setGpsEnabled: (isGpsEnabled) => set({ isGpsEnabled }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearLocation: () =>
    set({
      currentLocation: null,
      lastUpdated: null,
      error: null,
    }),
  
  updateLocationFromGps: (latitude, longitude, city = 'Unknown', country = 'Unknown') =>
    set({
      currentLocation: {
        latitude,
        longitude,
        city,
        country,
      },
      isGpsEnabled: true,
      lastUpdated: new Date(),
      error: null,
    }),
  
  setManualLocation: (city, country, latitude, longitude) =>
    set({
      currentLocation: {
        latitude,
        longitude,
        city,
        country,
      },
      isGpsEnabled: false,
      lastUpdated: new Date(),
      error: null,
    }),
}));