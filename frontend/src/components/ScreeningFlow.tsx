import { useState, useCallback, useRef, useEffect } from 'react';
import HeartbeatWaveform from '@/components/HeartbeatWaveform';
import ConfirmDialog from '@/components/ConfirmDialog';
import SeverityBadge from '@/components/SeverityBadge';
import RiskGauge from '@/components/charts/RiskGauge';
import { screeningService } from '@/services/screeningService';
import { Mic, Upload, Square, FileAudio, Loader2, CheckCircle, X, ArrowLeft, Stethoscope, Download, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'select' | 'record' | 'upload';
type Step = 'idle' | 'recording' | 'preview' | 'analyzing' | 'done';

interface ScreeningFlowProps {
  patientId: string;
  patientName: string;
  onComplete: (result: any) => void;
  onClose: () => void;
  overlay?: boolean;
}

export default function ScreeningFlow({ patientId, patientName, onComplete, onClose, overlay = false }: ScreeningFlowProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [step, setStep] = useState<Step>('idle');
  const [timer, setTimer] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Current stepper step (1-3)
  const currentStep = step === 'idle' ? (mode === 'select' ? 1 : 2)
    : step === 'recording' || step === 'preview' ? 2
    : step === 'analyzing' ? 3
    : 3;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use webm for broad browser compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        setStep('preview');
        // Stop mic
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(250); // collect chunks every 250ms
      setStep('recording');
      setTimer(0);

      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setTimer(elapsed);
      }, 200);

    } catch (err: any) {
      console.error('Microphone access error:', err);
      setError('Microphone access denied. Please allow microphone permissions and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const runAnalysis = async (fileData: Blob | File, inputMethod: string) => {
    setStep('analyzing');
    setError(null);
    try {
      const formData = new FormData();
      // Determine filename extension
      const ext = fileData instanceof File ? fileData.name : 'recording.webm';
      formData.append('audio', fileData, ext);
      formData.append('patientId', patientId);
      formData.append('inputMethod', inputMethod);

      const pred = await screeningService.submitScreening(formData);
      const data = pred.result || pred.data || pred;
      setResult(data);
      setStep('done');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
      setStep('preview');
    }
  };

  const handleDone = () => {
    if (result) onComplete(result);
  };

  const handleClose = () => {
    if (step === 'recording' || step === 'analyzing') {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    if (step === 'recording') stopRecording();
    setConfirmClose(false);
    onClose();
  };

  const resetFlow = () => {
    setStep('idle');
    setMode('select');
    setRecordedBlob(null);
    setUploadedFile(null);
    setError(null);
    setResult(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
  };

  // Stepper component
  const Stepper = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[
        { num: 1, label: 'Method' },
        { num: 2, label: mode === 'record' ? 'Record' : 'Upload' },
        { num: 3, label: 'Result' },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <motion.div
            animate={{ scale: currentStep === s.num ? 1.1 : 1 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              currentStep > s.num ? 'bg-success text-success-foreground' :
              currentStep === s.num ? 'gradient-primary text-primary-foreground shadow-lg shadow-primary/30' :
              'bg-muted text-muted-foreground'
            }`}
          >
            {currentStep > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
          </motion.div>
          <span className={`text-[10px] font-medium hidden sm:block ${currentStep >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
            {s.label}
          </span>
          {i < 2 && <div className={`w-8 h-0.5 rounded-full transition-colors ${currentStep > s.num ? 'bg-success' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );

  const content = (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">New Screening</h3>
            <p className="text-xs text-muted-foreground">Patient: {patientName}</p>
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Stepper />

      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-critical/10 border border-critical/20 text-sm text-critical"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Mode Selection */}
        {mode === 'select' && step === 'idle' && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <p className="text-sm text-muted-foreground mb-4">Choose how to provide the heart sound sample</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setMode('record')}
                className="p-5 rounded-xl border-2 border-transparent bg-muted/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm font-semibold text-foreground">Record Live</div>
                <div className="text-[10px] text-muted-foreground mt-1">Capture via microphone</div>
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setMode('upload')}
                className="p-5 rounded-xl border-2 border-transparent bg-muted/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                  <Upload className="h-6 w-6 text-accent" />
                </div>
                <div className="text-sm font-semibold text-foreground">Upload File</div>
                <div className="text-[10px] text-muted-foreground mt-1">Upload an audio file</div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Record - Ready */}
        {mode === 'record' && step === 'idle' && (
          <motion.div key="record-idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <button onClick={() => setMode('select')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <div className="h-28 rounded-xl overflow-hidden border border-border bg-muted/10">
              <HeartbeatWaveform isAnimating={false} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Place the stethoscope on the patient's chest and press start</p>
            <Button onClick={startRecording} className="w-full gradient-primary text-primary-foreground border-0 h-11">
              <Mic className="h-4 w-4 mr-2" /> Start Recording
            </Button>
          </motion.div>
        )}

        {/* Step 2: Recording in progress */}
        {step === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="h-28 rounded-xl overflow-hidden border border-primary/20 bg-muted/10">
              <HeartbeatWaveform isAnimating={true} />
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-critical animate-pulse" />
              <span className="text-sm font-mono text-foreground">{formatTime(timer)}</span>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">Recording... Press stop when ready (min 3 seconds)</p>
            <Button onClick={stopRecording} variant="destructive" className="w-full h-11" disabled={timer < 3}>
              <Square className="h-4 w-4 mr-2" /> Stop Recording
            </Button>
          </motion.div>
        )}

        {/* Step 2: Preview before submit */}
        {step === 'preview' && recordedBlob && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <button onClick={resetFlow} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Start Over
            </button>
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Recording Complete</div>
                  <div className="text-[10px] text-muted-foreground">{formatTime(timer)} captured • {(recordedBlob.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              {audioPreviewUrl && (
                <audio controls src={audioPreviewUrl} className="w-full h-10 rounded-lg" />
              )}
            </div>
            <Button onClick={() => runAnalysis(recordedBlob, 'record')} className="w-full gradient-primary text-primary-foreground border-0 h-11">
              <Stethoscope className="h-4 w-4 mr-2" /> Analyze Recording
            </Button>
          </motion.div>
        )}

        {/* Step 2: Upload Mode */}
        {mode === 'upload' && step === 'idle' && (
          <motion.div key="upload-idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <button onClick={() => setMode('select')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            {!uploadedFile ? (
              <label className="block border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary/40 transition-colors text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Click to select an audio file</div>
                <div className="text-[10px] text-muted-foreground mt-1">.wav, .webm, .ogg, .mp3, .m4a</div>
                <input type="file" accept=".wav,.webm,.ogg,.mp3,.m4a,audio/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setUploadedFile(file); }} />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                  <FileAudio className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{uploadedFile.name}</span>
                  <span className="text-[10px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Button onClick={() => runAnalysis(uploadedFile, 'upload')} className="w-full gradient-primary text-primary-foreground border-0 h-11">
                  <Stethoscope className="h-4 w-4 mr-2" /> Analyze File
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Analyzing */}
        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">Analyzing Heart Sound</div>
              <div className="text-xs text-muted-foreground mt-1">AI model processing audio data...</div>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 'done' && result && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">Screening Complete</span>
            </div>

            <div className="flex justify-center">
              <RiskGauge score={result.riskScore} size={140} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Condition</div>
                <div className="text-sm font-bold text-foreground mt-1">{result.condition}</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Severity</div>
                <div className="mt-1"><SeverityBadge severity={result.severity} /></div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</div>
                <div className={`text-lg font-bold mt-1 ${result.riskScore > 65 ? 'text-critical' : result.riskScore > 30 ? 'text-warning' : 'text-success'}`}>{result.riskScore}</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</div>
                <div className="text-lg font-bold text-primary mt-1">{result.confidence}%</div>
              </div>
            </div>

            {/* Download Report */}
            <Button onClick={async () => {
              try {
                const blob = await screeningService.downloadReport(result._id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `PulseGuard_Report_${result._id}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch { /* ignore if report fails */ }
            }} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 h-10">
              <Download className="h-4 w-4 mr-2" /> Download PDF Report
            </Button>

            <Button onClick={handleDone} className="w-full gradient-primary text-primary-foreground border-0 h-11">
              Save & Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Close */}
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Cancel Screening?"
        description="The screening is still in progress. Are you sure you want to cancel?"
        confirmLabel="Yes, Cancel"
        variant="destructive"
        onConfirm={handleForceClose}
      />
    </div>
  );

  if (overlay) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card w-full max-w-md p-6">
          {content}
        </motion.div>
      </motion.div>
    );
  }

  return <div className="glass-card p-6">{content}</div>;
}
