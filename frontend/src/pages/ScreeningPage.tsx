import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import ScreeningFlow from '@/components/ScreeningFlow';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useScreening } from '@/hooks/useScreening';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Mic, Info, Stethoscope, Activity, CheckCircle2 } from 'lucide-react';

export default function ScreeningPage() {
  const navigate = useNavigate();
  const { setLatestResult } = useScreening();
  const { user } = useAuth();
  const [confirmNav, setConfirmNav] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);

  const handleComplete = (result: any) => {
    setPendingResult(result);
    setConfirmNav(true);
  };

  const handleConfirmNav = () => {
    if (pendingResult) setLatestResult(pendingResult);
    setConfirmNav(false);
    navigate('/results');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6">
        
        <div className="text-center space-y-4 pt-8 pb-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Cardiac Audio Analysis</h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered engine analyzes phonocardiogram signals using advanced neural networks. Follow the instructions below for accurate results.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          
          {/* Instructions Panel */}
          <div className="space-y-6 order-2 lg:order-1">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8">
               <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                 <Info className="h-5 w-5 text-primary" /> Preparation Guide
               </h2>
               <div className="space-y-6">
                 {[
                   { icon: Stethoscope, title: "Positioning", d: "Place your recording device (or digital stethoscope) firmly against the chest wall, specifically at the apex of the heart." },
                   { icon: Activity, title: "Environment", d: "Ensure the room is completely silent. Ambient noise will corrupt the frequency spectrum processing." },
                   { icon: CheckCircle2, title: "Duration", d: "Record continuously for at least 5-10 seconds to capture multiple complete cardiac cycles." }
                 ].map((s, i) => (
                   <div key={i} className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                        <s.icon className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                       <div className="font-semibold text-foreground">{s.title}</div>
                       <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.d}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
              <h3 className="text-sm font-semibold mb-2 text-foreground">What happens next?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">The AI extracts 40 mel-frequency cepstral coefficients (MFCC) separating abnormal murmurs from standard S1/S2 heartbeats.</p>
            </motion.div>
          </div>

          {/* Screening Tool */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="shadow-2xl rounded-3xl overflow-hidden border border-primary/20 relative order-1 lg:order-2">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
             <div className="p-4 sm:p-8 bg-card/80 backdrop-blur-xl h-full flex flex-col justify-center">
               <ScreeningFlow
                 patientId={user?._id || user?.id || ''}
                 patientName={user?.name || 'Patient'}
                 onComplete={handleComplete}
                 onClose={() => navigate('/patient')}
               />
             </div>
          </motion.div>

        </div>
      </div>

      <ConfirmDialog
        open={confirmNav}
        onOpenChange={setConfirmNav}
        title="View Detailed Results?"
        description="Screening complete! Would you like to view the full AI analysis report?"
        confirmLabel="View Results"
        cancelLabel="Back to Dashboard"
        onConfirm={handleConfirmNav}
      />
    </DashboardLayout>
  );
}
