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
import { User, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DoctorPatientReview() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const latest = patient?.screenings?.[patient.screenings.length - 1];

  const handleSaveRemarks = async () => {
    if (latest?.id) {
      try {
        await screeningService.updateDoctorReview(latest.id, remarks);
        toast.success('Remarks saved');
      } catch (err) {
        toast.error('Failed to save remarks');
      }
    } else {
      toast.error('No screening to associate remarks with');
    }
  };

  const handleMarkReviewed = async () => {
    if (latest?.id) {
      try {
        await screeningService.updateDoctorReview(latest.id, remarks, 'reviewed');
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
          {latest && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Feature Contributions</h3>
              <FeatureChart features={latest.features} />
            </motion.div>
          )}
        </div>

        {/* Activity Plan Editor */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
          <ActivityPlanEditor patientId={patient.id} patientName={patient.name} />
        </motion.div>

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
    </DashboardLayout>
  );
}
