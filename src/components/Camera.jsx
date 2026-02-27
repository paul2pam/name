import { useRef, useState, useCallback, useEffect } from 'react';

const RECORDING_DURATION = 10_000; // 20 seconds

export default function Camera({ onRecordingComplete, onRecordingStart, disabled }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    const chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      onRecordingComplete?.(blob);
      setRecording(false);
      setCountdown(0);
    };

    recorder.start();
    setRecording(true);
    setCountdown(RECORDING_DURATION / 1000);
    onRecordingStart?.();

    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, RECORDING_DURATION);
  }, [onRecordingComplete]);

  // Countdown timer
  useEffect(() => {
    if (!recording || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recording, countdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="camera-container">
      <div className="camera-viewport">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-video ${cameraActive ? 'active' : ''}`}
        />
        {!cameraActive && (
          <div className="camera-placeholder">
            <span className="camera-icon">📷</span>
            <p>Camera preview</p>
          </div>
        )}
        {recording && (
          <div className="recording-overlay">
            <div className="rec-indicator" />
            <span>{countdown}s remaining</span>
          </div>
        )}
      </div>

      {error && <p className="camera-error">{error}</p>}

      <div className="camera-controls">
        {!cameraActive ? (
          <button className="btn-primary" onClick={startCamera} disabled={disabled}>
            Enable Camera
          </button>
        ) : !recording ? (
          <>
            <button className="btn-primary" onClick={startRecording} disabled={disabled}>
              Start Measurement
            </button>
            <button className="btn-secondary" onClick={stopCamera}>
              Turn Off
            </button>
          </>
        ) : (
          <button className="btn-secondary" disabled>
            Recording...
          </button>
        )}
      </div>
    </div>
  );
}
