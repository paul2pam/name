import { useState, useCallback } from 'react';
import Camera from './components/Camera';
import HeartRate from './components/HeartRate';
import History from './components/History';
import { uploadVideo, pollForResults } from './services/presageApi';
import './App.css';

function App() {
  const [status, setStatus] = useState('idle'); // idle | recording | processing | result | error
  const [bpm, setBpm] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [measurements, setMeasurements] = useState([]);

  const handleRecordingComplete = useCallback(async (videoBlob) => {
    setStatus('processing');
    try {
      const uploadId = await uploadVideo(videoBlob);
      const result = await pollForResults(uploadId);

      const heartRate = result.heart_rate ?? result.pulse_rate ?? result.hr ?? 0;
      setBpm(Math.round(heartRate));
      setStatus('result');

      setMeasurements(prev => [
        {
          bpm: Math.round(heartRate),
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Measurement error:', err);
      setErrorMessage(err.message || String(err));
      setStatus('error');
    }
  }, []);

  const handleRecordingStart = useCallback(() => {
    setStatus('recording');
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">♥ HeartRate</div>
        <div className="nav-links">
          <span className="nav-status">
            Powered by <a href="https://presagetechnologies.com" target="_blank" rel="noreferrer">Presage</a>
          </span>
        </div>
      </nav>

      <main className="main-content">
        <div className="measurement-section">
          <Camera
            onRecordingComplete={handleRecordingComplete}
            onRecordingStart={handleRecordingStart}
            disabled={status === 'processing'}
          />
          <HeartRate bpm={bpm} status={status} errorMessage={errorMessage} />
        </div>

        <History measurements={measurements} />
      </main>
    </div>
  );
}

export default App;
