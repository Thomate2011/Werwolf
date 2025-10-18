import React from 'react';
import Modal from './Modal';
import { useTranslation } from '../LanguageContext';

interface NarratorSeatingInfoProps {
  onConfirm: () => void;
}

const NarratorSeatingInfo: React.FC<NarratorSeatingInfoProps> = ({ onConfirm }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('narrator_seating_info_title')}
      onClose={() => {}}
      isOpaque={true}
      size="md"
    >
      <p className="text-center mb-6 text-lg">
        {t('narrator_seating_info_message')}
      </p>

      <button
        onClick={onConfirm}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
      >
        {t('continue')}
      </button>
    </Modal>
  );
};

export default NarratorSeatingInfo;