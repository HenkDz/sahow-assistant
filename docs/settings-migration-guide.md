# Settings System Migration Guide

This guide explains how to add new settings to the unified settings management system that was implemented as part of the settings persistence fix.

## Overview

The application now uses a unified settings management system with proper i18n support. All settings are persisted across app sessions and synchronized between different storage mechanisms.

## Adding New Settings

### 1. Update Type Definitions

First, add your new setting to the appropriate interface in `types.ts`:

```typescript
// For user preferences
interface UserPreferences {
  // existing settings...
  newSetting: boolean; // or appropriate type
}

// For specific setting categories
interface NotificationPreferences {
  // existing settings...
  newNotificationSetting: string;
}
```

### 2. Add Translation Keys

Add translation keys for your new setting in the i18n locale files:

```json
// i18n/locales/en.json
{
  "settings": {
    "new_setting_label": "New Setting",
    "new_setting_description": "Description of what this setting does"
  }
}

// i18n/locales/ar.json
{
  "settings": {
    "new_setting_label": "الإعداد الجديد",
    "new_setting_description": "وصف ما يفعله هذا الإعداد"
  }
}
```

### 3. Update Settings Service

If your setting requires special handling, update the `SettingsService`:

```typescript
// services/SettingsService.ts
export class SettingsService {
  // Add methods for your new setting
  async getNewSetting(): Promise<boolean> {
    // Implementation
  }

  async setNewSetting(value: boolean): Promise<void> {
    // Implementation with validation
  }
}
```

### 4. Update Settings Store

Add the new setting to the Zustand store:

```typescript
// stores/userPreferencesStore.ts
interface UserPreferencesState {
  // existing state...
  newSetting: boolean;
  
  // Add action
  setNewSetting: (value: boolean) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      // existing state...
      newSetting: false, // default value
      
      setNewSetting: (value: boolean) => {
        set({ newSetting: value });
        // Trigger persistence
        SettingsService.setNewSetting(value);
      },
    }),
    // persist config...
  )
);
```

### 5. Create Settings Component

Create a component for your new setting:

```typescript
// components/NewSettingComponent.tsx
import { useTranslation } from '../i18n/I18nProvider';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

interface NewSettingComponentProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const NewSettingComponent: React.FC<NewSettingComponentProps> = ({
  value,
  onChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="setting-item">
      <label className="setting-label">
        {t('settings.new_setting_label')}
      </label>
      <p className="setting-description">
        {t('settings.new_setting_description')}
      </p>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="setting-input"
      />
    </div>
  );
};
```

### 6. Add to Settings Screen

Include your new setting in the main settings screen:

```typescript
// components/SettingsScreen.tsx
import { NewSettingComponent } from './NewSettingComponent';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { newSetting, setNewSetting } = useUserPreferencesStore();

  return (
    <div className="settings-screen">
      {/* existing settings... */}
      
      <NewSettingComponent
        value={newSetting}
        onChange={setNewSetting}
      />
    </div>
  );
};
```

### 7. Add Validation (Optional)

If your setting needs validation, add it to the settings validation:

```typescript
// services/SettingsService.ts
private validateSettings(settings: UserPreferences): ValidationResult {
  const errors: string[] = [];

  // Existing validations...

  // Add validation for new setting
  if (typeof settings.newSetting !== 'boolean') {
    errors.push('newSetting must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 8. Add Tests

Create tests for your new setting:

```typescript
// src/test/settings/NewSetting.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewSettingComponent } from '../../components/NewSettingComponent';

describe('NewSettingComponent', () => {
  it('should render with correct label', () => {
    render(<NewSettingComponent value={false} onChange={() => {}} />);
    expect(screen.getByText('New Setting')).toBeInTheDocument();
  });

  it('should call onChange when toggled', () => {
    const onChange = vi.fn();
    render(<NewSettingComponent value={false} onChange={onChange} />);
    
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

## Migration from Old System

If you're migrating existing settings from the old system:

### 1. Data Migration

Add migration logic to handle existing data:

```typescript
// services/SettingsService.ts
private async migrateOldSettings(): Promise<void> {
  const oldSettings = await this.getOldSettingsFormat();
  if (oldSettings) {
    const newSettings = this.convertToNewFormat(oldSettings);
    await this.saveSettings(newSettings);
    await this.removeOldSettings();
  }
}
```

### 2. Backward Compatibility

Maintain backward compatibility during transition:

```typescript
// Check for old format first
const settings = await this.getSettings() || await this.getOldSettings();
```

## Best Practices

1. **Always add default values** for new settings
2. **Include proper validation** for setting values
3. **Add comprehensive tests** for new settings
4. **Update documentation** when adding settings
5. **Consider migration path** for existing users
6. **Use proper TypeScript types** for type safety
7. **Follow i18n patterns** for all user-facing text
8. **Test cross-platform compatibility** (web and Android)

## Troubleshooting

### Settings Not Persisting
- Check that the setting is included in the persist configuration
- Verify that the SettingsService is being called correctly
- Ensure proper error handling is in place

### Translation Missing
- Verify translation keys exist in all locale files
- Check that the i18n system is properly initialized
- Ensure fallback translations are available

### Type Errors
- Update all relevant TypeScript interfaces
- Run type checking: `bun run type-check`
- Ensure proper imports and exports

### Storage Issues
- Check Capacitor Preferences configuration
- Verify LocalStorage fallback is working
- Test storage quota limits

## Testing Checklist

Before deploying new settings:

- [ ] Unit tests pass for new components
- [ ] Integration tests cover settings persistence
- [ ] Cross-platform testing (web and Android)
- [ ] Translation completeness check
- [ ] Migration testing with existing data
- [ ] Performance impact assessment
- [ ] Accessibility compliance check

## Support

For questions about the settings system:

1. Check existing settings implementations for patterns
2. Review the settings service documentation
3. Test changes thoroughly before deployment
4. Consider backward compatibility impact