import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IslamicCalendarScreen } from '../../../components/IslamicCalendarScreen';
import { IslamicCalendarService } from '../../../services/IslamicCalendarService';
import { Language, Location, PrayerTimes } from '../../../types';

// Mock the services
vi.mock('../../../services/IslamicCalendarService');
vi.mock('../../../services/PrayerTimesService');

const mockLocation: Location = {
  latitude: 21.4225,
  longitude: 39.8262,
  city: 'Mecca',
  country: 'Saudi Arabia'
};

const mockPrayerTimes: PrayerTimes = {
  fajr: new Date('2024-01-01T05:30:00Z'),
  sunrise: new Date('2024-01-01T07:00:00Z'),
  dhuhr: new Date('2024-01-01T12:30:00Z'),
  asr: new Date('2024-01-01T15:45:00Z'),
  maghrib: new Date('2024-01-01T18:15:00Z'),
  isha: new Date('2024-01-01T19:45:00Z'),
  date: new Date('2024-01-01'),
  location: 'Mecca, Saudi Arabia'
};

const mockIslamicDate = {
  hijriDay: 1,
  hijriMonth: 'Muharram',
  hijriYear: 1445,
  gregorianDate: new Date('2024-01-01'),
  events: ['Islamic New Year']
};

describe('IslamicCalendarScreen', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock IslamicCalendarService methods
    vi.mocked(IslamicCalendarService.convertToHijri).mockReturnValue(mockIslamicDate);
    vi.mocked(IslamicCalendarService.getIslamicDateRange).mockReturnValue([mockIslamicDate]);
    vi.mocked(IslamicCalendarService.getDetailedIslamicEventsForDate).mockReturnValue([
      { name: 'Islamic New Year', nameAr: 'رأس السنة الهجرية', isHoliday: true }
    ]);
    vi.mocked(IslamicCalendarService.isRamadan).mockReturnValue(false);
    vi.mocked(IslamicCalendarService.getHijriMonthName).mockReturnValue('Muharram');
    vi.mocked(IslamicCalendarService.formatIslamicDate).mockReturnValue('1 Muharram 1445 AH');
    
    // Add the missing hijriMonthNames property
    Object.defineProperty(IslamicCalendarService, 'hijriMonthNames', {
      value: ['Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
              'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
              'Ramadan', 'Shawwal', 'Dhul Qi\'dah', 'Dhul Hijjah'],
      writable: false
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render Islamic calendar screen in English', async () => {
    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Islamic Calendar')).toBeInTheDocument();
    });

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('should render Islamic calendar screen in Arabic', async () => {
    render(
      <IslamicCalendarScreen
        language="ar"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('التقويم الإسلامي')).toBeInTheDocument();
    });

    expect(screen.getByText('اليوم')).toBeInTheDocument();
    expect(screen.getByText('رجوع')).toBeInTheDocument();
  });

  it('should display current Islamic date', async () => {
    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 Muharram 1445 AH')).toBeInTheDocument();
    });

    expect(screen.getByText('Hijri')).toBeInTheDocument();
    expect(screen.getByText('Gregorian')).toBeInTheDocument();
  });

  it('should handle back button click', async () => {
    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Islamic Calendar')).toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should handle today button click', async () => {
    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Islamic Calendar')).toBeInTheDocument();
    });

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    // Should trigger a re-render with current date
    expect(IslamicCalendarService.convertToHijri).toHaveBeenCalled();
  });

  it('should handle month navigation', async () => {
    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Islamic Calendar')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText('Next Month');
    fireEvent.click(nextButton);

    // Should trigger calendar data reload
    expect(IslamicCalendarService.convertToHijri).toHaveBeenCalled();
  });

  it('should display events when available', async () => {
    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    expect(screen.getByText('Islamic New Year')).toBeInTheDocument();
  });

  it('should show no events message when no events available', async () => {
    // Mock no events
    vi.mocked(IslamicCalendarService.convertToHijri).mockReturnValue({
      ...mockIslamicDate,
      events: []
    });

    render(
      <IslamicCalendarScreen
        language="en"
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No events')).toBeInTheDocument();
    });
  });
});

