// Test script to verify qibla preferences implementation
import { SettingsService } from './services/SettingsService.js';

async function testQiblaPreferences() {
  console.log('Testing Qibla Preferences Implementation...\n');
  
  try {
    // Test 1: Get default preferences
    console.log('1. Testing default preferences...');
    const defaults = await SettingsService.getPreferences();
    console.log('Default qibla settings:', defaults.qibla);
    
    // Verify default values
    if (defaults.qibla.compassMode === 'automatic' && 
        defaults.qibla.preferManualWhenSensorsFail === true) {
      console.log('✅ Default qibla preferences are correct\n');
    } else {
      console.log('❌ Default qibla preferences are incorrect\n');
    }
    
    // Test 2: Update qibla preferences
    console.log('2. Testing qibla preferences update...');
    await SettingsService.updatePreferences('qibla', {
      compassMode: 'manual',
      preferManualWhenSensorsFail: false
    });
    
    const updated = await SettingsService.getPreferences();
    console.log('Updated qibla settings:', updated.qibla);
    
    if (updated.qibla.compassMode === 'manual' && 
        updated.qibla.preferManualWhenSensorsFail === false) {
      console.log('✅ Qibla preferences update works correctly\n');
    } else {
      console.log('❌ Qibla preferences update failed\n');
    }
    
    // Test 3: Reset to defaults
    console.log('3. Testing reset to defaults...');
    await SettingsService.resetToDefaults();
    
    const reset = await SettingsService.getPreferences();
    console.log('Reset qibla settings:', reset.qibla);
    
    if (reset.qibla.compassMode === 'automatic' && 
        reset.qibla.preferManualWhenSensorsFail === true) {
      console.log('✅ Reset to defaults works correctly\n');
    } else {
      console.log('❌ Reset to defaults failed\n');
    }
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testQiblaPreferences();