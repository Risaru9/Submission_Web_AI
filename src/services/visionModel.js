import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';

const MODEL_URL = '/model/model.json';
const METADATA_URL = '/model/metadata.json';

async function chooseBackend() {
  if (navigator.gpu) {
    try {
      await tf.setBackend('webgpu');
      await tf.ready();
      return 'WebGPU';
    } catch (error) {
      console.warn('WebGPU tidak tersedia, fallback ke WebGL.', error);
    }
  }

  await tf.setBackend('webgl');
  await tf.ready();
  return 'WebGL';
}

async function loadMetadata() {
  const response = await fetch(METADATA_URL);
  if (!response.ok) {
    throw new Error('metadata.json tidak dapat dimuat.');
  }

  return response.json();
}

export async function createVisionModel(onProgress) {
  onProgress?.(0.02);

  const backend = await chooseBackend();
  onProgress?.(0.15);

  const [metadata, model] = await Promise.all([
    loadMetadata(),
    tf.loadLayersModel(MODEL_URL, {
      onProgress(progress) {
        onProgress?.(0.15 + progress * 0.85);
      }
    })
  ]);

  const labels = metadata.labels;
  const imageSize = metadata.imageSize ?? 224;

  return {
    backend,
    labels,
    imageSize,
    async predict(source) {
      const predictionTensor = tf.tidy(() => {
        const pixels = tf.browser.fromPixels(source);
        const resized = tf.image.resizeBilinear(pixels, [imageSize, imageSize]);
        const normalized = resized
          .toFloat()
          .div(127.5)
          .sub(1)
          .expandDims(0);

        return model.predict(normalized);
      });

      try {
        const probabilities = await predictionTensor.data();
        const ranked = Array.from(probabilities)
          .map((confidence, index) => ({
            label: labels[index] ?? `Label ${index + 1}`,
            confidence
          }))
          .sort((a, b) => b.confidence - a.confidence);

        return ranked[0];
      } finally {
        predictionTensor.dispose();
      }
    },
    dispose() {
      model.dispose();
    }
  };
}
