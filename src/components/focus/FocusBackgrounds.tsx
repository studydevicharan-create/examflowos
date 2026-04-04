import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

type BgType = 'breathing' | 'particles' | 'waves';
type Intensity = 'low' | 'medium';

interface Props {
  type: BgType;
  intensity: Intensity;
  progress: number; // 0–1 timer progress
  sound: string;
}

// Breathing gradient — slow color shift loop
function BreathingGradient({ intensity, progress }: { intensity: Intensity; progress: number }) {
  const baseOpacity = intensity === 'low' ? 0.25 : 0.4;
  // React to progress: brighter mid-session, subtle glow near end
  const dynamicOpacity = baseOpacity + progress * 0.15;
  const duration = 8 - progress * 2; // faster near end (8s → 6s)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        background: [
          `radial-gradient(ellipse at 30% 50%, hsl(217 91% 20% / ${dynamicOpacity}) 0%, hsl(270 40% 12% / ${dynamicOpacity * 0.6}) 50%, transparent 80%)`,
          `radial-gradient(ellipse at 70% 40%, hsl(270 50% 18% / ${dynamicOpacity}) 0%, hsl(217 60% 15% / ${dynamicOpacity * 0.6}) 50%, transparent 80%)`,
          `radial-gradient(ellipse at 40% 60%, hsl(230 45% 15% / ${dynamicOpacity}) 0%, hsl(260 35% 10% / ${dynamicOpacity * 0.6}) 50%, transparent 80%)`,
          `radial-gradient(ellipse at 30% 50%, hsl(217 91% 20% / ${dynamicOpacity}) 0%, hsl(270 40% 12% / ${dynamicOpacity * 0.6}) 50%, transparent 80%)`,
        ],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// Particle drift — tiny dots floating
function ParticleDrift({ intensity, progress, sound }: { intensity: Intensity; progress: number; sound: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }>>([]);

  const count = intensity === 'low' ? 30 : 50;
  // Sound sync: brown = slower, rain = slight wobble, white = static drift
  const speedMul = sound === 'Brown' ? 0.5 : sound === 'Rain' ? 0.8 : 1;
  const dynamicSpeed = (0.15 + progress * 0.15) * speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio > 1 ? 2 : 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio > 1 ? 2 : 1);
    };
    resize();

    // Init particles once
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
        });
      }
    }

    let lastTime = 0;
    const draw = (time: number) => {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx * dynamicSpeed * delta * 0.06;
        p.y += p.vy * dynamicSpeed * delta * 0.06;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(210, 25%, 92%, ${p.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count, dynamicSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
    />
  );
}

// Wave flow — soft horizontal wave lines
function WaveFlow({ intensity, progress }: { intensity: Intensity; progress: number }) {
  const baseOpacity = intensity === 'low' ? 0.06 : 0.1;
  const opacity = baseOpacity + progress * 0.04;
  const duration = 10 - progress * 3;

  const waves = useMemo(() => [
    { d: 'M0,50 Q150,20 300,50 Q450,80 600,50 Q750,20 900,50 Q1050,80 1200,50', y: '30%' },
    { d: 'M0,50 Q150,80 300,50 Q450,20 600,50 Q750,80 900,50 Q1050,20 1200,50', y: '55%' },
    { d: 'M0,50 Q150,30 300,50 Q450,70 600,50 Q750,30 900,50 Q1050,70 1200,50', y: '75%' },
  ], []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {waves.map((wave, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
          className="absolute w-[200%] h-12"
          style={{ top: wave.y }}
          animate={{ x: [0, -600] }}
          transition={{ duration: duration + i * 2, repeat: Infinity, ease: 'linear' }}
        >
          <path
            d={wave.d}
            fill="none"
            stroke={`hsla(217, 91%, 60%, ${opacity})`}
            strokeWidth="1.5"
          />
        </motion.svg>
      ))}
    </div>
  );
}

export default function FocusBackground({ type, intensity, progress, sound }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      {type === 'breathing' && <BreathingGradient intensity={intensity} progress={progress} />}
      {type === 'particles' && <ParticleDrift intensity={intensity} progress={progress} sound={sound} />}
      {type === 'waves' && <WaveFlow intensity={intensity} progress={progress} />}
    </div>
  );
}
