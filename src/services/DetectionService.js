import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';

const MODEL_URL = '/model/model.json';
const METADATA_URL = '/model/metadata.json';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = { imageSize: 224 };
    this.backend = 'Memilih backend...';
  }

  // TODO [Basic] Muat model dan metadata secara bersamaan, lalu simpan ke instance
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel(onProgress) {
    onProgress?.(5, 'Menunggu Model... 5%');

    if (navigator.gpu) {
      try {
        await tf.setBackend('webgpu');
        await tf.ready();
        this.backend = 'WebGPU';
      } catch (error) {
        console.warn('WebGPU gagal, fallback ke WebGL.', error);
      }
    }

    if (tf.getBackend() !== 'webgpu') {
      await tf.setBackend('webgl');
      await tf.ready();
      this.backend = 'WebGL';
    }

    onProgress?.(20, `Menunggu Model... 20% (${this.backend})`);

    const [metadata, model] = await Promise.all([
      fetch(METADATA_URL).then((response) => {
        if (!response.ok) throw new Error('metadata.json gagal dimuat');
        return response.json();
      }),
      tf.loadLayersModel(MODEL_URL, {
        onProgress: (progress) => {
          const percent = Math.round(20 + progress * 80);
          onProgress?.(percent, `Menunggu Model... ${percent}%`);
        },
      }),
    ]);

    this.model = model;
    this.labels = metadata.labels;
    this.config.imageSize = metadata.imageSize || 224;

    // TODO: WARM UP THE MODEL
    const dummyInput = tf.zeros([1, this.config.imageSize, this.config.imageSize, 3]);
    const warmupResult = this.model.predict(dummyInput);
    await warmupResult.data();
    warmupResult.dispose();
    dummyInput.dispose();

    onProgress?.(100, 'Model deteksi siap. Memuat Generative AI...');
    return this;
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  async predict(imageElement) {
    if (!this.isLoaded()) {
      throw new Error('Model deteksi belum dimuat');
    }

    const predictionTensor = tf.tidy(() => {
      const pixels = tf.browser.fromPixels(imageElement);
      const resized = tf.image.resizeBilinear(pixels, [
        this.config.imageSize,
        this.config.imageSize,
      ]);
      const normalized = resized
        .toFloat()
        .div(127.5)
        .sub(1)
        .expandDims(0);

      return this.model.predict(normalized);
    });

    try {
      const probabilities = await predictionTensor.data();
      const ranked = Array.from(probabilities)
        .map((score, index) => ({
          className: this.labels[index] || `Class ${index + 1}`,
          score,
          confidence: Math.round(score * 100),
          isValid: score >= 0.7,
        }))
        .sort((first, second) => second.score - first.score);

      return ranked[0];
    } finally {
      predictionTensor.dispose();
    }
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isLoaded() {
    return Boolean(this.model && this.labels.length);
  }

  dispose() {
    this.model?.dispose();
    this.model = null;
  }
}
