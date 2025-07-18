import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RamadanTimesCard } from '../../../components/RamadanTimesCard';
import { IslamicCalendarService } from '../../../services/IslamicCalendarService';
import { PrayerTimesService } from '../../../services/PrayerTimesService';
import { Location, PrayerTimes } from '../../../types';

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

describe('RamadanTimesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PrayerTimesService.calculatePrayerTimes).mockResolvedValue(mockPrayerTimes);
    vi.mocked(IslamicCalendarService.calculateRamadanTimes).mockResolvedValue({
      suhoorTime: mockPrayerTimes.fajr,
      iftarTime: mockPrayerTimes.maghrib,
      date: new Date('2024-01-01')
    });
  });

  it('should render Ramadan times card in English', async () => {
    render(
      <RamadanTimesCard
        date={new Date('2024-01-01')}
        language="en"
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ramadan Times')).toBeInTheDocument();
    });

    expect(screen.getByText('Suhoor')).toBeInTheDocument();
    expect(screen.getByText('Iftar')).toBeInTheDocument();
    expect(screen.getByText('Ends at')).toBeInTheDocument();
    expect(screen.getByText('Starts at')).toBeInTheDocument();
  });

  it('should render Ramadan times card in Arabic', async () => {
    render(
      <RamadanTimesCard
        date={new Date('2024-01-01')}
        language="ar"
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('أوقات رمضان')).toBeInTheDocument();
    });

    expect(screen.getByText('السحور')).toBeInTheDocument();
    expect(screen.getByText('الإفطار')).toBeInTheDocument();
    expect(screen.getByText('ينتهي في')).toBeInTheDocument();
    expect(screen.getByText('يبدأ في')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    // Mock a delayed response
    vi.mocked(PrayerTimesService.calculatePrayerTimes).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPrayerTimes), 1000))
    );

    render(
      <RamadanTimesCard
        date={new Date('2024-01-01')}
        language="en"
        location={mockLocation}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show error when location is not provided', () => {
    render(
      <RamadanTimesCard
        date={new Date('2024-01-01')}
        language="en"
      />
    );

    expect(screen.getByText('Location required for Ramadan times')).toBeInTheDocument();
  });

  it('should handle prayer times service error', async () => {
    vi.mocked(PrayerTimesService.calculatePrayerTimes).mockRejectedValue(
      new Error('Failed to calculate prayer times')
    );

    render(
      <RamadanTimesCard
        date={new Date('2024-01-01')}
        language="en"
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading Ramadan times')).toBeInTheDocument();
    });
  });

  it('should display formatted times', async () => {
    render(
      <RamadanTimesCard
        date={new Date('2024-01-01')}
        language="en"
        location={mockLocation}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ramadan Times')).toBeInTheDocument();
    });

    // Check that times are displayed (format may vary based on locale)
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });
});