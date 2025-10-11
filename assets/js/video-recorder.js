// ===============================================
// BITACA CINEMA - VIDEO RECORDER
// MediaStream API para gravar depoimentos
// ===============================================

class BitacaVideoRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
    }

    /**
     * Verifica suporte do navegador
     */
    static isSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            typeof MediaRecorder !== 'undefined'
        );
    }

    /**
     * Solicita permissões
     */
    static async checkPermissions() {
        if (!navigator.permissions) {
            return {camera: 'prompt', microphone: 'prompt'};
        }

        try {
            const [camera, microphone] = await Promise.all([
                navigator.permissions.query({name: 'camera'}),
                navigator.permissions.query({name: 'microphone'})
            ]);

            return {
                camera: camera.state,
                microphone: microphone.state
            };
        } catch (error) {
            console.warn('Permissions API not supported:', error);
            return {camera: 'prompt', microphone: 'prompt'};
        }
    }

    /**
     * Inicializa câmera e microfone
     */
    async startCamera() {
        try {
            const constraints = {
                video: {
                    width: {ideal: 1280},
                    height: {ideal: 720},
                    facingMode: 'user',
                    frameRate: {ideal: 30}
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            return {
                success: true,
                stream: this.stream
            };
        } catch (error) {
            console.error('❌ Camera access error:', error);

            let message = 'Erro ao acessar câmera/microfone.';

            if (error.name === 'NotAllowedError') {
                message = 'Permissão negada. Por favor, permita o acesso à câmera e microfone.';
            } else if (error.name === 'NotFoundError') {
                message = 'Nenhuma câmera ou microfone encontrado.';
            } else if (error.name === 'NotReadableError') {
                message = 'Câmera/microfone já está em uso por outro aplicativo.';
            }

            return {
                success: false,
                error: message
            };
        }
    }

    /**
     * Para stream da câmera
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * Inicia gravação
     */
    startRecording() {
        if (!this.stream) {
            throw new Error('Camera not initialized');
        }

        this.recordedChunks = [];

        const options = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        };

        // Fallback para outros codecs se VP9 não estiver disponível
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }

        this.mediaRecorder = new MediaRecorder(this.stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.start(100); // Coleta dados a cada 100ms
        this.isRecording = true;

        console.log('🎥 Recording started');
    }

    /**
     * Para gravação
     */
    stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, {
                    type: 'video/webm'
                });

                this.isRecording = false;
                console.log('✅ Recording stopped');

                resolve(blob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Baixa vídeo gravado
     */
    downloadRecording(blob, filename = 'bitaca-depoimento.webm') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Video downloaded:', filename);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.BitacaVideoRecorder = BitacaVideoRecorder;
}
