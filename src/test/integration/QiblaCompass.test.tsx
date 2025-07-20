import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QiblaCompass from '../../../components/qibla/QiblaCompass';
import { Location } from '../../../types';

// Mock the services
const mockCalculateQiblaDirection = vi.fn();
const mockCalculateCompassBearing = vi.fn();
const mockIsPointingTowardsQibla = vi.fn();
const mockWatchDeviceOrientation = vi.fn();
const mockStopWatchingOrientation = vi.fn();
const mockGetCurrentLocation = vi.fn();

vi.mock('../../../services/QiblaService', () => ({
  QiblaService: {
    calculateQiblaDirection: mockCalculateQiblaDirection,
    calculateCompassBearing: mockCalculateCompassBearing,
    isPointingTowardsQibla: mockIsPointingTowardsQibla
  },
  qiblaService: {
    watchDeviceOrientation: mockWatchDeviceOrientation,
    stopWatchingOrientation: mockStopWatchingOrientation
  }
}));

vi.mock('../../../services/LocationService', () => ({
  locationService: {
    getCurrentLocation: mockGetCurrentLocation
  }
}));

// Mock i18n provider
vi.mock('../../../i18n/I18nProvider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'title': 'Qibla Compass',
        'distance_to_kaaba': 'Distance to Mecca',
        'loading': 'Finding Qibla direction...',
        'location_required': 'Location required',
        'direction': 'Pointing towards Qibla ✓',
        'common:status.error_title': 'Error',
        'common:buttons.retry': 'Try Again',
        'compass.calibration': 'Calibration Instructions',
        'compass.instructions': 'Hold your device flat and level'
      };
      return translations[key] || key;
    },
    isRTL: false
  })
}));

describe('QiblaCompass Integration', () => {
  const mockLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  };

  const mockOnBack = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock successful QiblaService responses
    mockCalculateQiblaDirection.mockReturnValue({
      success: true,
      result: {
        direction: 58.48,
        distance: 10306.31
      }
    });
    mockCalculateCompassBearing.mockReturnValue(45);
    mockIsPointingTowardsQibla.mockReturnValue(false);
    mockWatchDeviceOrientation.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    expect(screen.getByText('Finding Qibla direction...')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('should render compass after successful initialization', async () => {
    // Mock successful orientation watching
    mockWatchDeviceOrientation.mockImplementation((callback: (result: any) => void) => {
      // Simulate successful orientation callback
      setTimeout(() => {
        callback({
          success: true,
          orientation: 90
        });
      }, 100);
      return Promise.resolve(true);
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Qibla Compass')).toBeInTheDocument();
    });

    // Check if compass elements are rendered
    expect(screen.getByText('Distance to Mecca')).toBeInTheDocument();
    expect(screen.getByText('10306km')).toBeInTheDocument(); // Distance formatted
    expect(screen.getByText('New York, USA')).toBeInTheDocument();
  });

  it('should handle location service error gracefully', async () => {
    mockGetCurrentLocation.mockResolvedValue({
      success: false,
      error: {
        code: 1,
        message: 'Location permission denied'
      }
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        // No userLocation provided to trigger location service call
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Location permission denied')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle QiblaService calculation error', async () => {
    mockCalculateQiblaDirection.mockReturnValue({
      success: false,
      error: 'Invalid location coordinates'
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid location coordinates')).toBeInTheDocument();
    });
  });

  it('should show calibration instructions when orientation is not supported', async () => {
    mockWatchDeviceOrientation.mockResolvedValue(false);

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Device orientation not supported')).toBeInTheDocument();
    });

    // Check if calibration instructions are shown
    expect(screen.getByText('Calibration Instructions')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', async () => {
    mockWatchDeviceOrientation.mockImplementation((callback: (result: any) => void) => {
      setTimeout(() => {
        callback({
          success: true,
          orientation: 0
        });
      }, 100);
      return Promise.resolve(true);
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Qibla Compass')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should retry initialization when retry button is clicked', async () => {
    // First call fails
    mockCalculateQiblaDirection.mockReturnValueOnce({
      success: false,
      error: 'Network error'
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Mock successful retry
    mockCalculateQiblaDirection.mockReturnValue({
      success: true,
      result: {
        direction: 58.48,
        distance: 10306.31
      }
    });

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Should attempt to initialize again
    expect(mockCalculateQiblaDirection).toHaveBeenCalledTimes(2);
  });

  it('should show pointing indicator when device points to Qibla', async () => {
    // Mock pointing towards Qibla
    mockIsPointingTowardsQibla.mockReturnValue(true);
    
    mockWatchDeviceOrientation.mockImplementation((callback: (result: any) => void) => {
      setTimeout(() => {
        callback({
          success: true,
          orientation: 58 // Close to Qibla direction
        });
      }, 100);
      return Promise.resolve(true);
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pointing towards Qibla ✓')).toBeInTheDocument();
    });
  });

  it('should show adjustment message when not pointing to Qibla', async () => {
    // Mock not pointing towards Qibla
    mockIsPointingTowardsQibla.mockReturnValue(false);
    
    mockWatchDeviceOrientation.mockImplementation((callback: (result: any) => void) => {
      setTimeout(() => {
        callback({
          success: true,
          orientation: 180 // Opposite direction
        });
      }, 100);
      return Promise.resolve(true);
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Adjust your direction')).toBeInTheDocument();
    });
  });

  it('should toggle calibration instructions', async () => {
    // Mock orientation not calibrated
    mockWatchDeviceOrientation.mockImplementation((callback: (result: any) => void) => {
      setTimeout(() => {
        callback({
          success: true,
          orientation: 0
        });
      }, 100);
      return Promise.resolve(true);
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Qibla Compass')).toBeInTheDocument();
    });

    // Initially instructions should be hidden
    expect(screen.queryByText('Hold your device flat and level')).not.toBeInTheDocument();

    // Click to show instructions
    const showButton = screen.getByText('Show calibration instructions');
    fireEvent.click(showButton);

    expect(screen.getByText('Hide instructions')).toBeInTheDocument();
    expect(screen.getByText('Hold your device flat and level')).toBeInTheDocument();

    // Click to hide instructions
    const hideButton = screen.getByText('Hide instructions');
    fireEvent.click(hideButton);

    expect(screen.getByText('Show calibration instructions')).toBeInTheDocument();
    expect(screen.queryByText('Hold your device flat and level')).not.toBeInTheDocument();
  });
});