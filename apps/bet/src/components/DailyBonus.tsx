import { useState } from 'react';
import { useWallet, useDailyBonus } from '../hooks/useWallet';

interface DailyBonusProps {
  userId: string;
}

export default function DailyBonus({ userId }: DailyBonusProps) {
  const { data: wallet } = useWallet(userId);
  const dailyBonusMutation = useDailyBonus(userId);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleClaim = async () => {
    try {
      await dailyBonusMutation.mutateAsync();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error: any) {
      console.error('Erro ao coletar bônus:', error);
      alert(error.response?.data?.detail || 'Erro ao coletar bônus diário');
    }
  };

  if (!wallet) return null;

  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="card relative overflow-hidden">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse z-10 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉 +100 coins!</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">🎁 Bônus Diário</h3>
          <p className="text-gray-400 text-sm">
            Ganhe 100 coins todos os dias!
          </p>
        </div>

        <div>
          {wallet.can_claim_bonus ? (
            <button
              onClick={handleClaim}
              disabled={dailyBonusMutation.isPending}
              className="btn-primary animate-pulse-glow"
            >
              {dailyBonusMutation.isPending ? 'Coletando...' : 'Coletar 🪙'}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">Próximo bônus em:</p>
              <p className="text-white font-mono text-lg">
                {formatTimeRemaining(wallet.next_bonus_in)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Last Claim Info */}
      {wallet.last_daily_bonus && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-gray-500 text-xs">
            Último bônus: {new Date(wallet.last_daily_bonus).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
