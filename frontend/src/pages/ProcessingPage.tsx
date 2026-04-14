import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '@/hooks/useScreening';
import { getRandomPrediction } from '@/mockData/predictions';
import { motion } from 'framer-motion';
import { Brain, Heart } from 'lucide-react';


const stages = [
  'Preprocessing heart sound...',
  'Extracting acoustic features...',
  'Running AI classification model...',
  'Calculating risk score...',
  'Generating report...',
];

export default function ProcessingPage() {
  const [stageIndex, setStageIndex] = useState(0);
  const navigate = useNavigate();
  const { setLatestResult } = useScreening();

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev >= stages.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 600);

    const timeout = setTimeout(() => {
      const result = getRandomPrediction();
      setLatestResult(result);
      navigate('/results');
    }, 3500);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [navigate, setLatestResult]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div className="absolute inset-0 rounded-full bg-primary/10" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.div className="absolute inset-0 rounded-full bg-primary/5" animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Heart Sound</h2>
        <p className="text-muted-foreground mb-6">Our AI is processing your recording</p>

        <div className="space-y-3 text-left max-w-xs mx-auto">
          {stages.map((stage, i) => (
            <motion.div key={stage} initial={{ opacity: 0.3 }} animate={{ opacity: i <= stageIndex ? 1 : 0.3 }} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${i <= stageIndex ? 'bg-primary' : 'bg-border'}`} />
              <span className={`text-sm ${i <= stageIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{stage}</span>
              {i === stageIndex && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Heart className="h-3 w-3 text-primary" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
