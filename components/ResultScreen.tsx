
import React from 'react';
import { Language, ResultKey } from '../types';
import { ScaleIcon, BookOpenIcon, ArrowPathIcon, ArrowLeftIcon } from './icons/HeroIcons';

interface ResultScreenProps {
  resultKey: ResultKey | null;
  onStartOver: () => void;
  onBack: () => void;
  t: Record<string, string>;
  lang: Language;
}

const InfoCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    content: string;
    borderColor: string;
    bgColor: string;
}> = ({ title, icon, content, borderColor, bgColor }) => {

    const contentContainerClasses = [
        'text-slate-700',
        'text-base',
        'space-y-4',
        '[&_p]:mb-2',
        '[&_ul]:list-disc',
        '[&_ul]:space-y-1.5',
        'ltr:[&_ul]:list-inside',
        'rtl:[&_ul]:list-inside',
        '[&_li]:mb-1',
        '[&_strong]:font-semibold',
        '[&_strong]:text-blue-600',
        '[&_.text-red-600]:text-red-600', // style propagation
        'ltr:text-left',
        'rtl:text-right',
    ].join(' ');

    return (
        <div className={`rounded-xl border-t-4 ${borderColor} ${bgColor} p-5 shadow-md`}>
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <div
                className={contentContainerClasses}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
};

const ResultScreen: React.FC<ResultScreenProps> = ({ resultKey, onStartOver, onBack, t, lang }) => {
  if (!resultKey) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
              aria-label={t.btn_back}
            >
              <ArrowLeftIcon className="w-6 h-6 text-blue-600" />
            </button>
            <h1 className="text-xl font-bold text-blue-800">{t.result_title}</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <InfoCard 
          title={t[`${resultKey}_title`]}
          icon={<ScaleIcon className="w-6 h-6 text-blue-600" />}
          content={t[`${resultKey}_details`]}
          borderColor="border-blue-500"
          bgColor="bg-white"
        />
        
        <InfoCard 
          title={t.daleel_title}
          icon={<BookOpenIcon className="w-6 h-6 text-green-600" />}
          content={t[`${resultKey}_daleel`]}
          borderColor="border-green-500"
          bgColor="bg-white"
        />

        <button
          onClick={onStartOver}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className="w-5 h-5"/>
          <span>{t.btn_start_over}</span>
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
