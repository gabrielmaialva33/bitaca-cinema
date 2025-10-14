import { useState } from 'react';
import { usePlaceBet, useUserBets } from '../hooks/useBetting';

interface BettingInterfaceProps {
  userId: string;
}

// Mock battles for demo - in production, this would come from an API
const MOCK_BATTLES = [
  {
    id: 'battle-1',
    title: 'AI Battle: GPT-4 vs Claude',
    contestants: ['GPT-4', 'Claude'],
    status: 'live',
    odds: [1.8, 2.2],
  },
  {
    id: 'battle-2',
    title: 'Human vs AI: MC Flow vs Gemini',
    contestants: ['MC Flow', 'Gemini AI'],
    status: 'upcoming',
    odds: [2.5, 1.5],
  },
];

export default function BettingInterface({ userId }: BettingInterfaceProps) {
  const [selectedBattle, setSelectedBattle] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betOn, setBetOn] = useState<string>('');

  const placeBetMutation = usePlaceBet(userId);
  const { data: betsData } = useUserBets(userId, 10);

  const handlePlaceBet = async (battleId: string, contestant: string, amount: number) => {
    try {
      await placeBetMutation.mutateAsync({
        user_id: userId,
        battle_id: battleId,
        bet_on: contestant,
        bet_amount: amount,
      });
      alert(`Aposta realizada! ${amount} coins em ${contestant}`);
      setSelectedBattle(null);
      setBetAmount(100);
      setBetOn('');
    } catch (error: any) {
      console.error('Erro ao apostar:', error);
      alert(error.response?.data?.detail || 'Erro ao realizar aposta');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">🎤 Batalhas de Rima</h2>

      {/* Active Battles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_BATTLES.map((battle) => (
          <div key={battle.id} className="battle-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{battle.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                battle.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
              }`}>
                {battle.status === 'live' ? '🔴 AO VIVO' : '📅 EM BREVE'}
              </span>
            </div>

            {/* Contestants */}
            <div className="space-y-3">
              {battle.contestants.map((contestant, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-lg">{contestant}</p>
                      <p className="text-gray-400 text-sm">Odds: {battle.odds[idx]}x</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBattle(battle.id);
                        setBetOn(contestant);
                      }}
                      disabled={battle.status !== 'live'}
                      className="btn-primary text-sm"
                    >
                      Apostar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bet Placement Modal */}
      {selectedBattle && betOn && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Realizar Aposta</h3>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Apostando em:</label>
                <p className="text-white text-xl font-bold">{betOn}</p>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Valor da Aposta:</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min={10}
                  max={10000}
                  step={10}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
                />
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedBattle(null);
                    setBetOn('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handlePlaceBet(selectedBattle, betOn, betAmount)}
                  disabled={placeBetMutation.isPending}
                  className="flex-1 btn-primary"
                >
                  {placeBetMutation.isPending ? 'Apostando...' : `Apostar ${betAmount} 🪙`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bets */}
      {betsData && betsData.bets.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">📊 Suas Apostas Recentes</h3>
          <div className="space-y-2">
            {betsData.bets.slice(0, 5).map((bet) => (
              <div key={bet._id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{bet.bet_on}</p>
                  <p className="text-gray-400 text-sm">
                    {bet.bet_amount} coins @ {bet.odds}x
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  bet.status === 'won' ? 'bg-green-500 text-white' :
                  bet.status === 'lost' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-black'
                }`}>
                  {bet.status === 'won' ? '✅ Ganhou' :
                   bet.status === 'lost' ? '❌ Perdeu' :
                   '⏳ Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
