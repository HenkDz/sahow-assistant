import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrayerTimesScreen from '../../../components/PrayerTimesScreen';
import PrayerTimeCard from '../../../components/PrayerTimeCard';
import { PrayerTimes, Location, CalculationMethod, Madhab } from '../../../types';
import { PrayerTimesService } from '../../../services/PrayerTimesService';

// Mock the stores
vi.mock('../../../stores/userPreferencesStore', () => ({
  useUserPreferencesStore: () => ({
    preferences: {
      language: 'en',
      madhab: Madhab.HANAFI,
      calculationMethod: CalculationMethod.MWL,
      notificationsEnabled: true,
      notificationOffset: 10,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA'
      }
    }
  })
}));

vi.mock('../../../stores/prayerTimesStore', () => ({
  usePrayerTimesStore: () => ({
    currentPrayerTimes: mockPrayerTimes,
    isLoading: false,
    error: null,
    setPrayerTimes: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn()
  })
}));

// Mock the PrayerTimesService
vi.mock('../../../services/PrayerTimesService', () => ({
  PrayerTimesService: {
    calculatePrayerTimes: vi.fn(),
    calculateWeeklyPrayerTimes: vi.fn(),
    getNextPrayer: vi.fn(),
    getCurrentPrayer: vi.fn(),
    getTimeUntilNextPrayer: vi.fn(),
    formatPrayerTime: vi.fn()
  }
}));

const mockPrayerTimes: PrayerTimes = {
  fajr: new Date('2024-01-15T05:30:00'),
  sunrise: new Date('2024-01-15T07:00:00'),
  dhuhr: new Date('2024-01-15T12:15:00'),
  asr: new Date('2024-01-15T15:30:00'),
  maghrib: new Date('2024-01-15T17:45:00'),
  isha: new Date('2024-01-15T19:15:00'),
  date: new Date('2024-01-15'),
  location: 'New York, USA'
};

const mockTranslations = {
  prayer_times_title: 'Prayer Times',
  todays_prayers: "Today's Prayers",
  weekly_prayers: 'Weekly Prayer Times',
  next_prayer: 'Next Prayer',
  current: 'Current',
  next: 'Next',
  in: 'in',
  btn_back: 'Back',
  loading_prayer_times: 'Loading prayer times...',
  error_title: 'Error',
  retry: 'Retry',
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  calculation_method: 'Calculation Method'
};

describe('PrayerTimeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (PrayerTimesService.formatPrayerTime as Mock).mockImplementation((time: Date) => 
      time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    );
    (PrayerTimesService.getNextPrayer as Mock).mockReturnValue({
      name: 'Dhuhr',
      time: mockPrayerTimes.dhuhr
    });
    (PrayerTimesService.getCurrentPrayer as Mock).mockReturnValue({
      name: 'Fajr',
      time: mockPrayerTimes.fajr
    });
    (PrayerTimesService.getTimeUntilNextPrayer as Mock).mockReturnValue(120);
  });

  it('should render prayer times in compact mode', () => {
    render(
      <PrayerTimeCard
        prayerTimes={mockPrayerTimes}
        t={mockTranslations}
        lang="en"
        compact={true}
      />
    );

    expect(screen.getByText('Fajr')).toBeInTheDocument();
    expect(screen.getByText('Dhuhr')).toBeInTheDocument();
    expect(screen.getByText('Asr')).toBeInTheDocument();
    expect(screen.getByText('Maghrib')).toBeInTheDocument();
    expect(screen.getByText('Isha')).toBeInTheDocument();
  });

  it('should render prayer times in full mode', () => {
    render(
      <PrayerTimeCard
        prayerTimes={mockPrayerTimes}
        t={mockTranslations}
        lang="en"
        compact={false}
      />
    );

    expect(screen.getByText('Fajr')).toBeInTheDocument();
    expect(screen.getByText('الفجر')).toBeInTheDocument(); // Arabic name
    expect(screen.getByText('Calculation Method')).toBeInTheDocument();
  });

  it('should show countdown when enabled', () => {
    render(
      <PrayerTimeCard
        prayerTimes={mockPrayerTimes}
        t={mockTranslations}
        lang="en"
        showCountdown={true}
      />
    );

    expect(screen.getByText('Next Prayer')).toBeInTheDocument();
    expect(screen.getByText('Dhuhr')).toBeInTheDocument();
    expect(screen.getByText('in 2h 0m')).toBeInTheDocument();
  });

  it('should display Arabic names when language is Arabic', () => {
    render(
      <PrayerTimeCard
        prayerTimes={mockPrayerTimes}
        t={mockTranslations}
        lang="ar"
        compact={true}
      />
    );

    expect(screen.getByText('الفجر')).toBeInTheDocument();
    expect(screen.getByText('الظهر')).toBeInTheDocument();
    expect(screen.getByText('العصر')).toBeInTheDocument();
    expect(screen.getByText('المغرب')).toBeInTheDocument();
    expect(screen.getByText('العشاء')).toBeInTheDocument();
  });

  it('should highlight next prayer', () => {
    render(
      <PrayerTimeCard
        prayerTimes={mockPrayerTimes}
        t={mockTranslations}
        lang="en"
        compact={false}
      />
    );

    // The next prayer (Dhuhr) should have special styling
    const nextPrayerElements = screen.getAllByText('Next');
    expect(nextPrayerElements.length).toBeGreaterThan(0);
  });

  it('should highlight current prayer', () => {
    render(
      <PrayerTimeCard
        prayerTimes={mockPrayerTimes}
        t={mockTranslations}
        lang="en"
        compact={false}
      />
    );

    // The current prayer (Fajr) should have special styling
    const currentPrayerElements = screen.getAllByText('Current');
    expect(currentPrayerElements.length).toBeGreaterThan(0);
  });
});

describe('PrayerTimesScreen', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (PrayerTimesService.calculatePrayerTimes as Mock).mockResolvedValue(mockPrayerTimes);
    (PrayerTimesService.calculateWeeklyPrayerTimes as Mock).mockResolvedValue([
      mockPrayerTimes,
      { ...mockPrayerTimes, date: new Date('2024-01-16') },
      { ...mockPrayerTimes, date: new Date('2024-01-17') }
    ]);
  });

  it('should render prayer times screen', async () => {
    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Prayer Times')).toBeInTheDocument();
    });

    expect(screen.getByText('New York, USA')).toBeInTheDocument();
    expect(screen.getByText("Today's Prayers")).toBeInTheDocument();
  });

  it('should handle back button click', async () => {
    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Prayer Times')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    // Mock loading state
    vi.doMock('../../../stores/prayerTimesStore', () => ({
      usePrayerTimesStore: () => ({
        currentPrayerTimes: null,
        isLoading: true,
        error: null,
        setPrayerTimes: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn()
      })
    }));

    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    expect(screen.getByText('Loading prayer times...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    // Mock error state
    vi.doMock('../../../stores/prayerTimesStore', () => ({
      usePrayerTimesStore: () => ({
        currentPrayerTimes: null,
        isLoading: false,
        error: 'Failed to load prayer times',
        setPrayerTimes: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn()
      })
    }));

    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load prayer times')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should navigate between dates', async () => {
    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Prayer Times')).toBeInTheDocument();
    });

    // Find navigation buttons by aria-label
    const nextButton = screen.getByLabelText('Next day');
    const prevButton = screen.getByLabelText('Previous day');

    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();

    // Test navigation
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);

    // Service should be called multiple times for date changes
    expect(PrayerTimesService.calculatePrayerTimes).toHaveBeenCalledTimes(3); // Initial + 2 navigations
  });

  it('should handle location not available', () => {
    // Mock no location
    vi.doMock('../../../stores/userPreferencesStore', () => ({
      useUserPreferencesStore: () => ({
        preferences: {
          language: 'en',
          madhab: Madhab.HANAFI,
          calculationMethod: CalculationMethod.MWL,
          notificationsEnabled: true,
          notificationOffset: 10,
          location: undefined
        }
      })
    }));

    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should display weekly prayer times', async () => {
    render(
      <PrayerTimesScreen
        onBack={mockOnBack}
        t={mockTranslations}
        lang="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Weekly Prayer Times')).toBeInTheDocument();
    });

    expect(PrayerTimesService.calculateWeeklyPrayerTimes).toHaveBeenCalledWith(
      expect.any(Object), // location
      expect.any(Date),   // date
      7,                  // days
      CalculationMethod.MWL,
      Madhab.HANAFI
    );
  });
});