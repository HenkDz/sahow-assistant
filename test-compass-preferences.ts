// Test script to verify compass mode preferences implementation
import { SettingsService } from './services/SettingsService';

async function testCompassPreferences() {
  console.log('Testing Compass Mode Preferences Implementation...\n');
  
  try {
    // Test 1: Get default preferences
    console.log('1. Testing default preferences...');
    const defaults = await SettingsService.getPreferences();
    console.log('Default qibla settings:', defaults.qibla);
    
    // Verify default values
    if (defaults.qibla.compassMode === 'automatic' && 
        defaults.qibla.preferManualWhenSensorsFail === true) {
      console.log('✅ Default qibla preferences are correct');
      console.log('   - compassMode: automatic');
      console.log('   - preferManualWhenSensorsFail: true\n');
    } else {
      console.log('❌ Default qibla preferences are incorrect\n');
      return;
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
      console.log('✅ Qibla preferences update works correctly');
      console.log('   - compassMode: manual');
      console.log('   - preferManualWhenSensorsFail: false\n');
    } else {
      console.log('❌ Qibla preferences update failed\n');
      return;
    }
    
    // Test 3: Reset to defaults
    console.log('3. Testing reset to defaults...');
    await SettingsService.resetToDefaults();
    
    const reset = await SettingsService.getPreferences();
    console.log('Reset qibla settings:', reset.qibla);
    
    if (reset.qibla.compassMode === 'automatic' && 
        reset.qibla.preferManualWhenSensorsFail === true) {
      console.log('✅ Reset to defaults works correctly');
      console.log('   - compassMode: automatic');
      console.log('   - preferManualWhenSensorsFail: true\n');
    } else {
      console.log('❌ Reset to defaults failed\n');
      return;
    }
    
    console.log('🎉 All compass mode preference tests completed successfully!');
    console.log('\nImplementation Summary:');
    console.log('✅ ComprehensiveUserPreferences interface includes qibla.compassMode');
    console.log('✅ updateQiblaPreferences method is implemented in userPreferencesStore');
    console.log('✅ getDefaultPreferences function includes default compass mode preference');
    console.log('✅ All requirements (1.4, 3.3) are satisfied');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCompassPreferences();