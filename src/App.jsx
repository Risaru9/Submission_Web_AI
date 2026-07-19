import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  Camera,
  Check,
  Clipboard,
  Gauge,
  Leaf,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { CameraPanel } from './components/CameraPanel.jsx';
import { FactPanel } from './components/FactPanel.jsx';
import { PredictionPanel } from './components/PredictionPanel.jsx';
import { useCamera } from './hooks/useCamera.js';
import { generateVegetableFact } from './services/funFactService.js';
import { createVisionModel } from './services/visionModel.js';
import { PERSONAS } from './utils/personas.js';

const DEFAULT_FPS = 3;
const CONFIDENCE_TRIGGER = 0.55;

export default function App() {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const frameTimerRef = useRef(null);
  const lastFactLabelRef = useRef('');

  const [fpsLimit, setFpsLimit] = useState(DEFAULT_FPS);
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [modelStatus, setModelStatus] = useState('Menunggu Model...');
  const [modelProgress, setModelProgress] = useState(0);
  const [backend, setBackend] = useState('Mendeteksi backend...');
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [fact, setFact] = useState('');
  const [factStatus, setFactStatus] = useState('Menunggu sayuran terdeteksi.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyState, setCopyState] = useState('idle');

  const { cameraStatus, cameraError, startCamera, stopCamera } = useCamera(videoRef);

  const selectedPersona = useMemo(
    () => PERSONAS.find((item) => item.id === persona) ?? PERSONAS[0],
    [persona]
  );

  useEffect(() => {
    let isMounted = true;

    async function initVision() {
      try {
        const detector = await createVisionModel((progress) => {
          if (!isMounted) return;
          const percent = Math.round(progress * 100);
          setModelProgress(Math.min(100, Math.max(1, percent)));
          setModelStatus(`Menunggu Model... ${percent}%`);
        });

        if (!isMounted) {
          detector.dispose();
          return;
        }

        detectorRef.current = detector;
        setBackend(detector.backend);
        setModelProgress(100);
        setModelStatus('Model siap mengenali sayuran.');
      } catch (error) {
        console.error(error);
        setModelStatus('Model gagal dimuat. Periksa console dan berkas model.');
      }
    }

    initVision();

    return () => {
      isMounted = false;
      detectorRef.current?.dispose();
    };
  }, []);

  const requestFact = useCallback(
    async (label) => {
      if (!label || lastFactLabelRef.current === `${label}-${persona}` || isGenerating) {
        return;
      }

      lastFactLabelRef.current = `${label}-${persona}`;
      setIsGenerating(true);
      setFactStatus('Si Otak sedang menulis fun fact...');
      setCopyState('idle');

      try {
        const text = await generateVegetableFact(label, selectedPersona, (progress) => {
          if (progress?.status) {
            setFactStatus(`Menyiapkan Generative AI: ${progress.status}`);
          }
        });
        setFact(text);
        setFactStatus('Fun fact siap dibaca.');
      } catch (error) {
        console.error(error);
        setFactStatus('Fun fact fallback ditampilkan karena model bahasa belum siap.');
        setFact(
          `${label} punya cerita menarik: sayuran ini sering dipakai di dapur karena mudah berpadu dengan banyak rasa, warna, dan tekstur.`
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, persona, selectedPersona]
  );

  const runPrediction = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;

    if (!detector || !video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return;
    }

    setIsPredicting(true);

    try {
      const result = await detector.predict(video);
      setPrediction(result);

      if (result.confidence >= CONFIDENCE_TRIGGER) {
        requestFact(result.label);
      }
    } catch (error) {
      console.error(error);
      setModelStatus('Prediksi gagal dijalankan.');
    } finally {
      setIsPredicting(false);
    }
  }, [requestFact]);

  useEffect(() => {
    window.clearInterval(frameTimerRef.current);

    if (cameraStatus !== 'active' || !detectorRef.current) {
      return undefined;
    }

    const interval = Math.max(250, Math.round(1000 / fpsLimit));
    frameTimerRef.current = window.setInterval(runPrediction, interval);

    return () => window.clearInterval(frameTimerRef.current);
  }, [cameraStatus, fpsLimit, runPrediction]);

  useEffect(() => {
    lastFactLabelRef.current = '';
    if (prediction?.label && prediction.confidence >= CONFIDENCE_TRIGGER) {
      requestFact(prediction.label);
    }
  }, [persona, prediction, requestFact]);

  const handleCopy = async () => {
    if (!fact) return;

    await navigator.clipboard.writeText(fact);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  const resetSession = () => {
    setPrediction(null);
    setFact('');
    setFactStatus('Menunggu sayuran terdeteksi.');
    lastFactLabelRef.current = '';
  };

  const isReady = modelProgress === 100 && cameraStatus === 'active';

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Root Fact App">
        <div className="brand-mark">
          <Leaf aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Computer Vision + Generative AI</p>
          <h1>Root Fact App</h1>
        </div>
        <div className="offline-badge">
          <WifiOff aria-hidden="true" />
          <span>PWA Ready</span>
        </div>
      </section>

      <section className="workspace">
        <CameraPanel
          cameraError={cameraError}
          cameraStatus={cameraStatus}
          isPredicting={isPredicting}
          isReady={isReady}
          onStart={startCamera}
          onStop={stopCamera}
          videoRef={videoRef}
        />

        <aside className="side-rail">
          <div className="status-strip">
            <div className="status-line">
              <LoaderCircle className={modelProgress < 100 ? 'spin' : ''} aria-hidden="true" />
              <div>
                <span>{modelStatus}</span>
                <progress value={modelProgress} max="100" aria-label="Progress model" />
              </div>
            </div>
            <div className="status-line">
              <Gauge aria-hidden="true" />
              <span>{backend}</span>
            </div>
          </div>

          <div className="control-row">
            <label htmlFor="fps-limit">FPS Limit</label>
            <input
              id="fps-limit"
              max="10"
              min="1"
              onChange={(event) => setFpsLimit(Number(event.target.value))}
              type="range"
              value={fpsLimit}
            />
            <output>{fpsLimit} FPS</output>
          </div>

          <div className="control-row">
            <label htmlFor="persona">Persona AI</label>
            <select
              id="persona"
              onChange={(event) => setPersona(event.target.value)}
              value={persona}
            >
              {PERSONAS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <PredictionPanel prediction={prediction} />

          <FactPanel
            copyIcon={copyState === 'copied' ? Check : Clipboard}
            fact={fact}
            isGenerating={isGenerating}
            onCopy={handleCopy}
            status={factStatus}
          />

          <div className="actions">
            <button className="ghost-button" onClick={resetSession} type="button">
              <RotateCcw aria-hidden="true" />
              <span>Reset</span>
            </button>
            <button
              className="primary-button"
              disabled={modelProgress < 100 || cameraStatus === 'active'}
              onClick={startCamera}
              type="button"
            >
              <Camera aria-hidden="true" />
              <span>Buka Kamera</span>
            </button>
            <button
              className="ghost-button"
              disabled={!prediction?.label}
              onClick={() => requestFact(prediction.label)}
              type="button"
            >
              <Brain aria-hidden="true" />
              <span>Fun Fact</span>
            </button>
          </div>

          <p className="hint">
            <Sparkles aria-hidden="true" />
            Gunakan pencahayaan terang dan latar sederhana agar prediksi lebih stabil.
          </p>
        </aside>
      </section>
    </main>
  );
}
