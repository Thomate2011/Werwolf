import React, { useState } from 'react';
import { Player, Role } from '../types';
import { InfoIcon } from './icons';
import Modal from './Modal';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

type Action = 'amor' | 'dieb' | 'gaukler' | 'urwolf' | 'ergebene_magd' | 'waisenkind' | null;
type SelectionMode = 'amor' | 'urwolf' | 'ergebene_magd' | 'waisenkind' | null;

interface GameOverviewPageProps {
  players: Player[];
  onTogglePlayerStatus: (playerName: string) => void;
  onNavigate: (page: 'home') => void;
  onGoToNarrator: () => void;
  onGoToRoleSelection: () => void;
  thiefExtraRoles: Role[];
  jesterExtraRoles: Role[];
  lovers: string[];
  onSetLovers: (lovers: string[]) => void;
  onMaidAction: (maidName: string, targetName: string) => void;
  onUrwolfAction: (targetName: string) => void;
  onOrphanAction: (orphanName: string, targetName: string) => void;
  onRoleSwap: (playerOriginalRole: 'dieb' | 'gaukler', newRole: Role) => void;
  urwolfHasUsedAbility: boolean;
  orphanHasUsedAbility: boolean;
}

const RoleCard: React.FC<{ role: Role; onClick?: () => void }> = ({ role, onClick }) => (
    <div className={`p-4 border-2 border-blue-400 rounded-lg text-center bg-white shadow-md ${onClick ? 'cursor-pointer hover:bg-blue-50' : ''}`} onClick={onClick}>
        <h3 className="text-4xl lg:text-5xl font-bold text-blue-800 break-words [hyphens:auto]">{role.name}</h3>
        <p className="mt-2 text-sm">{role.description}</p>
    </div>
);

const GameOverviewPage: React.FC<GameOverviewPageProps> = (props) => {
  const { 
    players, onTogglePlayerStatus, onNavigate, onGoToNarrator, onGoToRoleSelection, 
    thiefExtraRoles, jesterExtraRoles, lovers, onSetLovers, onMaidAction, 
    onUrwolfAction, onRoleSwap, urwolfHasUsedAbility, orphanHasUsedAbility, onOrphanAction
  } = props;
  
  const [infoModalRole, setInfoModalRole] = useState<Role | null>(null);
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const [showRemoveLoversModal, setShowRemoveLoversModal] = useState(false);
  const { t } = useTranslation();

  const findAlivePlayerByOriginalRole = (roleId: string): Player | undefined => {
    return players.find(p => p.originalRole.id === roleId && p.status === 'alive');
  };
  
  const findAlivePlayerByCurrentRole = (roleId: string): Player | undefined => {
    return players.find(p => p.role.id === roleId && p.status === 'alive');
  }

  const amorPlayer = findAlivePlayerByOriginalRole('amor');
  const thiefPlayer = findAlivePlayerByCurrentRole('dieb');
  const jesterPlayer = findAlivePlayerByOriginalRole('gaukler');
  const urwolfPlayer = findAlivePlayerByOriginalRole('urwolf');
  const maidPlayer = findAlivePlayerByCurrentRole('ergebene_magd');
  const orphanPlayer = findAlivePlayerByOriginalRole('waisenkind');

  const hasSpecialActions = (amorPlayer && lovers.length < 2) || thiefPlayer || (jesterPlayer && jesterPlayer.role.id !== 'werwolf') || (urwolfPlayer && !urwolfHasUsedAbility) || maidPlayer || (orphanPlayer && !orphanHasUsedAbility);
  
  const handlePlayerClick = (clickedPlayerIndex: number) => {
    if (selectionMode) {
      const clickedPlayer = players[clickedPlayerIndex];

      if (selectionMode === 'amor') {
        if (lovers.length < 2 && !lovers.includes(clickedPlayer.name)) {
          const newLovers = [...lovers, clickedPlayer.name];
          onSetLovers(newLovers);
          if (newLovers.length === 2) {
            setSelectionMode(null);
            setActiveAction(null);
            setSelectionMessage('');
          } else {
            setSelectionMessage(t('select_second_person'));
          }
        }
      } else if (selectionMode === 'urwolf') {
          onUrwolfAction(clickedPlayer.name);
          setSelectionMode(null);
          setActiveAction(null);
          setSelectionMessage('');
      } else if (selectionMode === 'ergebene_magd' && maidPlayer) {
          if (clickedPlayer.name === maidPlayer.name) return;
          onMaidAction(maidPlayer.name, clickedPlayer.name);
          setSelectionMode(null);
          setActiveAction(null);
          setSelectionMessage('');
      } else if (selectionMode === 'waisenkind' && orphanPlayer) {
          if (clickedPlayer.name === orphanPlayer.name) return;
          onOrphanAction(orphanPlayer.name, clickedPlayer.name);
          setSelectionMode(null);
          setActiveAction(null);
          setSelectionMessage('');
      }
    } else {
      onTogglePlayerStatus(players[clickedPlayerIndex].name);
    }
  };
  
  const startSelection = (mode: SelectionMode, messageKey: string) => {
    setSelectionMode(mode);
    setSelectionMessage(t(messageKey));
    setActiveAction(null);
  }
  
  const removeLovers = () => {
      onSetLovers([]);
      setShowRemoveLoversModal(false);
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333] relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('overview_title')}</h1>
        <button onClick={onGoToNarrator} className="bg-[#2e7d32] text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">
          {t('narrator_text_btn')}
        </button>
      </div>

      {selectionMessage && <p className="text-center font-bold text-blue-600 bg-blue-100 p-2 rounded-md mb-4">{selectionMessage}</p>}
      
      {hasSpecialActions && (
        <div className="mb-4 p-3 border rounded-lg bg-gray-50">
          <h3 className="font-bold text-center mb-2">{t('special_actions')}</h3>
          <div className="flex justify-center items-start flex-wrap gap-4 text-center">
              {amorPlayer && lovers.length < 2 && <button onClick={() => setActiveAction('amor')} className="hover:opacity-75"><span className="text-3xl">❤️</span><br/><span className="text-xs">{t('love')}</span></button>}
              {thiefPlayer && thiefExtraRoles.length > 0 && <button onClick={() => setActiveAction('dieb')} className="hover:opacity-75"><span className="text-3xl">💰</span><br/><span className="text-xs">{t('thief')}</span></button>}
              {jesterPlayer && jesterExtraRoles.length > 0 && jesterPlayer.role.id !== 'werwolf' && <button onClick={() => setActiveAction('gaukler')} className="hover:opacity-75"><span className="text-3xl">🎭</span><br/><span className="text-xs">{t('jester')}</span></button>}
              {urwolfPlayer && !urwolfHasUsedAbility && <button onClick={() => setActiveAction('urwolf')} className="hover:opacity-75"><span className="text-3xl">🐺</span><br/><span className="text-xs">{t('urwolf')}</span></button>}
              {maidPlayer && <button onClick={() => setActiveAction('ergebene_magd')} className="hover:opacity-75"><span className="text-3xl">👩🏼</span><br/><span className="text-xs">{t('maid')}</span></button>}
              {orphanPlayer && !orphanHasUsedAbility && <button onClick={() => setActiveAction('waisenkind')} className="hover:opacity-75"><span className="text-3xl">👦🏼</span><br/><span className="text-xs">{t('orphan')}</span></button>}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded-md">{t('overview_instruction')}</p>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {players.map((player, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-3 rounded-lg transition ${player.status === 'alive' ? 'cursor-pointer' : ''} ${selectionMode && player.status === 'alive' ? 'hover:bg-blue-100' : 'cursor-pointer'} ${
              player.status === 'dead' ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => handlePlayerClick(index)}
          >
            <div className="flex items-center">
                <span className={`font-semibold ${player.status === 'dead' ? 'line-through' : ''}`}>
                  {player.role.name} | {player.name}
                </span>
            </div>
            <div className="flex items-center space-x-2">
                {lovers.includes(player.name) && (
                    <button onClick={(e) => { e.stopPropagation(); setShowRemoveLoversModal(true); }} className="text-lg">❤️</button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setInfoModalRole(player.role); }} className="text-blue-500 hover:text-blue-700">
                  <InfoIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <button onClick={onGoToRoleSelection} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition">
            {t('restart')}
          </button>
          <p className="text-xs text-gray-500 mt-1">{t('restart_info')}</p>
        </div>
        <div className="text-center">
          <button onClick={() => onNavigate('home')} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition">
            {t('to_homepage')}
          </button>
           <p className="text-xs text-gray-500 mt-1">{t('homepage_info')}</p>
        </div>
      </div>

      {infoModalRole && (
        <Modal title={infoModalRole.name} onClose={() => setInfoModalRole(null)} isOpaque={true}>
          <p>{infoModalRole.description}</p>
        </Modal>
      )}

      {showRemoveLoversModal && (
          <Modal title={t('lovers_modal_title')} onClose={() => setShowRemoveLoversModal(false)}>
              <p>{t('lovers_modal_desc')}</p>
              <button onClick={removeLovers} className="mt-4 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg">{t('lovers_modal_btn')}</button>
          </Modal>
      )}

      {activeAction && (
        <Modal 
            title={
                activeAction === 'amor' ? t('love') : 
                activeAction === 'dieb' ? t('thief') : 
                activeAction === 'gaukler' ? t('jester') : 
                activeAction === 'urwolf' ? t('urwolf') : 
                activeAction === 'ergebene_magd' ? t('maid') : t('orphan')
            }
            onClose={() => setActiveAction(null)}
            size={activeAction === 'dieb' || activeAction === 'gaukler' ? 'full' : 'md'}
            isOpaque={true}
        >
          {activeAction === 'dieb' && (
             <div className="space-y-4">
                <p>{t('action_thief_desc')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {thiefExtraRoles.map((role, i) => <RoleCard key={i} role={role} onClick={() => { onRoleSwap('dieb', role); setActiveAction(null); }} />)}
                </div>
              </div>
          )}
          {activeAction === 'gaukler' && (
             <div className="space-y-4">
                <p>{t('action_jester_desc')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {jesterExtraRoles.map((role, i) => <RoleCard key={i} role={role} onClick={() => { onRoleSwap('gaukler', role); setActiveAction(null); }} />)}
                </div>
              </div>
          )}
          {activeAction === 'amor' && (
            <>
              <p>{t('action_love_desc')}</p>
              <button onClick={() => startSelection('amor', 'select_first_person')} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{t('action_love_btn')}</button>
            </>
          )}
          {activeAction === 'urwolf' && (
            <>
              <p>{t('action_urwolf_desc')}</p>
              <button onClick={() => startSelection('urwolf', 'select_person_to_infect')} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{t('action_urwolf_btn')}</button>
            </>
          )}
           {activeAction === 'ergebene_magd' && (
            <>
              <p>{t('action_maid_desc')}</p>
              <button onClick={() => startSelection('ergebene_magd', 'select_person_for_maid')} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{t('action_maid_btn')}</button>
            </>
          )}
           {activeAction === 'waisenkind' && (
            <>
              <p>{t('action_orphan_desc')}</p>
              <button onClick={() => startSelection('waisenkind', 'select_role_model')} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{t('action_orphan_btn')}</button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default GameOverviewPage;