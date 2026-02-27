export default function History({ measurements }) {
  if (measurements.length === 0) return null;

  return (
    <div className="history-container">
      <h2 className="history-title">Measurement History</h2>
      <div className="history-list">
        {measurements.map((m, i) => (
          <div className="history-item" key={i}>
            <div className="history-bpm">
              <span className="history-heart">♥</span>
              <span className="history-value">{m.bpm}</span>
              <span className="history-unit">BPM</span>
            </div>
            <div className="history-time">{m.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
