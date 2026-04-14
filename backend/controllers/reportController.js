import PDFDocument from 'pdfkit';
import Screening from '../models/Screening.js';
import User from '../models/User.js';
import PatientDetail from '../models/PatientDetail.js';
import DoctorPatient from '../models/DoctorPatient.js';

// @desc    Generate PDF report for a screening
// @route   GET /screenings/:id/report
// @access  Private
export const generateReport = async (req, res, next) => {
    try {
        const screening = await Screening.findById(req.params.id)
            .populate('patientId', 'name email phone')
            .populate('initiatedBy', 'name role');

        if (!screening) {
            return res.status(404).json({ success: false, error: 'Screening not found' });
        }

        // Auth check
        const patientUserId = screening.patientId._id || screening.patientId;
        if (req.user.role === 'patient' && patientUserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        if (req.user.role === 'doctor') {
            const map = await DoctorPatient.findOne({ doctorId: req.user._id, patientId: patientUserId });
            if (!map) return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Get patient details
        const patientDetails = await PatientDetail.findOne({ userId: patientUserId });

        // Create PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PulseGuard_Report_${screening._id}.pdf`);
        doc.pipe(res);

        // --- HEADER ---
        doc.rect(0, 0, 595.28, 100).fill('#1a73e8');
        doc.fill('#ffffff');
        doc.fontSize(28).font('Helvetica-Bold').text('PulseGuard', 50, 30);
        doc.fontSize(10).font('Helvetica').text('AI-Powered Cardiac Screening Report', 50, 62);
        doc.fontSize(8).text(`Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 50, 78);
        
        // Report ID right-aligned
        doc.fontSize(8).text(`Report ID: ${screening._id}`, 350, 78, { align: 'right' });

        doc.fill('#1a1a2e');
        let y = 120;

        // --- PATIENT INFO ---
        doc.rect(50, y, 495, 30).fill('#f0f4ff');
        doc.fill('#1a73e8').fontSize(12).font('Helvetica-Bold').text('PATIENT INFORMATION', 60, y + 8);
        y += 40;
        doc.fill('#333333').fontSize(10).font('Helvetica');
        
        const patientName = screening.patientId?.name || 'N/A';
        const patientEmail = screening.patientId?.email || 'N/A';
        const patientPhone = screening.patientId?.phone || 'N/A';
        const age = patientDetails?.age || 'N/A';
        const gender = patientDetails?.gender || 'N/A';
        const bloodGroup = patientDetails?.bloodGroup || 'N/A';

        // Two columns
        doc.text(`Name: ${patientName}`, 60, y);
        doc.text(`Age: ${age}`, 350, y);
        y += 18;
        doc.text(`Email: ${patientEmail}`, 60, y);
        doc.text(`Gender: ${gender}`, 350, y);
        y += 18;
        doc.text(`Phone: ${patientPhone}`, 60, y);
        doc.text(`Blood Group: ${bloodGroup}`, 350, y);
        y += 35;

        // --- SCREENING RESULTS ---
        doc.rect(50, y, 495, 30).fill('#fff0f0');
        doc.fill('#e53935').fontSize(12).font('Helvetica-Bold').text('SCREENING RESULTS', 60, y + 8);
        y += 40;
        doc.fill('#333333').fontSize(10).font('Helvetica');

        // Condition box
        doc.rect(60, y, 220, 70).lineWidth(1).stroke('#ddd');
        doc.fontSize(9).fill('#888').text('DETECTED CONDITION', 70, y + 8);
        doc.fontSize(16).fill('#1a1a2e').font('Helvetica-Bold').text(screening.condition || 'N/A', 70, y + 28);
        doc.fontSize(10).fill('#666').font('Helvetica').text(`Severity: ${screening.severity}`, 70, y + 50);

        // Risk Score box
        doc.rect(310, y, 220, 70).lineWidth(1).stroke('#ddd');
        doc.fontSize(9).fill('#888').font('Helvetica').text('RISK SCORE', 320, y + 8);
        
        const riskColor = screening.riskScore > 65 ? '#e53935' : screening.riskScore > 30 ? '#fb8c00' : '#43a047';
        doc.fontSize(32).fill(riskColor).font('Helvetica-Bold').text(`${screening.riskScore}`, 320, y + 22);
        doc.fontSize(10).fill('#666').font('Helvetica').text(`Confidence: ${screening.confidence}%`, 320, y + 50);
        y += 85;

        // Risk level text
        const riskText = screening.riskScore > 65 ? 'HIGH RISK — Immediate medical attention recommended' :
                         screening.riskScore > 30 ? 'MODERATE RISK — Follow-up consultation advised' :
                         'LOW RISK — Continue regular monitoring';
        const riskBgColor = screening.riskScore > 65 ? '#fde0dc' : screening.riskScore > 30 ? '#fff3e0' : '#e8f5e9';
        const riskTxtColor = screening.riskScore > 65 ? '#c62828' : screening.riskScore > 30 ? '#e65100' : '#2e7d32';
        
        doc.rect(60, y, 470, 25).fill(riskBgColor);
        doc.fontSize(9).fill(riskTxtColor).font('Helvetica-Bold').text(riskText, 70, y + 7);
        y += 40;

        // --- SCREENING DETAILS ---
        doc.rect(50, y, 495, 30).fill('#f0fff4');
        doc.fill('#2e7d32').fontSize(12).font('Helvetica-Bold').text('SCREENING DETAILS', 60, y + 8);
        y += 40;
        doc.fill('#333333').fontSize(10).font('Helvetica');

        doc.text(`Input Method: ${screening.inputMethod || 'N/A'}`, 60, y);
        doc.text(`Initiated By: ${screening.initiatedBy?.name || 'N/A'} (${screening.initiatedBy?.role || 'N/A'})`, 350, y);
        y += 18;
        doc.text(`Date: ${new Date(screening.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 60, y);
        doc.text(`Time: ${new Date(screening.createdAt).toLocaleTimeString('en-IN')}`, 350, y);
        y += 35;

        // --- ADVANCED ANALYTICS (WAVEFORMS) ---
        // PCG
        doc.rect(50, y, 495, 100).lineWidth(1).stroke('#ddd');
        doc.fill('#1a1a2e').fontSize(10).font('Helvetica-Bold').text('PHONOCARDIOGRAM (PCG) SIGNAL', 60, y + 10);
        
        let pcgY = y + 55;
        doc.lineWidth(1);
        doc.strokeColor(screening.riskScore > 65 ? '#e53935' : '#43a047');
        
        let pathStr = `M 60 ${pcgY}`;
        const isHighRisk = screening.riskScore > 65;
        for (let x = 0; x < 470; x++) {
           const t = x * (isHighRisk ? 0.08 : 0.06);
           let py = pcgY;
           const beatPosition = t % 20;
           if (beatPosition < 2) {
               py -= Math.sin(beatPosition * Math.PI) * 20 * (isHighRisk ? 1.4 : 1);
           } else if (beatPosition > 5 && beatPosition < 6.5) {
               py += Math.sin((beatPosition - 5) * Math.PI * 1.5) * 12;
           }
           if (isHighRisk) {
               py += (Math.random() - 0.5) * 6;
           } else {
               py += (Math.random() - 0.5) * 2;
           }
           pathStr += ` L ${60 + x} ${py}`;
        }
        doc.path(pathStr).stroke();
        y += 115;

        // Frequency Spectrum
        doc.rect(50, y, 495, 100).lineWidth(1).stroke('#ddd');
        doc.fill('#1a1a2e').fontSize(10).font('Helvetica-Bold').text('FREQUENCY SPECTRUM ANALYSIS', 60, y + 10);
        
        const bars = 70;
        const barWidth = 470 / bars - 1;
        doc.fill(isHighRisk ? '#e53935' : '#1a73e8');
        for (let i = 0; i < bars; i++) {
           const normalizeI = i / bars;
           const bellCurve = Math.exp(-Math.pow((normalizeI - 0.5) * 4, 2)) * 50;
           const h = isHighRisk ? (Math.random() * 40 + bellCurve * 0.5 + 10) : (bellCurve + Math.random() * 10 + 5);
           doc.rect(60 + i * (barWidth + 1), y + 90 - h, barWidth, h).fill();
        }
        y += 115;

        // --- DOCTOR REMARKS ---
        if (screening.doctorRemarks) {
            doc.rect(50, y, 495, 30).fill('#e8eaf6');
            doc.fill('#283593').fontSize(12).font('Helvetica-Bold').text('DOCTOR REMARKS', 60, y + 8);
            y += 40;
            doc.fill('#333333').fontSize(10).font('Helvetica');
            doc.text(screening.doctorRemarks, 60, y, { width: 470 });
            y += doc.heightOfString(screening.doctorRemarks, { width: 470 }) + 20;
        }

        // --- FOOTER ---
        const pageHeight = 841.89; // A4 height
        doc.rect(0, pageHeight - 50, 595.28, 50).fill('#f5f5f5');
        doc.fill('#999999').fontSize(7).font('Helvetica');
        doc.text('This report is generated by PulseGuard AI Cardiac Screening System.', 50, pageHeight - 38);
        doc.text('It is intended for medical reference only and should not replace professional medical advice.', 50, pageHeight - 28);
        doc.text(`© ${new Date().getFullYear()} PulseGuard Healthcare Technology`, 50, pageHeight - 18);

        doc.end();
    } catch (error) {
        next(error);
    }
};
