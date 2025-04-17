document.addEventListener('DOMContentLoaded', () => {
    // Initialize log controls
    const clearLogsBtn = document.getElementById('clearLogs');
    const exportLogsBtn = document.getElementById('exportLogs');
    
    clearLogsBtn.addEventListener('click', () => {
        logConsole.innerHTML = '';
        addLog('Logs cleared', 'system');
    });
    
    exportLogsBtn.addEventListener('click', () => {
        const logs = Array.from(logConsole.children)
            .map(entry => entry.textContent)
            .join('\n');
        
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auradetect-logs-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog('Logs exported', 'system');
    });

    const video = document.getElementById('webcam');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    const logConsole = document.getElementById('logConsole');
    const startWebcamBtn = document.getElementById('startWebcam');
    const imageUpload = document.getElementById('imageUpload');
    const videoUpload = document.getElementById('videoUpload');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const videoContainer = document.querySelector('.video-container');

    let isWebcamActive = false;
    let streamInterval = null;
    let lastFrame = null;

    // Set initial canvas size
    canvas.width = 800;
    canvas.height = 450;

    // Initialize canvas size
    function stopWebcam() {
        if (!isWebcamActive) return;
        
        clearInterval(streamInterval);
        streamInterval = null;
        
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        
        isWebcamActive = false;
        video.style.display = 'none';
    }
    
    function showPlaceholder() {
        videoContainer.classList.remove('has-content');
        canvas.style.display = 'none';
        video.style.display = 'none';
    }

    function hidePlaceholder() {
        videoContainer.classList.add('has-content');
        canvas.style.display = 'block';
    }


    // Add log entry to console
    function addLog(message, type = 'detection') {
        const entry = document.createElement('div');
        entry.classList.add('log-entry', type);
        const timestamp = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
        logConsole.appendChild(entry);
        logConsole.scrollTop = logConsole.scrollHeight;
        
        // Keep only last 100 logs
        while (logConsole.children.length > 100) {
            logConsole.removeChild(logConsole.firstChild);
        }
    }

    // Draw detection boxes
    function drawDetections(detections) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff00';
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';

        detections.forEach(det => {
            const [x, y, w, h] = det.bbox;
            ctx.strokeRect(x, y, w, h);
            ctx.fillText(`${det.class} ${(det.confidence * 100).toFixed(0)}%`, x, y > 20 ? y - 5 : y + 20);
            
            // Log detection with coordinates
            addLog(`Detected ${det.class} (${(det.confidence * 100).toFixed(0)}%) at [x:${Math.round(x)}, y:${Math.round(y)}]`);
            ctx.fillStyle = 'rgba(0, 243, 255, 0.7)';
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);
            
            // Draw label text
            ctx.fillStyle = '#000';
            ctx.font = '12px JetBrains Mono';
            ctx.fillText(label, x1 + 5, y1 - 5);
        });
    }

    // Process frame
    async function processFrame() {
        if (!isWebcamActive) return;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        lastFrame = canvas.toDataURL('image/jpeg'); // Store the current frame
        
        // Get frame data for detection
        try {
            const response = await fetch('/detect_webcam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: lastFrame })
            });
            
            const data = await response.json();
            
            if (data.success) {
                drawDetections(data.detections);
                if (data.detections.length > 0) {
                    data.detections.forEach(det => {
                        addLog(`[${data.timestamp}] 🔹 Detected: ${det.class} (${(det.confidence * 100).toFixed(0)}%)`);
                    });
                }
            }
        } catch (error) {
            console.error('Detection error:', error);
            addLog(`Error: ${error.message}`, 'error');
        }
    }

    // Start webcam
    startWebcamBtn.addEventListener('click', async () => {
        if (isWebcamActive) {
            stopWebcam();
            startWebcamBtn.textContent = '📹 Start Webcam';
            addLog('Webcam stopped', 'system');
            if (lastFrame) {
                ctx.putImageData(lastFrame, 0, 0);
                addLog('Last frame captured', 'system');
            } else {
                showPlaceholder();
            }
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.style.display = 'block';
            await video.play();

            // Update canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            isWebcamActive = true;
            hidePlaceholder();
            startWebcamBtn.textContent = '⏹ Stop';
            addLog('Webcam started', 'system');

            // Start processing frames
            let lastProcessingTime = 0;
            const processFrame = async (currentTime) => {
                if (!isWebcamActive) return;
                
                // Limit to ~10 FPS for detection
                if (currentTime - lastProcessingTime > 100) { // 100ms = 10fps
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    lastFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        const response = await fetch('/detect_webcam', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                image: canvas.toDataURL('image/jpeg')
                            })
                        });
                        
                        const data = await response.json();
                        if (data.success && data.detections.length > 0) {
                            drawDetections(data.detections);
                            data.detections.forEach(det => {
                                addLog(`Detected: ${det.class} (${(det.confidence * 100).toFixed(0)}%)`);
                            });
                        }
                    } catch (error) {
                        console.error('Detection error:', error);
                    }
                    
                    lastProcessingTime = currentTime;
                }
                
                requestAnimationFrame(processFrame);
            };
            
            requestAnimationFrame(processFrame);
        } catch (error) {
            console.error('Error accessing webcam:', error);
            addLog(`Error: ${error.message}`, 'error');
            showPlaceholder();
        }
    });

    // Handle image upload
    videoUpload.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;
        
        stopWebcam();
        const file = e.target.files[0];
        const videoUrl = URL.createObjectURL(file);
        
        try {
            video.src = videoUrl;
            video.style.display = 'block';
            await video.play();
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            hidePlaceholder();
            
            let lastProcessingTime = 0;
            
            // Process video frames
            const processVideoFrame = async (currentTime) => {
                if (video.paused || video.ended) return;
                
                // Limit detection to ~10 FPS
                if (currentTime - lastProcessingTime > 100) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    lastFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        const response = await fetch('/detect_webcam', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                image: canvas.toDataURL('image/jpeg')
                            })
                        });
                        
                        const data = await response.json();
                        if (data.success && data.detections.length > 0) {
                            drawDetections(data.detections);
                            data.detections.forEach(det => {
                                addLog(`Detected: ${det.class} (${(det.confidence * 100).toFixed(0)}%)`);
                            });
                        }
                    } catch (error) {
                        console.error('Detection error:', error);
                    }
                    
                    lastProcessingTime = currentTime;
                }
                
                if (!video.paused && !video.ended) {
                    requestAnimationFrame(processVideoFrame);
                }
            };
            
            video.addEventListener('play', () => {
                addLog(`Started processing video: ${file.name}`, 'system');
                requestAnimationFrame(processVideoFrame);
            });
            
            video.addEventListener('ended', () => {
                addLog(`Completed processing video: ${file.name}`, 'system');
            });
            
            video.addEventListener('pause', () => {
                addLog('Video processing paused', 'system');
            });
            
        } catch (error) {
            console.error('Error playing video:', error);
            addLog(`Error: ${error.message}`, 'error');
            showPlaceholder();
        } finally {
            videoUpload.value = '';
        }
    });
    
    imageUpload.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;
        
        stopWebcam();
        const file = e.target.files[0];
        loadingOverlay.classList.remove('hidden');
        
        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.style.display = 'block';
            video.style.display = 'none';
            hidePlaceholder();
            
            // Process the image for detection
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/detect_image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                drawDetections(data.detections);
                if (data.detections.length > 0) {
                    data.detections.forEach(det => {
                        addLog(`Detected: ${det.class} (${(det.confidence * 100).toFixed(0)}%)`);
                    });
                } else {
                    addLog('No objects detected');
                }
            }
        } catch (error) {
            console.error('Error processing image:', error);
            addLog(`Error: ${error.message}`, 'error');
            showPlaceholder();
        } finally {
            loadingOverlay.classList.add('hidden');
            imageUpload.value = '';
        }
        
        try {
            // Create a temporary image element
            const img = new Image();
            img.onload = async () => {
                // Set canvas dimensions maintaining aspect ratio
                const maxWidth = 800;
                const maxHeight = 600;
                let scale = 1;
                
                if (img.width > maxWidth || img.height > maxHeight) {
                    const widthRatio = maxWidth / img.width;
                    const heightRatio = maxHeight / img.height;
                    scale = Math.min(widthRatio, heightRatio);
                }
                
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // Clear previous content and draw new image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Store as last frame
                lastFrame = canvas.toDataURL('image/jpeg');
                
                // Create form data with the processed image
                const formData = new FormData();
                const blob = await (await fetch(lastFrame)).blob();
                formData.append('file', blob, 'image.jpg');
                
                const response = await fetch('/detect_image', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Draw detections
                    drawDetections(data.detections);
                    
                    // Log detections
                    if (data.detections.length > 0) {
                        data.detections.forEach(det => {
                            addLog(`[${data.timestamp}] 🔹 Detected: ${det.class} (${(det.confidence * 100).toFixed(0)}%)`);
                        });
                    } else {
                        addLog(`[${data.timestamp}] ℹ️ No objects detected in image`, 'system');
                    }
                }
            };
            
            img.src = URL.createObjectURL(file);
        } catch (error) {
            addLog(`Error: ${error.message}`, 'error');
        } finally {
            loadingOverlay.classList.add('hidden');
            // Reset file input to allow uploading the same file again
            imageUpload.value = '';
        }
    });

    // Clear logs
    document.getElementById('clearLogs').addEventListener('click', () => {
        logConsole.innerHTML = '';
        addLog('Logs cleared', 'system');
    });

    // Export logs
    document.getElementById('exportLogs').addEventListener('click', () => {
        const logs = Array.from(logConsole.children)
            .map(entry => entry.textContent)
            .join('\n');
        
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'detection-logs.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
