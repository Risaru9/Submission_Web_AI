import { LoaderCircle, Sparkles } from 'lucide-react';

export function FactPanel({ copyIcon: CopyIcon, fact, isGenerating, onCopy, status }) {
  return (
    <section className="info-panel fact-panel" aria-label="Fun fact AI">
      <div className="panel-heading">
        <Sparkles aria-hidden="true" />
        <h2>Si Otak</h2>
        <button
          aria-label="Salin fun fact"
          className="icon-button"
          disabled={!fact}
          onClick={onCopy}
          title="Salin fun fact"
          type="button"
        >
          <CopyIcon aria-hidden="true" />
        </button>
      </div>
      <p className="fact-status">
        {isGenerating && <LoaderCircle className="spin" aria-hidden="true" />}
        {status}
      </p>
      <p className="fact-text">
        {fact || 'Fun fact akan muncul otomatis setelah sayuran terdeteksi.'}
      </p>
    </section>
  );
}
