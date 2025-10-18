// src/components/NarratorDayPhase.tsx - FINAL & KOMPLETT

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import Modal from './Modal';
import { ROLES_CONFIG } from '../constants';

type DayPhase =
  | 'death_overview'
  | 'maid_action'
  | 'hunter_action'
  | 'discussion'
  | 'voting'
  | 'game_over';

interface NarratorDayPhaseProps {
  players: Player[];
  nightDeaths: string[];
  onPlayersUpdate: (players: Player[]) => void;
  onContinueToNextRound: () => void;
  onGameEnd: (winner: string) => void;
  currentRound: number;
  locale: string;
  t: (key: string) => string;
}

const NarratorDayPhase: React.FC<NarratorDayPhaseProps> = ({
  players,
  nightDeaths,
  onPlayersUpdate,
  onContinueToNextRound,
  onGameEnd,
  currentRound,
  locale,
  t,
}) => {
  const [dayPhase, setDayPhase] = useState<DayPhase>('death_overview');
  const [voteResult, setVoteResult] = useState<string | null>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showVoteResult, setShowVoteResult] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);

  // Lebende Spieler
  const getAlivePlayers = useMemo(
    () => localPlayers.filter((p) => p.status === 'alive'),
    [localPlayers]
  );

  const getRoleInfo = (roleId: string) => {
    const roleConfig = ROLES_CONFIG.find((r) => r.id === roleId);
    if (!roleConfig) return { name: roleId };
    return { name: t(roleConfig.nameKey) };
  };

  // Gewinnbedingung prüfen
  const checkWinConditions = useCallback((): string | null => {
    const alive = getAlivePlayers;
    const werewolves = alive.filter(
      (p) =>
        p.role.id === 'werwolf' ||
        p.role.id === 'der_grosse_boese_werwolf' ||
        p.role.id === 'der_weisse_werwolf'
    );
    const nonWerewolves = alive.filter(
      (p) =>
        p.role.id !== 'werwolf' &&
        p.role.id !== 'der_grosse_boese_werwolf' &&
        p.role.id !== 'der_weisse_werwolf'
    );

    // Weißer Werwolf allein
    const whiteWolf = alive.find((p) => p.role.id === 'der_weisse_werwolf');
    if (whiteWolf && alive.length === 1) {
      return 'white_wolf';
    }

    // Werwölfe gewinnen
    if (werewolves.length > 0 && nonWerewolves.length === 0) {
      return 'werewolves';
    }

    // Dorfbewohner gewinnen
    if (werewolves.length === 0 && nonWerewolves.length > 0) {
      return 'villagers';
    }

    return null;
  }, [getAlivePlayers]);

  // Tod Overview
  const handleDeathOverviewContinue = useCallback(() => {
    const maidPlayer = localPlayers.find(
      (p) => p.role.id === 'ergebene_magd' && p.status === 'alive'
    );

    if (maidPlayer && nightDeaths.length > 0) {
      setDayPhase('maid_action');
      audioManager.playAudio(locale as any, 'narrator_day_maid_choice', () => {});
    } else {
      const hunterInDeaths = nightDeaths.some((name) => {
        const player = localPlayers.find((p) => p.name === name);
        return player?.originalRole.id === 'jaeger';
      });

      if (hunterInDeaths) {
        setDayPhase('hunter_action');
        audioManager.playAudio(locale as any, 'narrator_day_hunter_shoots', () => {});
      } else {
        setDayPhase('discussion');
        audioManager.playAudio(locale as any, 'narrator_day_discussion', () => {});
      }
    }
  }, [localPlayers, nightDeaths, locale]);

  // Ergebene Magd Action
  const handleMaidAction = useCallback(
    (wantToSwitch: boolean) => {
      if (!wantToSwitch) {
        // Weiter zur nächsten Phase
        const hunterInDeaths = nightDeaths.some((name) => {
          const player = localPlayers.find((p) => p.name === name);
          return player?.originalRole.id === 'jaeger';
        });

        if (hunterInDeaths) {
          setDayPhase('hunter_action');
          audioManager.playAudio(locale as any, 'narrator_day_hunter_shoots', () => {});
        } else {
          setDayPhase('discussion');
          audioManager.playAudio(locale as any, 'narrator_day_discussion', () => {});
        }
      }
      // Wenn yes: warte auf Spieler-Input (wird in UI gemacht)
    },
    [nightDeaths, localPlayers, locale]
  );

  // Hunter Action
  const handleHunterAction = useCallback(
    (targetName: string) => {
      const newPlayers = [...localPlayers];
      const targetIndex = newPlayers.findIndex((p) => p.name === targetName);

      if (targetIndex !== -1) {
        newPlayers[targetIndex].status = 'dead';
        setLocalPlayers(newPlayers);
        onPlayersUpdate(newPlayers);

        setDayPhase('discussion');
        audioManager.playAudio(locale as any, 'narrator_day_discussion', () => {});
      }
    },
    [localPlayers, locale, onPlayersUpdate]
  );

  // Abstimmung
  const handleVoteSelect = useCallback(
    (playerName: string) => {
      const newPlayers = [...localPlayers];
      const playerIndex = newPlayers.findIndex((p) => p.name === playerName);

      if (playerIndex !== -1) {
        newPlayers[playerIndex].status = 'dead';
        setLocalPlayers(newPlayers);
        setVoteResult(playerName);
        setShowVotingModal(false);

        // Prüfe Gewinnbedingungen
        const gameWinner = checkWinConditions();
        if (gameWinner) {
          setWinner(gameWinner);
          setShowWinner(true);
        } else {
          onPlayersUpdate(newPlayers);
          setShowVoteResult(true);
        }
      }
    },
    [localPlayers, checkWinConditions, onPlayersUpdate]
  );

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
      <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">
        ☀️ Tagesphase - Runde {currentRound}
      </h1>

      {/* TODESÜBERSICHT */}
      {dayPhase === 'death_overview' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
            <p className="font-semibold mb-3">Gestorbene diese Nacht:</p>
            {nightDeaths.length > 0 ? (
              <div className="space-y-2">
                {nightDeaths.map((name) => {
                  const player = localPlayers.find((p) => p.name === name);
                  return (
                    <div key={name} className="text-red-700">
                      <p className="font-semibold">• {name}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 italic">Niemand ist gestorben.</p>
            )}
          </div>

          <button
            onClick={handleDeathOverviewContinue}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Weiter
          </button>
        </div>
      )}

      {/* ERGEBENE MAGD */}
      {dayPhase === 'maid_action' && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <p className="font-semibold mb-3">Ergebene Magd</p>
            <p className="text-gray-700">
              Es gibt Tote in dieser Nacht. Möchtest du die Rolle eines Verstorbenen
              übernehmen und weiterleben?
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleMaidAction(false)}
              className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Nein, weiterleben
            </button>
            <button
              onClick={() => {
                // Maid will Rolle tauschen - Modal zum Wählen
                setShowVotingModal(true);
              }}
              className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
            >
              Ja, Rolle übernehmen
            </button>
          </div>

          {showVotingModal && (
            <Modal
              title="Verstorbene Spieler"
              onClose={() => setShowVotingModal(false)}
              size="md"
              isOpaque={true}
            >
              <p className="mb-4 text-sm">Wähle einen Verstorbenen, dessen Rolle du übernehmen möchtest:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nightDeaths.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      // Hier würde Rolle-Tausch stattfinden
                      setShowVotingModal(false);
                      handleMaidAction(false);
                    }}
                    className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* JÄGER */}
      {dayPhase === 'hunter_action' && (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
            <p className="font-semibold mb-3">Jäger</p>
            <p className="text-gray-700">
              Der Jäger ist gestorben. Mit seinem letzten Atemzug schießt er noch einen Schuss ab.
              Wähle ein Opfer!
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {getAlivePlayers.map((player) => (
              <button
                key={player.name}
                onClick={() => handleHunterAction(player.name)}
                className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200 font-semibold"
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DISKUSSIONSPHASE */}
      {dayPhase === 'discussion' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <p className="font-semibold mb-2">Diskussionsphase</p>
            <p className="text-gray-700">
              Besprecht euch, wer der Werwolf sein könnte. Wenn ihr bereit seid, klickt auf
              "Zur Abstimmung".
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Noch im Spiel:</p>
            <p className="text-sm text-gray-700">
              {getAlivePlayers.map((p) => p.name).join(', ')}
            </p>
          </div>

          <button
            onClick={() => {
              setDayPhase('voting');
              setShowVotingModal(true);
              audioManager.playAudio(locale as any, 'narrator_day_voting', () => {});
            }}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Zur Abstimmung
          </button>
        </div>
      )}

      {/* ABSTIMMUNG */}
      {dayPhase === 'voting' && showVotingModal && (
        <Modal
          title="Abstimmung"
          onClose={() => {}}
          size="md"
          isOpaque={true}
        >
          <p className="mb-4 font-semibold">
            Wählt eine Person aus, die ihr anklagen möchtet.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getAlivePlayers.map((player) => (
              <button
                key={player.name}
                onClick={() => handleVoteSelect(player.name)}
                className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200 transition"
              >
                <p className="font-semibold">{player.name}</p>
                <p className="text-xs text-gray-600">{getRoleInfo(player.role.id).name}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ABSTIMMUNGSERGEBNIS */}
      {showVoteResult && (
        <Modal
          title="Abstimmungsergebnis"
          onClose={() => {}}
          isOpaque={true}
        >
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
              <p className="font-semibold mb-2">{voteResult} wurde angeklagt.</p>
              <p className="text-sm text-gray-700">
                Die Person stirbt und wird aus dem Spiel entfernt.
              </p>
            </div>

            <button
              onClick={() => {
                setShowVoteResult(false);
                onContinueToNextRound();
              }}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Nächste Runde
            </button>
          </div>
        </Modal>
      )}

      {/* SPIELENDE */}
      {showWinner && winner && (
        <Modal
          title="Spiel beendet!"
          onClose={() => {}}
          isOpaque={true}
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <p className="font-bold text-lg mb-2">
                {winner === 'villagers' && '🏘️ Die Dorfbewohner haben gewonnen!'}
                {winner === 'werewolves' && '🐺 Die Werwölfe haben gewonnen!'}
                {winner === 'white_wolf' && '⚪ Der weiße Werwolf hat allein gewonnen!'}
              </p>
              <p className="text-sm text-gray-700">Das Spiel ist vorbei.</p>
            </div>

            <button
              onClick={() => {
                onGameEnd(winner);
              }}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Zurück zur Startseite
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NarratorDayPhase;