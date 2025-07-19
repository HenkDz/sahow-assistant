import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LocationPermissionModal from '../../../components/LocationPermissionModal';
import ManualLocationInput from '../../../components/ManualLocationInput';
import LocationStatusIndicator from '../../../components/LocationStatusIndicator';

// Mock translations for testing - these should match the i18n keys
const mockTranslations = {
  location_error: 'Location Error',
  location_permission_denied: 'Location Permission Denied',
  location_unavailable: 'Location Unavailable',
  location_timeout: 'Location Request Timeout',
  location_error_generic: 'An error occurred while getting your location.',
  location_permission_help: 'To enable location services, go to your device settings and allow location access for this app.',
  btn_manual_location: 'Enter Location Manually',
  btn_retry: 'Try Again',
  btn_cancel: 'Cancel',
  manual_location_title: 'Set Your Location',
  manual_location_desc: 'Enter your city and country to get accurate prayer times.',
  quick_select_cities: 'Quick Select',
  label_city: 'City',
  label_country: 'Country',
  label_use_coordinates: 'I know the exact coordinates',
  label_latitude: 'Latitude',
  label_longitude: 'Longitude',
  placeholder_city: 'Enter your city',
  placeholder_country: 'Enter your country',
  error_city_required: 'City is required',
  error_country_required: 'Country is required',
  error_invalid_latitude: 'Latitude must be between -90 and 90',
  error_invalid_longitude: 'Longitude must be between -180 and 180',
  btn_set_location: 'Set Location',
  btn_reset: 'Reset',
  location_loading: 'Getting location...',
  location_not_set: 'Location not set',
  location_gps: 'GPS Location',
  location_manual: 'Manual Location',
  location_unknown: 'Unknown location',
  location_tap_to_set: 'Tap to set your location',
  status_gps: 'GPS',
  status_manual: 'Manual',
};

describe('LocationPermissionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onRetry: vi.fn(),
    onManualInput: vi.fn(),
    error: null,
    t: mockTranslations
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<LocationPermissionModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Location Error')).not.toBeInTheDocument();
  });

  it('should render permission denied error correctly', () => {
    const error = { code: 1, message: 'Permission denied' };
    render(<LocationPermissionModal {...defaultProps} error={error} />);
    
    expect(screen.getByText('Location Permission Denied')).toBeInTheDocument();
    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.getByText('Enter Location Manually')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render position unavailable error with retry option', () => {
    const error = { code: 2, message: 'Position unavailable' };
    render(<LocationPermissionModal {...defaultProps} error={error} />);
    
    expect(screen.getByText('Location Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Position unavailable')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Enter Location Manually')).toBeInTheDocument();
  });

  it('should render timeout error with retry option', () => {
    const error = { code: 3, message: 'Request timeout' };
    render(<LocationPermissionModal {...defaultProps} error={error} />);
    
    expect(screen.getByText('Location Request Timeout')).toBeInTheDocument();
    expect(screen.getByText('Request timeout')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should call onManualInput when manual input button is clicked', () => {
    const error = { code: 1, message: 'Permission denied' };
    render(<LocationPermissionModal {...defaultProps} error={error} />);
    
    fireEvent.click(screen.getByText('Enter Location Manually'));
    expect(defaultProps.onManualInput).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry when retry button is clicked', () => {
    const error = { code: 3, message: 'Timeout' };
    render(<LocationPermissionModal {...defaultProps} error={error} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    const error = { code: 1, message: 'Permission denied' };
    render(<LocationPermissionModal {...defaultProps} error={error} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ManualLocationInput', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onLocationSet: vi.fn(),
    t: mockTranslations
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<ManualLocationInput {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Set Your Location')).not.toBeInTheDocument();
  });

  it('should render with initial location values', () => {
    const initialLocation = {
      city: 'Mecca',
      country: 'Saudi Arabia',
      latitude: 21.4225,
      longitude: 39.8262
    };
    
    render(<ManualLocationInput {...defaultProps} initialLocation={initialLocation} />);
    
    expect(screen.getByDisplayValue('Mecca')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saudi Arabia')).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    render(<ManualLocationInput {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Set Location'));
    
    await waitFor(() => {
      expect(screen.getByText('City is required')).toBeInTheDocument();
      expect(screen.getByText('Country is required')).toBeInTheDocument();
    });
  });

  it('should validate coordinates when coordinates option is enabled', async () => {
    const { container } = render(<ManualLocationInput {...defaultProps} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Enter your city'), {
      target: { value: 'Test City' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your country'), {
      target: { value: 'Test Country' }
    });
    
    // Enable coordinates
    fireEvent.click(screen.getByLabelText('I know the exact coordinates'));
    
    // Enter invalid coordinates
    fireEvent.change(screen.getByPlaceholderText('21.4225'), {
      target: { value: '91' } // Invalid latitude
    });
    fireEvent.change(screen.getByPlaceholderText('39.8262'), {
      target: { value: '181' } // Invalid longitude
    });
    
    // Submit form to trigger validation
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Check if validation errors appear
      const latError = container.querySelector('.text-red-500');
      expect(latError).toBeInTheDocument();
    });
  });

  it('should call onLocationSet with correct data when form is valid', async () => {
    render(<ManualLocationInput {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your city'), {
      target: { value: 'Mecca' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your country'), {
      target: { value: 'Saudi Arabia' }
    });
    
    fireEvent.click(screen.getByText('Set Location'));
    
    await waitFor(() => {
      expect(defaultProps.onLocationSet).toHaveBeenCalledWith({
        city: 'Mecca',
        country: 'Saudi Arabia',
        latitude: 0,
        longitude: 0
      });
    });
  });

  it('should handle quick city selection', () => {
    render(<ManualLocationInput {...defaultProps} />);
    
    // Click on Mecca quick select button
    fireEvent.click(screen.getByText('Mecca'));
    
    expect(screen.getByDisplayValue('Mecca')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saudi Arabia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('21.4225')).toBeInTheDocument();
    expect(screen.getByDisplayValue('39.8262')).toBeInTheDocument();
  });

  it('should reset form when reset button is clicked', () => {
    render(<ManualLocationInput {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Enter your city'), {
      target: { value: 'Test City' }
    });
    
    // Reset form
    fireEvent.click(screen.getByText('Reset'));
    
    expect(screen.getByPlaceholderText('Enter your city')).toHaveValue('');
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<ManualLocationInput {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('LocationStatusIndicator', () => {
  const defaultProps = {
    location: null,
    isGpsLocation: false,
    isLoading: false,
    t: mockTranslations
  };

  afterEach(() => {
    cleanup();
  });

  it('should show loading state', () => {
    render(<LocationStatusIndicator {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Getting location...')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show location not set state', () => {
    render(<LocationStatusIndicator {...defaultProps} />);
    
    expect(screen.getByText('Location not set')).toBeInTheDocument();
    expect(screen.getByText('Tap to set your location')).toBeInTheDocument();
  });

  it('should show GPS location correctly', () => {
    const location = {
      city: 'Mecca',
      country: 'Saudi Arabia',
      latitude: 21.4225,
      longitude: 39.8262
    };
    
    render(<LocationStatusIndicator {...defaultProps} location={location} isGpsLocation={true} />);
    
    expect(screen.getByText('GPS Location')).toBeInTheDocument();
    expect(screen.getByText('GPS')).toBeInTheDocument();
    expect(screen.getByText('Mecca, Saudi Arabia')).toBeInTheDocument();
  });

  it('should show manual location correctly', () => {
    const location = {
      city: 'Mecca',
      country: 'Saudi Arabia',
      latitude: 21.4225,
      longitude: 39.8262
    };
    
    render(<LocationStatusIndicator {...defaultProps} location={location} isGpsLocation={false} />);
    
    expect(screen.getByText('Manual Location')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Mecca, Saudi Arabia')).toBeInTheDocument();
  });

  it('should show coordinates when city/country not available', () => {
    const location = {
      city: '',
      country: '',
      latitude: 21.4225,
      longitude: 39.8262
    };
    
    render(<LocationStatusIndicator {...defaultProps} location={location} />);
    
    expect(screen.getByText('21.4225, 39.8262')).toBeInTheDocument();
  });

  it('should call onLocationClick when clicked', () => {
    const onLocationClick = vi.fn();
    render(<LocationStatusIndicator {...defaultProps} onLocationClick={onLocationClick} />);
    
    fireEvent.click(screen.getByText('Location not set'));
    expect(onLocationClick).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(<LocationStatusIndicator {...defaultProps} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Location Components Integration', () => {
  afterEach(() => {
    cleanup();
  });

  it('should handle complete location flow', async () => {
    const onLocationSet = vi.fn();
    
    // Render manual location input
    const { container } = render(<ManualLocationInput 
      isOpen={true}
      onClose={vi.fn()}
      onLocationSet={onLocationSet}
      t={mockTranslations}
    />);
    
    // Select a quick city using a more specific selector
    const meccaButton = container.querySelector('button:has(.font-medium)');
    if (meccaButton) {
      fireEvent.click(meccaButton);
    }
    
    // Submit the form
    fireEvent.click(screen.getByText('Set Location'));
    
    await waitFor(() => {
      expect(onLocationSet).toHaveBeenCalled();
    });
  });

  it('should handle error recovery flow', () => {
    const onManualInput = vi.fn();
    const onRetry = vi.fn();
    
    const error = { code: 2, message: 'Position unavailable' };
    
    const { container } = render(<LocationPermissionModal 
      isOpen={true}
      onClose={vi.fn()}
      onRetry={onRetry}
      onManualInput={onManualInput}
      error={error}
      t={mockTranslations}
    />);
    
    // Use container to find specific buttons
    const retryButton = container.querySelector('.bg-green-600');
    const manualButton = container.querySelector('.bg-blue-600');
    
    expect(retryButton).toBeInTheDocument();
    expect(manualButton).toBeInTheDocument();
    
    // Test retry flow
    if (retryButton) {
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    }
    
    // Test manual input flow
    if (manualButton) {
      fireEvent.click(manualButton);
      expect(onManualInput).toHaveBeenCalledTimes(1);
    }
  });
});