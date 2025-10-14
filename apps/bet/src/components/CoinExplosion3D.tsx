import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import Coin3D from './Coin3D';

interface CoinExplosion3DProps {
  show: boolean;
  amount: number;
  onComplete?: () => void;
}

interface CoinData {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  scale: number;
}

export default function CoinExplosion3D({
  show,
  amount,
  onComplete,
}: CoinExplosion3DProps) {
  const [coins, setCoins] = useState<CoinData[]>([]);

  useEffect(() => {
    if (!show) {
      setCoins([]);
      return;
    }

    // Generate explosion of coins
    const coinCount = Math.min(amount / 100, 20); // Max 20 coins
    const newCoins: CoinData[] = Array.from({ length: coinCount }, (_, i) => ({
      id: i,
      position: [0, 0, 5] as [number, number, number],
      velocity: [
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 2,
        (Math.random() - 0.5) * 2,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.3,
    }));

    setCoins(newCoins);

    // Animate coins flying out
    const interval = setInterval(() => {
      setCoins((prevCoins) =>
        prevCoins.map((coin) => ({
          ...coin,
          position: [
            coin.position[0] + coin.velocity[0] * 0.1,
            coin.position[1] + coin.velocity[1] * 0.1,
            coin.position[2] + coin.velocity[2] * 0.1,
          ] as [number, number, number],
          velocity: [
            coin.velocity[0] * 0.98,
            coin.velocity[1] - 0.2, // Gravity
            coin.velocity[2] * 0.98,
          ] as [number, number, number],
        }))
      );
    }, 50);

    // Complete after 2 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete?.();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [show, amount, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{
          antialias: false,
          alpha: true,
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {coins.map((coin) => (
          <Coin3D
            key={coin.id}
            position={coin.position}
            scale={coin.scale}
            spinning
          />
        ))}
      </Canvas>

      {/* Amount text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl font-bold text-secondary animate-pulse drop-shadow-[0_0_10px_rgba(0,255,65,0.8)]">
          +{amount.toLocaleString()} 🪙
        </div>
      </div>
    </div>
  );
}
