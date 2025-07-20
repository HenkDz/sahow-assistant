# Implementation Plan

- [x] 1. Extend user preferences store with compass mode settings
  - Add qibla compass mode preference to ComprehensiveUserPreferences interface
  - Implement updateQiblaPreferences method in userPreferencesStore
  - Add default compass mode preference to getDefaultPreferences function
  - _Requirements: 1.4, 3.3_

- [x] 2. Enhance QiblaService with manual compass functionality













  - Add calculateStaticQiblaDirection method that returns direction from North
  - Implement compass mode preference getter and setter methods
  - Add isAutomaticModeSupported method to check device capabilities
  - Create unit tests for manual compass calculations
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Create CompassModeToggle component
  - Implement toggle switch component with automatic/manual mode options
  - Add visual indicators for current mode and availability
  - Include proper accessibility attributes and keyboard navigation
  - Style component to match existing design system
  - _Requirements: 1.1, 3.2, 3.3_

- [ ] 4. Create ManualCompass component
  - Implement static compass component with red arrow pointing to Qibla
  - Add clear North marking and degree indicators around compass rose
  - Display Qibla direction in degrees from North
  - Include manual mode instructions and usage guidance
  - _Requirements: 2.1, 2.2, 2.3, 3.1_

- [ ] 5. Enhance QiblaCompass component with mode switching
  - Add compass mode state management and toggle functionality
  - Implement conditional rendering for automatic vs manual compass
  - Add mode switching logic with state preservation
  - Include automatic fallback to manual mode when sensors fail
  - _Requirements: 1.1, 1.4, 4.4_

- [ ] 6. Add manual mode instructions and user guidance
  - Create instruction component explaining how to use manual compass
  - Add visual cues for aligning device with North
  - Include contextual help based on current mode
  - Implement instruction toggle functionality
  - _Requirements: 2.3, 3.2_

- [ ] 7. Implement error handling and fallback logic
  - Add automatic suggestion to switch to manual mode when sensors fail
  - Implement graceful error handling for manual mode calculations
  - Add retry mechanisms for failed operations
  - Include appropriate error messages for different failure scenarios
  - _Requirements: 4.4, 1.1_

- [ ] 8. Add comprehensive testing for manual compass functionality
  - Write unit tests for QiblaService manual mode methods
  - Create component tests for CompassModeToggle and ManualCompass
  - Add integration tests for mode switching functionality
  - Test accuracy of manual compass calculations across different locations
  - _Requirements: 4.2, 4.3_

- [ ] 9. Integrate manual compass with existing translation system
  - Add translation keys for manual compass mode labels and instructions
  - Update existing translation files with new manual mode text
  - Ensure RTL language support for manual compass component
  - Test manual compass with different language settings
  - _Requirements: 2.3, 3.2_

- [ ] 10. Polish UI and add final enhancements
  - Refine visual styling for manual compass and mode toggle
  - Add smooth transitions between automatic and manual modes
  - Implement accessibility improvements for screen readers
  - Optimize performance for mode switching and compass rendering
  - _Requirements: 3.1, 3.3_