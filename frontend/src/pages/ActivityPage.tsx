import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { patientService } from '@/services/patientService';
import { recommendationService } from '@/services/recommendationService';
import { useAuth } from '@/hooks/useAuth';
import { useActivityPlanStore } from '@/store/activityPlanStore';
import { motion } from 'framer-motion';
import { Activity, Heart, Sun, Wind, Clock, UtensilsCrossed, Pill, ClipboardList } from 'lucide-react';

const categoryIcons: Record<string, typeof Activity> = {
  exercise: Activity,
  breathing: Wind,
  rest: Heart,
  diet: UtensilsCrossed,
  medication: Pill,
};

const categoryColors: Record<string, string> = {
  exercise: 'bg-primary/10 text-primary',
  breathing: 'bg-accent/10 text-accent-foreground',
  rest: 'bg-success/10 text-success',
  diet: 'bg-warning/10 text-warning',
  medication: 'bg-critical/10 text-critical',
};

export default function ActivityPage() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [rec, setRec] = useState<any>(null);
  const { plans, fetchPlan } = useActivityPlanStore();

  useEffect(() => {
    const loadData = async () => {
      const userId = user?._id || user?.id;
      if (userId) {
        const pData = await patientService.getPatientById(userId);
        setPatient(pData);
        await fetchPlan(userId);

        const latestScreening = pData?.screenings?.[pData.screenings.length - 1];
        if (latestScreening) {
          const rData = await recommendationService.getRecommendations(latestScreening.severity, latestScreening.riskScore);
          setRec(rData);
        }
      }
    };
    loadData();
  }, [user]);

  const latest = patient?.screenings?.[patient.screenings.length - 1];
  const doctorPlan = plans[user?._id || user?.id || ''];

  const getRiskLevel = () => {
    if (!latest) return 'unknown';
    if (latest.riskScore <= 30) return 'low';
    if (latest.riskScore <= 65) return 'moderate';
    return 'high';
  };

  const riskLevel = getRiskLevel();

  const dailySchedule: Record<string, { time: string; activity: string; icon: typeof Sun }[]> = {
    low: [
      { time: '6:00 AM', activity: 'Morning walk (30 min)', icon: Sun },
      { time: '7:00 AM', activity: 'Light stretching / Yoga', icon: Activity },
      { time: '10:00 AM', activity: 'Deep breathing exercises (10 min)', icon: Wind },
      { time: '4:00 PM', activity: 'Brisk walking or jogging (20 min)', icon: Activity },
      { time: '7:00 PM', activity: 'Evening relaxation walk (15 min)', icon: Sun },
    ],
    moderate: [
      { time: '6:30 AM', activity: 'Gentle walk (20 min)', icon: Sun },
      { time: '8:00 AM', activity: 'Breathing exercises (15 min)', icon: Wind },
      { time: '11:00 AM', activity: 'Light stretching (10 min)', icon: Activity },
      { time: '4:00 PM', activity: 'Slow walk (15 min)', icon: Sun },
      { time: '8:00 PM', activity: 'Guided relaxation / meditation', icon: Wind },
    ],
    high: [
      { time: '7:00 AM', activity: 'Seated breathing exercises (10 min)', icon: Wind },
      { time: '10:00 AM', activity: 'Gentle seated stretching', icon: Activity },
      { time: '2:00 PM', activity: 'Short slow walk (5 min, if approved)', icon: Sun },
      { time: '5:00 PM', activity: 'Deep breathing (10 min)', icon: Wind },
      { time: '8:00 PM', activity: 'Rest and relaxation', icon: Heart },
    ],
    unknown: [],
  };

  const schedule = dailySchedule[riskLevel] || [];

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-10 text-muted-foreground">Loading activity plan...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Daily Activity Suggestions
        </h1>

        <div className={`p-4 rounded-xl text-sm font-medium ${
          riskLevel === 'low' ? 'bg-success/10 text-success' :
          riskLevel === 'moderate' ? 'bg-warning/10 text-warning' :
          riskLevel === 'high' ? 'bg-critical/10 text-critical' : 'bg-muted/30 text-muted-foreground'
        }`}>
          Current Risk Level: <span className="font-bold capitalize">{riskLevel}</span>
          {latest && ` (Score: ${latest.riskScore})`}
        </div>

        {/* Doctor-prescribed plan */}
        {doctorPlan && doctorPlan.items.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Doctor-Prescribed Activity Plan
            </h3>
            <div className="space-y-2">
              {doctorPlan.items
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item, i) => {
                  const Icon = categoryIcons[item.category] || Activity;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/20"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[item.category] || 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-mono font-semibold text-primary w-20 flex-shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.time}
                      </span>
                      <span className="text-sm text-foreground">{item.activity}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-auto hidden sm:block">
                        {item.category}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
            {doctorPlan.notes && (
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-xs font-semibold text-primary mb-1">Doctor's Notes</div>
                <p className="text-sm text-muted-foreground">{doctorPlan.notes}</p>
              </div>
            )}
          </div>
        )}

        {rec && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-foreground mb-3">AI-Suggested Activity Plan</h3>
            <ul className="space-y-2">
              {rec.activityPlan.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /> {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Suggested Daily Schedule</h3>
          <div className="space-y-3">
            {schedule.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20">
                <div className="text-sm font-mono font-semibold text-primary w-20">{item.time}</div>
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.activity}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
