# Design Document

## Overview

This design document outlines the technical architecture for enhancing the Sahw Assistant app into a comprehensive Islamic prayer companion. The enhancement will build upon the existing React/TypeScript/Capacitor stack while introducing new features for prayer times, Qibla direction, Islamic calendar, audio capabilities, dhikr counter, offline functionality, personalization, and community features.

The design maintains the current mobile-first approach and bilingual (Arabic/English) support while expanding the app's scope from a specific Sahw guidance tool to a full Islamic prayer companion.

## Architecture

### High-Level Architecture

The enhanced app will follow a modular architecture pattern with the following layers:

1. **Presentation Layer**: React components with TypeScript
2. **State Management Layer**: React Context API with custom hooks
3. **Service Layer**: Business logic and API integrations
4. **Data Layer**: Local storage, caching, and external API integration
5. **Native Layer**: Capacitor plugins for device features

### Technology Stack Extensions

**Current Stack:**
- React 19.1.0 with TypeScript
- Capacitor 7.4.2 for mobile deployment
- Vite for build tooling

**New Dependencies:**
- `@capacitor/geolocation` - Location services for prayer times and Qibla
- `@capacitor/local-notifications` - Prayer time notifications
- `@capacitor/device` - Device orientation for Qibla compass
- `@capacitor/storage` - Offline data persistence
- `@capacitor/haptics` - Tactile feedback for tasbih counter
- `adhan` - Islamic prayer time calculations
- `hijri-date` - Islamic calendar conversions
- `react-query` - Data fetching and caching
- `zustand` - Lightweight state management

## Components and Interfaces

### Core State Management

```typescript
// Enhanced types extending current structure
export type Language = 'ar' | 'en';
export type View = 'welcome' | 'question' | 'result' | 'prayer-times' | 'qibla' | 'calendar' | 'tasbih' | 'settings' | 'mosques';
export type Madhab = 'hanafi' | 'shafi' | 'maliki' | 'hanbali';
export type CalculationMethod = 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';

export interface UserPreferences {
  language: Language;
  madhab: Madhab;
  calculationMethod: CalculationMethod;
  notificationsEnabled: boolean;
  notificationOffset: number; // minutes before prayer
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
}

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  date: Date;
  location: string;
}

export interface IslamicDate {
  hijriDay: number;
  hijriMonth: string;
  hijriYear: number;
  gregorianDate: Date;
  events?: string[];
}
```

### Navigation Component

```typescript
// New bottom navigation component
export interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  t: Translation;
}
```

### Prayer Times Service

```typescript
export interface PrayerTimesService {
  calculatePrayerTimes(location: Location, date: Date, method: CalculationMethod): Promise<PrayerTimes>;
  getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: Date };
  scheduleNotifications(prayerTimes: PrayerTimes, offset: number): Promise<void>;
}
```

### Qibla Service

```typescript
export interface QiblaService {
  calculateQiblaDirection(userLocation: Location): Promise<number>;
  getDistanceToMecca(userLocation: Location): number;
  watchDeviceOrientation(): Observable<number>;
}
```

### Audio Service

```typescript
export interface AudioService {
  playArabicAudio(textId: string, speed: 'normal' | 'slow'): Promise<void>;
  preloadAudioFiles(): Promise<void>;
  isAudioAvailable(textId: string): boolean;
}
```

## Data Models

### Prayer Times Data Model

```typescript
export class PrayerTimesModel {
  private location: Location;
  private calculationMethod: CalculationMethod;
  private madhab: Madhab;

  constructor(preferences: UserPreferences) {
    this.location = preferences.location;
    this.calculationMethod = preferences.calculationMethod;
    this.madhab = preferences.madhab;
  }

  async getTodaysPrayerTimes(): Promise<PrayerTimes> {
    // Implementation using adhan library
  }

  async getWeeklyPrayerTimes(): Promise<PrayerTimes[]> {
    // Implementation for week view
  }

  adjustForMadhab(baseTimes: PrayerTimes): PrayerTimes {
    // Madhab-specific adjustments (e.g., Hanafi Asr calculation)
  }
}
```

### Islamic Calendar Model

```typescript
export class IslamicCalendarModel {
  convertToHijri(gregorianDate: Date): IslamicDate {
    // Implementation using hijri-date library
  }

  getIslamicEvents(hijriDate: IslamicDate): string[] {
    // Return relevant Islamic events for the date
  }

  getRamadanTimes(location: Location, hijriYear: number): {
    suhoorTime: Date;
    iftarTime: Date;
  }[] {
    // Calculate Suhoor and Iftar times for Ramadan
  }
}
```

### Offline Storage Model

```typescript
export class OfflineStorageModel {
  async cachePrayerTimes(prayerTimes: PrayerTimes[]): Promise<void> {
    // Cache prayer times for offline access
  }

  async getCachedPrayerTimes(date: Date): Promise<PrayerTimes | null> {
    // Retrieve cached prayer times
  }

  async cacheUserPreferences(preferences: UserPreferences): Promise<void> {
    // Store user preferences locally
  }

  async syncWhenOnline(): Promise<void> {
    // Sync cached data when connectivity returns
  }
}
```

## Error Handling

### Location Services Error Handling

```typescript
export class LocationErrorHandler {
  static handleLocationError(error: GeolocationError): {
    message: string;
    fallbackAction: () => void;
  } {
    switch (error.code) {
      case GeolocationError.PERMISSION_DENIED:
        return {
          message: 'Location permission denied. Please enable location services.',
          fallbackAction: () => this.showManualLocationInput()
        };
      case GeolocationError.POSITION_UNAVAILABLE:
        return {
          message: 'Location unavailable. Using last known location.',
          fallbackAction: () => this.useLastKnownLocation()
        };
      default:
        return {
          message: 'Location error occurred.',
          fallbackAction: () => this.showManualLocationInput()
        };
    }
  }
}
```

### Network Error Handling

```typescript
export class NetworkErrorHandler {
  static handleOfflineMode(): {
    showOfflineIndicator: boolean;
    availableFeatures: View[];
  } {
    return {
      showOfflineIndicator: true,
      availableFeatures: ['welcome', 'question', 'result', 'qibla', 'tasbih', 'settings']
    };
  }
}
```

## Testing Strategy

### Unit Testing

- **Prayer Time Calculations**: Test accuracy of prayer time calculations across different locations and calculation methods
- **Qibla Direction**: Verify Qibla direction calculations for various global locations
- **Islamic Calendar**: Test Hijri date conversions and event detection
- **Audio Service**: Test audio playback functionality and error handling
- **Offline Storage**: Test data persistence and retrieval mechanisms

### Integration Testing

- **Location Services**: Test integration with device GPS and manual location input
- **Notification System**: Test prayer time notification scheduling and delivery
- **Madhab Preferences**: Test that madhab selection affects calculations correctly
- **Language Switching**: Test that language changes update all UI elements
- **Offline/Online Sync**: Test data synchronization when connectivity changes

### End-to-End Testing

- **Complete User Flows**: Test full user journeys from onboarding to daily usage
- **Cross-Platform**: Test functionality on both Android and web platforms
- **Performance**: Test app performance with large datasets and offline scenarios
- **Accessibility**: Test screen reader compatibility and touch accessibility

### Device Testing

- **GPS Accuracy**: Test location accuracy across different devices
- **Compass Calibration**: Test Qibla compass accuracy on various device orientations
- **Audio Quality**: Test Arabic audio playback quality and synchronization
- **Battery Impact**: Test battery usage with background notifications and GPS usage

## Implementation Phases

### Phase 1: Core Infrastructure
- Set up new state management with Zustand
- Implement location services and error handling
- Add offline storage capabilities
- Create new navigation system

### Phase 2: Prayer Times Feature
- Implement prayer time calculations
- Add notification system
- Create prayer times UI components
- Add madhab-specific adjustments

### Phase 3: Qibla and Calendar
- Implement Qibla direction calculation
- Add compass UI with device orientation
- Create Islamic calendar integration
- Add Ramadan timing features

### Phase 4: Audio and Tasbih
- Implement audio service for Arabic pronunciation
- Add tasbih counter with haptic feedback
- Enhance existing Sahw content with audio
- Add transliteration support

### Phase 5: Community and Polish
- Add mosque finder functionality
- Implement user preferences and settings
- Add comprehensive offline support
- Performance optimization and testing