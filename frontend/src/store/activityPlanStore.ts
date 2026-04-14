import { create } from 'zustand';
import { activityService } from '@/services/activityService';

export interface ActivityItem {
  id: string;
  time: string;
  activity: string;
  category: 'exercise' | 'breathing' | 'rest' | 'diet' | 'medication';
}

export interface PatientActivityPlan {
  patientId: string;
  items: ActivityItem[];
  notes: string;
  updatedAt: string;
}

interface ActivityPlanStore {
  plans: Record<string, PatientActivityPlan>;
  fetchPlan: (patientId: string) => Promise<PatientActivityPlan | undefined>;
  savePlan: (plan: PatientActivityPlan) => Promise<void>;
  addItem: (patientId: string, item: ActivityItem) => Promise<void>;
  updateItem: (patientId: string, itemId: string, updates: Partial<ActivityItem>) => Promise<void>;
  removeItem: (patientId: string, itemId: string) => Promise<void>;
  updateNotes: (patientId: string, notes: string) => Promise<void>;
}

export const useActivityPlanStore = create<ActivityPlanStore>((set, get) => ({
  plans: {},

  fetchPlan: async (patientId) => {
    try {
      const plan = await activityService.getPlan(patientId);
      if (plan) {
        set((state) => ({ plans: { ...state.plans, [patientId]: plan } }));
      }
      return plan;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  },

  savePlan: async (plan) => {
    try {
      await activityService.updatePlan(plan.patientId, plan);
      set((state) => ({
        plans: { ...state.plans, [plan.patientId]: { ...plan, updatedAt: new Date().toISOString() } },
      }));
    } catch (err) {
      console.error(err);
    }
  },

  addItem: async (patientId, item) => {
    try {
      await activityService.addItem(patientId, item);
      set((state) => {
        const existing = state.plans[patientId] || { patientId, items: [], notes: '', updatedAt: '' };
        return {
          plans: {
            ...state.plans,
            [patientId]: { ...existing, items: [...existing.items, item], updatedAt: new Date().toISOString() },
          },
        };
      });
    } catch (err) { console.error(err); }
  },

  updateItem: async (patientId, itemId, updates) => {
    // Optimistic or rely on full plan update
    // The backend endpoint only supports put /activity-plans/:patientId for wholesale updates ideally,
    // or specific endpoints. Assuming /activity-plans/:patientId/items/:itemId PUT exists or we update full plan.
    try {
      const plan = get().plans[patientId];
      if (!plan) return;
      const updatedPlan = {
        ...plan,
        items: plan.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
      };
      await activityService.updatePlan(patientId, updatedPlan);
      
      set((state) => ({
        plans: {
          ...state.plans,
          [patientId]: { ...updatedPlan, updatedAt: new Date().toISOString() },
        },
      }));
    } catch (err) { console.error(err); }
  },

  removeItem: async (patientId, itemId) => {
    try {
      await activityService.removeItem(patientId, itemId);
      set((state) => {
        const plan = state.plans[patientId];
        if (!plan) return state;
        return {
          plans: {
            ...state.plans,
            [patientId]: {
              ...plan,
              items: plan.items.filter((i) => i.id !== itemId),
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    } catch (err) { console.error(err); }
  },

  updateNotes: async (patientId, notes) => {
    try {
      const existing = get().plans[patientId] || { patientId, items: [], notes: '', updatedAt: '' };
      const updatedPlan = { ...existing, notes };
      await activityService.updatePlan(patientId, updatedPlan);
      set((state) => ({
        plans: {
          ...state.plans,
          [patientId]: { ...updatedPlan, updatedAt: new Date().toISOString() },
        },
      }));
    } catch (err) { console.error(err); }
  },
}));
