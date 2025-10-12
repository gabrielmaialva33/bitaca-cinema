// ===============================================
// BITACA CINEMA - VIDEO RECORDER UI
// Interface controller para gravação de depoimentos
// ===============================================

(function () {
    'use strict';

    let recorder = null;
    let recordingStartTime = null;
    let timerInterval = null;
    const MAX_RECORDING_TIME = 60000; // 60 segundos

    // UI Elements
    let modal, video, previewVideo, btnStart, btnRecord, btnStop,
        btnDownload, btnRetry, btnUpload, timer, status, permissionError;

    // Backend API URL
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://api.abitaca.com.br';

    /**
     * Inicializa UI
     */
    function init() {
        // Check browser support
        if (!BitacaVideoRecorder.isSupported()) {
            alert('Seu navegador não suporta gravação de vídeo. Use Chrome, Firefox ou Edge.');
            return;
        }

        // Get UI elements
        modal = document.getElementById('recorder-modal');
        video = document.getElementById('camera-preview');
        previewVideo = document.getElementById('recorded-preview');
        btnStart = document.getElementById('btn-start-camera');
        btnRecord = document.getElementById('btn-record');
        btnStop = document.getElementById('btn-stop');
        btnDownload = document.getElementById('btn-download');
        btnRetry = document.getElementById('btn-retry');
        btnUpload = document.getElementById('btn-upload');
        timer = document.getElementById('recording-timer');
        status = document.getElementById('recording-status');
        permissionError = document.getElementById('permission-error');

        // Event listeners
        document.querySelectorAll('[data-action="open-recorder"]').forEach(btn => {
            btn.addEventListener('click', openRecorder);
        });

        document.querySelectorAll('[data-action="close-recorder"]').forEach(btn => {
            btn.addEventListener('click', closeRecorder);
        });

        if (btnStart) btnStart.addEventListener('click', startCamera);
        if (btnRecord) btnRecord.addEventListener('click', startRecording);
        if (btnStop) btnStop.addEventListener('click', stopRecording);
        if (btnDownload) btnDownload.addEventListener('click', downloadVideo);
        if (btnUpload) btnUpload.addEventListener('click', uploadVideo);
        if (btnRetry) btnRetry.addEventListener('click', retryRecording);

        // Close modal on overlay click
        modal?.querySelector('.recorder-modal__overlay')?.addEventListener('click', closeRecorder);

        console.log('🎥 Video Recorder UI initialized');
    }

    /**
     * Abre modal
     */
    async function openRecorder() {
        if (!modal) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Check permissions
        const permissions = await BitacaVideoRecorder.checkPermissions();
        console.log('📹 Permissions:', permissions);

        if (permissions.camera === 'denied' || permissions.microphone === 'denied') {
            showPermissionError();
        } else {
            // Auto-start camera
            setTimeout(startCamera, 500);
        }
    }

    /**
     * Fecha modal
     */
    function closeRecorder() {
        if (!modal) return;

        // Stop camera/recording
        if (recorder) {
            recorder.stopCamera();
            recorder = null;
        }

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Reset UI
        setState('initial');
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Clear video sources
        if (video) video.srcObject = null;
        if (previewVideo) previewVideo.src = '';
    }

    /**
     * Inicia câmera
     */
    async function startCamera() {
        setState('loading');
        setStatus('Iniciando câmera...');

        if (!recorder) {
            recorder = new BitacaVideoRecorder();
        }

        const result = await recorder.startCamera();

        if (result.success) {
            // Show live preview
            if (video) {
                video.srcObject = result.stream;
            }

            setState('ready');
            setStatus('Pronto para gravar');
            hidePermissionError();
        } else {
            setState('initial');
            setStatus('');
            showPermissionError(result.error);
        }
    }

    /**
     * Inicia gravação
     */
    function startRecording() {
        try {
            recorder.startRecording();
            recordingStartTime = Date.now();

            setState('recording');
            setStatus('Gravando...');
            startTimer();

            // Auto-stop após 60s
            setTimeout(() => {
                if (recorder && recorder.isRecording) {
                    stopRecording();
                }
            }, MAX_RECORDING_TIME);

        } catch (error) {
            console.error('Recording error:', error);
            alert('Erro ao iniciar gravação: ' + error.message);
        }
    }

    /**
     * Para gravação
     */
    async function stopRecording() {
        if (!recorder) return;

        setState('processing');
        setStatus('Finalizando...');
        stopTimer();

        const blob = await recorder.stopRecording();

        if (blob) {
            // Show preview
            if (previewVideo) {
                previewVideo.src = URL.createObjectURL(blob);
                previewVideo.load();
            }

            // Store blob for download
            window._recordedBlob = blob;

            setState('preview');
            setStatus('Gravação concluída!');
        } else {
            setState('ready');
            setStatus('Erro ao processar vídeo');
        }
    }

    /**
     * Baixa vídeo
     */
    function downloadVideo() {
        if (!window._recordedBlob) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `bitaca-depoimento-${timestamp}.webm`;

        recorder.downloadRecording(window._recordedBlob, filename);
        setStatus('✅ Vídeo baixado!');
    }

    /**
     * Upload vídeo para Cloudflare R2
     */
    async function uploadVideo() {
        if (!window._recordedBlob) {
            alert('Nenhum vídeo gravado para fazer upload.');
            return;
        }

        // Disable buttons during upload
        if (btnUpload) btnUpload.disabled = true;
        if (btnDownload) btnDownload.disabled = true;
        if (btnRetry) btnRetry.disabled = true;

        setStatus('Preparando upload...');

        try {
            // Step 1: Get presigned URL from backend
            setStatus('Conectando ao servidor...');

            const presignedResponse = await fetch(`${API_URL}/api/upload/presigned-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_extension: 'webm',
                    content_type: 'video/webm',
                    metadata: {
                        duration: Math.floor((Date.now() - recordingStartTime) / 1000),
                        user_agent: navigator.userAgent
                    }
                })
            });

            if (!presignedResponse.ok) {
                throw new Error(`Falha ao obter URL de upload: ${presignedResponse.status}`);
            }

            const uploadData = await presignedResponse.json();
            console.log('Upload data:', uploadData);

            // Step 2: Upload to R2 using presigned URL
            setStatus('Enviando vídeo... 0%');

            const formData = new FormData();

            // Add all presigned fields
            Object.keys(uploadData.fields).forEach(key => {
                formData.append(key, uploadData.fields[key]);
            });

            // Add the video file
            formData.append('file', window._recordedBlob, 'depoimento.webm');

            // Upload with progress tracking
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setStatus(`Enviando vídeo... ${percentComplete}%`);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 204 || xhr.status === 200) {
                    setStatus('✅ Vídeo salvo na nuvem!');
                    console.log('Video uploaded successfully:', uploadData.public_url);

                    // Show success message
                    setTimeout(() => {
                        alert(`Vídeo salvo com sucesso!\n\nVocê pode acessá-lo em:\n${uploadData.public_url}`);

                        // Close modal after successful upload
                        setTimeout(closeRecorder, 2000);
                    }, 500);
                } else {
                    throw new Error(`Upload falhou: ${xhr.status} ${xhr.statusText}`);
                }
            });

            xhr.addEventListener('error', () => {
                throw new Error('Erro de rede durante o upload');
            });

            xhr.open('POST', uploadData.upload_url);
            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            setStatus('❌ Erro no upload');
            alert(`Erro ao fazer upload do vídeo:\n${error.message}\n\nTente novamente ou baixe o vídeo localmente.`);

            // Re-enable buttons
            if (btnUpload) btnUpload.disabled = false;
            if (btnDownload) btnDownload.disabled = false;
            if (btnRetry) btnRetry.disabled = false;
        }
    }

    /**
     * Tenta gravar novamente
     */
    function retryRecording() {
        // Clear preview
        if (previewVideo) {
            URL.revokeObjectURL(previewVideo.src);
            previewVideo.src = '';
        }

        window._recordedBlob = null;

        setState('ready');
        setStatus('Pronto para gravar');
    }

    /**
     * Timer de gravação
     */
    function startTimer() {
        let elapsed = 0;

        timerInterval = setInterval(() => {
            elapsed = Date.now() - recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;

            if (timer) {
                timer.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            // Pulse animation
            if (timer) {
                timer.style.transform = elapsed % 1000 < 500 ? 'scale(1.1)' : 'scale(1)';
            }
        }, 100);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * Gerencia estados da UI
     */
    function setState(state) {
        const states = ['initial', 'loading', 'ready', 'recording', 'processing', 'preview'];

        modal?.querySelectorAll('[data-state]').forEach(el => {
            el.style.display = 'none';
        });

        modal?.querySelectorAll(`[data-state="${state}"]`).forEach(el => {
            el.style.display = el.dataset.display || 'block';
        });

        // Update buttons
        if (btnStart) btnStart.disabled = state !== 'initial';
        if (btnRecord) btnRecord.disabled = state !== 'ready';
        if (btnStop) btnStop.disabled = state !== 'recording';
        if (btnDownload) btnDownload.disabled = state !== 'preview';
        if (btnUpload) btnUpload.disabled = state !== 'preview';
        if (btnRetry) btnRetry.disabled = state !== 'preview';
    }

    /**
     * Atualiza status
     */
    function setStatus(text) {
        if (status) {
            status.textContent = text;
        }
    }

    /**
     * Mostra erro de permissão
     */
    function showPermissionError(message) {
        if (permissionError) {
            permissionError.style.display = 'block';
            if (message) {
                permissionError.querySelector('p').textContent = message;
            }
        }
    }

    function hidePermissionError() {
        if (permissionError) {
            permissionError.style.display = 'none';
        }
    }

    /**
     * Initialize on DOM ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
