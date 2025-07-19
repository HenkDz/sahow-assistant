# Smart Refresh System

## Overview

The Smart Refresh System provides an intelligent, user-friendly approach to data refresh prompts that eliminates annoying frequent notifications while ensuring users are informed when data truly needs updating.

## Key Features

### 1. Intelligent Cache Age Detection

The system categorizes cached data into four states:

- **Fresh** (< 6 hours): No prompts shown
- **Stale** (6-24 hours): No prompts, but data is monitored
- **Outdated** (1-3 days): Prompts shown based on user preferences
- **Critical** (3+ days): Always prompts for refresh

### 2. User-Configurable Preferences

Users can control refresh behavior through three frequency settings:

- **Conservative**: Only shows prompts for critically outdated data (3+ days)
- **Normal**: Shows prompts for outdated data (1+ day) - Default setting
- **Aggressive**: Shows prompts more frequently (12+ hours)

### 3. Smart Dismissal System

When users dismiss a refresh prompt, they can choose:

- **Temporary** (2 hours): Quick dismissal for short-term use
- **Session** (8 hours): Standard dismissal for current session
- **Extended** (24 hours): Don't ask again today

### 4. Context-Aware Prompting

The system considers multiple factors before showing prompts:

- User's preference settings
- Current dismissal status
- Network connectivity
- Data criticality level
- Time since last sync

## Implementation Details

### Core Service Methods

```typescript
// Check if data needs synchronization (24+ hours)
await OfflineStorageService.needsSync()

// Get detailed cache freshness information
await OfflineStorageService.getCacheFreshness()

// Check if refresh prompt should be shown (respects user preferences)
await OfflineStorageService.shouldShowRefreshPrompt()

// Dismiss prompts for specified duration
await OfflineStorageService.recordPromptDismissal('session')
```

### React Hook Integration

The `useSmartRefresh` hook provides easy integration:

```typescript
const { 
  shouldShowPrompt, 
  cacheFreshness, 
  dismissPrompt,
  updateRefreshPreferences 
} = useSmartRefresh();
```

### Settings Integration

Users can access refresh settings through:
- Settings → Data Refresh
- Configure auto-prompt behavior
- Set frequency preferences
- View current cache status

## Benefits

### For Users
- **Reduced Annoyance**: No more frequent, unnecessary refresh prompts
- **Control**: Full control over when and how often to be reminded
- **Transparency**: Clear information about data age and freshness
- **Flexibility**: Multiple dismissal options for different situations

### For Developers
- **Intelligent Logic**: Automatic handling of refresh timing
- **Easy Integration**: Simple hook-based API
- **Comprehensive Testing**: Full test coverage for all scenarios
- **Configurable**: Easy to adjust thresholds and behavior

## Usage Examples

### Basic Integration
```typescript
// In any component that needs refresh awareness
const { shouldShowPrompt, dismissPrompt } = useSmartRefresh();

if (shouldShowPrompt) {
  // Show refresh UI
}
```

### Custom Refresh Logic
```typescript
// Check specific data freshness
const freshness = await OfflineStorageService.getCacheFreshness();

if (freshness.status === 'critical') {
  // Force refresh for critical data
}
```

### User Preference Updates
```typescript
// Update user preferences
await OfflineStorageService.setRefreshPreferences({
  enableAutoPrompts: true,
  promptFrequency: 'conservative'
});
```

## Configuration

### Default Settings
- Auto prompts: Enabled
- Frequency: Normal (1+ day for prompts)
- Sync threshold: 24 hours
- Critical threshold: 3 days

### Customizable Thresholds
All timing thresholds can be adjusted in `OfflineStorageService`:

```typescript
const CACHE_EXPIRY = {
  PRAYER_TIMES: 24 * 60 * 60 * 1000, // 24 hours
  QIBLA_DIRECTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  ISLAMIC_CALENDAR: 30 * 24 * 60 * 60 * 1000 // 30 days
};
```

## Testing

The system includes comprehensive tests covering:
- Cache age detection accuracy
- User preference respect
- Dismissal period handling
- Edge cases and error scenarios

Run tests with:
```bash
npm test src/test/refresh-logic.test.ts
```

## Migration from Old System

The new system automatically:
- Migrates existing cache data
- Applies sensible defaults for new users
- Maintains backward compatibility
- Reduces prompt frequency immediately

## Troubleshooting

### Common Issues

1. **Prompts still showing frequently**
   - Check user preferences in Settings → Data Refresh
   - Verify dismissal periods are being respected
   - Consider switching to 'conservative' frequency

2. **No prompts showing when expected**
   - Ensure auto prompts are enabled
   - Check if prompts are dismissed
   - Verify network connectivity

3. **Cache not updating**
   - Check `needsSync()` return value
   - Verify network connectivity
   - Review last sync timestamp

### Debug Information

Access debug info through:
```typescript
const stats = await OfflineStorageService.getCacheStats();
const freshness = await OfflineStorageService.getCacheFreshness();
```

## Future Enhancements

Potential improvements:
- Machine learning-based prompt timing
- Context-aware refresh (e.g., prayer time proximity)
- Battery-aware sync scheduling
- User behavior analysis for optimization