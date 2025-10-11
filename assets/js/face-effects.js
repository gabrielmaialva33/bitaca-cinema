/**
 * BitacaFaceEffects - MediaPipe Face Landmarker Integration
 * Adiciona efeitos faciais em tempo real usando MediaPipe
 * Compatível com GitHub Pages (client-side apenas)
 */

class BitacaFaceEffects {
  constructor() {
    this.faceLandmarker = null;
    this.isInitialized = false;
    this.isProcessing = false;
    this.canvas = null;
    this.canvasCtx = null;
    this.lastVideoTime = -1;
    this.effects = {
      landmarks: true,
      mesh: false,
      glasses: false,
      mask: false
    };
  }

  /**
   * Inicializa o MediaPipe Face Landmarker
   */
  async initialize() {
    if (this.isInitialized) return { success: true };

    try {
      // Carrega o FilesetResolver do MediaPipe
      const vision = await window.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Cria o FaceLandmarker
      this.faceLandmarker = await window.FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true
      });

      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error('[BitacaFaceEffects] Erro ao inicializar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Configura o canvas para renderizar efeitos
   */
  setupCanvas(video) {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvasCtx = this.canvas.getContext('2d');
    }

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;

    return this.canvas;
  }

  /**
   * Processa frame de vídeo e detecta landmarks faciais
   */
  async processVideoFrame(video, timestamp) {
    if (!this.isInitialized || !this.faceLandmarker) {
      return null;
    }

    // Evita processar o mesmo frame duas vezes
    if (timestamp === this.lastVideoTime) {
      return null;
    }

    this.lastVideoTime = timestamp;

    try {
      // Detecta faces no vídeo
      const results = await this.faceLandmarker.detectForVideo(video, timestamp);
      return results;
    } catch (error) {
      console.error('[BitacaFaceEffects] Erro ao processar frame:', error);
      return null;
    }
  }

  /**
   * Desenha landmarks faciais no canvas
   */
  drawLandmarks(results) {
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return;
    }

    const ctx = this.canvasCtx;
    const landmarks = results.faceLandmarks[0]; // Primeira face detectada

    // Desenha pontos dos landmarks
    if (this.effects.landmarks) {
      ctx.fillStyle = '#00ff00';
      for (const landmark of landmarks) {
        const x = landmark.x * this.canvas.width;
        const y = landmark.y * this.canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Desenha mesh facial (conecta landmarks)
    if (this.effects.mesh) {
      ctx.strokeStyle = '#00ff0066';
      ctx.lineWidth = 1;
      this.drawFaceMesh(landmarks);
    }
  }

  /**
   * Desenha conexões do mesh facial
   */
  drawFaceMesh(landmarks) {
    const ctx = this.canvasCtx;

    // MediaPipe Face Mesh connections (simplificado)
    // Contorno do rosto
    const faceOval = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ];

    for (let i = 0; i < faceOval.length - 1; i++) {
      const start = landmarks[faceOval[i]];
      const end = landmarks[faceOval[i + 1]];

      ctx.beginPath();
      ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
      ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
      ctx.stroke();
    }

    // Olhos
    const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133];
    const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263];

    [leftEye, rightEye].forEach(eye => {
      for (let i = 0; i < eye.length - 1; i++) {
        const start = landmarks[eye[i]];
        const end = landmarks[eye[i + 1]];

        ctx.beginPath();
        ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
        ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
        ctx.stroke();
      }
    });

    // Boca
    const mouth = [
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
      291, 375, 321, 405, 314, 17, 84, 181, 91, 146
    ];

    for (let i = 0; i < mouth.length - 1; i++) {
      const start = landmarks[mouth[i]];
      const end = landmarks[mouth[i + 1]];

      ctx.beginPath();
      ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
      ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
      ctx.stroke();
    }
  }

  /**
   * Renderiza frame com efeitos aplicados
   */
  renderFrame(video, results) {
    const ctx = this.canvasCtx;

    // Limpa canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Desenha vídeo original
    ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    // Aplica efeitos
    if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
      this.drawLandmarks(results);

      // Adiciona indicador de face detectada
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('✓ Face Detectada', 10, 30);

      // Mostra expressões faciais (blendshapes) se disponível
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const blendshapes = results.faceBlendshapes[0].categories;

        // Filtra expressões significativas (score > 0.3)
        const significantExpressions = blendshapes
          .filter(b => b.score > 0.3)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Inter, sans-serif';
        significantExpressions.forEach((expr, idx) => {
          ctx.fillText(
            `${expr.categoryName}: ${(expr.score * 100).toFixed(0)}%`,
            10,
            60 + idx * 25
          );
        });
      }
    } else {
      // Nenhuma face detectada
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('✗ Nenhuma face detectada', 10, 30);
    }

    return this.canvas;
  }

  /**
   * Toggle efeito específico
   */
  toggleEffect(effectName) {
    if (this.effects.hasOwnProperty(effectName)) {
      this.effects[effectName] = !this.effects[effectName];
      return this.effects[effectName];
    }
    return false;
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }

    this.isInitialized = false;
    this.isProcessing = false;
    this.lastVideoTime = -1;

    if (this.canvas) {
      this.canvasCtx = null;
      this.canvas = null;
    }
  }
}

// Exporta classe globalmente
window.BitacaFaceEffects = BitacaFaceEffects;
