import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useActivityPlanStore } from '@/store/activityPlanStore';
import { motion } from 'framer-motion';
import { Activity, Heart, Sun, Wind, Clock, UtensilsCrossed, Pill, ClipboardList, Loader2 } from 'lucide-react';

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
  const { plans, fetchPlan } = useActivityPlanStore();
  const [loading, setLoading] = useState(true);

  const userId = user?._id || user?.id || '';

  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        setLoading(true);
        await fetchPlan(userId);
        setLoading(false);
      }
    };
    loadData();
  }, [userId, fetchPlan]);

  const doctorPlan = plans[userId];

  // Hardcoded fallback schedule based on general risk guidance
  const dailySchedule = [
    { time: '6:00 AM', activity: 'Morning walk (30 min)', icon: Sun, category: 'exercise' },
    { time: '7:00 AM', activity: 'Light stretching / Yoga', icon: Activity, category: 'exercise' },
    { time: '10:00 AM', activity: 'Deep breathing exercises (10 min)', icon: Wind, category: 'breathing' },
    { time: '4:00 PM', activity: 'Brisk walking or jogging (20 min)', icon: Activity, category: 'exercise' },
    { time: '7:00 PM', activity: 'Evening relaxation walk (15 min)', icon: Sun, category: 'rest' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading activity plan...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Activity Plan
        </h1>

        {/* Doctor-prescribed plan */}
        {doctorPlan && doctorPlan.items.length > 0 ? (
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
        ) : (
          <div className="glass-card p-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No Activity Plan Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your doctor hasn't created a personalized activity plan for you yet. 
              Below are some general suggestions.
            </p>
          </div>
        )}

        {/* General Daily Schedule (always shown as suggestions) */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-foreground mb-4">General Daily Schedule Suggestions</h3>
          <div className="space-y-3">
            {dailySchedule.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20">
                <div className="text-sm font-mono font-semibold text-primary w-20">{item.time}</div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[item.category] || 'bg-muted text-muted-foreground'}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm text-foreground">{item.activity}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
