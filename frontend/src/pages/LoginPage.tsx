import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, Stethoscope, ArrowRight, ArrowLeft, Mail, Lock, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/ThemeToggle';
import PulseGuardLogo from '@/components/PulseGuardLogo';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'role' | 'credentials';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [step, setStep] = useState<Step>('role');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setTimeout(() => setStep('credentials'), 400);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email || !password) return;
    
    setIsSubmitting(true);
    try {
      await login(email, password, selectedRole);
      toast({ title: 'Login Successful', description: `Welcome back to PulseGuard.` });
      navigate(selectedRole === 'patient' ? '/patient' : '/doctor');
    } catch (err: any) {
      toast({
        title: 'Login Failed',
        description: err.response?.data?.message || 'Invalid credentials or server error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Ambient blurs */}
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <PulseGuardLogo size={36} />
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">How would you like to continue?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { role: 'patient' as const, icon: User, title: 'Patient', desc: 'View screenings, track health, manage activity plans', color: 'primary' },
                  { role: 'doctor' as const, icon: Stethoscope, title: 'Doctor', desc: 'Review cases, manage patients, prescribe activity', color: 'accent' },
                ].map(({ role, icon: Icon, title, desc }) => (
                  <motion.button
                    key={role}
                    type="button"
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRoleSelect(role)}
                    className={`glass-card p-6 text-center transition-all group cursor-pointer border-2 ${
                      selectedRole === role
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                        : 'border-transparent hover:border-primary/20'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                      selectedRole === role ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-primary/10'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors ${
                        selectedRole === role ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    </div>
                    <div className={`text-lg font-bold mb-1 ${selectedRole === role ? 'text-primary' : 'text-foreground'}`}>{title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                    <div className={`mt-3 flex items-center justify-center gap-1 text-xs font-medium transition-opacity ${
                      selectedRole === role ? 'opacity-100 text-primary' : 'opacity-0'
                    }`}>
                      <Sparkles className="h-3 w-3" /> Selected
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button type="button" onClick={() => navigate('/signup')} className="text-primary hover:underline font-medium">
                  Sign Up
                </button>
              </div>
            </motion.div>
          )}

          {step === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <button
                type="button"
                onClick={() => { setStep('role'); setSelectedRole(null); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to role selection
              </button>

              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-primary/10`}>
                  {selectedRole === 'patient' ? <User className="h-7 w-7 text-primary" /> : <Stethoscope className="h-7 w-7 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Sign in as {selectedRole === 'patient' ? 'Patient' : 'Doctor'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleLogin} className="glass-card p-6 space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 bg-muted/50 border-border h-11"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-muted/50 border-border h-11"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary text-primary-foreground border-0 h-11">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Signing in...' : 'Continue'} {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
