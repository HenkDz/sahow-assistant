import React from 'react';
import { ArrowLeftIcon } from './icons/HeroIcons';

interface HeaderProps {
  title: string;
  onBack: () => void;
  isRTL?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, isRTL }) => {
  return (
    <div className="bg-white shadow-sm border-b border-blue-100 sticky top-0 pt-12 z-10">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeftIcon className={`w-6 h-6 text-blue-600 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-xl font-bold text-blue-800">{title}</h1>
          <div className="w-10"></div> {/* Spacer for centering title */}
        </div>
      </div>
    </div>
  );
};
