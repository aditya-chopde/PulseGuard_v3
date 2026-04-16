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

/**
 * Transforms a backend activity item (with _id) to frontend shape (with id).
 */
function mapBackendItem(item: any): ActivityItem {
  return {
    id: item._id || item.id,
    time: item.time,
    activity: item.activity,
    category: item.category,
  };
}

export const useActivityPlanStore = create<ActivityPlanStore>((set, get) => ({
  plans: {},

  fetchPlan: async (patientId) => {
    try {
      const response = await activityService.getPlan(patientId);
      // Backend returns { success, data: { plan, items } }
      const raw = response?.data || response;
      if (!raw?.plan) return undefined;

      const transformed: PatientActivityPlan = {
        patientId,
        items: (raw.items || []).map(mapBackendItem),
        notes: raw.plan.notes || '',
        updatedAt: raw.plan.updatedAt || new Date().toISOString(),
      };

      set((state) => ({ plans: { ...state.plans, [patientId]: transformed } }));
      return transformed;
    } catch (err: any) {
      // 404 is expected if no plan exists yet — not an error
      if (err?.response?.status === 404) {
        return undefined;
      }
      console.error('Failed to fetch activity plan:', err);
      return undefined;
    }
  },

  savePlan: async (plan) => {
    try {
      await activityService.updatePlan(plan.patientId, { notes: plan.notes });
      set((state) => ({
        plans: { ...state.plans, [plan.patientId]: { ...plan, updatedAt: new Date().toISOString() } },
      }));
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  },

  addItem: async (patientId, item) => {
    try {
      // Ensure a plan exists first (upsert)
      const existing = get().plans[patientId];
      if (!existing) {
        await activityService.updatePlan(patientId, { notes: '' });
      }

      // POST the item to the backend
      const response = await activityService.addItem(patientId, {
        time: item.time,
        activity: item.activity,
        category: item.category,
        sortOrder: 0,
      });

      // Use the backend-generated _id
      const savedItem = mapBackendItem(response?.data || response);

      set((state) => {
        const plan = state.plans[patientId] || { patientId, items: [], notes: '', updatedAt: '' };
        return {
          plans: {
            ...state.plans,
            [patientId]: {
              ...plan,
              items: [...plan.items, savedItem],
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    } catch (err) {
      console.error('Failed to add activity item:', err);
      throw err;
    }
  },

  updateItem: async (patientId, itemId, updates) => {
    try {
      // Backend doesn't have a PUT /items/:itemId endpoint.
      // Strategy: delete old item, create new one with updated fields.
      const plan = get().plans[patientId];
      if (!plan) return;

      const oldItem = plan.items.find((i) => i.id === itemId);
      if (!oldItem) return;

      const updatedItem = { ...oldItem, ...updates };

      // Delete old item from backend
      await activityService.removeItem(patientId, itemId);

      // Create new item
      const response = await activityService.addItem(patientId, {
        time: updatedItem.time,
        activity: updatedItem.activity,
        category: updatedItem.category,
        sortOrder: 0,
      });

      const savedItem = mapBackendItem(response?.data || response);

      set((state) => {
        const currentPlan = state.plans[patientId];
        if (!currentPlan) return state;
        return {
          plans: {
            ...state.plans,
            [patientId]: {
              ...currentPlan,
              items: currentPlan.items.map((i) => (i.id === itemId ? savedItem : i)),
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    } catch (err) {
      console.error('Failed to update activity item:', err);
      throw err;
    }
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
    } catch (err) {
      console.error('Failed to remove activity item:', err);
      throw err;
    }
  },

  updateNotes: async (patientId, notes) => {
    try {
      // Only send { notes } — that's all the backend accepts
      await activityService.updatePlan(patientId, { notes });
      set((state) => {
        const existing = state.plans[patientId] || { patientId, items: [], notes: '', updatedAt: '' };
        return {
          plans: {
            ...state.plans,
            [patientId]: { ...existing, notes, updatedAt: new Date().toISOString() },
          },
        };
      });
    } catch (err) {
      console.error('Failed to update notes:', err);
      throw err;
    }
  },
}));
