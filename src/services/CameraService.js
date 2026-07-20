export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = {
      fps: 3,
      cameras: [],
      facingMode: 'environment',
    };
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  // TODO [Basic] Tambahkan konfigurasi kamera untuk mendapatkan daftar perangkat input video
  // TODO [Basic] Dapatkan constraints kamera berdasarkan konfigurasi dan kamera yang dipilih
  async loadCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      throw new Error('Browser tidak mendukung MediaStream API');
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    this.config.cameras = devices.filter((device) => device.kind === 'videoinput');
    return this.config.cameras;
  }

  // TODO [Basic] Memulai kamera dengan perangkat yang dipilih dan menampilkan pada elemen video
  async startCamera(selectedCameraId) {
    this.stopCamera();

    const videoConstraint = selectedCameraId && selectedCameraId !== 'default'
      ? { deviceId: { exact: selectedCameraId } }
      : {
        facingMode: this.config.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraint,
      audio: false,
    });

    if (this.video) {
      this.video.srcObject = this.stream;
      await this.video.play();
    }

    return this.stream;
  }

  // TODO [Basic] Menghentikan siaran kamera dan membersihkan sumber daya
  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
  setFPS(fps) {
    this.config.fps = Number(fps) || 3;
  }

  // TODO [Basic] Periksa apakah kamera sedang aktif
  isActive() {
    return Boolean(this.stream?.active);
  }

  // TODO [Basic] Periksa apakah elemen video siap untuk digunakan
  isReady() {
    return Boolean(this.video && this.video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA);
  }

  // Draw frame to canvas to prevent video texture glitch during tf.browser.fromPixels
  getFrame() {
    if (this.video && this.canvas && this.isReady()) {
      const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      if (this.canvas.width !== this.video.videoWidth) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      }
      ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      return this.canvas;
    }
    return this.video;
  }
}
