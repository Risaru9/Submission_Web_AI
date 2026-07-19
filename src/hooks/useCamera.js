import { useCallback, useEffect, useRef, useState } from 'react';

export function useCamera(videoRef) {
  const streamRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus('idle');
  }, [videoRef]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setCameraStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus('active');
    } catch (error) {
      console.error(error);
      setCameraStatus('idle');
      setCameraError('Izin kamera ditolak atau kamera tidak tersedia.');
    }
  }, [videoRef]);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    cameraStatus,
    cameraError,
    startCamera,
    stopCamera
  };
}
