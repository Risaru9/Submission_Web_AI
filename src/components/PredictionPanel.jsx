import { Sprout } from 'lucide-react';

export function PredictionPanel({ prediction }) {
  const percent = prediction ? Math.round(prediction.confidence * 100) : 0;

  return (
    <section className="info-panel" aria-label="Hasil prediksi">
      <div className="panel-heading">
        <Sprout aria-hidden="true" />
        <h2>Si Mata</h2>
      </div>
      <div className="prediction-box">
        <span className="label">{prediction?.label ?? 'Belum ada sayuran'}</span>
        <span className="confidence">{percent}% yakin</span>
      </div>
      <progress value={percent} max="100" aria-label="Tingkat keyakinan prediksi" />
    </section>
  );
}
