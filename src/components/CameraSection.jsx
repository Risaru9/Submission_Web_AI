import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, ScanLine } from 'lucide-react';
import { APP_CONFIG, TONE_CONFIG } from '../utils/config';

function CameraSection({
  isRunning,
  appState,
  onToggleCamera,
  onCapture,
  onToneChange,
  services,
  modelStatus,
  error,
  currentTone
}) {
  const [fps, setFps] = useState(APP_CONFIG.fpsLimit);
  const [cameraType, setCameraType] = useState('default');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (services.camera) {
      if (videoRef.current && !services.camera.video) {
        services.camera.setVideoElement(videoRef.current);
      }
      if (canvasRef.current && !services.camera.canvas) {
        services.camera.setCanvasElement(canvasRef.current);
      }
    }
  });

  useEffect(() => {
    if (services.camera) {
      services.camera.setFPS(3); // Tetap set FPS default jika dibutuhkan oleh CameraService
    }
  }, [services.camera]);

  const handleCameraChange = (newCameraType) => {
    setCameraType(newCameraType);
    if (services.camera && services.camera.isActive()) {
      services.camera.config.facingMode = newCameraType === 'front' ? 'user' : 'environment';
      services.camera.startCamera();
    }
  };


  const handleToneChange = (e) => {
    const newTone = e.target.value;
    if (onToneChange) {
      onToneChange(newTone);
    }
  };

  const isModelReady = modelStatus === 'Model AI Siap';
  const buttonDisabled = !isModelReady || appState === 'analyzing';

  let buttonAction = onToggleCamera;
  let IconComponent = Camera;
  let btnClass = 'capture-btn';
  let ariaLabel = 'Mulai Kamera';

  if (appState === 'result') {
    buttonAction = onToggleCamera;
    IconComponent = Camera;
    ariaLabel = 'Ulangi Kamera';
  } else if (isRunning) {
    buttonAction = onCapture;
    IconComponent = ScanLine;
    btnClass = 'capture-btn scanning';
    ariaLabel = 'Tangkap Gambar';
  }

  return (
    <section className="camera-section" aria-label="Camera Feed and Controls">
      <div className="camera-container">
        <div className="camera-wrapper">
          <video
            ref={videoRef}
            id="media-video"
            autoPlay
            muted
            playsInline
            className={isRunning ? '' : 'hidden'}
          />

          <canvas
            ref={canvasRef}
            id="media-canvas"
            className="hidden"
          />

          <div className={`camera-overlay ${isRunning ? 'active' : ''}`}>
            <div className="overlay-frame"></div>
          </div>

          {!isRunning && (
            <div className="camera-placeholder">
              <Camera size={48} />
              <p>Kamera tidak aktif</p>
              {error && (
                <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="camera-controls">
          <button
            id="btn-toggle"
            className={btnClass}
            onClick={buttonAction}
            disabled={buttonDisabled}
            aria-label={ariaLabel}
            style={{ opacity: buttonDisabled ? 0.6 : 1 }}
          >
            <IconComponent size={24} />
          </button>
        </div>

        <div className="settings-bar">
          <div className="setting-item">
            <Camera size={16} />
            <select
              id="camera-select"
              value={cameraType}
              onChange={(e) => handleCameraChange(e.target.value)}
              disabled={isRunning}
            >
              <option value="default">Belakang</option>
              <option value="front">Depan</option>
            </select>
          </div>


          <div className="setting-item tone-setting">
            <Mic size={16} />
            <select
              id="tone-select"
              value={currentTone || 'normal'}
              onChange={handleToneChange}
              disabled={isRunning}
            >
              {TONE_CONFIG.availableTones.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CameraSection;
