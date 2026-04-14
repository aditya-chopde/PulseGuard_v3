import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, Stethoscope, ArrowRight, ArrowLeft, Mail, Lock, Phone, UserCircle, Sparkles, Droplets, Weight, Ruler, Loader2, UserCheck, Shield, ClipboardList, Building2, Stethoscope as StethoscopeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ThemeToggle from '@/components/ThemeToggle';
import PulseGuardLogo from '@/components/PulseGuardLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from '@/components/PhoneInput';
import { MultiInputField } from '@/components/MultiInputField';
import { DoctorSelectDropdown } from '@/components/DoctorSelectDropdown';
import { sendRequest } from '@/services/doctorPatientService';
import { useQuery } from '@tanstack/react-query';

type Step = 'role' | 'info' | 'role-specific' | 'security';

type RoleSpecificForm = {
  patient: {
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    bloodGroup: string;
    height: string;
    weight: string;
    smokingStatus: boolean;
    medicalHistory: string[];
    allergies: string[];
    emergencyContactName: string;
    emergencyContactPhone: string;
    preferredDoctorId: string;
  };
  doctor: {
    specialization: string;
    licenseNumber: string;
    clinicName: string;
  };
};

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [step, setStep] = useState<Step>('role');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [roleSpecific, setRoleSpecific] = useState<RoleSpecificForm>({
    patient: {
      age: '',
      gender: 'Male' as const,
      bloodGroup: 'B+',
      height: '',
      weight: '',
      smokingStatus: false,
      medicalHistory: [],
      allergies: [],
      emergencyContactName: '',
      emergencyContactPhone: '',
      preferredDoctorId: '',
    },
    doctor: {
      specialization: '',
      licenseNumber: '',
      clinicName: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setTimeout(() => setStep('info'), 400);
  };

  const updateCommonForm = (updates: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateRoleSpecific = (role: 'patient' | 'doctor', updates: Partial<RoleSpecificForm['patient'] | RoleSpecificForm['doctor']>) => {
    setRoleSpecific(prev => ({
      ...prev,
      [role]: { ...prev[role], ...updates } as any,
    }));
  };

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
        ...form,
        role: selectedRole,
        ...(selectedRole === 'patient' && {
          ...roleSpecific.patient,
          medicalHistory: roleSpecific.patient.medicalHistory.join(', '),
          allergies: roleSpecific.patient.allergies.join(', '),
          emergencyContact: {
            name: roleSpecific.patient.emergencyContactName,
            phone: roleSpecific.patient.emergencyContactPhone,
          },
        }),
        ...(selectedRole === 'doctor' && roleSpecific.doctor),
      };
      const userResult = await signup(signupData);
      
      // Auto-send doctor request for patient
      if (selectedRole === 'patient' && roleSpecific.patient.preferredDoctorId) {
        try {
          await sendRequest(roleSpecific.patient.preferredDoctorId);
          toast({
            title: 'Doctor request sent!',
            description: 'Your preferred doctor has been notified.',
          });
        } catch (requestErr) {
          console.error('Doctor request failed, but signup succeeded:', requestErr);
          // Don't fail signup on request failure
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

  const steps = selectedRole === 'patient' ? ['Role', 'Account', 'Health', 'Password'] : ['Role', 'Account', 'Doctor Info', 'Password'];

  const stepIndex = step === 'role' ? 0 : step === 'info' ? 1 : step === 'role-specific' ? 2 : 3;

  const currentStepTitle = (() => {
    if (step === 'role') return 'Choose Role';
    if (step === 'info') return 'Account Details';
    if (step === 'role-specific') return selectedRole === 'patient' ? 'Health Profile' : 'Doctor Profile';
    return 'Security';
  })();

  const goNext = () => {
    if (step === 'info') setStep('role-specific');
    else if (step === 'role-specific') setStep('security');
  };

  const goBack = () => {
    if (step === 'security') setStep('role-specific');
    else if (step === 'role-specific') setStep('info');
    else if (step === 'info') {
      setStep('role');
      setSelectedRole(null);
    }
  };

  const isStepValid = () => {
    if (step === 'info') {
      return form.name && form.email && form.phone.length === 10;
    }
    if (step === 'role-specific') {
      if (selectedRole === 'patient') {
        return roleSpecific.patient.age && roleSpecific.patient.gender && roleSpecific.patient.emergencyContactPhone.length === 10 && roleSpecific.patient.preferredDoctorId;
      }
      return roleSpecific.doctor.specialization && roleSpecific.doctor.licenseNumber && roleSpecific.doctor.clinicName;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <div className="absolute top-20 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-6">
          <PulseGuardLogo size={36} />
        </motion.div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`w-2 h-2 rounded-full transition-all ${i <= stepIndex ? 'bg-primary scale-125' : 'bg-muted'}`} />
              {i < steps.length - 1 && <div className={`flex-1 h-px mx-1.5 bg-muted ${i < stepIndex ? 'bg-primary' : ''}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold mb-4 text-foreground">Join PulseGuard</h1>
              <p className="text-muted-foreground mb-8">Create your free account</p>
              <div className="grid gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('patient')}
                  className="group glass-card p-8 text-left border hover:border-primary/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 p-3 flex items-center justify-center transition-all">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Patient</h3>
                  <p className="text-sm text-muted-foreground mb-3">Screen your heart health, track results</p>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('doctor')}
                  className="group glass-card p-8 text-left border hover:border-primary/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 p-3 flex items-center justify-center transition-all">
                      <StethoscopeIcon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Doctor</h3>
                  <p className="text-sm text-muted-foreground mb-3">Review cases, manage patients</p>
                </motion.button>
              </div>
              <p className="mt-8 text-xs text-muted-foreground">
                Already have an account? <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">Sign in</button>
              </p>
            </motion.div>
          )}

          {(step === 'info' || step === 'role-specific' || step === 'security') && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  className="text-muted-foreground hover:text-foreground p-1 -ml-1 rounded-full hover:bg-muted transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-bold text-foreground">{currentStepTitle}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Step {stepIndex + 1} of 4</p>
                </div>
              </div>

              {step === 'info' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => updateCommonForm({ name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateCommonForm({ email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <PhoneInput
                      value={form.phone}
                      onChange={(phone) => updateCommonForm({ phone })}
                    />
                  </div>
                  <Button onClick={goNext} className="w-full" disabled={!isStepValid()}>
                    Continue
                  </Button>
                </div>
              )}

              {step === 'role-specific' && selectedRole === 'patient' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Age</Label>
                        <Input
                          type="number"
                          value={roleSpecific.patient.age}
                          onChange={(e) => updateRoleSpecific('patient', { age: e.target.value })}
                          min={1}
                          max={120}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <Select value={roleSpecific.patient.gender} onValueChange={(v) => updateRoleSpecific('patient', { gender: v as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Blood Group</Label>
                        <Select value={roleSpecific.patient.bloodGroup} onValueChange={(v) => updateRoleSpecific('patient', { bloodGroup: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodGroups.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          value={roleSpecific.patient.height}
                          onChange={(e) => updateRoleSpecific('patient', { height: e.target.value })}
                          placeholder="170"
                        />
                      </div>
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          value={roleSpecific.patient.weight}
                          onChange={(e) => updateRoleSpecific('patient', { weight: e.target.value })}
                          placeholder="70"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="smoking"
                          checked={roleSpecific.patient.smokingStatus}
                          onCheckedChange={(checked) => updateRoleSpecific('patient', { smokingStatus: checked })}
                        />
                        <Label htmlFor="smoking" className="text-sm font-medium">Smoker</Label>
                      </div>
                      <MultiInputField
                        label="Medical History"
                        value={roleSpecific.patient.medicalHistory}
                        onChange={(v) => updateRoleSpecific('patient', { medicalHistory: v })}
                        placeholder="e.g., Hypertension, Diabetes"
                      />
                      <MultiInputField
                        label="Allergies"
                        value={roleSpecific.patient.allergies}
                        onChange={(v) => updateRoleSpecific('patient', { allergies: v })}
                        placeholder="e.g., Penicillin, Nuts"
                      />
                      <div className="space-y-2">
                        <Label>Emergency Contact</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Name"
                            value={roleSpecific.patient.emergencyContactName}
                            onChange={(e) => updateRoleSpecific('patient', { emergencyContactName: e.target.value })}
                          />
                          <PhoneInput
                            value={roleSpecific.patient.emergencyContactPhone}
                            onChange={(phone) => updateRoleSpecific('patient', { emergencyContactPhone: phone })}
                          />
                        </div>
                      </div>

                      <DoctorSelectDropdown
                        value={roleSpecific.patient.preferredDoctorId}
                        onChange={(doctorId) => updateRoleSpecific('patient', { preferredDoctorId: doctorId })}
                      />
                    </div>
                  </div>
                  <Button onClick={goNext} className="w-full" disabled={!isStepValid()}>
                    Continue to Password
                  </Button>
                </div>
              )}


              {step === 'role-specific' && selectedRole === 'doctor' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Specialization</Label>
                      <Input
                        value={roleSpecific.doctor.specialization}
                        onChange={(e) => updateRoleSpecific('doctor', { specialization: e.target.value })}
                        placeholder="Cardiology"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">License Number</Label>
                      <Input
                        value={roleSpecific.doctor.licenseNumber}
                        onChange={(e) => updateRoleSpecific('doctor', { licenseNumber: e.target.value })}
                        placeholder="DL-123456"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Clinic Name</Label>
                      <Input
                        value={roleSpecific.doctor.clinicName}
                        onChange={(e) => updateRoleSpecific('doctor', { clinicName: e.target.value })}
                        placeholder="HeartCare Clinic"
                      />
                    </div>
                  </div>
                  <Button onClick={goNext} className="w-full" disabled={!isStepValid()}>
                    Continue to Password
                  </Button>
                </div>
              )}

              {step === 'security' && (
                <div className="glass-card p-6 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => updateCommonForm({ password: e.target.value })}
                          placeholder="At least 8 characters"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          value={form.confirmPassword}
                          onChange={(e) => updateCommonForm({ confirmPassword: e.target.value })}
                          placeholder="Repeat password"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" onClick={handleSignup} disabled={isSubmitting || form.password !== form.confirmPassword} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create My Account'
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

