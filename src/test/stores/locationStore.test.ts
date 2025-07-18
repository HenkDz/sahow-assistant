import { describe, it, expect, beforeEach } from 'vitest';
import { useLocationStore } from '../../../stores/locationStore';
import { Location } from '../../../types';

describe('LocationStore', () => {
  const mockLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA',
  };

  beforeEach(() => {
    // Reset store state before each test
    useLocationStore.setState({
      currentLocation: null,
      isGpsEnabled: false,
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  });

  it('should have initial state', () => {
    const state = useLocationStore.getState();
    
    expect(state.currentLocation).toBeNull();
    expect(state.isGpsEnabled).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastUpdated).toBeNull();
  });

  it('should set location', () => {
    const { setLocation } = useLocationStore.getState();
    
    setLocation(mockLocation);
    
    const state = useLocationStore.getState();
    expect(state.currentLocation).toEqual(mockLocation);
    expect(state.lastUpdated).toBeInstanceOf(Date);
    expect(state.error).toBeNull();
  });

  it('should set GPS enabled state', () => {
    const { setGpsEnabled } = useLocationStore.getState();
    
    setGpsEnabled(true);
    
    const state = useLocationStore.getState();
    expect(state.isGpsEnabled).toBe(true);
  });

  it('should set loading state', () => {
    const { setLoading } = useLocationStore.getState();
    
    setLoading(true);
    
    const state = useLocationStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const { setError } = useLocationStore.getState();
    const errorMessage = 'Location access denied';
    
    setError(errorMessage);
    
    const state = useLocationStore.getState();
    expect(state.error).toBe(errorMessage);
  });

  it('should clear location', () => {
    const { setLocation, clearLocation } = useLocationStore.getState();
    
    // Set up some data first
    setLocation(mockLocation);
    
    clearLocation();
    
    const state = useLocationStore.getState();
    expect(state.currentLocation).toBeNull();
    expect(state.lastUpdated).toBeNull();
    expect(state.error).toBeNull();
  });

  it('should update location from GPS', () => {
    const { updateLocationFromGps } = useLocationStore.getState();
    
    updateLocationFromGps(40.7128, -74.0060, 'New York', 'USA');
    
    const state = useLocationStore.getState();
    expect(state.currentLocation).toEqual(mockLocation);
    expect(state.isGpsEnabled).toBe(true);
    expect(state.lastUpdated).toBeInstanceOf(Date);
    expect(state.error).toBeNull();
  });

  it('should update location from GPS with default city/country', () => {
    const { updateLocationFromGps } = useLocationStore.getState();
    
    updateLocationFromGps(40.7128, -74.0060);
    
    const state = useLocationStore.getState();
    expect(state.currentLocation?.latitude).toBe(40.7128);
    expect(state.currentLocation?.longitude).toBe(-74.0060);
    expect(state.currentLocation?.city).toBe('Unknown');
    expect(state.currentLocation?.country).toBe('Unknown');
    expect(state.isGpsEnabled).toBe(true);
  });

  it('should set manual location', () => {
    const { setManualLocation } = useLocationStore.getState();
    
    setManualLocation('New York', 'USA', 40.7128, -74.0060);
    
    const state = useLocationStore.getState();
    expect(state.currentLocation).toEqual(mockLocation);
    expect(state.isGpsEnabled).toBe(false);
    expect(state.lastUpdated).toBeInstanceOf(Date);
    expect(state.error).toBeNull();
  });
});