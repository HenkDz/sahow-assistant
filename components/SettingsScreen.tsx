import React, { useState, useEffect } from 'react';
import { SettingsService, ComprehensiveUserPreferences } from '../services/SettingsService';
import { useTranslation } from '../i18n/I18nProvider';
import { Header } from './Header';
import MadhabSelector from './MadhabSelector';
import NotificationSettings from './NotificationSettings';
import LanguageSettings from './LanguageSettings';
import DisplaySettings from './DisplaySettings';
import CalculationMethodSelector from './CalculationMethodSelector';
import OfflineErrorBoundary from './OfflineErrorBoundary';
import RefreshSettings from './RefreshSettings';

// Icons
const BellIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalculatorIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const HeartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface SettingsScreenProps {
  onBack: () => void;
}

type SettingsSection = 
  | 'main' 
  | 'calculation' 
  | 'notifications' 
  | 'display' 
  | 'language' 
  | 'privacy' 
  | 'accessibility'
  | 'refresh';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { t, isRTL, currentLanguage } = useTranslation('settings');
  
  // Temporary fallback for legacy components
  const legacyT = new Proxy({} as Record<string, string>, {
    get: () => ''
  });
  const [preferences, setPreferences] = useState<ComprehensiveUserPreferences | null>(null);
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await SettingsService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async <T extends keyof ComprehensiveUserPreferences>(
    section: T,
    updates: Partial<ComprehensiveUserPreferences[T]>
  ) => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);
      
      await SettingsService.updatePreferences(section, updates);
      
      // Update local state
      setPreferences(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: typeof prev[section] === 'object' && prev[section] !== null
            ? { ...prev[section] as object, ...updates as object }
            : updates
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateTopLevel = async <T extends keyof ComprehensiveUserPreferences>(
    key: T,
    value: ComprehensiveUserPreferences[T]
  ) => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);
      
      // Create a partial update with just this key
      const updates = { [key]: value } as Partial<ComprehensiveUserPreferences>;
      await SettingsService.savePreferences({ ...preferences, ...updates });
      
      // Update local state
      setPreferences(prev => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await SettingsService.resetToDefaults();
      await loadPreferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = async () => {
    try {
      const data = await SettingsService.exportPreferences();
      
      // Create and trigger download
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sahw-assistant-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header title={t('title')} onBack={onBack} isRTL={isRTL} />
        
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header title={t('title')} onBack={onBack} isRTL={isRTL} />
        
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mx-4">
            <p className="text-red-600 font-semibold mb-2">{t('error_title')}</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={loadPreferences}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderMainMenu = () => {
    const menuItems = [
      {
        id: 'calculation' as SettingsSection,
        title: t('calculation'),
        description: t('calculation_desc'),
        icon: CalculatorIcon,
        badge: SettingsService.getCalculationMethodInfo(preferences.calculationMethod).name
      },
      {
        id: 'notifications' as SettingsSection,
        title: t('notifications'),
        description: t('notifications_desc'),
        icon: BellIcon,
        badge: preferences.notifications.enabled ? t('enabled') : t('disabled')
      },
      {
        id: 'display' as SettingsSection,
        title: t('display'),
        description: t('display_desc'),
        icon: EyeIcon,
        badge: preferences.display.theme
      },
      {
        id: 'language' as SettingsSection,
        title: t('language'),
        description: t('language_desc'),
        icon: GlobeIcon,
        badge: preferences.language === 'ar' ? 'العربية' : 'English'
      },
      {
        id: 'privacy' as SettingsSection,
        title: t('privacy'),
        description: t('privacy_desc'),
        icon: ShieldIcon,
        badge: preferences.privacy.analyticsEnabled ? t('enabled') : t('disabled')
      },
      {
        id: 'refresh' as SettingsSection,
        title: t('refresh'),
        description: t('refresh_desc'),
        icon: RefreshIcon,
        badge: t('title')
      },
      {
        id: 'accessibility' as SettingsSection,
        title: t('accessibility'),
        description: t('accessibility_desc'),
        icon: HeartIcon,
        badge: Object.values(preferences.accessibility).some(Boolean) ? t('enabled') : t('disabled')
      }
    ];

    return (
      <div className="px-4 py-6">
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentSection(item.id)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={exportSettings}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            {t('export_settings')}
          </button>
          
          <button
            onClick={resetToDefaults}
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            {saving ? t('resetting') : t('reset_to_defaults')}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'calculation':
        return (
          <div className="px-4 py-6">
            <MadhabSelector
              value={preferences.madhab}
              calculationMethod={preferences.calculationMethod}
              onChange={(madhab) => updateTopLevel('madhab', madhab)}
              onCalculationMethodChange={(calculationMethod) => updateTopLevel('calculationMethod', calculationMethod)}
              lang={currentLanguage}
              t={legacyT}
            />
            <CalculationMethodSelector
              value={preferences.calculationMethod}
              onChange={(calculationMethod) => updateTopLevel('calculationMethod', calculationMethod)}
              lang={currentLanguage}
              t={legacyT}
            />
          </div>
        );

      case 'notifications':
        return (
          <div className="px-4 py-6">
            <NotificationSettings
              value={preferences.notifications}
              onChange={(notifications) => updateSection('notifications', notifications)}
              lang={currentLanguage}
            />
          </div>
        );

      case 'display':
        return (
          <div className="px-4 py-6">
            <DisplaySettings
              value={preferences.display}
              onChange={(display) => updateSection('display', display)}
              lang={currentLanguage}
            />
          </div>
        );

      case 'language':
        return (
          <div className="px-4 py-6">
            <LanguageSettings
              value={preferences.language}
              onChange={(language) => updateSection('language', language)}
              lang={currentLanguage}
            />
          </div>
        );

      case 'refresh':
        return (
          <div className="px-4 py-6">
            <RefreshSettings />
          </div>
        );

      default:
        return renderMainMenu();
    }
  };

  const getSectionTitle = () => {
    const titles = {
      main: t('title'),
      calculation: t('calculation'),
      notifications: t('notifications'),
      display: t('display'),
      language: t('language'),
      refresh: t('refresh'),
      privacy: t('privacy'),
      accessibility: t('accessibility')
    };

    return titles[currentSection] || titles.main;
  };

  const handleBack = () => {
    if (currentSection === 'main') {
      onBack();
    } else {
      setCurrentSection('main');
    }
  };

  return (
    <OfflineErrorBoundary feature="settings">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header 
          title={getSectionTitle()} 
          onBack={handleBack} 
          isRTL={isRTL} 
        />
        
        <div className="pb-safe">
          {renderSection()}
        </div>

        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 mx-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-700">{t('saving')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfflineErrorBoundary>
  );
};

export default SettingsScreen;
