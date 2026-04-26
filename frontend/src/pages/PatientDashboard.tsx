import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { patientService } from '@/services/patientService';
import { useAuth } from '@/hooks/useAuth';
import RiskGauge from '@/components/charts/RiskGauge';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import RiskCircle from '@/components/charts/RiskCircle';
import SeverityBadge from '@/components/SeverityBadge';
import { Button } from '@/components/ui/button';
import { Heart, Plus, User, Calendar, Activity, TrendingUp, Clock, Droplets, Weight, Ruler, Stethoscope, ArrowRight, Shield, Pill, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { getRequests, sendRequest } from '@/services/doctorPatientService';
import { useQuery } from '@tanstack/react-query';
import { RequestStatusBadge } from '@/components/RequestStatusBadge';
import { DoctorSelectDropdown } from '@/components/DoctorSelectDropdown';
import type { DoctorPatientMapping } from '@/types/doctorPatient';
import { useActivityPlanStore } from '@/store/activityPlanStore';
import MedicineLookupWidget from '@/components/MedicineLookupWidget';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { data: requestsData, isLoading: requestsLoading, refetch } = useQuery({
    queryKey: ["patientRequests"],
    queryFn: getRequests,
    enabled: !!user
  });
  
  const requests = requestsData?.data || [];

  const { plans, fetchPlan } = useActivityPlanStore();

  const userId = user?._id || user?.id || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId) {
          const data = await patientService.getPatientById(userId);
          setPatient(data);
          // Fetch activity plan
          fetchPlan(userId);
        }
      } catch (error) {
        console.error('Failed to fetch patient data', error);
        toast({
          title: 'Failed to load dashboard',
          description: 'Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activityPlan = plans[userId];

  useEffect(() => {
    const accepted = requests.find((r: any) => r.status === 'accepted');
    if (accepted && !selectedDoctorId) {
      setSelectedDoctorId(accepted.doctorId._id);
    }
  }, [requests]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="p-5 text-center text-muted-foreground">Failed to load patient data or not found.</div>
      </DashboardLayout>
    );
  }

  const latest = patient.screenings?.[0];
  const bmi = patient.weight && patient.height ? (patient.weight / ((patient.height / 100) ** 2)).toFixed(1) : '--';

  const hasAccepted = requests.some((r: any) => r.status === 'accepted');
  const pendingRequest = requests.find((r: any) => r.status === 'pending');
  const declinedRequest = requests.find((r: any) => r.status === 'declined');
  const activeRequest = pendingRequest || declinedRequest;

  const handleSendRequest = async () => {
    if (!selectedDoctorId) {
      toast({ title: 'Select a doctor first', variant: 'destructive' });
      return;
    }
    try {
      await sendRequest(selectedDoctorId);
      toast({ title: 'Request sent!', description: 'Waiting for doctor approval.' });
      refetch();
    } catch (error) {
      toast({ title: 'Failed to send request', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {!hasAccepted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center max-w-md mx-auto">
            <div className="mb-6">
              {activeRequest && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Status for {activeRequest.doctorId?.name || 'Doctor'}</p>
                  <RequestStatusBadge status={activeRequest.status} />
                </div>
              )}
              <h2 className="text-xl font-bold mt-3 text-foreground">
                {declinedRequest ? 'Request Declined' : 'Doctor Approval Pending'}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {declinedRequest 
                  ? 'Your request was declined. You can select another doctor to proceed.'
                  : 'Your dashboard will be unlocked once a doctor accepts your request.'}
              </p>
            </div>
            
            {(!activeRequest || activeRequest.status === 'declined') && (
              <>
                <DoctorSelectDropdown
                  value={selectedDoctorId}
                  onChange={setSelectedDoctorId}
                />
                <Button onClick={handleSendRequest} className="w-full mt-4 gradient-primary text-primary-foreground border-0">
                  {declinedRequest ? 'Request Another Doctor' : 'Send Request'}
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome, {patient.name}</h1>
                <p className="text-muted-foreground text-sm">Your cardiac health overview</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/screening')} className="gradient-primary text-primary-foreground border-0">
                  <Plus className="h-4 w-4 mr-2" /> New Screening
                </Button>
              </div>
            </div>
          </>
        )}
        {hasAccepted && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Risk Score', value: latest?.riskScore ?? '--', icon: Shield, color: (latest?.riskScore || 0) > 65 ? 'text-critical' : (latest?.riskScore || 0) > 30 ? 'text-warning' : 'text-success', bg: 'bg-primary/10' },
                { label: 'Screenings', value: patient.screenings?.length || 0, icon: Stethoscope, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'BMI', value: bmi, icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
                { label: 'Last Visit', value: latest?.date?.slice(0, 6) || 'N/A', icon: Clock, color: 'text-info', bg: 'bg-info/10' },
              ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Severity Alert Banner */}
        {latest && latest.riskScore > 65 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-critical/10 border border-critical/20 flex items-center gap-3"
          >
            <Shield className="h-5 w-5 text-critical animate-pulse" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-critical">High Risk Alert</div>
              <div className="text-xs text-muted-foreground">Your latest screening shows elevated risk. Please consult your doctor.</div>
            </div>
            <Button size="sm" variant="outline" className="border-critical/30 text-critical hover:bg-critical/10 text-xs" onClick={() => navigate('/results')}>
              View Details
            </Button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left: Profile + Vitals */}
          <div className="lg:col-span-3 space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-3 ring-4 ring-primary/10">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="font-semibold text-foreground">{patient.name}</div>
                <div className="text-xs text-muted-foreground">{patient.age} yrs • {patient.gender}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{patient.phone}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Droplets, label: 'Blood', value: patient.bloodGroup, color: 'text-critical' },
                  { icon: Weight, label: 'Weight', value: `${patient.weight} kg`, color: 'text-primary' },
                  { icon: Ruler, label: 'Height', value: `${patient.height} cm`, color: 'text-accent' },
                ].map(item => (
                  <div key={item.label} className="p-2 rounded-lg bg-muted/30 text-center">
                    <item.icon className={`h-3.5 w-3.5 ${item.color} mx-auto mb-0.5`} />
                    <div className="text-[9px] text-muted-foreground">{item.label}</div>
                    <div className="text-xs font-bold text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 space-y-1.5">
                {[
                  { label: 'View History', icon: FileText, path: '/history' },
                  { label: 'Medicines', icon: Pill, path: '/medicines' },
                  { label: 'Activity Plan', icon: Activity, path: '/activity' },
                ].map(action => (
                  <button key={action.label} onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                    <ArrowRight className="h-3 w-3 ml-auto opacity-40" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center: Charts */}
          <div className="lg:col-span-5 space-y-4">
            {/* Risk Circle + Latest Condition */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex flex-col items-center justify-center">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk Pattern</h3>
                {latest ? <RiskCircle percentage={latest.riskScore} size={110} /> : <p className="text-muted-foreground text-xs">No data</p>}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Latest Diagnosis</h3>
                {latest ? (
                  <>
                    <div className="text-base font-bold text-foreground mb-1">{latest.condition}</div>
                    <SeverityBadge severity={latest.severity} />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Confidence: <span className="font-semibold text-foreground">{latest.confidence}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{latest.date}</div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Run your first screening</p>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <MedicineLookupWidget />
            </motion.div>
          </div>

          {/* Right: History + Activity */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Recent Screenings
              </h3>
              <div className="space-y-2">
                {patient.screenings?.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="text-xs font-medium text-foreground">{s.condition}</div>
                      <div className="text-[10px] text-muted-foreground">{s.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={s.severity} />
                      <span className={`text-xs font-bold ${s.riskScore > 65 ? 'text-critical' : s.riskScore > 30 ? 'text-warning' : 'text-success'}`}>{s.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Plan from Doctor */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Activity Plan
                </h3>
                <button onClick={() => navigate('/activity')} className="text-[10px] text-primary hover:underline">
                  View Full Plan →
                </button>
              </div>
              {activityPlan && activityPlan.items.length > 0 ? (
                <div className="space-y-2">
                  {activityPlan.items
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .slice(0, 4)
                    .map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
                        <Clock className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-[10px] font-mono font-semibold text-primary w-16 flex-shrink-0">{item.time}</span>
                        <span className="text-[10px] text-foreground truncate">{item.activity}</span>
                        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground ml-auto hidden sm:block">{item.category}</span>
                      </div>
                    ))}
                  {activityPlan.items.length > 4 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{activityPlan.items.length - 4} more activities</p>
                  )}
                  {activityPlan.notes && (
                    <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 mt-2">
                      <div className="text-[9px] font-semibold text-primary mb-0.5">Doctor's Notes</div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{activityPlan.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { level: 'Low Risk', desc: '30 min walking, yoga', color: 'success' },
                    { level: 'Moderate', desc: 'Light cardio, breathing exercises', color: 'warning' },
                    { level: 'High Risk', desc: 'Rest frequently, deep breathing', color: 'critical' },
                  ].map(a => (
                    <div key={a.level} className={`p-2.5 rounded-lg bg-${a.color}/5 border border-${a.color}/10`}>
                      <div className={`text-[10px] font-semibold text-${a.color}`}>{a.level}</div>
                      <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Risk Trend - Full Width */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Risk Score Trend
          </h3>
          <RiskTrendChart screenings={patient.screenings} />
        </motion.div>
        </>
        )}
      </div>
    </DashboardLayout>
  );
}
