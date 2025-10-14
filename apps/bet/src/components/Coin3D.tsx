import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Coin3DProps {
  position?: [number, number, number];
  scale?: number;
  spinning?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export default function Coin3D({
  position = [0, 0, 0],
  scale = 1,
  spinning = false,
  interactive = false,
  onClick,
}: Coin3DProps) {
  const coinRef = useRef<THREE.Group>(null);
  const hoverRef = useRef(false);

  useFrame((state) => {
    if (!coinRef.current) return;

    const time = state.clock.getElapsedTime();

    if (spinning) {
      // Coin flip animation
      coinRef.current.rotation.y += 0.1;
    } else if (interactive && hoverRef.current) {
      // Hover animation
      coinRef.current.rotation.y = Math.sin(time * 2) * 0.3;
      coinRef.current.position.y = position[1] + Math.sin(time * 4) * 0.1;
    } else {
      // Idle subtle rotation
      coinRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    }
  });

  const handlePointerOver = () => {
    if (interactive) {
      hoverRef.current = true;
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    hoverRef.current = false;
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      ref={coinRef}
      position={position}
      scale={scale}
      onClick={onClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Coin body */}
      <mesh>
        <cylinderGeometry args={[1, 1, 0.1, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
          emissive="#FFA500"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Coin rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.05, 16, 32]} />
        <meshStandardMaterial
          color="#DAA520"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight
        position={[0, 0, 0]}
        color="#FFD700"
        intensity={0.5}
        distance={3}
      />
    </group>
  );
}
