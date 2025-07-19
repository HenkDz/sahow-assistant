# Sahw Assistant - Islamic Prayer and Guidance App

A comprehensive Islamic mobile app built with React 19 and Capacitor 7, featuring prayer times, Qibla direction, Islamic calendar, digital Tasbih counter, and offline functionality.

## Features

### 🕌 Prayer Times
- Accurate prayer times calculation based on location
- Multiple calculation methods and school options
- Notifications for prayer times
- Offline caching for areas with poor connectivity

### 🧭 Qibla Direction
- Compass-based Qibla direction finder
- Real-time device orientation tracking
- Distance calculation to Mecca
- Offline support with cached directions

### 📅 Islamic Calendar
- Hijri date conversion and display
- Islamic events and holidays
- Ramadan times (Suhoor and Iftar)
- Offline calendar data caching

### 📿 Digital Tasbih Counter
- Haptic feedback for milestone achievements
- Customizable dhikr text selection
- Counter history and persistence
- Goal tracking (33, 99, 100, etc.)

### 🌐 Offline Functionality
- Complete offline support for all features
- Automatic data synchronization when online
- Cache management and storage optimization
- Network status indicators

### 🤔 Sahw Assistant
- Interactive guidance for prayer doubts
- Question-based approach to Islamic rulings
- Multilingual support (Arabic/English)
- Scenario-based decision trees

## Technical Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Mobile Framework**: Capacitor 7.4.2
- **Build Tool**: Vite 6.3.5
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand
- **Storage**: Capacitor Preferences API
- **Testing**: Vitest with React Testing Library

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Mobile Development

### Android

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

### iOS

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync ios
   ```

3. Open in Xcode:
   ```bash
   npx cap open ios
   ```

## Architecture

### Services
- **PrayerTimesService**: Prayer time calculations with offline caching
- **QiblaService**: Qibla direction and compass functionality
- **IslamicCalendarService**: Hijri date conversion and Islamic events
- **TasbihService**: Digital counter with haptic feedback
- **OfflineStorageService**: Comprehensive offline data management
- **NetworkService**: Network connectivity and sync management

### Components
- **MainNavigationScreen**: Primary navigation interface
- **PrayerTimesScreen**: Prayer times display and settings
- **QiblaCompass**: Interactive compass for Qibla direction
- **IslamicCalendarScreen**: Calendar view with Islamic dates
- **TasbihScreen**: Digital Tasbih counter interface
- **OfflineIndicator**: Network status and cache management

### Offline Features
- Automatic data caching with intelligent invalidation
- Background synchronization when connectivity returns
- Cache statistics and manual sync controls
- Offline-first architecture with graceful fallbacks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Islamic prayer time calculations based on established astronomical methods
- Qibla direction calculations using great circle formulas
- Islamic calendar data from authentic sources
- Haptic feedback implementation using Capacitor APIs
