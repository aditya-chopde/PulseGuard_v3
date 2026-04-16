import { useState, useEffect } from 'react';
import { useActivityPlanStore, ActivityItem } from '@/store/activityPlanStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Clock, Activity, Wind, Heart, UtensilsCrossed, Pill, ClipboardList, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ActivityPlanEditorProps {
  patientId: string;
  patientName: string;
}

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

export default function ActivityPlanEditor({ patientId, patientName }: ActivityPlanEditorProps) {
  const { plans, fetchPlan, addItem, updateItem, removeItem, updateNotes } = useActivityPlanStore();
  const plan = plans[patientId];
  const items = plan?.items || [];
  const notes = plan?.notes || '';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);
  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [category, setCategory] = useState<ActivityItem['category']>('exercise');
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Fetch existing plan when component mounts or patientId changes
  useEffect(() => {
    if (patientId) {
      setLoadingPlan(true);
      fetchPlan(patientId).finally(() => setLoadingPlan(false));
    }
  }, [patientId, fetchPlan]);

  const resetForm = () => {
    setTime('');
    setActivity('');
    setCategory('exercise');
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: ActivityItem) => {
    setEditingItem(item);
    setTime(item.time);
    setActivity(item.activity);
    setCategory(item.category);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!time.trim() || !activity.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateItem(patientId, editingItem.id, { time: time.trim(), activity: activity.trim(), category });
        toast.success('Activity updated');
      } else {
        const newItem: ActivityItem = {
          id: '', // Will be replaced by backend _id
          time: time.trim(),
          activity: activity.trim(),
          category,
        };
        await addItem(patientId, newItem);
        toast.success('Activity added');
      }
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to save activity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await removeItem(patientId, itemId);
      toast.success('Activity removed');
    } catch (err) {
      toast.error('Failed to remove activity');
    }
  };

  const handleNotesChange = async (value: string) => {
    try {
      await updateNotes(patientId, value);
    } catch (err) {
      // Silently fail for debounce-like behavior; notes will update on next save
    }
  };

  // Debounce notes updates
  const [localNotes, setLocalNotes] = useState(notes);
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localNotes !== notes && patientId) {
        handleNotesChange(localNotes);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [localNotes]);

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading activity plan...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Activity Plan for {patientName}
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog} className="gradient-primary text-primary-foreground border-0">
              <Plus className="h-4 w-4 mr-1" /> Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingItem ? 'Edit Activity' : 'Add New Activity'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Time</label>
                <Input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 6:00 AM"
                  className="bg-muted/30 border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Activity</label>
                <Input
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="e.g. Morning walk (30 min)"
                  className="bg-muted/30 border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
                <Select value={category} onValueChange={(v) => setCategory(v as ActivityItem['category'])}>
                  <SelectTrigger className="bg-muted/30 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="breathing">Breathing</SelectItem>
                    <SelectItem value="rest">Rest</SelectItem>
                    <SelectItem value="diet">Diet</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-primary-foreground border-0">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {editingItem ? 'Update' : 'Add'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No activities added yet. Click "Add Activity" to create a plan.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((item) => {
                const Icon = categoryIcons[item.category] || Activity;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[item.category] || 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-mono font-semibold text-primary w-20 flex-shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.time}
                      </span>
                      <span className="text-sm text-foreground truncate">{item.activity}</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block">
                      {item.category}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3 w-3 text-critical" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      {/* Doctor notes */}
      <div className="pt-2">
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Doctor Notes for Activity Plan</label>
        <Textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder="Add notes about this patient's activity restrictions, goals, etc."
          className="bg-muted/30 border-border"
          rows={3}
        />
      </div>
    </div>
  );
}
