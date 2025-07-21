import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';

interface RadiusSelectorProps {
  value: number;
  onChange: (value: number) => void;
  onApply?: () => void;
  className?: string;
  showApplyButton?: boolean;
  compact?: boolean;
}

const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  value,
  onChange,
  onApply,
  className = '',
  showApplyButton = false,
  compact = false
}) => {
  const { t } = useTranslation('mosques');
  const [inputValue, setInputValue] = useState(value.toString());
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setInputValue(value.toString());
    setIsDirty(false);
  }, [value]);

  const handleSliderChange = (newValue: number) => {
    setInputValue(newValue.toString());
    onChange(newValue);
    setIsDirty(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      onChange(Math.min(100, Math.max(1, numValue)));
      setIsDirty(true);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < 1 || numValue > 100) {
      setInputValue(value.toString());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onApply && isDirty) {
      onApply();
    }
  };

  const sliderStyle = {
    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-600 whitespace-nowrap">{t('radius')}:</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            className="w-16 text-sm border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <span className="text-sm text-gray-500">km</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with current value */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {t('searchRadius')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            className="w-16 text-sm border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <span className="text-sm text-gray-500">km</span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="100"
          value={value}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all slider"
          style={sliderStyle}
        />
        
        {/* Range indicators */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>1km</span>
          <span className="text-blue-600 font-medium">{value}km</span>
          <span>100km</span>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div className="flex gap-2">
        {[5, 10, 20, 50].map((preset) => (
          <button
            key={preset}
            onClick={() => handleSliderChange(preset)}
            className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
              value === preset
                ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
            }`}
          >
            {preset}km
          </button>
        ))}
      </div>

      {/* Apply button */}
      {showApplyButton && onApply && (
        <button
          onClick={onApply}
          disabled={!isDirty}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t('applyFilters')}
        </button>
      )}
    </div>
  );
};

export default RadiusSelector; 