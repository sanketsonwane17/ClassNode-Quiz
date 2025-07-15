import React, { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
  life: number;
}

interface ParticleEffectsProps {
  trigger: boolean;
  type?: 'success' | 'celebration' | 'sparkle';
  duration?: number;
}

const ParticleEffects: React.FC<ParticleEffectsProps> = ({ 
  trigger, 
  type = 'success',
  duration = 2000 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const colors = {
      success: ['#10b981', '#059669', '#34d399', '#6ee7b7'],
      celebration: ['#fbbf24', '#f59e0b', '#fb923c', '#f97316'],
      sparkle: ['#8b5cf6', '#a855f7', '#c084fc', '#ddd6fe']
    };

    const particleColors = colors[type];
    const newParticles: Particle[] = [];

    // Create particles
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: window.innerHeight,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        size: Math.random() * 6 + 4,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: -(Math.random() * 8 + 5)
        },
        life: 1
      });
    }

    setParticles(newParticles);

    // Animate particles
    const animationInterval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.velocity.x,
          y: particle.y + particle.velocity.y,
          velocity: {
            ...particle.velocity,
            y: particle.velocity.y + 0.3 // gravity
          },
          life: particle.life - 0.02
        })).filter(particle => particle.life > 0 && particle.y < window.innerHeight + 100)
      );
    }, 16);

    // Clear particles after duration
    const clearTimer = setTimeout(() => {
      setParticles([]);
      clearInterval(animationInterval);
    }, duration);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(clearTimer);
    };
  }, [trigger, type, duration]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
            transition: 'all 0.1s ease-out'
          }}
        />
      ))}
    </div>
  );
};

export default ParticleEffects;