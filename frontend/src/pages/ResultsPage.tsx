import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useScreening } from '@/hooks/useScreening';
import { currentPatient } from '@/mockData/patients';
import RiskGauge from '@/components/charts/RiskGauge';
import FeatureChart from '@/components/charts/FeatureChart';
import HeartSoundWaveformChart from '@/components/charts/HeartSoundWaveformChart';
import FrequencySpectrumChart from '@/components/charts/FrequencySpectrumChart';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import SeverityDistributionChart from '@/components/charts/SeverityDistributionChart';
import SeverityBadge from '@/components/SeverityBadge';
import { getRecommendations } from '@/mockData/recommendations';
import { screeningService } from '@/services/screeningService';
import { Button } from '@/components/ui/button';
import { Heart, AlertTriangle, CheckCircle, ArrowRight, Activity, Pill, Calendar, BarChart3, AudioWaveform, TrendingUp, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultsPage() {
  const { latestResult } = useScreening();
  const navigate = useNavigate();
  const patient = currentPatient;

  if (!latestResult) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">No results available.</p>
          <Button onClick={() => navigate('/screening')} className="mt-4">Start Screening</Button>
        </div>
      </DashboardLayout>
    );
  }

  const rec = getRecommendations(latestResult.severity, latestResult.riskScore);
  const isHighRisk = latestResult.riskScore > 65;

  // Build severity distribution from patient screenings + latest
  const allScreenings = [...patient.screenings, latestResult];
  const severityCounts = allScreenings.reduce((acc, s) => {
    acc[s.severity] = (acc[s.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({ name, value: value as number }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">AI Prediction Results</h1>
          <div className="flex gap-2">
            {latestResult._id && (
              <Button onClick={async () => {
                try {
                  const blob = await screeningService.downloadReport(latestResult._id);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `PulseGuard_Report_${latestResult._id}.pdf`; a.click();
                  window.URL.revokeObjectURL(url);
                } catch {}
              }} variant="outline" size="sm" className="border-primary/30 text-primary">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Report
              </Button>
            )}
            <Button onClick={() => navigate('/patient')} variant="outline" size="sm" className="border-border">Back to Dashboard</Button>
          </div>
        </div>

        {/* Top diagnosis cards */}
        <div className="grid md:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Detected Condition</h3>
            <div className="flex items-center gap-3 mb-3">
              {isHighRisk ? <AlertTriangle className="h-8 w-8 text-critical" /> : <CheckCircle className="h-8 w-8 text-success" />}
              <div className="text-xl font-bold text-foreground">{latestResult.condition}</div>
            </div>
            <SeverityBadge severity={latestResult.severity} />
            <div className="mt-4 text-sm text-muted-foreground">
              Confidence: <span className="font-semibold text-foreground">{latestResult.confidence}%</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Cardiac Risk Score</h3>
            <RiskGauge score={latestResult.riskScore} size={180} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Follow-up
            </h3>
            <div className={`p-3 rounded-lg text-sm font-medium ${
              isHighRisk ? 'bg-critical/10 text-critical' : latestResult.riskScore > 30 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
            }`}>
              {rec.followUp}
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground mt-4 mb-2 flex items-center gap-2">
              <Pill className="h-4 w-4" /> Medication Note
            </h3>
            <p className="text-sm text-muted-foreground">{rec.medication}</p>
          </motion.div>
        </div>

        {/* ===== GRAPH-BASED REPORTS SECTION ===== */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Heart Sound Analysis Reports</h2>
          </div>
        </motion.div>

        {/* Heart Sound Waveform (PCG) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <AudioWaveform className="h-5 w-5 text-primary" /> Phonocardiogram (PCG) Signal
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Simulated heart sound waveform showing S1/S2 peaks and systolic/diastolic phases. 
            {latestResult.condition !== 'Normal' && (
              <span className="text-warning"> Murmur activity detected during systolic phase.</span>
            )}
          </p>
          <HeartSoundWaveformChart condition={latestResult.condition} riskScore={latestResult.riskScore} realData={latestResult.pcgData} />
          <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary inline-block rounded" /> PCG Signal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-success inline-block rounded" /> S1/S2 Peaks
            </span>
          </div>
        </motion.div>

        {/* Frequency Spectrum */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Frequency Spectrum Analysis
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Power spectral density of the recorded heart sound. Normal heart sounds peak below 150 Hz.
            {latestResult.condition !== 'Normal' && (
              <span className="text-warning"> Elevated high-frequency components indicate abnormal valve activity.</span>
            )}
          </p>
          <FrequencySpectrumChart condition={latestResult.condition} riskScore={latestResult.riskScore} realData={latestResult.spectrumData} />
          <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary inline-block rounded" /> Patient Signal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-muted-foreground inline-block rounded border-dashed" /> Normal Baseline
            </span>
          </div>
        </motion.div>

        {/* Feature Contributions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Explainable AI — Feature Contributions
          </h3>
          <FeatureChart features={latestResult.features} />
        </motion.div>

        {/* Risk Trend + Severity Distribution */}
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Risk Score Progression
            </h3>
            <RiskTrendChart screenings={[...patient.screenings, latestResult]} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Severity Distribution
            </h3>
            <SeverityDistributionChart data={severityData} />
          </motion.div>
        </div>

        {/* Recommendations */}
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Lifestyle Suggestions
            </h3>
            <ul className="space-y-2">
              {rec.lifestyle.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> {tip}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Activity Recommendations
            </h3>
            <ul className="space-y-2">
              {rec.activityPlan.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /> {a}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
