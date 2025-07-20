# Design Document

## Overview

The manual Qibla compass feature extends the existing QiblaCompass component to provide a sensor-independent mode for determining Qibla direction. This design adds a toggle mechanism between automatic (sensor-based) and manual modes, with the manual mode displaying a static red arrow pointing towards Qibla relative to North.

## Architecture

### Component Structure
```
QiblaCompass (Enhanced)
├── CompassModeToggle (New)
├── AutomaticCompass (Existing functionality)
├── ManualCompass (New)
├── CompassInstructions (Enhanced)
└── Shared UI Components (Location info, distance, etc.)
```

### State Management
- Add `compassMode: 'automatic' | 'manual'` to user preferences store
- Extend existing compass state to handle mode switching
- Maintain separate state for manual mode calculations

### Service Layer
- Enhance QiblaService with manual mode calculations
- Add static compass bearing calculation methods
- Maintain existing automatic mode functionality

## Components and Interfaces

### 1. Enhanced QiblaCompass Component

**New State Properties:**
```typescript
interface CompassState {
  // Existing properties...
  compassMode: 'automatic' | 'manual';
  manualQiblaDirection: number; // Static direction from North
  showModeInstructions: boolean;
}
```

**New Methods:**
- `toggleCompassMode()`: Switch between automatic and manual modes
- `calculateManualDirection()`: Calculate static Qibla direction from North
- `renderManualCompass()`: Render manual compass UI
- `renderModeToggle()`: Render mode selection toggle

### 2. CompassModeToggle Component (New)

```typescript
interface CompassModeToggleProps {
  currentMode: 'automatic' | 'manual';
  onModeChange: (mode: 'automatic' | 'manual') => void;
  isAutomaticSupported: boolean;
}
```

**Features:**
- Toggle switch UI with clear labels
- Disabled state when automatic mode is not supported
- Visual indicators for current mode

### 3. ManualCompass Component (New)

```typescript
interface ManualCompassProps {
  qiblaDirection: number; // Direction from North in degrees
  distance: number;
  locationName: string;
  isRTL: boolean;
}
```

**Features:**
- Static compass rose with clear North marking
- Red arrow pointing to Qibla direction
- Degree markings and cardinal directions
- Instructions overlay

### 4. Enhanced QiblaService

**New Methods:**
```typescript
class QiblaService {
  // Existing methods...
  
  static calculateStaticQiblaDirection(userLocation: Location): QiblaServiceResult;
  static getCompassModePreference(): 'automatic' | 'manual';
  static setCompassModePreference(mode: 'automatic' | 'manual'): Promise<void>;
  static isAutomaticModeSupported(): Promise<boolean>;
}
```

## Data Models

### User Preferences Extension

```typescript
interface ComprehensiveUserPreferences {
  // Existing properties...
  qibla: {
    compassMode: 'automatic' | 'manual';
    preferManualWhenSensorsFail: boolean;
  };
}
```

### Manual Compass State

```typescript
interface ManualCompassState {
  qiblaDirectionFromNorth: number; // 0-360 degrees from North
  isCalculated: boolean;
  calculationError: string | null;
}
```

## Error Handling

### Automatic Mode Fallback
- When device orientation fails, automatically suggest manual mode
- Show clear error message with manual mode option
- Preserve user's mode preference for future sessions

### Manual Mode Error Handling
- Handle location calculation errors gracefully
- Provide retry mechanism for failed calculations
- Show appropriate error messages for invalid locations

### Mode Switching
- Validate mode availability before switching
- Handle permission errors for automatic mode
- Maintain state consistency during mode transitions

## Testing Strategy

### Unit Tests
1. **QiblaService Manual Mode Tests**
   - Test static Qibla direction calculations
   - Verify accuracy against known locations
   - Test edge cases (polar regions, date line crossing)

2. **Component State Management Tests**
   - Test mode switching functionality
   - Verify state persistence across mode changes
   - Test error handling during mode transitions

3. **User Preferences Integration Tests**
   - Test preference saving and loading
   - Verify default mode selection logic
   - Test preference validation

### Integration Tests
1. **Mode Switching Flow**
   - Test complete user flow from automatic to manual mode
   - Verify UI updates correctly during mode changes
   - Test fallback behavior when sensors fail

2. **Compass Accuracy Tests**
   - Compare manual mode calculations with automatic mode
   - Test accuracy across different global locations
   - Verify consistent results between modes

### User Experience Tests
1. **Accessibility Testing**
   - Test screen reader compatibility for mode toggle
   - Verify keyboard navigation for mode switching
   - Test high contrast mode compatibility

2. **Performance Testing**
   - Measure rendering performance for manual compass
   - Test memory usage during mode switching
   - Verify smooth transitions between modes

## Implementation Phases

### Phase 1: Core Manual Mode
- Add manual compass calculation logic to QiblaService
- Implement basic ManualCompass component
- Add mode toggle functionality to QiblaCompass

### Phase 2: Enhanced UI and UX
- Implement CompassModeToggle component
- Add comprehensive instructions for manual mode
- Enhance visual design and animations

### Phase 3: Integration and Preferences
- Integrate with user preferences store
- Add automatic fallback logic
- Implement preference persistence

### Phase 4: Testing and Polish
- Comprehensive testing across devices and browsers
- Performance optimization
- Accessibility improvements
- Documentation and user guides

## Technical Considerations

### Browser Compatibility
- Manual mode works on all browsers (no sensor dependency)
- Graceful degradation when DeviceOrientationEvent is not supported
- Consistent behavior across mobile and desktop platforms

### Performance Optimization
- Cache manual compass calculations
- Optimize rendering for smooth mode transitions
- Minimize re-calculations during mode switches

### Accessibility
- Clear visual indicators for current mode
- Screen reader support for mode descriptions
- Keyboard navigation for mode toggle
- High contrast support for compass elements

### Internationalization
- Support for RTL languages in manual compass
- Localized instructions for manual mode usage
- Cultural considerations for compass design