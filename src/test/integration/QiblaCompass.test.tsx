import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QiblaCompass from '../../../components/QiblaCompass';
import { Location } from '../../../types';

// Mock the services
vi.mock('../../../services/QiblaService', () => ({
  QiblaService: {
    calculateQiblaDirection: vi.fn(),
    calculateCompassBearing: vi.fn(),
    isPointingTowardsQibla: vi.fn()
  },
  qiblaService: {
    watchDeviceOrientation: vi.fn(),
    stopWatchingOrientation: vi.fn()
  }
}));

vi.mock('../../../services/LocationService', () => ({
  locationService: {
    getCurrentLocation: vi.fn()
  }
}));

describe('QiblaCompass Integration', () => {
  const mockLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  };

  const mockTranslations = {
    qibla_compass: 'Qibla Compass',
    distance_to_mecca: 'Distance to Mecca',
    loading_qibla: 'Finding Qibla direction...',
    error_title: 'Error',
    retry: 'Try Again',
    btn_back: 'Back',
    pointing_to_qibla: 'Pointing towards Qibla ✓',
    adjust_direction: 'Adjust your direction',
    compass_needs_calibration: 'Compass needs calibration',
    show_instructions: 'Show calibration instructions',
    hide_instructions: 'Hide instructions',
    qibla_info: 'About Qibla',
    qibla_description: 'The Qibla is the direction Muslims face during prayer, pointing towards the Kaaba in Mecca, Saudi Arabia.'
  };

  const mockOnBack = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock successful QiblaService responses
    const { QiblaService } = await import('../../../services/QiblaService');
    QiblaService.calculateQiblaDirection.mockReturnValue({
      success: true,
      result: {
        direction: 58.48,
        distance: 10306.31
      }
    });
    QiblaService.calculateCompassBearing.mockReturnValue(45);
    QiblaService.isPointingTowardsQibla.mockReturnValue(false);

    const { qiblaService } = await import('../../../services/QiblaService');
    qiblaService.watchDeviceOrientation.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <QiblaCompass
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
        userLocation={mockLocation}
      />
    );

    expect(screen.getByText('Finding Qibla direction...')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('should render compass after successful initialization', async () => {
    const { qiblaService } = await import('../../../services/QiblaService');
    
    // Mock successful orientation watching
    qiblaService.watchDeviceOrientation.mockImplementation((callback) => {
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
        t={mockTranslations}
        lang="en"
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
    const { locationService } = await import('../../../services/LocationService');
    locationService.getCurrentLocation.mockResolvedValue({
      success: false,
      error: {
        code: 1,
        message: 'Location permission denied'
      }
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
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
    const { QiblaService } = await import('../../../services/QiblaService');
    QiblaService.calculateQiblaDirection.mockReturnValue({
      success: false,
      error: 'Invalid location coordinates'
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid location coordinates')).toBeInTheDocument();
    });
  });

  it('should show calibration instructions when orientation is not supported', async () => {
    const { qiblaService } = await import('../../../services/QiblaService');
    qiblaService.watchDeviceOrientation.mockResolvedValue(false);

    render(
      <QiblaCompass
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
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
    const { qiblaService } = await import('../../../services/QiblaService');
    qiblaService.watchDeviceOrientation.mockImplementation((callback) => {
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
        t={mockTranslations}
        lang="en"
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
    const { QiblaService } = await import('../../../services/QiblaService');
    
    // First call fails
    QiblaService.calculateQiblaDirection.mockReturnValueOnce({
      success: false,
      error: 'Network error'
    });

    render(
      <QiblaCompass
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Mock successful retry
    QiblaService.calculateQiblaDirection.mockReturnValue({
      success: true,
      result: {
        direction: 58.48,
        distance: 10306.31
      }
    });

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Should attempt to initialize again
    expect(QiblaService.calculateQiblaDirection).toHaveBeenCalledTimes(2);
  });

  it('should show pointing indicator when device points to Qibla', async () => {
    const { QiblaService, qiblaService } = await import('../../../services/QiblaService');
    
    // Mock pointing towards Qibla
    QiblaService.isPointingTowardsQibla.mockReturnValue(true);
    
    qiblaService.watchDeviceOrientation.mockImplementation((callback) => {
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
        t={mockTranslations}
        lang="en"
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pointing towards Qibla ✓')).toBeInTheDocument();
    });
  });

  it('should show adjustment message when not pointing to Qibla', async () => {
    const { QiblaService, qiblaService } = await import('../../../services/QiblaService');
    
    // Mock not pointing towards Qibla
    QiblaService.isPointingTowardsQibla.mockReturnValue(false);
    
    qiblaService.watchDeviceOrientation.mockImplementation((callback) => {
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
        t={mockTranslations}
        lang="en"
        userLocation={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Adjust your direction')).toBeInTheDocument();
    });
  });

  it('should toggle calibration instructions', async () => {
    const { qiblaService } = await import('../../../services/QiblaService');
    
    // Mock orientation not calibrated
    qiblaService.watchDeviceOrientation.mockImplementation((callback) => {
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
        t={mockTranslations}
        lang="en"
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