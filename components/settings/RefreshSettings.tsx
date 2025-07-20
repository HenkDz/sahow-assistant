import { useState, useEffect } from 'react';
import { OfflineStorageService } from '../../services/OfflineStorageService';

interface RefreshSettingsProps {
  onClose?: () => void;
}

export default function RefreshSettings({ onClose }: RefreshSettingsProps) {
  const [preferences, setPreferences] = useState({
    enableAutoPrompts: true,
    promptFrequency: 'normal' as 'conservative' | 'normal' | 'aggressive'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await OfflineStorageService.getRefreshPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading refresh preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await OfflineStorageService.setRefreshPreferences(preferences);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving refresh preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFrequencyDescription = (frequency: string) => {
    switch (frequency) {
      case 'conservative':
        return 'Only show refresh prompts when data is critically outdated (3+ days)';
      case 'normal':
        return 'Show refresh prompts when data is outdated (1+ day)';
      case 'aggressive':
        return 'Show refresh prompts more frequently (12+ hours)';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Refresh Settings
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Enable Auto Prompts */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Auto Refresh Prompts
            </label>
            <p className="text-xs text-gray-500">
              Show prompts when data needs refreshing
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enableAutoPrompts}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                enableAutoPrompts: e.target.checked
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Prompt Frequency */}
        {preferences.enableAutoPrompts && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Frequency
            </label>
            <div className="space-y-2">
              {(['conservative', 'normal', 'aggressive'] as const).map((frequency) => (
                <label key={frequency} className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value={frequency}
                    checked={preferences.promptFrequency === frequency}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      promptFrequency: e.target.value as 'conservative' | 'normal' | 'aggressive'
                    }))}
                    className="mt-1 mr-3 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700 capitalize">
                      {frequency}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getFrequencyDescription(frequency)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Current Status
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Auto prompts: {preferences.enableAutoPrompts ? 'Enabled' : 'Disabled'}</div>
            {preferences.enableAutoPrompts && (
              <div>Frequency: {preferences.promptFrequency}</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}