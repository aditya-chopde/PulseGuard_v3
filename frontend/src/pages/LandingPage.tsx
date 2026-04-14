import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Mic, Brain, FileText, Shield, ArrowRight, Activity, Users, Zap, ChevronRight, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import HeroECG from '@/components/HeroECG';
import PulseGuardLogo from '@/components/PulseGuardLogo';

const features = [
  { icon: Brain, title: 'Heart Sound Analysis', desc: 'Deep learning models analyze phonocardiogram signals for abnormalities' },
  { icon: Activity, title: 'Severity Classification', desc: 'Automatic grading of cardiac conditions from mild to severe' },
  { icon: Zap, title: 'Risk Score Prediction', desc: 'Real-time cardiac risk assessment with confidence scoring' },
  { icon: Users, title: 'Doctor Dashboard', desc: 'Seamless specialist consultation and case review workflows' },
  { icon: Monitor, title: 'Patient Monitoring', desc: 'Continuous tracking of cardiac health trends over time' },
];

const steps = [
  { icon: Mic, title: 'Record Heart Sound', desc: 'Capture audio via stethoscope' },
  { icon: Brain, title: 'AI Analysis', desc: 'Process with deep learning' },
  { icon: Activity, title: 'Risk Score', desc: 'Get severity & risk score' },
  { icon: FileText, title: 'Doctor Review', desc: 'Expert validation & report' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <PulseGuardLogo size={28} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-muted-foreground">Login</Button>
            <Button onClick={() => navigate('/signup')} className="gradient-primary text-primary-foreground border-0">
              Sign Up <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
                <Activity className="h-3.5 w-3.5" />
                AI-Powered Cardiac Pre-Screening
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-[1.1]">
                AI Powered Cardiac Screening for{' '}
                <span className="text-gradient">Early Detection</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Helping clinics detect heart abnormalities early using intelligent heart sound analysis. PulseGuard brings affordable AI-driven screening to rural healthcare.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate('/signup')} className="gradient-primary text-primary-foreground border-0 px-8 h-12">
                  Start Screening <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="px-8 h-12 border-border hover:bg-muted">
                  View Demo <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Animated ECG illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              <div className="glass-card p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Live Heart Beat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-critical" />
                    <span className="text-sm font-mono font-bold text-foreground">72 BPM</span>
                  </div>
                </div>
                <HeroECG height={220} />
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>Lead II</span>
                  <span>25mm/s • 10mm/mV</span>
                  <span className="text-success font-medium">Normal Sinus Rhythm</span>
                </div>
              </div>

              {/* Floating stat cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-4 -left-4 glass-card px-4 py-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                  <div className="text-lg font-bold text-foreground">94.2%</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -top-4 -right-4 glass-card px-4 py-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Screenings</div>
                  <div className="text-lg font-bold text-foreground">12,400+</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Key Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Advanced cardiac analysis powered by deep learning</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }} className="glass-card p-6 group hover:glow-border transition-all duration-300">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          </motion.div>
          <div className="grid sm:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="text-xs font-bold text-primary mb-1">STEP {i + 1}</div>
                <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            <span className="font-semibold text-foreground">PulseGuard</span>
          </div>
          AI-Powered Cardiac Pre-Screening System &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
