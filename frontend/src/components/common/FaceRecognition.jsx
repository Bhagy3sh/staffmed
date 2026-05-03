import { useState, useRef, useEffect } from 'react';

const FaceScanIcon = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 220 220" className="w-40 h-40" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,65 L20,20 L65,20" />
    <path d="M155,20 L200,20 L200,65" />
    <path d="M20,155 L20,200 L65,200" />
    <path d="M155,200 L200,200 L200,155" />
    <line x1="65" y1="20" x2="155" y2="20" strokeDasharray="9,5" />
    <line x1="65" y1="200" x2="155" y2="200" strokeDasharray="9,5" />
    <line x1="20" y1="65" x2="20" y2="155" strokeDasharray="9,5" />
    <line x1="200" y1="65" x2="200" y2="155" strokeDasharray="9,5" />
    <circle cx="110" cy="93" r="30" />
    <path d="M58,192 Q58,148 110,140 Q162,148 162,192" />
    <line x1="36" y1="98" x2="52" y2="98" />
    <line x1="168" y1="98" x2="184" y2="98" />
  </svg>
);

export default function FaceRecognition({ role = 'patient' }) {
  const [phase, setPhase] = useState('idle'); // idle | requesting | scanning | success | error
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    clearInterval(intervalRef.current);
  };

  useEffect(() => () => stopCamera(), []);

  const startScan = async () => {
    setPhase('requesting');
    setScanProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setPhase('scanning');

      // Animate a progress bar — no frames are captured or stored
      let progress = 0;
      intervalRef.current = setInterval(() => {
        progress += 2;
        setScanProgress(progress);
        if (progress >= 100) {
          clearInterval(intervalRef.current);
          stopCamera();
          setPhase('success');
        }
      }, 60);
    } catch {
      setPhase('error');
    }
  };

  const reset = () => {
    stopCamera();
    setPhase('idle');
    setScanProgress(0);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Camera / scan display */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center"
        style={{ width: 280, height: 220 }}>

        {/* Live camera feed — displayed only, never captured */}
        <video ref={videoRef} autoPlay playsInline muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity
            ${phase === 'scanning' ? 'opacity-100' : 'opacity-0'}`} />

        {/* Face scan frame overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-colors
          ${phase === 'success' ? 'bg-green-500/10' : 'bg-black/10'}`}>
          <FaceScanIcon color={phase === 'success' ? '#22c55e' : '#ffffff'} />
        </div>

        {/* Scanning progress bar */}
        {phase === 'scanning' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full transition-all" style={{ width: `${scanProgress}%`, backgroundColor: '#1a2744' }} />
          </div>
        )}

        {/* Requesting overlay */}
        {phase === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
            <p className="text-white text-sm font-semibold">Requesting camera…</p>
          </div>
        )}

        {/* Success overlay */}
        {phase === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-green-500/20 pb-4">
            <div className="bg-green-500 rounded-full px-4 py-1.5 text-white text-xs font-bold shadow">
              ✓ Identity Verified
            </div>
          </div>
        )}

        {/* Error overlay */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 gap-2">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 text-xs font-semibold text-center px-4">Camera access denied.<br />Please allow camera permissions.</p>
          </div>
        )}
      </div>

      {/* Instructions / status */}
      <div className="text-center space-y-1 px-4">
        {phase === 'idle' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {role === 'nurse'
                ? "Verify the patient's identity before their appointment."
                : 'Verify your identity to continue.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Camera is used for verification only — nothing is stored.</p>
          </>
        )}
        {phase === 'scanning' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Scanning… {scanProgress}%</p>
        )}
        {phase === 'success' && (
          <p className="text-sm text-green-600 font-bold">Identity verified successfully!</p>
        )}
        {phase === 'error' && (
          <p className="text-sm text-red-500">Could not access camera. Please check browser permissions.</p>
        )}
      </div>

      {/* Actions */}
      {phase === 'idle' && (
        <button onClick={startScan}
          className="px-7 py-2.5 rounded-full text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1a2744' }}>
          Verify Identity
        </button>
      )}
      {phase === 'success' && (
        <button onClick={reset}
          className="px-7 py-2.5 rounded-full text-sm font-bold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
          Verify Again
        </button>
      )}
      {phase === 'error' && (
        <button onClick={reset}
          className="px-7 py-2.5 rounded-full text-sm font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}
