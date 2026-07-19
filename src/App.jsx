import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG, TONE_CONFIG, isValidDetection } from './utils/config';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastDetectedLabelRef = useRef('');
  const isGeneratingFactRef = useRef(false);
  const [currentTone, setCurrentTone] = useState(TONE_CONFIG.defaultTone);

  // TODO [Basic] Inisialisasi layanan deteksi, kamera, dan generator fakta saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;

    async function initializeServices() {
      const detector = new DetectionService();
      const camera = new CameraService();
      const generator = new RootFactsService();

      try {
        await Promise.all([
          detector.loadModel((_percent, status) => {
            if (isMounted) actions.setModelStatus(status);
          }),
          camera.loadCameras(),
        ]);

        if (!isMounted) return;

        actions.setServices({ detector, camera, generator });
        actions.setModelStatus('Model AI Siap');

        generator.loadModel().catch((error) => {
          console.warn('Generator fakta belum siap, fallback akan digunakan.', error);
        });
      } catch (error) {
        console.error(error);
        actions.setError('Gagal memuat model atau kamera. Periksa izin browser dan koneksi.');
        actions.setModelStatus('Model AI Gagal');
      }
    }

    initializeServices();

    return () => {
      isMounted = false;
    };
  }, [actions]);

  // TODO [Basic] Bersihkan sumber daya saat komponen ditinggalkan
  useEffect(() => () => {
    window.clearTimeout(detectionCleanupRef.current);
    state.services.camera?.stopCamera();
    state.services.detector?.dispose();
  }, [state.services.camera, state.services.detector]);

  // TODO [Basic] Fungsi untuk memulai loop deteksi
  const startDetectionLoop = useCallback(() => {
    const { camera, detector, generator } = state.services;

    const detectFrame = async () => {
      if (!isRunningRef.current || !camera?.isReady() || !detector?.isLoaded()) {
        detectionCleanupRef.current = window.setTimeout(detectFrame, APP_CONFIG.detectionRetryInterval);
        return;
      }

      actions.setAppState('analyzing');

      try {
        const result = await detector.predict(camera.video);
        actions.setDetectionResult(result);

        if (isValidDetection(result) && !isGeneratingFactRef.current) {
          const detectionKey = `${result.className}-${currentTone}`;
          actions.setAppState('result');

          if (lastDetectedLabelRef.current !== detectionKey) {
            lastDetectedLabelRef.current = detectionKey;
            isGeneratingFactRef.current = true;
            actions.setFunFactData(null);

            try {
              generator?.setTone(currentTone);
              const fact = await generator?.generateFacts(result.className);
              actions.setFunFactData(fact);
            } catch (error) {
              console.error(error);
              actions.setFunFactData('error');
            } finally {
              isGeneratingFactRef.current = false;
            }
          }
        }
      } catch (error) {
        console.error(error);
        actions.setError('Prediksi gagal dijalankan.');
      } finally {
        const fps = camera?.config?.fps || APP_CONFIG.fpsLimit;
        const delay = Math.max(250, Math.round(1000 / fps));
        if (isRunningRef.current) {
          detectionCleanupRef.current = window.setTimeout(detectFrame, delay);
        }
      }
    };

    detectFrame();
  }, [actions, currentTone, state.services]);

  // TODO [Basic] Fungsi untuk memulai dan menghentikan kamera
  const handleToggleCamera = useCallback(async () => {
    const { camera, detector } = state.services;

    if (!camera || !detector?.isLoaded()) {
      actions.setError('Model atau kamera belum siap.');
      return;
    }

    if (isRunningRef.current) {
      isRunningRef.current = false;
      window.clearTimeout(detectionCleanupRef.current);
      camera.stopCamera();
      actions.setRunning(false);
      actions.resetResults();
      return;
    }

    try {
      await camera.startCamera();
      isRunningRef.current = true;
      lastDetectedLabelRef.current = '';
      actions.setRunning(true);
      actions.setAppState('analyzing');
      startDetectionLoop();
    } catch (error) {
      console.error(error);
      actions.setError('Izin kamera ditolak atau kamera tidak tersedia.');
    }
  }, [actions, startDetectionLoop, state.services]);

  // TODO [Advance] Fungsi untuk mengubah nada fakta yang dihasilkan
  const handleToneChange = useCallback((newTone) => {
    setCurrentTone(newTone);
    state.services.generator?.setTone(newTone);
    lastDetectedLabelRef.current = '';

    if (state.detectionResult && isValidDetection(state.detectionResult)) {
      actions.setFunFactData(null);
    }
  }, [actions, state.detectionResult, state.services.generator]);

  // TODO [Skilled] Fungsi untuk menyalin fakta ke clipboard
  const handleCopyFact = useCallback(async () => {
    if (state.funFactData && state.funFactData !== 'error') {
      await navigator.clipboard.writeText(state.funFactData);
    }
  }, [state.funFactData]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
