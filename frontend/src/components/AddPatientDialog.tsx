import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient } from '@/mockData/patients';
import { UserPlus, User, Phone, MapPin, Droplets, Weight, Ruler, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (patient: Patient) => void;
}

type Step = 'personal' | 'medical' | 'review';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddPatientDialog({ open, onOpenChange, onAdd }: AddPatientDialogProps) {
  const [step, setStep] = useState<Step>('personal');
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', age: '', gender: 'Male', phone: '', address: '',
    bloodGroup: 'B+', weight: '', height: '', smokingStatus: false, allergies: '', medicalHistory: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: ''
  });

  const stepIndex = step === 'personal' ? 0 : step === 'medical' ? 1 : 2;
  const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  const resetForm = () => {
    setForm({ name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'B+', weight: '', height: '' });
    setStep('personal');
  };

  const handleConfirmAdd = () => {
    setConfirmAdd(false);
    const newPatient: any = {
      name: form.name,
      email: form.email,
      password: form.password,
      age: parseInt(form.age) || 0,
      gender: form.gender,
      phone: form.phone,
      address: form.address,
      bloodGroup: form.bloodGroup,
      weight: parseInt(form.weight) || 0,
      height: parseInt(form.height) || 0,
      smokingStatus: form.smokingStatus,
      allergies: form.allergies,
      medicalHistory: form.medicalHistory,
      emergencyContact: {
        name: form.emergencyName,
        phone: form.emergencyPhone,
        relation: form.emergencyRelation
      }
    };
    onAdd(newPatient);
    resetForm();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
        <DialogContent className="glass-card border-border max-w-md p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-3">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-foreground">Add New Patient</DialogTitle>
                  <DialogDescription className="text-xs">Register a new patient to the system</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Progress */}
            <div className="flex items-center gap-2 mt-4">
              {['Personal', 'Medical', 'Review'].map((label, i) => (
                <div key={label} className="flex items-center gap-1.5 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    i < stepIndex ? 'bg-success/20 text-success' : i === stepIndex ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${i < stepIndex ? 'bg-success/40' : 'bg-border'}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {step === 'personal' && (
                <motion.div key="personal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="pl-10 bg-muted/50 border-border h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="bg-muted/50 border-border h-10" />
                    <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="bg-muted/50 border-border h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Age" className="bg-muted/50 border-border h-10" />
                    <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                      <SelectTrigger className="bg-muted/50 border-border h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone base" className="pl-10 bg-muted/50 border-border h-10" />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" className="pl-10 bg-muted/50 border-border h-10" />
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold text-muted-foreground mt-2 border-t pt-2 border-border/50">Emergency Contact</h4>
                  <div className="grid grid-cols-3 gap-2">
                     <Input value={form.emergencyName} onChange={e => setForm({ ...form, emergencyName: e.target.value })} placeholder="Name" className="bg-muted/50 border-border h-10 text-xs" />
                     <Input value={form.emergencyRelation} onChange={e => setForm({ ...form, emergencyRelation: e.target.value })} placeholder="Relation" className="bg-muted/50 border-border h-10 text-xs" />
                     <Input value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="Phone" className="bg-muted/50 border-border h-10 text-xs" />
                  </div>
                  <Button onClick={() => setStep('medical')} disabled={!form.name || !form.email || !form.password} className="w-full gradient-primary text-primary-foreground border-0 h-10 mt-2">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {step === 'medical' && (
                <motion.div key="medical" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <button onClick={() => setStep('personal')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Blood Group</label>
                      <Select value={form.bloodGroup} onValueChange={v => setForm({ ...form, bloodGroup: v })}>
                        <SelectTrigger className="bg-muted/50 border-border h-10">
                          <Droplets className="h-3.5 w-3.5 text-critical mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodGroups.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Weight (kg)</label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="kg" className="pl-9 bg-muted/50 border-border h-10" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Smoking Status</label>
                      <Select value={form.smokingStatus ? 'Yes' : 'No'} onValueChange={v => setForm({ ...form, smokingStatus: v === 'Yes' })}>
                        <SelectTrigger className="bg-muted/50 border-border h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">Non-Smoker</SelectItem>
                          <SelectItem value="Yes">Smoker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <Input value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder="Allergies (comma separated)" className="bg-muted/50 border-border h-9 text-xs" />
                    <Input value={form.medicalHistory} onChange={e => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Medical History (comma separated)" className="bg-muted/50 border-border h-9 text-xs" />
                  </div>
                  <Button onClick={() => setStep('review')} className="w-full gradient-primary text-primary-foreground border-0 h-10">
                    Review <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {step === 'review' && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  <button onClick={() => setStep('medical')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>

                  {/* Preview Card */}
                  <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{initials}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{form.name || 'Patient Name'}</div>
                        <div className="text-xs text-muted-foreground">{form.age}y • {form.gender}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Blood', value: form.bloodGroup, icon: Droplets },
                        { label: 'Weight', value: `${form.weight || '--'} kg`, icon: Weight },
                        { label: 'Height', value: `${form.height || '--'} cm`, icon: Ruler },
                      ].map(item => (
                        <div key={item.label} className="p-2 rounded-lg bg-background/50">
                          <item.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                          <div className="text-[10px] text-muted-foreground">{item.label}</div>
                          <div className="text-xs font-bold text-foreground">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {form.phone && <div className="text-xs text-muted-foreground"><Phone className="h-3 w-3 inline mr-1" />{form.phone}</div>}
                    {form.address && <div className="text-xs text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{form.address}</div>}
                  </div>

                  <Button onClick={() => setConfirmAdd(true)} className="w-full gradient-primary text-primary-foreground border-0 h-10">
                    <CheckCircle className="h-4 w-4 mr-2" /> Add Patient
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAdd}
        onOpenChange={setConfirmAdd}
        title="Add this patient?"
        description={`Are you sure you want to add ${form.name} to your patient list?`}
        confirmLabel="Yes, Add Patient"
        onConfirm={handleConfirmAdd}
      />
    </>
  );
}
