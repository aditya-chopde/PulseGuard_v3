import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { patientService } from '@/services/patientService';
import { useAuth } from '@/hooks/useAuth';
import SeverityBadge from '@/components/SeverityBadge';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import HeartSoundWaveformChart from '@/components/charts/HeartSoundWaveformChart';
import FrequencySpectrumChart from '@/components/charts/FrequencySpectrumChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';

import { screeningService } from '@/services/screeningService';
import { Download } from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState<any>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const userId = user?._id || user?.id;
        if (userId) {
          const res = await screeningService.getPatientScreenings(userId);
          setScreenings(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-muted-foreground">Loading history...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Screening History
        </h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Condition</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Severity</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Risk Score</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Confidence</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Report</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s: any) => (
                  <tr key={s._id || s.id} onClick={() => setSelectedScreening(s)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">{new Date(s.createdAt || s.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{s.condition}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={s.severity} /></td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">{s.riskScore}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.confidence}%</td>
                    <td className="px-4 py-3">
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
                          className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {screenings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted-foreground text-sm">No screening history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {screenings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Risk Score Trend</h3>
            <RiskTrendChart screenings={[...screenings].reverse()} />
          </motion.div>
        )}
      </div>

      <Dialog open={!!selectedScreening} onOpenChange={(open) => !open && setSelectedScreening(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Screening Analysis Results</DialogTitle>
            <DialogDescription>
              Detailed view of your structural sound metrics and diagnostic results.
            </DialogDescription>
          </DialogHeader>

          {selectedScreening && (
             <div className="space-y-6 mt-4">
                 {/* Top row stats */}
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

                 {/* Recording Playback */}
                 <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Heart Recording Audio</h3>
                    <audio controls className="w-full h-10 outline-none" src={`http://localhost:5000${selectedScreening.audioUrl}`}>
                       Your browser does not support the audio element.
                    </audio>
                 </div>

                 {/* Charts */}
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

                 {/* Doctor Remarks */}
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
