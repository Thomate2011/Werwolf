import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { LANGUAGES } from '../i18n';
import Modal from './Modal';
import { GlobeIcon } from './icons';

const LanguageSelector: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { setLocale, t } = useTranslation();

  const handleSelect = (
    code: 'de' | 'en' | 'fr' | 'es' | 'pt' | 'it' | 'ru' | 'is' | 'sv' | 'zh' | 'ja' | 'tr' | 'ar' | 'ko' | 'hi' | 'bn' | 'emoji'
  ) => {
    setLocale(code);
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 hover:bg-gray-100 rounded-full transition"
        title={t('language')}
      >
        <GlobeIcon className="w-6 h-6 text-gray-700" />
      </button>

      {showModal && (
        <Modal title={t('language')} onClose={() => setShowModal(false)}>
          {/* Scrollbarer Bereich */}
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as any)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition flex items-center"
              >
                <span className="text-2xl mr-3">{lang.flag}</span>
                <span className="font-semibold">{lang.name}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

export default LanguageSelector;