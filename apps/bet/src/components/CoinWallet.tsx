import { useWallet } from '../hooks/useWallet';

interface CoinWalletProps {
  userId: string;
}

export default function CoinWallet({ userId }: CoinWalletProps) {
  const { data: wallet, isLoading, error } = useWallet(userId);

  if (isLoading) {
    return (
      <div className="wallet-card animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-32 mb-4"></div>
        <div className="h-12 bg-gray-800 rounded w-48"></div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="wallet-card border-red-500/50">
        <p className="text-red-400">Erro ao carregar carteira</p>
      </div>
    );
  }

  return (
    <div className="wallet-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">💰 Carteira</h2>
      </div>

      <div className="space-y-4">
        {/* Balance */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Saldo Atual</p>
          <p className="text-4xl font-bold text-primary coin-spin">
            {wallet.balance.toLocaleString()}
            <span className="text-2xl ml-2">coins</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <div>
            <p className="text-gray-400 text-sm">Total Ganho</p>
            <p className="text-xl font-semibold text-green-400">
              +{wallet.total_earned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Gasto</p>
            <p className="text-xl font-semibold text-red-400">
              -{wallet.total_spent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
