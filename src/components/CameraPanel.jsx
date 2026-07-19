import { Camera, Pause, ScanLine } from 'lucide-react';

export function CameraPanel({
  cameraError,
  cameraStatus,
  isPredicting,
  isReady,
  onStart,
  onStop,
  videoRef
}) {
  return (
    <section className="camera-panel" aria-label="Area kamera">
      <div className="video-frame">
        <video autoPlay muted playsInline ref={videoRef} />
        <div className="scan-overlay" aria-hidden="true">
          <ScanLine />
        </div>
        {!isReady && (
          <div className="camera-placeholder">
            <Camera aria-hidden="true" />
            <span>
              {cameraStatus === 'idle'
                ? 'Aktifkan kamera untuk mulai mengenali sayuran.'
                : 'Menyiapkan kamera dan model...'}
            </span>
          </div>
        )}
      </div>

      <div className="camera-toolbar">
        <span className={`pill ${cameraStatus === 'active' ? 'active' : ''}`}>
          {cameraStatus === 'active' ? 'Kamera aktif' : 'Kamera belum aktif'}
        </span>
        <span className={`pill ${isPredicting ? 'active' : ''}`}>
          {isPredicting ? 'Menganalisis frame' : 'Menunggu frame'}
        </span>
        {cameraStatus === 'active' ? (
          <button className="ghost-button" onClick={onStop} type="button">
            <Pause aria-hidden="true" />
            <span>Jeda</span>
          </button>
        ) : (
          <button className="primary-button" onClick={onStart} type="button">
            <Camera aria-hidden="true" />
            <span>Mulai</span>
          </button>
        )}
      </div>

      {cameraError && <p className="error-text">{cameraError}</p>}
    </section>
  );
}
