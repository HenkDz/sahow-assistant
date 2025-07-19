
import React from 'react';
import { ResultKey } from '../../types';
import { ScaleIcon, BookOpenIcon, ArrowPathIcon } from '../icons/HeroIcons';
import { Header } from '../Header';
import { useTranslation } from '../../i18n/I18nProvider';

interface ResultScreenProps {
  resultKey: ResultKey | null;
  onStartOver: () => void;
  onBack: () => void;
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

const ResultScreen: React.FC<ResultScreenProps> = ({ resultKey, onStartOver, onBack }) => {
  const { t, isRTL } = useTranslation();
  
  if (!resultKey) return null;
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 ${isRTL ? 'font-[Tajawal]' : 'font-[Inter]'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header title={t('sahw_assistant:results.title')} onBack={onBack} isRTL={isRTL} />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <InfoCard 
          title={t(`sahw_assistant:results.${resultKey}.title`)}
          icon={<ScaleIcon className="w-6 h-6 text-blue-600" />}
          content={t(`sahw_assistant:results.${resultKey}.details`)}
          borderColor="border-blue-500"
          bgColor="bg-white"
        />
        
        <InfoCard 
          title={t('sahw_assistant:results.daleel_title')}
          icon={<BookOpenIcon className="w-6 h-6 text-green-600" />}
          content={t(`sahw_assistant:results.${resultKey}.daleel`)}
          borderColor="border-green-500"
          bgColor="bg-white"
        />

        <button
          onClick={onStartOver}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className="w-5 h-5"/>
          <span>{t('common:navigation.start_over')}</span>
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
