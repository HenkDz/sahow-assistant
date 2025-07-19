# Implementation Plan

- [x] 1. Set up enhanced project infrastructure and dependencies





  - Install new dependencies: @capacitor/geolocation, @capacitor/local-notifications, @capacitor/device, @capacitor/storage, @capacitor/haptics, adhan, hijri-date, react-query, zustand
  - Update capacitor.config.ts with new plugin configurations and permissions
  - Create new directory structure: services/, hooks/, stores/, utils/islamic/
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

- [x] 2. Implement core state management and type system




- [x] 2.1 Extend type definitions for enhanced features


  - Update types.ts with new View types, UserPreferences, PrayerTimes, IslamicDate interfaces
  - Add Madhab and CalculationMethod enums
  - Create location and mosque-related type definitions
  - _Requirements: 1.1, 7.2_

- [x] 2.2 Create Zustand store for global app state


  - Implement user preferences store with persistence
  - Create prayer times store with caching logic
  - Add location store with GPS and manual location handling
  - Write unit tests for store functionality
  - _Requirements: 1.1, 6.2, 7.1_

- [x] 3. Implement location services and error handling





- [x] 3.1 Create location service with Capacitor Geolocation


  - Write LocationService class with getCurrentLocation and watchPosition methods
  - Implement error handling for permission denied and position unavailable scenarios
  - Add manual location input fallback functionality
  - Create unit tests for location service error scenarios
  - _Requirements: 1.4, 2.3_


- [x] 3.2 Build location permission and settings UI

  - Create LocationPermissionModal component for requesting permissions
  - Implement ManualLocationInput component with city/country selection
  - Add location status indicator to show GPS vs manual location
  - Write integration tests for location UI flows
  - _Requirements: 1.4, 2.3_

- [x] 4. Implement prayer times calculation and display




- [x] 4.1 Create PrayerTimesService using adhan library


  - Implement calculatePrayerTimes method with different calculation methods
  - Add madhab-specific adjustments (especially Hanafi Asr calculation)
  - Create getNextPrayer utility to determine upcoming prayer
  - Write comprehensive unit tests for prayer time accuracy across locations
  - _Requirements: 1.1, 1.2, 1.5, 7.2_

- [x] 4.2 Build prayer times display components


  - Create PrayerTimesScreen component showing today's prayer times
  - Implement PrayerTimeCard component with countdown to next prayer
  - Add weekly prayer times view with date navigation
  - Create responsive design for both Arabic and English layouts
  - _Requirements: 1.1_



- [x] 4.3 Implement prayer time notifications





  - Create NotificationService using Capacitor Local Notifications
  - Add notification scheduling for all prayer times with user-defined offset
  - Implement notification permission handling and settings
  - Write integration tests for notification scheduling and delivery
  - _Requirements: 1.3, 7.4_

- [x] 5. Implement Qibla direction finder




- [x] 5.1 Create QiblaService for direction calculations


  - Implement calculateQiblaDirection method using great circle calculations
  - Add getDistanceToMecca utility for displaying distance to Kaaba
  - Create device orientation tracking using Capacitor Device plugin
  - Write unit tests for Qibla direction accuracy across global locations
  - _Requirements: 2.1, 2.4_

- [x] 5.2 Build Qibla compass UI component


  - Create QiblaCompass component with real-time direction updates
  - Implement compass needle animation and smooth rotation
  - Add distance display and location information
  - Create calibration instructions and error handling UI
  - _Requirements: 2.1, 2.2_

- [x] 6. Implement Islamic calendar integration




- [x] 6.1 Create IslamicCalendarService using hijri-date library


  - Implement Hijri date conversion and Islamic event detection
  - Add Islamic holidays and observances database
  - Create Ramadan timing calculations for Suhoor and Iftar
  - Write unit tests for date conversions and event detection
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 6.2 Build Islamic calendar display components


  - Create IslamicCalendarScreen with dual Gregorian/Hijri date display
  - Implement CalendarEventCard component for Islamic holidays
  - Add RamadanTimesCard component for Suhoor/Iftar during Ramadan
  - Create month navigation and event highlighting functionality
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 7. Enhance Sahw Assistant with audio capabilities
- [ ] 7.1 Create AudioService for Arabic pronunciation
  - Implement audio file management and preloading system
  - Add playArabicAudio method with speed control (normal/slow)
  - Create audio highlighting synchronization with text display
  - Write integration tests for audio playback and text synchronization
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7.2 Update existing Sahw components with audio features
  - Modify ResultScreen component to include audio playback buttons
  - Add transliteration display alongside existing Arabic text
  - Implement audio progress indicator and playback controls
  - Create audio availability indicators for supported content
  - _Requirements: 4.1, 4.4_

- [x] 8. Implement digital Tasbih counter
- [x] 8.1 Create TasbihService with haptic feedback
  - Implement counter logic with increment, reset, and goal detection
  - Add haptic feedback using Capacitor Haptics for milestone achievements
  - Create counter persistence to maintain count across app sessions
  - Write unit tests for counter logic and persistence
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 8.2 Build Tasbih counter UI component
  - Create TasbihScreen component with large, accessible counter button
  - Implement visual feedback for goal achievements (33, 99, 100)
  - Add reset confirmation dialog and counter history
  - Create customizable dhikr text selection and display
  - _Requirements: 5.1, 5.4_

- [x] 9. Implement offline functionality and data persistence
- [x] 9.1 Create OfflineStorageService using Capacitor Storage
  - Implement prayer times caching with location-based invalidation
  - Create user preferences persistence with automatic sync
  - Add network status tracking and offline mode detection
  - Cache Qibla direction calculations for offline compass use
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9.2 Add offline data indicators and sync controls



  - Create offline status indicator showing cached data availability
  - Implement background data synchronization when connection returns
  - Add manual sync triggers and cache management controls
  - Display sync status and last update timestamps
  - _Requirements: 6.4, 6.5_

- [x] 9.3 Integrate offline capabilities into existing services
  - Update PrayerTimesService with automatic caching and offline fallback
  - Add QiblaService offline support for compass functionality
  - Integrate IslamicCalendarService with offline date calculations
  - Create offline-aware hooks for components to use cached data
  - _Requirements: 6.1, 6.2, 6.3_
  - Implement prayer times caching for offline access
  - Add user preferences and settings persistence
  - Create data synchronization logic for when connectivity returns
  - Write integration tests for offline/online data sync scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9.4 Add offline mode indicators and graceful degradation
  - Create OfflineIndicator component to show connection status
  - Implement graceful degradation for features requiring internet
  - Add cached data age indicators and refresh prompts
  - Create offline-first user experience with appropriate messaging
  - Add OfflineErrorBoundary for feature-specific error handling
  - Create offline-first hooks for better user experience
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. Build comprehensive settings and personalization
- [x] 10.1 Create SettingsService for user preferences
  - Implement madhab selection with prayer time calculation adjustments
  - Add calculation method selection for different geographic preferences
  - Create notification preferences with timing and sound options
  - Write unit tests for settings persistence and application
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10.2 Build settings UI components
  - Create SettingsScreen component with organized preference sections
  - Implement MadhabSelector component with explanatory information
  - Add NotificationSettings component with preview functionality
  - Create LanguageSettings component extending existing language switcher
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 11. Implement community features for mosque finding





- [x] 11.1 Create MosqueService for nearby Islamic centers


  - Implement mosque search using location-based queries
  - Add mosque data structure with contact info and prayer times
  - Create integration with device maps for navigation
  - Write integration tests for mosque search and data retrieval
  - _Requirements: 8.1, 8.3_

- [x] 11.2 Build mosque finder UI components


  - Create MosqueFinderScreen component with search and list functionality
  - Implement MosqueCard component displaying mosque information
  - Add distance calculation and sorting by proximity
  - Create mosque detail view with contact information and directions
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 12. Update navigation and integrate all features
- [ ] 12.1 Create enhanced navigation system
  - Implement BottomNavigation component with icons for all new features
  - Update App.tsx to handle new view states and routing
  - Add navigation state persistence and deep linking support
  - Create smooth transitions between different app sections
  - _Requirements: All requirements integration_

- [ ] 12.2 Integrate all features into cohesive user experience
  - Update WelcomeScreen to showcase new features and onboarding
  - Create feature discovery and tutorial system for new users
  - Implement cross-feature integration (e.g., prayer times in calendar)
  - Add comprehensive error boundaries and fallback UI components
  - _Requirements: All requirements integration_

- [ ] 13. Performance optimization and testing
- [ ] 13.1 Optimize app performance and bundle size
  - Implement code splitting for feature-specific components
  - Add lazy loading for audio files and large datasets
  - Optimize prayer time calculations and caching strategies
  - Create performance monitoring and optimization tests
  - _Requirements: 6.1, 6.4_

- [ ] 13.2 Comprehensive testing and quality assurance
  - Write end-to-end tests for complete user workflows
  - Add accessibility testing for screen readers and touch navigation
  - Create cross-platform testing for Android and web deployment
  - Implement automated testing for prayer time accuracy and Qibla calculations
  - _Requirements: All requirements validation_