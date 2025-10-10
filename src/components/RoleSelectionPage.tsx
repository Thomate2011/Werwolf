import React, { useState, useMemo, useEffect } from 'react';
import { Role } from '../types';
import { InfoIcon, PlusIcon, MinusIcon } from './icons';
import Modal from './Modal';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

type SelectionPhase = 'main' | 'thief' | 'jester' | 'confirm_thief' | 'confirm_jester';

interface RoleSelectionPageProps {
  playerCount: number;
  onBack: () => void;
  onStartGame: (roles: Role[], thiefRoles: Role[], jesterRoles: Role[]) => void;
  initialSelectedRoles: Record<string, number>;
  onSelectionChange: (newSelection: Record<string, number>) => void;
}

const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ playerCount, onBack, onStartGame, initialSelectedRoles, onSelectionChange }) => {
  const [selectedRoles, setSelectedRoles] = useState<Record<string, number>>(initialSelectedRoles);
  const [thiefExtraRoles, setThiefExtraRoles] = useState<Record<string, number>>({});
  const [jesterExtraRoles, setJesterExtraRoles] = useState<Record<string, number>>({});
  const [infoModalRole, setInfoModalRole] = useState<Role | null>(null);
  const [phase, setPhase] = useState<SelectionPhase>('main');
  const { t } = useTranslation();

  const ROLES: Role[] = useMemo(() => ROLES_CONFIG.map(role => ({
    id: role.id,
    name: t(role.nameKey),
    description: t(role.descriptionKey)
  })), [t]);

  useEffect(() => {
    onSelectionChange(selectedRoles);
  }, [selectedRoles, onSelectionChange]);

  const isThiefInGame = (selectedRoles['dieb'] || 0) > 0;
  const isJesterInGame = (selectedRoles['gaukler'] || 0) > 0;

  const rolesForCurrentPhase = useMemo(() => {
    if (phase === 'main') return ROLES;
    return ROLES.filter(r => r.id !== 'dieb' && r.id !== 'gaukler');
  }, [phase, ROLES]);

  const {
    selectedCounts, 
    handleCountChange, 
    totalSelected, 
    targetCount 
  } = useMemo(() => {
    switch (phase) {
      case 'thief':
        return {
          selectedCounts: thiefExtraRoles,
          handleCountChange: (id: string, delta: number) => setThiefExtraRoles(prev => ({...prev, [id]: Math.max(0, (prev[id] || 0) + delta)})),
          totalSelected: Object.values(thiefExtraRoles).reduce((a, b) => a + b, 0),
          targetCount: 2,
        };
      case 'jester':
        return {
          selectedCounts: jesterExtraRoles,
          handleCountChange: (id: string, delta: number) => setJesterExtraRoles(prev => ({...prev, [id]: Math.max(0, (prev[id] || 0) + delta)})),
          totalSelected: Object.values(jesterExtraRoles).reduce((a, b) => a + b, 0),
          targetCount: 3,
        };
      default:
        return {
          selectedCounts: selectedRoles,
          handleCountChange: (id: string, delta: number) => setSelectedRoles(prev => ({...prev, [id]: Math.max(0, (prev[id] || 0) + delta)})),
          totalSelected: Object.values(selectedRoles).reduce((a, b) => a + b, 0),
          targetCount: playerCount,
        };
    }
  }, [phase, selectedRoles, thiefExtraRoles, jesterExtraRoles, playerCount]);

  const remainingRoles = targetCount - totalSelected;

  const proceed = () => {
    if (phase === 'main') {
      if (isThiefInGame) {
        setPhase('confirm_thief');
      } else if (isJesterInGame) {
        setPhase('confirm_jester');
      } else {
        handleStart();
      }
    } else if (phase === 'thief') {
      if (isJesterInGame) {
        setPhase('confirm_jester');
      } else {
        handleStart();
      }
    } else if (phase === 'jester') {
      handleStart();
    }
  };

  const handleStart = () => {
    const finalMainRoles: Role[] = [];
    Object.entries(selectedRoles).forEach(([roleId, count]) => {
      const role = ROLES.find(r => r.id === roleId);
      if (role) for (let i = 0; i < count; i++) finalMainRoles.push(role);
    });

    const finalThiefRoles: Role[] = [];
    Object.entries(thiefExtraRoles).forEach(([roleId, count]) => {
      const role = ROLES.find(r => r.id === roleId);
      if (role) for (let i = 0; i < count; i++) finalThiefRoles.push(role);
    });

    const finalJesterRoles: Role[] = [];
    Object.entries(jesterExtraRoles).forEach(([roleId, count]) => {
        const role = ROLES.find(r => r.id === roleId);
        if (role) for (let i = 0; i < count; i++) finalJesterRoles.push(role);
    });
    
    onStartGame(finalMainRoles, finalThiefRoles, finalJesterRoles);
  };
  
  const getPageTitle = () => {
    if (phase === 'thief') return t('thief_selection_title');
    if (phase === 'jester') return t('jester_selection_title');
    return t('role_selection_title');
  };

  const renderNavButtons = () => (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
      <div className="flex items-center space-x-2">
        {phase === 'main' && <button onClick={onBack} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">{t('back')}</button>}
        <LanguageSelector />
      </div>
    </div>
  );

  const renderBottomButtons = () => (
     <div className="mt-6 flex justify-between items-center">
        {phase === 'main' ? (
          <>
            <button onClick={onBack} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition">{t('back')}</button>
            {remainingRoles === 0 && (
              <button onClick={proceed} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">
                {isThiefInGame || isJesterInGame ? t('continue') : t('start_game')}
              </button>
            )}
          </>
        ) : (
           remainingRoles === 0 && (
              <button onClick={proceed} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition">
                {phase === 'thief' && isJesterInGame ? t('continue_to_jester') : t('start_game')}
              </button>
           )
        )}
     </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333] relative">
      {renderNavButtons()}
      
      <div className="text-center bg-blue-50 p-3 rounded-lg my-4">
        <p className="font-semibold">{t('select_exactly_n_roles', { count: targetCount })}</p>
        <p className="text-blue-600">{t('n_roles_to_assign', { count: remainingRoles })}</p>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {rolesForCurrentPhase.map(role => (
          <div key={role.id} className="flex items-center justify-between bg-[#fafafa] border border-[#ddd] p-3 rounded-lg">
            <div className="flex items-center flex-1 min-w-0 mr-3">
              <span className="font-semibold mr-2 truncate">{role.name}</span>
              <button onClick={() => setInfoModalRole(role)} className="text-blue-500 hover:text-blue-700 flex-shrink-0">
                <InfoIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button onClick={() => handleCountChange(role.id, -1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50" disabled={(selectedCounts[role.id] || 0) === 0}>
                <MinusIcon className="w-5 h-5" />
              </button>
              <span className="w-6 text-center font-bold">{selectedCounts[role.id] || 0}</span>
              <button onClick={() => handleCountChange(role.id, 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50" disabled={totalSelected >= targetCount}>
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {renderBottomButtons()}

      {infoModalRole && (
        <Modal title={infoModalRole.name} onClose={() => setInfoModalRole(null)}>
          <p>{infoModalRole.description}</p>
        </Modal>
      )}

      {(phase === 'confirm_thief' || phase === 'confirm_jester') && (
        <Modal 
          title={phase === 'confirm_thief' ? t('confirm_thief_title') : t('confirm_jester_title')}
          onClose={() => setPhase('main')}
          isOpaque={true}
        >
          <p>
            {phase === 'confirm_thief' 
              ? t('confirm_thief_desc')
              : t('confirm_jester_desc')
            }
          </p>
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={() => setPhase('main')}
              className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              {t('change_roles')}
            </button>
            <button
              onClick={() => setPhase(phase === 'confirm_thief' ? 'thief' : 'jester')}
              className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              {t('continue')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RoleSelectionPage;