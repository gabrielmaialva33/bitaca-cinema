import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Floating blood particles
function BloodParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = window.innerWidth < 768 ? 300 : 500; // Less particles on mobile

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random positions in 3D space
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Blood red colors with variation
      colors[i * 3] = 0.5 + Math.random() * 0.5; // R
      colors[i * 3 + 1] = 0.0; // G
      colors[i * 3 + 2] = 0.0; // B
    }

    return [positions, colors];
  }, [count]);

  useFrame((state) => {
    if (!particlesRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Slow floating motion
      positions[i3 + 1] += Math.sin(time + i) * 0.001;

      // Wrap around if particle goes too high
      if (positions[i3 + 1] > 10) {
        positions[i3 + 1] = -10;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Slow rotation
    particlesRef.current.rotation.y = time * 0.05;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Creepy fog effect
function Fog() {
  return (
    <>
      <fogExp2 attach="fog" args={['#050505', 0.05]} />
      <ambientLight intensity={0.2} color="#8B0000" />
      <directionalLight position={[0, 5, 5]} intensity={0.3} color="#FF0000" />
    </>
  );
}

// Glitchy grid floor
function GlitchGrid() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Random glitch effect
    if (Math.random() > 0.95) {
      meshRef.current.position.y = Math.random() * 0.1 - 0.05;
    } else {
      meshRef.current.position.y = -5;
    }

    // Pulse opacity
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.1 + Math.sin(time * 2) * 0.05;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[50, 50, 20, 20]} />
      <meshBasicMaterial
        color="#8B0000"
        wireframe
        transparent
        opacity={0.1}
      />
    </mesh>
  );
}

// Rotating ominous shapes
function OminousShapes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = time * 0.1;
    groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
  });

  const shapes = useMemo(() => {
    const count = window.innerWidth < 768 ? 5 : 8;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 8;
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle * 2) * 2,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: Math.random() * 0.5 + 0.3,
      };
    });
  }, []);

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <mesh key={i} position={shape.position} scale={shape.scale}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#4A0000"
            emissive="#8B0000"
            emissiveIntensity={0.2}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

export default function HorrorBackground3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{
          antialias: false, // Better performance on mobile
          powerPreference: 'low-power', // Battery saving
        }}
        dpr={window.innerWidth < 768 ? 1 : 1.5} // Lower resolution on mobile
      >
        <Fog />
        <BloodParticles />
        <GlitchGrid />
        <OminousShapes />
      </Canvas>
    </div>
  );
}
