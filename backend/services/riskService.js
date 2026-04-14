/**
 * Calculates Risk Score based on following:
 * Risk Score = (Severity × 0.4) + (Probability × 0.3) + (Acoustic Index × 0.2) + (Patient Factors × 0.1)
 * 
 * Returns score, mapped severity string, and category:
 */
export const calculateRiskScore = (numericSeverity, probability, acousticIndex, patientFactors = 10) => {
    const rawScore = (numericSeverity * 0.4) + (probability * 0.3) + (acousticIndex * 0.2) + (patientFactors * 0.1);
    
    // Ensure score is between 0 and 100
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let riskCategory = 'Low';
    if (score > 80) riskCategory = 'Critical';
    else if (score > 60) riskCategory = 'High';
    else if (score > 30) riskCategory = 'Moderate';

    // Map severity to strings as required by Screening.js
    // Assuming python returns severity 0-100
    let severityString = 'None';
    if (numericSeverity >= 80) severityString = 'Severe';
    else if (numericSeverity >= 50) severityString = 'Moderate';
    else if (numericSeverity >= 30) severityString = 'Mild';

    return { 
        riskScore: score, 
        riskCategory, 
        severityLabel: severityString,
        confidence: probability // Directly mapped for Screening.js mapping
    };
};
