export default function HeartRate({ bpm, status, errorMessage }) {
  const animationDuration = bpm > 0 ? 60 / bpm : 1;

  return (
    <div className="heartrate-container">
      <div className="heartrate-display">
        {status === 'idle' && (
          <>
            <div className="heart-icon">♥</div>
            <p className="heartrate-label">Ready to measure</p>
            <p className="heartrate-hint">Enable your camera and start a measurement</p>
          </>
        )}

        {status === 'recording' && (
          <>
            <div className="heart-icon recording">♥</div>
            <p className="heartrate-label">Recording...</p>
            <p className="heartrate-hint">Stay still and keep your face visible</p>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="heart-icon processing">♥</div>
            <p className="heartrate-label">Analyzing...</p>
            <p className="heartrate-hint">Processing video with Presage API</p>
          </>
        )}

        {status === 'result' && (
          <>
            <div
              className="heart-icon pulse"
              style={{ animationDuration: `${animationDuration}s` }}
            >
              ♥
            </div>
            <div className="bpm-value">{bpm}</div>
            <p className="bpm-unit">BPM</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="heart-icon error">♥</div>
            <p className="heartrate-label">Measurement failed</p>
            <p className="heartrate-hint error-detail">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}
