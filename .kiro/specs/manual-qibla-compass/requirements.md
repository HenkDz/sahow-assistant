# Requirements Document

## Introduction

This feature adds a manual compass mode to the existing Qibla compass functionality. The manual mode provides an alternative for users whose devices don't support automatic orientation detection or prefer manual alignment. It displays a red arrow pointing towards the Qibla direction relative to North, allowing users to manually align their device with North to determine the correct Qibla direction.

## Requirements

### Requirement 1

**User Story:** As a Muslim user, I want a manual compass mode option so that I can determine Qibla direction even when my device doesn't support automatic orientation detection.

#### Acceptance Criteria

1. WHEN the user accesses the Qibla compass THEN the system SHALL provide a toggle option to switch between automatic and manual compass modes
2. WHEN the user selects manual mode THEN the system SHALL display a compass with a red arrow pointing towards Qibla relative to North
3. WHEN in manual mode THEN the system SHALL show clear instructions for the user to align their device with North
4. WHEN the user switches between modes THEN the system SHALL preserve the current location and Qibla calculations

### Requirement 2

**User Story:** As a Muslim user, I want clear visual indicators in manual mode so that I can easily understand how to use the manual compass.

#### Acceptance Criteria

1. WHEN in manual mode THEN the system SHALL display a red arrow that points towards the Qibla direction relative to North
2. WHEN in manual mode THEN the system SHALL show "N" marking clearly at the top of the compass
3. WHEN in manual mode THEN the system SHALL display instructions explaining how to align the device with North
4. WHEN in manual mode THEN the system SHALL show the calculated Qibla direction in degrees from North

### Requirement 3

**User Story:** As a Muslim user, I want the manual compass to be visually distinct from the automatic compass so that I understand which mode I'm using.

#### Acceptance Criteria

1. WHEN in manual mode THEN the system SHALL use a red arrow to indicate Qibla direction
2. WHEN in manual mode THEN the system SHALL display a "Manual Mode" indicator
3. WHEN in manual mode THEN the system SHALL show different styling to distinguish from automatic mode
4. WHEN switching modes THEN the system SHALL provide clear visual feedback about the current mode

### Requirement 4

**User Story:** As a Muslim user, I want the manual compass to work reliably without device sensors so that I can use it as a fallback option.

#### Acceptance Criteria

1. WHEN in manual mode THEN the system SHALL NOT depend on device orientation sensors
2. WHEN in manual mode THEN the system SHALL calculate and display the static Qibla direction from the user's location
3. WHEN the device orientation sensors fail THEN the system SHALL automatically suggest switching to manual mode
4. WHEN in manual mode THEN the system SHALL maintain the same accuracy as automatic mode for Qibla direction calculation