import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { patientService } from '@/services/patientService';
import { screeningService } from '@/services/screeningService';
import RiskGauge from '@/components/charts/RiskGauge';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import FeatureChart from '@/components/charts/FeatureChart';
import SeverityBadge from '@/components/SeverityBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ActivityPlanEditor from '@/components/ActivityPlanEditor';
import { User, ArrowLeft, CheckCircle, MessageSquare, Download, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import MedicineLookupWidget from '@/components/MedicineLookupWidget';
import HeartSoundWaveformChart from '@/components/charts/HeartSoundWaveformChart';
import FrequencySpectrumChart from '@/components/charts/FrequencySpectrumChart';
import { AudioWaveform, Activity, BarChart3 } from 'lucide-react';

export default function DoctorPatientReview() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState<any>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        if (patientId) {
          const data = await patientService.getPatientById(patientId);
          setPatient(data);
          setRemarks(data.doctorRemarks || '');
          setReviewed(data.reviewed || false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  const latest = patient?.screenings?.[0];

  const handleSaveRemarks = async () => {
    const screeningId = latest?._id || latest?.id;
    if (screeningId) {
      try {
        await screeningService.updateDoctorReview(screeningId, remarks);
        toast.success('Remarks saved');
      } catch (err) {
        toast.error('Failed to save remarks');
      }
    } else {
      toast.error('No screening to associate remarks with');
    }
  };

  const handleMarkReviewed = async () => {
    const screeningId = latest?._id || latest?.id;
    if (screeningId) {
      try {
        await screeningService.updateDoctorReview(screeningId, remarks, 'reviewed');
        setReviewed(true);
        toast.success('Case marked as reviewed');
      } catch (err) {
        toast.error('Failed to update status');
      }
    } else {
      setReviewed(true);
      toast.success('Case marked as reviewed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">Loading patient data...</div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Patient not found</p>
          <Button onClick={() => navigate('/doctor')} className="mt-4">Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/doctor')} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Patient Review</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{patient.name}</div>
                <div className="text-sm text-muted-foreground">{patient.age} yrs • {patient.gender}</div>
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>{patient.phone}</div>
              <div>{patient.address}</div>
              <div className="mt-2">
                Status: {reviewed ? <span className="text-success font-medium">Reviewed ✓</span> : <span className="text-warning font-medium">Pending Review</span>}
              </div>
            </div>
          </motion.div>

          {latest && (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Latest Analysis</h3>
                <div className="text-xl font-bold text-foreground mb-2">{latest.condition}</div>
                <SeverityBadge severity={latest.severity} />
                <div className="mt-3 text-sm text-muted-foreground">Confidence: <span className="font-semibold text-foreground">{latest.confidence}%</span></div>
                <div className="text-sm text-muted-foreground">Date: {latest.date}</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Risk Score</h3>
                <RiskGauge score={latest.riskScore} size={160} />
              </motion.div>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Risk Score Trend</h3>
            <RiskTrendChart screenings={patient.screenings} />
          </motion.div>
        </div>

        {patient.screenings && patient.screenings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                 <History className="h-5 w-5 text-primary" /> Screening History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Condition</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Severity</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Risk Score</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Confidence</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {[...patient.screenings].map((s: any) => (
                    <tr key={s._id || s.id} onClick={() => setSelectedScreening(s)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{new Date(s.createdAt || s.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap">{s.condition}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><SeverityBadge severity={s.severity} /></td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground whitespace-nowrap">{s.riskScore}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{s.confidence}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(s._id || s.id) && (
                          <button
                            onClick={async (e) => {
                               e.stopPropagation();
                               try {
                                 const blob = await screeningService.downloadReport(s._id || s.id);
                                 const url = window.URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = `PulseGuard_Report_${s._id || s.id}.pdf`;
                                 a.click();
                                 window.URL.revokeObjectURL(url);
                               } catch(e) { console.error("Report download failed", e) }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {latest && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AudioWaveform className="h-5 w-5 text-primary" /> Phonocardiogram (PCG) Signal
              </h3>
              <HeartSoundWaveformChart condition={latest.condition} riskScore={latest.riskScore} realData={latest.pcgData} />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Frequency Spectrum Analysis
              </h3>
              <FrequencySpectrumChart condition={latest.condition} riskScore={latest.riskScore} realData={latest.spectrumData} />
            </motion.div>
          </div>
        )}

        {/* Activity Plan & Medicines */}
        <div className="grid md:grid-cols-12 gap-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6 md:col-span-7">
            <ActivityPlanEditor patientId={patient._id || patient.id} patientName={patient.name} />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="md:col-span-5 flex flex-col">
            <MedicineLookupWidget />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Doctor Remarks
          </h3>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add your remarks about this patient's case..." className="mb-4 bg-muted/30 border-border" rows={4} />
          <div className="flex gap-3">
            <Button onClick={handleSaveRemarks} variant="outline" className="border-border">Save Remarks</Button>
            {!reviewed && (
              <Button onClick={handleMarkReviewed} className="gradient-primary text-primary-foreground border-0">
                <CheckCircle className="h-4 w-4 mr-2" /> Mark as Reviewed
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <Dialog open={!!selectedScreening} onOpenChange={(open) => !open && setSelectedScreening(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Screening Analysis Results</DialogTitle>
            <DialogDescription>
              Detailed view of structural sound metrics and diagnostic results.
            </DialogDescription>
          </DialogHeader>

          {selectedScreening && (
             <div className="space-y-6 mt-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Condition</p>
                       <p className="text-lg font-bold text-foreground lead-tight">{selectedScreening.condition}</p>
                    </div>
                    <div className="glass-card p-4">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Severity</p>
                       <SeverityBadge severity={selectedScreening.severity} />
                    </div>
                    <div className="glass-card p-4">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Risk Score</p>
                       <p className={`text-2xl font-black ${selectedScreening.riskScore > 65 ? 'text-critical' : selectedScreening.riskScore > 30 ? 'text-warning' : 'text-success'}`}>{selectedScreening.riskScore}</p>
                    </div>
                    <div className="glass-card p-4">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Confidence</p>
                       <p className="text-xl font-bold text-foreground">{selectedScreening.confidence}%</p>
                    </div>
                 </div>

                 <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Heart Recording Audio</h3>
                    <audio controls className="w-full h-10 outline-none" src={`http://localhost:5000${selectedScreening.audioUrl}`}>
                       Your browser does not support the audio element.
                    </audio>
                 </div>

                 <div className="space-y-6 mt-6">
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Phonocardiogram (PCG) Signal</h3>
                      <HeartSoundWaveformChart condition={selectedScreening.condition} riskScore={selectedScreening.riskScore} realData={selectedScreening.pcgData} />
                    </div>
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Frequency Spectrum Analysis</h3>
                      <FrequencySpectrumChart condition={selectedScreening.condition} riskScore={selectedScreening.riskScore} realData={selectedScreening.spectrumData} />
                    </div>
                 </div>

                 {selectedScreening.doctorRemarks && (
                   <div className="glass-card p-5 bg-primary/5 border border-primary/20">
                     <h3 className="font-semibold text-primary mb-2">Doctor Remarks</h3>
                     <p className="text-sm text-foreground">{selectedScreening.doctorRemarks}</p>
                   </div>
                 )}
             </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
