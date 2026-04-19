import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, Stethoscope, ArrowRight, ArrowLeft, Mail, Lock, Phone, Sparkles, Loader2, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ThemeToggle from '@/components/ThemeToggle';
import PulseGuardLogo from '@/components/PulseGuardLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from '@/components/PhoneInput';
import { MultiInputField } from '@/components/MultiInputField';
import { DoctorSelectDropdown } from '@/components/DoctorSelectDropdown';
import { sendRequest } from '@/services/doctorPatientService';
import { Shield } from 'lucide-react';

type Step = 'role' | 'credentials' | 'details' | 'security';

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [step, setStep] = useState<Step>('role');
  
  // Unified form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Patient specific
    age: '',
    gender: 'Male' as any,
    bloodGroup: 'B+',
    weight: '',
    height: '',
    smokingStatus: false,
    medicalHistory: [] as string[],
    allergies: [] as string[],
    emergencyContactName: '',
    emergencyContactPhone: '',
    preferredDoctorId: '',
    // Doctor specific
    specialization: '',
    licenseNumber: '',
    clinicName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setTimeout(() => setStep('credentials'), 400);
  };

  const setF = (updates: Partial<typeof form>) => setForm(prev => ({ ...prev, ...updates }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast({ title: 'Phone must be 10 digits', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const signupData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: selectedRole,
        ...(selectedRole === 'patient' && {
          age: form.age,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          weight: form.weight,
          height: form.height,
          smokingStatus: form.smokingStatus,
          medicalHistory: form.medicalHistory.join(', '),
          allergies: form.allergies.join(', '),
          emergencyContact: {
            name: form.emergencyContactName,
            phone: form.emergencyContactPhone,
          },
        }),
        ...(selectedRole === 'doctor' && {
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          clinicName: form.clinicName,
        }),
      };
      
      await signup(signupData);
      
      // Auto-send doctor request if patient
      if (selectedRole === 'patient' && form.preferredDoctorId) {
        try {
          await sendRequest(form.preferredDoctorId);
          toast({ title: 'Doctor request sent!' });
        } catch (reqErr) {
          console.error(reqErr);
        }
      }
      toast({ title: 'Account created successfully!' });
      navigate(selectedRole === 'patient' ? '/patient' : '/doctor');
    } catch (err: any) {
      toast({
        title: 'Signup Failed',
        description: err.response?.data?.message || 'Server error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden py-10">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Ambient blurs to match LoginPage */}
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className={`w-full ${step === 'details' ? 'max-w-xl' : 'max-w-lg'} relative z-10 transition-all duration-300`}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
          <PulseGuardLogo size={36} />
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div key="role" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Join PulseGuard</h1>
                <p className="text-muted-foreground">Select your role to get started</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { role: 'patient' as const, icon: User, title: 'Patient', desc: 'Screen your heart health, track results', color: 'primary' },
                  { role: 'doctor' as const, icon: Stethoscope, title: 'Doctor', desc: 'Review cases, manage patients', color: 'accent' },
                ].map(({ role, icon: Icon, title, desc }) => (
                  <motion.button key={role} type="button" whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }} onClick={() => handleRoleSelect(role)}
                    className={`glass-card p-6 text-center transition-all group cursor-pointer border-2 ${
                      selectedRole === role ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-transparent hover:border-primary/20'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                      selectedRole === role ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-primary/10'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors ${selectedRole === role ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </div>
                    <div className={`text-lg font-bold mb-1 ${selectedRole === role ? 'text-primary' : 'text-foreground'}`}>{title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                    <div className={`mt-3 flex items-center justify-center gap-1 text-xs font-medium transition-opacity ${selectedRole === role ? 'opacity-100 text-primary' : 'opacity-0'}`}>
                      <Sparkles className="h-3 w-3" /> Selected
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">Sign in</button>
              </div>
            </motion.div>
          )}

          {step === 'credentials' && (
            <motion.div key="credentials" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <button type="button" onClick={() => { setStep('role'); setSelectedRole(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to role selection
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-primary/10">
                  {selectedRole === 'patient' ? <User className="h-7 w-7 text-primary" /> : <Stethoscope className="h-7 w-7 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
                <p className="text-sm text-muted-foreground mt-1">Let's set up your {selectedRole} account</p>
              </div>

              <div className="glass-card p-6 space-y-4">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={form.name} onChange={e => setF({ name: e.target.value })} placeholder="Full Name" className="pl-10 bg-muted/50 h-11" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" value={form.email} onChange={e => setF({ email: e.target.value })} placeholder="Email Address" className="pl-10 bg-muted/50 h-11" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <PhoneInput value={form.phone} onChange={phone => setF({ phone })} className="pl-10 bg-muted/50 h-11 border-border rounded-md w-full" />
                  </div>
                </div>

                <Button type="button" onClick={() => setStep('details')} disabled={!form.name || !form.email || form.phone.length !== 10} className="w-full gradient-primary text-primary-foreground border-0 h-11 mt-2">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <button type="button" onClick={() => setStep('credentials')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to basic info
              </button>

              <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-foreground">{selectedRole === 'patient' ? 'Health Profile' : 'Professional Profile'}</h2>
                 <p className="text-sm text-muted-foreground mt-1">We need a few more details</p>
              </div>

              {selectedRole === 'patient' ? (
                <div className="glass-card p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Age</label>
                      <Input type="number" value={form.age} onChange={e => setF({ age: e.target.value })} placeholder="Yrs" className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender</label>
                      <Select value={form.gender} onValueChange={(v: any) => setF({ gender: v })}>
                        <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood</label>
                      <Select value={form.bloodGroup} onValueChange={(v) => setF({ bloodGroup: v })}>
                        <SelectTrigger className="bg-muted/50 px-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wt (kg)</label>
                      <Input type="number" value={form.weight} onChange={e => setF({ weight: e.target.value })} placeholder="70" className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ht (cm)</label>
                      <Input type="number" value={form.height} onChange={e => setF({ height: e.target.value })} placeholder="170" className="bg-muted/50" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Switch id="smoking" checked={form.smokingStatus} onCheckedChange={checked => setF({ smokingStatus: checked })} />
                    <label htmlFor="smoking" className="text-sm font-medium text-foreground">Do you smoke?</label>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <MultiInputField label="Medical History" value={form.medicalHistory} onChange={v => setF({ medicalHistory: v })} placeholder="e.g. Hypertension" />
                    <MultiInputField label="Allergies" value={form.allergies} onChange={v => setF({ allergies: v })} placeholder="e.g. Penicillin" />
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact</label>
                      <Input value={form.emergencyContactName} onChange={e => setF({ emergencyContactName: e.target.value })} placeholder="Name" className="bg-muted/50 mb-2" />
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                        <PhoneInput value={form.emergencyContactPhone} onChange={phone => setF({ emergencyContactPhone: phone })} className="pl-9 bg-muted/50 border-border" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Preferred Doctor (Optional)</label>
                    <DoctorSelectDropdown value={form.preferredDoctorId} onChange={id => setF({ preferredDoctorId: id })} />
                  </div>

                  <Button type="button" onClick={() => setStep('security')} disabled={!form.age} className="w-full gradient-primary text-primary-foreground border-0 h-11 mt-4">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="glass-card p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specialization</label>
                      <Input value={form.specialization} onChange={e => setF({ specialization: e.target.value })} placeholder="e.g. Cardiology" className="bg-muted/50 h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">License Number</label>
                      <Input value={form.licenseNumber} onChange={e => setF({ licenseNumber: e.target.value })} placeholder="DL-123456" className="bg-muted/50 h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinic / Hospital Name</label>
                      <Input value={form.clinicName} onChange={e => setF({ clinicName: e.target.value })} placeholder="HeartCare Center" className="bg-muted/50 h-11" />
                    </div>
                  </div>
                  <Button type="button" onClick={() => setStep('security')} disabled={!form.specialization || !form.licenseNumber} className="w-full gradient-primary text-primary-foreground border-0 h-11 mt-4">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <button type="button" onClick={() => setStep('details')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to details
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-primary/10">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Secure your account</h2>
                <p className="text-sm text-muted-foreground mt-1">Create a strong password</p>
              </div>

              <form onSubmit={handleSignup} className="glass-card p-6 space-y-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" value={form.password} onChange={e => setF({ password: e.target.value })} placeholder="Password (min 8 chars)" className="pl-10 bg-muted/50 h-11" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" value={form.confirmPassword} onChange={e => setF({ confirmPassword: e.target.value })} placeholder="Confirm Password" className="pl-10 bg-muted/50 h-11" />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting || !form.password || form.password !== form.confirmPassword} className="w-full gradient-primary text-primary-foreground border-0 h-11 mt-4">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Creating Account...' : 'Complete Signup'}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
