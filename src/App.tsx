import React, { useState, useCallback, useMemo } from 'react';
import { Page, Player, Role } from './types';
import HomePage from './components/HomePage';
import PlayerEntryPage from './components/PlayerEntryPage';
import RoleSelectionPage from './components/RoleSelectionPage';
import CardRevealPage from './components/CardRevealPage';
import GameOverviewPage from './components/GameOverviewPage';
import NarratorPage from './components/NarratorPage';
import { ROLES_CONFIG } from './constants';
import { useTranslation } from './LanguageContext';

interface MaidActionHistory {
  maidName: string;
  maidOriginalRole: Role;
  targetName: string;
  targetOriginalRole: Role;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [players, setPlayers] = useState<string[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<Player[]>([]);
  const [narratorRound, setNarratorRound] = useState<'1' | '2'>('1');
  
  const [selectedRoles, setSelectedRoles] = useState<Record<string, number>>({});
  const [thiefExtraRoles, setThiefExtraRoles] = useState<Role[]>([]);
  const [jesterExtraRoles, setJesterExtraRoles] = useState<Role[]>([]);
  const [lovers, setLovers] = useState<string[]>([]);

  const [urwolfHasUsedAbility, setUrwolfHasUsedAbility] = useState(false);
  const [orphanHasUsedAbility, setOrphanHasUsedAbility] = useState(false);
  const [maidActionHistory, setMaidActionHistory] = useState<MaidActionHistory | null>(null);
  
  const { t } = useTranslation();

  const ROLES: Role[] = useMemo(() => ROLES_CONFIG.map(role => ({
    id: role.id,
    name: t(role.nameKey),
    description: t(role.descriptionKey)
  })), [t]);

  const handleSetPlayers = useCallback((playerNames: string[]) => {
    const currentTotalRoles = Object.values(selectedRoles).reduce((a, b) => a + b, 0);
    if (playerNames.length < currentTotalRoles) {
      setSelectedRoles({});
    }
    setPlayers(playerNames);
    setCurrentPage('role-selection');
  }, [selectedRoles]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const handleStartGame = useCallback((roles: Role[], thiefRoles: Role[], jesterRoles: Role[]) => {
    const shuffledRoles = shuffleArray(roles);
    const assigned: Player[] = players.map((name, index) => ({
      name,
      role: shuffledRoles[index],
      originalRole: shuffledRoles[index],
      status: 'alive',
    }));
    setAssignedRoles(assigned);
    setThiefExtraRoles(thiefRoles);
    setJesterExtraRoles(jesterRoles);
    setLovers([]);
    setUrwolfHasUsedAbility(false);
    setOrphanHasUsedAbility(false);
    setMaidActionHistory(null);
    setNarratorRound('1');
    setCurrentPage('card-reveal');
  }, [players]);
  
  const handleGoToRoleSelection = useCallback(() => {
    setCurrentPage('role-selection');
  }, []);

  const handleGoHome = useCallback(() => {
    setPlayers([]);
    setAssignedRoles([]);
    setThiefExtraRoles([]);
    setJesterExtraRoles([]);
    setLovers([]);
    setSelectedRoles({});
    setOrphanHasUsedAbility(false);
    setCurrentPage('home');
  }, []);

  const handleTogglePlayerStatus = useCallback((playerName: string) => {
    let newPlayers = [...assignedRoles];
    const playerIndex = newPlayers.findIndex(p => p.name === playerName);

    if (playerIndex === -1) return;

    const clickedPlayer = newPlayers[playerIndex];
    
    if (lovers.includes(clickedPlayer.name)) {
        const areBothLoversDead = lovers.every(loverName => {
            const loverPlayer = newPlayers.find(p => p.name === loverName);
            return loverPlayer && loverPlayer.status === 'dead';
        });
        
        if (areBothLoversDead && clickedPlayer.status === 'dead') {
             newPlayers = newPlayers.map(p => {
                if (lovers.includes(p.name)) {
                    return { ...p, status: 'alive' };
                }
                return p;
            });
        } else { 
            newPlayers = newPlayers.map(p => {
                if (lovers.includes(p.name)) {
                    return { ...p, status: 'dead' };
                }
                return p;
            });
        }
        
    } else {
        const newStatus = clickedPlayer.status === 'dead' ? 'alive' : 'dead';
        newPlayers[playerIndex] = { ...clickedPlayer, status: newStatus };
    }

    if (maidActionHistory) {
        const targetPlayer = newPlayers.find(p => p.name === maidActionHistory.targetName);
        if (targetPlayer && targetPlayer.status === 'alive') {
            const maidPlayer = newPlayers.find(p => p.name === maidActionHistory.maidName);
            if (maidPlayer) {
                const maidPlayerIndex = newPlayers.findIndex(p => p.name === maidActionHistory.maidName);
                const targetPlayerIndex = newPlayers.findIndex(p => p.name === maidActionHistory.targetName);

                newPlayers[maidPlayerIndex].role = maidActionHistory.maidOriginalRole;
                newPlayers[targetPlayerIndex].role = maidActionHistory.targetOriginalRole;
            }
            setMaidActionHistory(null); 
        }
    }
    
    setAssignedRoles(newPlayers);
  }, [assignedRoles, lovers, maidActionHistory]);
  
  const handleMaidAction = (maidName: string, targetName: string) => {
    const maidPlayerIndex = assignedRoles.findIndex(p => p.name === maidName);
    const targetPlayerIndex = assignedRoles.findIndex(p => p.name === targetName);

    if (maidPlayerIndex === -1 || targetPlayerIndex === -1) return;

    const newPlayers = [...assignedRoles];
    const maidPlayer = newPlayers[maidPlayerIndex];
    const targetPlayer = newPlayers[targetPlayerIndex];

    setMaidActionHistory({
      maidName: maidPlayer.name,
      maidOriginalRole: maidPlayer.role,
      targetName: targetPlayer.name,
      targetOriginalRole: targetPlayer.role,
    });
    
    maidPlayer.role = targetPlayer.role;
    targetPlayer.status = 'dead';
    
    setAssignedRoles(newPlayers);
  };
  
  const handleUrwolfAction = (targetName: string) => {
    const targetPlayerIndex = assignedRoles.findIndex(p => p.name === targetName);
    if (targetPlayerIndex === -1) return;

    const newPlayers = [...assignedRoles];
    const werwolfRole = ROLES.find(r => r.id === 'werwolf');
    if (werwolfRole) {
      newPlayers[targetPlayerIndex].role = werwolfRole;
    }
    setUrwolfHasUsedAbility(true);
    setAssignedRoles(newPlayers);
  };

  const handleOrphanAction = (orphanName: string, targetName: string) => {
  const orphanPlayerIndex = assignedRoles.findIndex(p => p.name === orphanName);
  const targetPlayerIndex = assignedRoles.findIndex(p => p.name === targetName);

  if (orphanPlayerIndex === -1 || targetPlayerIndex === -1) return;

  const newPlayers = [...assignedRoles];
  const orphanPlayer = newPlayers[orphanPlayerIndex];
  const targetPlayer = newPlayers[targetPlayerIndex];

  orphanPlayer.role = targetPlayer.role;
  
  setOrphanHasUsedAbility(true);
  setAssignedRoles(newPlayers);
};
  
  const handleRoleSwap = (playerOriginalRole: 'dieb' | 'gaukler', newRole: Role) => {
    const newPlayers = [...assignedRoles];
    
    // Finde ALLE Spieler mit dieser AKTUELLEN Rolle (inkl. Waisenkind!)
    const playersWithRole = newPlayers.filter(p => p.role.id === playerOriginalRole);
    
    // Tausche die Rolle für ALLE Spieler (Vorbild + Waisenkind)
    playersWithRole.forEach(player => {
      player.role = newRole;
    });
    
    // Für Dieb: Entferne die gewählte Karte
    if(playerOriginalRole === 'dieb') {
      setThiefExtraRoles(prev => prev.filter(r => r.id !== newRole.id));
    }
    
    setAssignedRoles(newPlayers);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onStart={() => setCurrentPage('player-entry')} />;
      case 'player-entry':
        return <PlayerEntryPage onNext={handleSetPlayers} initialPlayerNames={players} />;
      case 'role-selection':
        return <RoleSelectionPage 
                  playerCount={players.length} 
                  onBack={() => setCurrentPage('player-entry')} 
                  onStartGame={handleStartGame}
                  initialSelectedRoles={selectedRoles}
                  onSelectionChange={setSelectedRoles}
                />;
      case 'card-reveal':
        return <CardRevealPage players={assignedRoles} onComplete={() => setCurrentPage('overview')} />;
      case 'overview':
        return <GameOverviewPage 
                  players={assignedRoles} 
                  onTogglePlayerStatus={handleTogglePlayerStatus} 
                  onNavigate={handleGoHome}
                  onGoToNarrator={() => setCurrentPage('narrator')}
                  onGoToRoleSelection={handleGoToRoleSelection}
                  thiefExtraRoles={thiefExtraRoles}
                  jesterExtraRoles={jesterExtraRoles}
                  lovers={lovers}
                  onSetLovers={setLovers}
                  onMaidAction={handleMaidAction}
                  onUrwolfAction={handleUrwolfAction}
                  onRoleSwap={handleRoleSwap}
                  urwolfHasUsedAbility={urwolfHasUsedAbility}
                  orphanHasUsedAbility={orphanHasUsedAbility}
                  onOrphanAction={handleOrphanAction}
                />;
      case 'narrator':
        return <NarratorPage 
                  onBack={() => setCurrentPage('overview')} 
                  activeRound={narratorRound}
                  setActiveRound={setNarratorRound}
                  players={assignedRoles}
                />;
      default:
        return <HomePage onStart={() => setCurrentPage('player-entry')} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f4f7f9]">
      {renderPage()}
    </div>
  );
};

export default App;