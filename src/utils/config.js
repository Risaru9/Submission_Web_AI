export const APP_CONFIG = {
  detectionConfidenceThreshold: 70,
  analyzingDelay: 2000,
  factsGenerationDelay: 2000,
  detectionRetryInterval: 100,
  fpsLimit: 3,
};

export const TONE_CONFIG = {
  availableTones: [
    { value: 'normal', label: 'Normal', prompt: 'neutral, clear, helpful, and informative' },
    { value: 'funny', label: 'Lucu', prompt: 'playful and lightly funny' },
    { value: 'history', label: 'Sejarah', prompt: 'historical and curious with a tiny cultural note' },
    { value: 'nutrition', label: 'Gizi', prompt: 'practical and nutrition-focused without medical claims' },
  ],
  defaultTone: 'normal'
};

export const isValidDetection = (result) => {
  const { detectionConfidenceThreshold } = APP_CONFIG;
  return result && result.isValid && result.confidence >= detectionConfidenceThreshold;
};
