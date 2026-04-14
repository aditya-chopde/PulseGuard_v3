export interface Recommendation {
  lifestyle: string[];
  medication: string;
  followUp: string;
  activityPlan: string[];
}

export function getRecommendations(severity: string, riskScore: number): Recommendation {
  if (riskScore <= 30) {
    return {
      lifestyle: [
        "Maintain a heart-healthy diet rich in fruits and vegetables",
        "Regular cardiovascular exercise (30 min/day)",
        "Adequate sleep (7-8 hours)",
        "Stress management through meditation",
      ],
      medication: "No medication recommended at this time",
      followUp: "Routine check-up in 12 months",
      activityPlan: [
        "30 minutes brisk walking daily",
        "Light jogging 3 times/week",
        "Yoga or stretching exercises",
        "Swimming or cycling as preferred",
      ],
    };
  }
  if (riskScore <= 65) {
    return {
      lifestyle: [
        "Low-sodium diet strictly recommended",
        "Light to moderate exercise with monitoring",
        "Avoid caffeine and alcohol",
        "Regular blood pressure monitoring at home",
        "Stress reduction techniques",
      ],
      medication: "Beta-blockers or ACE inhibitors may be considered (consult cardiologist)",
      followUp: "Consult cardiologist within 2 weeks. Follow-up in 3 months.",
      activityPlan: [
        "20 minutes light walking daily",
        "Breathing exercises (10 min, twice daily)",
        "Gentle yoga (avoid inverted poses)",
        "Avoid heavy lifting or strenuous activity",
      ],
    };
  }
  return {
    lifestyle: [
      "Strict dietary restrictions as per cardiologist",
      "Bed rest or minimal activity as advised",
      "24/7 monitoring recommended",
      "Emergency contact numbers accessible",
      "Avoid all stimulants",
    ],
    medication: "Immediate cardiology consultation required. Possible medications: Digoxin, Diuretics, Anticoagulants (prescription only)",
    followUp: "Immediate referral to cardiologist. Hospital evaluation recommended.",
    activityPlan: [
      "Avoid all intense physical activity",
      "Gentle walking only if approved by doctor",
      "Deep breathing exercises while seated",
      "Rest frequently throughout the day",
    ],
  };
}
