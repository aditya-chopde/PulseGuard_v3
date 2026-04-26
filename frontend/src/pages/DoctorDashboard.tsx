import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { patientService } from '@/services/patientService';
import { getRequests, respondRequest } from '@/services/doctorPatientService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import SeverityBadge from '@/components/SeverityBadge';
import SeverityDistributionChart from '@/components/charts/SeverityDistributionChart';
import RiskGauge from '@/components/charts/RiskGauge';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import HeartRateChart from '@/components/charts/HeartRateChart';
import PCGChart from '@/components/charts/PCGChart';
import SpectrumChart from '@/components/charts/SpectrumChart';
import ScreeningFlow from '@/components/ScreeningFlow';
import AddPatientDialog from '@/components/AddPatientDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RequestStatusBadge } from '@/components/RequestStatusBadge';
import { Patient } from '@/mockData/patients';
import { PredictionResult } from '@/mockData/predictions';
import { AlertTriangle, Users, Activity, Eye, Droplets, Weight, Ruler, TrendingUp, TrendingDown, Clock, CalendarDays, Stethoscope, Heart, BarChart3, CheckCircle2, Plus, UserPlus, Search, Filter, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import type { DoctorPatientMapping } from '@/types/doctorPatient';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [patientsData, setPatientsData] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data: requestsData } = useQuery({
    queryKey: ["doctorRequests"],
    queryFn: getRequests
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: string }) => respondRequest(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorRequests"] });
    }
  });

  const pendingRequests = requestsData?.data || [];

  const fetchPatients = async () => {
    try {
      const data = await patientService.getPatients();
      setPatientsData(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch patients', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients().then(data => {
      if (data.length > 0) setSelectedPatient(data[0]);
    });
  }, []);

  const latest = selectedPatient?.screenings?.[0];

  // Screening state
  const [screeningOpen, setScreeningOpen] = useState(false);
  const [confirmScreening, setConfirmScreening] = useState(false);

  // Add Patient state
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  const handleStartScreening = () => setConfirmScreening(true);
  const handleConfirmScreening = () => {
    setConfirmScreening(false);
    setScreeningOpen(true);
  };

  const handleScreeningComplete = (result: PredictionResult) => {
    setPatientsData(prev => prev.map(p =>
      p.id === selectedPatient.id && p._id === selectedPatient._id ? { ...p, screenings: [result, ...(p.screenings || [])] } : p
    ));
    setSelectedPatient((prev: any) => ({ ...prev, screenings: [result, ...(prev.screenings || [])] }));
    setScreeningOpen(false);
  };

  const handleAddPatient = async (patient: any) => {
    try {
      setLoading(true);
      await patientService.createPatient({
        ...patient
      });
      const data = await fetchPatients();
      if (data.length > 0) {
        setSelectedPatient(data[data.length - 1]);
      }
      toast({ title: 'Patient added successfully!' });
    } catch (err: any) {
      console.error('Failed to create patient', err);
      toast({ title: 'Failed to add patient', description: err.response?.data?.error || 'Unknown error', variant: 'destructive' });
      setLoading(false);
    }
  };

  const patients = patientsData;
  const filteredPatients = searchQuery
    ? patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : patients;

  const highRiskPatients = patients.filter(p => {
    const l = p.screenings[0];
    return l && l.riskScore > 65;
  });

  const allScreenings = patients.flatMap(p => p.screenings);
  const severityCounts = allScreenings.reduce((acc, s) => {
    acc[s.severity] = (acc[s.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({ name, value: value as number }));

  const reviewedCount = patients.filter(p => p.reviewed).length;
  const pendingCount = patients.length - reviewedCount;
  const avgRisk = Math.round(patients.reduce((sum, p) => {
    const l = p.screenings[0];
    return sum + (l?.riskScore || 0);
  }, 0) / patients.length);

  const statsCards = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: 'primary', trend: '+3 this week', trendUp: true },
    { label: 'High Risk', value: highRiskPatients.length, icon: AlertTriangle, color: 'critical', trend: 'Needs attention', trendUp: false },
    { label: 'Reviewed', value: reviewedCount, icon: CheckCircle2, color: 'success', trend: `${pendingCount} pending`, trendUp: true },
    { label: 'Avg Risk Score', value: isNaN(avgRisk) ? 0 : avgRisk, icon: BarChart3, color: 'warning', trend: 'Across all patients', trendUp: avgRisk < 50 },
    { label: 'Total Screenings', value: allScreenings.length, icon: Activity, color: 'info', trend: 'All time records', trendUp: true },
    // { label: 'Consultations', value: 12, icon: Stethoscope, color: 'accent', trend: 'This month', trendUp: true },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Patient overview & analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddPatientOpen(true)} className="border-primary/30 text-primary hover:bg-primary/10">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Patient
            </Button>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="glass-card p-4 border-warning/30 bg-warning/5">
            <h3 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Pending Requests 
              <span className="bg-warning text-warning-foreground px-2 py-0.5 rounded-full text-xs">{pendingRequests.length}</span>
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((req: any) => (
                <div key={req._id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div>
                    <div className="font-medium text-sm">{req.patientId?.name || 'Unknown Patient'}</div>
                    <div className="text-xs text-muted-foreground">{req.patientId?.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respondMutation.mutate({ id: req._id, action: "accept" })} disabled={respondMutation.isPending} className="bg-success text-success-foreground hover:bg-success/90 h-8">
                       <Check className="h-3 w-3 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ id: req._id, action: "decline" })} disabled={respondMutation.isPending} className="text-critical border-critical/30 hover:bg-critical/10 h-8">
                       <X className="h-3 w-3 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPatient ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {statsCards.map((stat, i) => {
                const colorMap: Record<string, string> = {
                  primary: 'bg-primary/10 text-primary',
                  critical: 'bg-critical/10 text-critical',
                  success: 'bg-success/10 text-success',
                  warning: 'bg-warning/10 text-warning',
                  info: 'bg-info/10 text-info',
                  accent: 'bg-accent/10 text-accent',
                };
                return (
                  <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}
                    className="glass-card p-3.5 hover:shadow-lg transition-shadow group cursor-default"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[stat.color]}`}>
                        <stat.icon className="h-3.5 w-3.5" />
                      </div>
                      {stat.trendUp ? <TrendingUp className="h-3 w-3 text-success opacity-60" /> : <TrendingDown className="h-3 w-3 text-critical opacity-60" />}
                    </div>
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                    <div className="text-[9px] text-muted-foreground/60 mt-0.5">{stat.trend}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Patient Selector with Search */}
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-2 px-1 gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                  <Users className="h-3.5 w-3.5" /> Patients
                </h3>
                <div className="relative max-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="h-7 pl-7 text-xs bg-muted/30 border-border"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {filteredPatients.map(p => {
                  const l = p.screenings[0];
                  const isSelected = (p._id || p.id) === (selectedPatient._id || selectedPatient.id);
                  return (
                    <motion.button key={p._id || p.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedPatient(p)}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-2 ${
                        isSelected ? 'border-primary bg-primary/10 shadow-md shadow-primary/10' : 'border-transparent bg-muted/20 hover:bg-muted/40 hover:border-primary/15'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'gradient-primary' : 'bg-muted'}`}>
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{p.photo}</span>
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-medium whitespace-nowrap ${isSelected ? 'text-primary' : 'text-foreground'}`}>{p.name}</div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          {p.age}y
                          {l && l.riskScore > 65 && <span className="px-1 rounded bg-critical/10 text-critical font-bold text-[8px] animate-pulse">HIGH</span>}
                          {l && l.riskScore <= 30 && <span className="px-1 rounded bg-success/10 text-success font-bold text-[8px]">LOW</span>}
                          {l && l.riskScore > 30 && l.riskScore <= 65 && <span className="px-1 rounded bg-warning/10 text-warning font-bold text-[8px]">MED</span>}
                          {!l && <span className="px-1 rounded bg-muted text-muted-foreground font-bold text-[8px]">NEW</span>}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Main Layout */}
            <div className="grid lg:grid-cols-12 gap-4">
              {/* Left: Patient Profile */}
              <div className="lg:col-span-3 space-y-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-3 ring-4 ring-primary/10">
                      <span className="text-base font-bold text-primary-foreground">{selectedPatient.photo}</span>
                    </div>
                    <div className="font-semibold text-foreground">{selectedPatient.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedPatient.age} yrs • {selectedPatient.gender}</div>
                    <div className="mt-2">
                      {selectedPatient.reviewed
                        ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-success/10 text-success">Reviewed</span>
                        : <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-warning/10 text-warning">Pending Review</span>
                      }
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Droplets, label: 'Blood', value: selectedPatient.bloodGroup, color: 'text-critical' },
                      { icon: Weight, label: 'Weight', value: `${selectedPatient.weight} kg`, color: 'text-primary' },
                      { icon: Ruler, label: 'Height', value: `${selectedPatient.height} cm`, color: 'text-accent' },
                      { icon: Activity, label: 'Screenings', value: selectedPatient.screenings.length, color: 'text-warning' },
                      { icon: Heart, label: 'BPM', value: `${65 + Math.floor(Math.random() * 20)}`, color: 'text-critical' },
                      { icon: Clock, label: 'Last Visit', value: latest?.date?.slice(0, 6) || 'N/A', color: 'text-info' },
                    ].map(item => (
                      <div key={item.label} className="p-2 rounded-lg bg-muted/30 text-center hover:bg-muted/50 transition-colors">
                        <item.icon className={`h-3.5 w-3.5 ${item.color} mx-auto mb-0.5`} />
                        <div className="text-[9px] text-muted-foreground">{item.label}</div>
                        <div className="text-xs font-bold text-foreground">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => navigate(`/doctor/patient/${selectedPatient._id || selectedPatient.id}`)}
                      className="flex-1 gradient-primary text-primary-foreground border-0 text-xs h-9">
                      <Eye className="h-3 w-3 mr-1" /> Review
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleStartScreening}
                      className="flex-1 border-primary/30 text-primary hover:bg-primary/10 text-xs h-9">
                      <Stethoscope className="h-3 w-3 mr-1" /> Screen
                    </Button>
                  </div>
                </motion.div>

                {/* High Risk Alerts */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-critical animate-pulse" /> High Risk Alerts
                  </h3>
                  {highRiskPatients.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No high risk patients</p>
                  ) : (
                    <div className="space-y-1.5">
                      {highRiskPatients.map(p => {
                        const l = p.screenings[0];
                        return (
                          <motion.div key={p._id || p.id} whileHover={{ scale: 1.01 }}
                            className="flex items-center justify-between p-2 rounded-lg bg-critical/5 border border-critical/10 cursor-pointer"
                            onClick={() => { setSelectedPatient(p); navigate(`/doctor/patient/${p._id || p.id}`); }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-critical/10 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-critical">{p.photo}</span>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-foreground">{p.name}</div>
                                <div className="text-[9px] text-muted-foreground">{l.riskScore} • {l.condition}</div>
                              </div>
                            </div>
                            <Eye className="h-3 w-3 text-critical" />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Center: Charts */}
              <div className="lg:col-span-5 space-y-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Risk Score Trend — {selectedPatient.name}
                  </h3>
                  <RiskTrendChart screenings={selectedPatient.screenings} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                  {/* <PCGChart riskScore={latest?.riskScore || 50} /> */}
                  {/*  <SpectrumChart riskScore={latest?.riskScore || 50} /> */}
                </motion.div>
              </div>

              {/* Right: Diagnosis */}
              <div className="lg:col-span-4 space-y-4">
                {latest ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Diagnosis</h3>
                    <div>
                      <div className="text-xl font-bold text-foreground mb-1.5">{latest.condition}</div>
                      <SeverityBadge severity={latest.severity} />
                    </div>
                    <div className="flex justify-center">
                      <RiskGauge score={latest.riskScore} size={150} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-bold text-foreground">{latest.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${latest.confidence}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full rounded-full bg-primary" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium text-foreground">{latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : latest.date || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Audio Playback */}
                    {latest.audioUrl && (
                      <div className="p-3 rounded-xl bg-muted/20 border border-border">
                        <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-2">Heart Sound Recording</div>
                        <audio controls src={`http://localhost:5000${latest.audioUrl}`} className="w-full h-8" preload="none" />
                      </div>
                    )}

                    {selectedPatient.doctorRemarks && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Doctor Remarks</div>
                        <p className="text-sm text-foreground">{selectedPatient.doctorRemarks}</p>
                      </div>
                    )}

                    {/* PDF Download */}
                    {latest._id && (
                      <Button size="sm" variant="outline"
                        className="w-full border-primary/30 text-primary hover:bg-primary/10 text-xs h-8"
                        onClick={async () => {
                          try {
                            const { screeningService } = await import('@/services/screeningService');
                            const blob = await screeningService.downloadReport(latest._id);
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `PulseGuard_Report_${latest._id}.pdf`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error('PDF download failed', err);
                          }
                        }}
                      >
                        Download PDF Report
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 text-center">
                    <Stethoscope className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No screenings yet</p>
                    <Button size="sm" onClick={handleStartScreening} className="mt-3 gradient-primary text-primary-foreground border-0">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Run First Screening
                    </Button>
                  </motion.div>
                )}

                {/* Severity Distribution */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Severity Distribution
                  </h3>
                  <SeverityDistributionChart data={severityData} />
                </motion.div>
              </div>
            </div>

            {/* Patients Table */}
            {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> All Patients
                </h3>
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{patients.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Patient</th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Condition</th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => {
                      const l = p.screenings[p.screenings.length - 1];
                      return (
                        <tr key={p._id || p.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                                <span className="text-[8px] font-bold text-primary-foreground">{p.photo}</span>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-foreground">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground">{p.age}y • {p.gender}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{l?.condition || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-bold ${
                              (l?.riskScore || 0) > 65 ? 'text-critical' : (l?.riskScore || 0) > 30 ? 'text-warning' : 'text-success'
                            }`}>{l?.riskScore || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {p.reviewed
                              ? <span className="text-[9px] font-bold bg-success/10 text-success px-2 py-0.5 rounded-full">Reviewed</span>
                              : <span className="text-[9px] font-bold bg-warning/10 text-warning px-2 py-0.5 rounded-full">Pending</span>
                            }
                          </td>
                          <td className="px-4 py-2.5">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/doctor/patient/${p._id || p.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div> */}
          </>
        ) : (
          <div className="glass-card p-10 text-center flex flex-col items-center justify-center border-dashed">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Active Patients</h3>
            <p className="text-sm text-muted-foreground mb-5">You haven't added any patients or accepted any requests yet.</p>
            <Button onClick={() => setAddPatientOpen(true)} className="gradient-primary text-primary-foreground border-0">
               <UserPlus className="h-4 w-4 mr-2" /> Add a Patient
            </Button>
          </div>
        )}
      </div>

      {/* Screening Overlay */}
      <AnimatePresence>
        {screeningOpen && selectedPatient && (
          <ScreeningFlow
            patientId={selectedPatient._id || selectedPatient.id}
            patientName={selectedPatient.name}
            onComplete={handleScreeningComplete}
            onClose={() => setScreeningOpen(false)}
            overlay
          />
        )}
      </AnimatePresence>

      {/* Confirm Screening Dialog */}
      <ConfirmDialog
        open={confirmScreening}
        onOpenChange={setConfirmScreening}
        title="Start New Screening?"
        description={`You are about to start a cardiac screening for ${selectedPatient?.name || 'this patient'}. This will record and analyze heart sounds using the AI model.`}
        confirmLabel="Yes, Start Screening"
        onConfirm={handleConfirmScreening}
      />

      {/* Add Patient Dialog */}
      <AddPatientDialog open={addPatientOpen} onOpenChange={setAddPatientOpen} onAdd={handleAddPatient} />
    </DashboardLayout>
  );
}
