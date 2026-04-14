import { motion } from 'framer-motion';

interface WaveformProps {
  isAnimating: boolean;
  barCount?: number;
}

export default function Waveform({ isAnimating, barCount = 40 }: WaveformProps) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-16">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-primary"
          animate={
            isAnimating
              ? {
                  height: [8, Math.random() * 48 + 8, 8],
                }
              : { height: 8 }
          }
          transition={
            isAnimating
              ? {
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: Math.random() * 0.3,
                }
              : { duration: 0.3 }
          }
          style={{ minHeight: 8 }}
        />
      ))}
    </div>
  );
}
