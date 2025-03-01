// Import firebase config
import { auth, database } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const clearSessionBtn = document.getElementById('clear-session');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('chat-sidebar');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Modality toggles
    const textToggle = document.getElementById('toggle-text');
    const audioToggle = document.getElementById('toggle-audio');
    const videoToggle = document.getElementById('toggle-video');
    
    // Media elements
    const userVideo = document.getElementById('user-video');
    const videoContainer = document.getElementById('video-container');
    const audioVisualization = document.getElementById('audio-visualization');
    const multimediaContainer = document.querySelector('.multimedia-container');
    const modelAvatar = document.getElementById('model-avatar');
    
    // Input control buttons
    const micButton = document.getElementById('mic-button');
    const cameraButton = document.getElementById('camera-button');
    
    // Response toggles
    const voiceResponseToggle = document.getElementById('voice-response-toggle');
    const textResponseToggle = document.getElementById('text-response-toggle');
    
    // Variables for media streams
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;
    let userStream;
    let audioContext;
    let audioSource;
    let analyser;
    let audioData;
    let lastMessageTimestamp = 0;
    let requestActive = false;
    
    // Gemini API Key - Use the same key from flamey.js
    const GEMINI_API_KEY = "AIzaSyBlvhpuRx-ispBO9mCxnMNu78FQ4rLnmrI"; // Store securely in production
    // Updated model name as requested
    const GEMINI_LIVE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('flamey-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(true);
    }
    
    // Handle sidebar toggle for mobile
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Handle clicks outside sidebar to close it on mobile
    document.addEventListener('click', (e) => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('active');
        }
    });
    
    // Handle theme toggle
    themeToggle.addEventListener('click', () => {
        const isLightMode = document.body.classList.toggle('light-mode');
        localStorage.setItem('flamey-theme', isLightMode ? 'light' : 'dark');
        updateThemeIcon(isLightMode);
    });
    
    // Function to update theme icon (same as flamey.js)
    function updateThemeIcon(isLightMode) {
        if (isLightMode) {
            themeIcon.innerHTML = `
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" />
                <path d="M12 5V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M12 21V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M5 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M21 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M7.05 7.05L5.63 5.63" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M18.36 18.36L16.95 16.95" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M7.05 16.95L5.63 18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M18.36 5.63L16.95 7.05" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" fill="currentColor" />
            `;
        } else {
            themeIcon.innerHTML = `
                <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M5 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M21 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19.07 4.93L16.95 7.05" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M7.05 16.95L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M16.95 16.95L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M4.93 4.93L7.05 7.05" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            `;
        }
    }
    
    // Auto-resize textarea as user types
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });
    
    // Handle enter key to submit form (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // Form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        
        if (message) {
            await handleUserInput(message, 'text');
            
            // Clear the input
            userInput.value = '';
            userInput.style.height = 'auto';
        }
    });
    
    // Clear session button
    clearSessionBtn.addEventListener('click', () => {
        chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar">
                    <div class="mini-flamey"></div>
                </div>
                <div class="message-content">
                    <p>Hi there! I'm Flamey Live, your multimodal AI assistant. I can see, hear, and speak with you. How would you like to interact today?</p>
                    <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `;
        stopAllMedia();
    });
    
    // Modality toggle buttons
    textToggle.addEventListener('click', () => {
        setActiveModality('text');
    });
    
    audioToggle.addEventListener('click', () => {
        setActiveModality('audio');
    });
    
    videoToggle.addEventListener('click', () => {
        setActiveModality('video');
    });
    
    // Mic button handler
    micButton.addEventListener('click', async () => {
        if (isRecording) {
            stopRecording();
            micButton.classList.remove('active');
        } else {
            await startAudioRecording();
            micButton.classList.add('active');
        }
    });
    
    // Camera button handler
    cameraButton.addEventListener('click', async () => {
        if (videoContainer.classList.contains('active')) {
            stopVideo();
            cameraButton.classList.remove('active');
        } else {
            await startVideo();
            cameraButton.classList.add('active');
        }
    });
    
    // Set active modality
    function setActiveModality(modality) {
        // Remove active class from all toggles
        textToggle.classList.remove('active');
        audioToggle.classList.remove('active');
        videoToggle.classList.remove('active');
        
        // Hide all media containers
        audioVisualization.classList.remove('active');
        videoContainer.classList.remove('active');
        multimediaContainer.classList.remove('active');
        
        // Stop any active media
        stopAllMedia();
        
        // Set the active toggle and show appropriate container
        switch (modality) {
            case 'text':
                textToggle.classList.add('active');
                break;
                
            case 'audio':
                audioToggle.classList.add('active');
                audioVisualization.classList.add('active');
                multimediaContainer.classList.add('active');
                startAudioRecording();
                break;
                
            case 'video':
                videoToggle.classList.add('active');
                videoContainer.classList.add('active');
                multimediaContainer.classList.add('active');
                startVideo();
                break;
        }
    }
    
    // Start video recording
    async function startVideo() {
        try {
            userStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
            });
            
            userVideo.srcObject = userStream;
            videoContainer.classList.add('active');
            multimediaContainer.classList.add('active');
            modelAvatar.classList.add('active');
            cameraButton.classList.add('active');
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            addMessageToUI('assistant', 'I could not access your camera. Please check your permissions and try again.');
        }
    }
    
    // Stop video recording
    function stopVideo() {
        if (userStream) {
            userStream.getTracks().forEach(track => track.stop());
            userStream = null;
        }
        
        userVideo.srcObject = null;
        videoContainer.classList.remove('active');
        multimediaContainer.classList.remove('active');
        modelAvatar.classList.remove('active');
        cameraButton.classList.remove('active');
    }
    
    // Start audio recording
    async function startAudioRecording() {
        try {
            userStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false
            });
            
            // Set up audio visualization
            setupAudioVisualization(userStream);
            
            // Set up media recorder
            mediaRecorder = new MediaRecorder(userStream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                if (recordedChunks.length > 0) {
                    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                    recordedChunks = [];
                    
                    // Convert blob to base64 for API
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = reader.result.split(',')[1];
                        
                        // Only process if there hasn't been a recent message
                        if (Date.now() - lastMessageTimestamp > 1000) {
                            await processAudioInput(base64Audio);
                        }
                    };
                }
            };
            
            // Start recording
            mediaRecorder.start();
            isRecording = true;
            audioVisualization.classList.add('active');
            multimediaContainer.classList.add('active');
            
            // Use Voice Activity Detection (VAD) to detect when the user stops speaking
            setupVoiceActivityDetection(userStream);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            addMessageToUI('assistant', 'I could not access your microphone. Please check your permissions and try again.');
        }
    }
    
    // Stop recording
    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
        }
        
        if (userStream) {
            userStream.getTracks().forEach(track => track.stop());
            userStream = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        audioVisualization.classList.remove('active');
        multimediaContainer.classList.remove('active');
        micButton.classList.remove('active');
    }
    
    // Stop all media
    function stopAllMedia() {
        stopRecording();
        stopVideo();
    }
    
    // Set up audio visualization
    function setupAudioVisualization(stream) {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 256;
        audioSource.connect(analyser);
        
        // Create data array for frequency data
        audioData = new Uint8Array(analyser.frequencyBinCount);
        
        // Visualize the audio
        visualizeAudio();
    }
    
    // Visualize audio data
    function visualizeAudio() {
        if (!analyser) return;
        
        requestAnimationFrame(visualizeAudio);
        
        analyser.getByteFrequencyData(audioData);
        
        // Calculate average frequency
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i];
        }
        const average = sum / audioData.length;
        
        // Update the bars
        const bars = document.querySelectorAll('.audio-wave .bar');
        bars.forEach((bar, index) => {
            const dataIndex = Math.floor(index * (audioData.length / bars.length));
            const scaledHeight = (audioData[dataIndex] / 255) * 60;
            bar.style.height = `${Math.max(4, scaledHeight)}px`;
        });
        
        // Add listening class when sound is detected
        const audioWave = document.querySelector('.audio-wave');
        if (average > 10) {
            audioWave.classList.add('listening');
        } else {
            audioWave.classList.remove('listening');
        }
    }
    
    // Setup Voice Activity Detection
    function setupVoiceActivityDetection(stream) {
        let silenceTimer;
        let isSpeaking = false;
        const silenceThreshold = 20;
        const silenceTimeoutMs = 1000;
        
        function checkAudioLevel() {
            if (!analyser) return;
            
            analyser.getByteFrequencyData(audioData);
            
            let sum = 0;
            for (let i = 0; i < audioData.length; i++) {
                sum += audioData[i];
            }
            const average = sum / audioData.length;
            
            if (average > silenceThreshold) {
                if (!isSpeaking) {
                    isSpeaking = true;
                }
                
                if (silenceTimer) {
                    clearTimeout(silenceTimer);
                    silenceTimer = null;
                }
            } else if (isSpeaking) {
                if (!silenceTimer) {
                    silenceTimer = setTimeout(() => {
                        stopRecording();
                        startAudioRecording();
                    }, silenceTimeoutMs);
                }
            }
            
            if (isRecording) {
                requestAnimationFrame(checkAudioLevel);
            }
        }
        
        requestAnimationFrame(checkAudioLevel);
    }
    
    // Process audio input
    async function processAudioInput(base64Audio) {
        try {
            const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_API_KEY}`
                },
                body: JSON.stringify({
                    config: {
                        encoding: 'WEBM_OPUS',
                        sampleRateHertz: 48000,
                        languageCode: 'en-US'
                    },
                    audio: {
                        content: base64Audio
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Speech recognition failed');
            }

            const data = await response.json();
            const transcript = data.results[0].alternatives[0].transcript;

            addMessageToUI('user', `(Voice) ${transcript}`);
            await handleUserInput(transcript, 'audio');

        } catch (error) {
            console.error('Error processing audio:', error);
            addMessageToUI('assistant', 'I had trouble processing your voice input. Please try again or use text input instead.');
        }
    }
    
    // Handle user input (text or transcribed audio)
    async function handleUserInput(message, inputType) {
        // Prevent rapid-fire requests
        if (requestActive) return;
        requestActive = true;
        
        // Update timestamp
        lastMessageTimestamp = Date.now();
        
        // Add user message to the UI if it's not from audio (audio adds its own UI message)
        if (inputType !== 'audio') {
            addMessageToUI('user', message);
        }
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get context
            const context = await buildSystemContext();
            
            // Prepare the request based on the active modality
            let requestBody;
            
            if (videoContainer.classList.contains('active') && userVideo.srcObject) {
                // Capture video frame as base64
                const videoFrame = await captureVideoFrame();
                
                // Multi-modal request with video frame
                requestBody = {
                    contents: [{
                        role: "user",
                        parts: [
                            { text: context + "\n\nUser: " + message },
                            { inline_data: { mime_type: "image/jpeg", data: videoFrame } }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                };
            } else {
                // Text-only request
                requestBody = {
                    contents: [{
                        role: "user",
                        parts: [
                            { text: context + "\n\nUser: " + message }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                };
            }
            
            // Make API request to Gemini
            const response = await fetch(`${GEMINI_LIVE_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error:', errorData);
                throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract the response text
            const aiResponse = data.candidates && data.candidates[0] && 
                              data.candidates[0].content && 
                              data.candidates[0].content.parts[0].text;
            
            // Remove typing indicator
            removeTypingIndicator();
            
            if (aiResponse) {
                // Add AI response to UI
                if (textResponseToggle.checked) {
                    addMessageToUI('assistant', aiResponse);
                }
                
                // Speak response if voice response is enabled
                if (voiceResponseToggle.checked) {
                    speakResponse(aiResponse);
                }
            } else {
                throw new Error('Invalid response format from Gemini API');
            }
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            removeTypingIndicator();
            addMessageToUI('assistant', 'Sorry, I encountered an error while processing your request. Please try again or use text input instead.');
        } finally {
            requestActive = false;
        }
    }
    
    // Build system context
    async function buildSystemContext() {
        return `You are an AI assistant powered by Google's Gemini API.
                You can see, hear, and speak with users through this multimodal interface.
                Be concise, helpful, and friendly in your responses.
                Format responses with markdown when appropriate.`;
    }
    
    // Capture video frame as base64
    async function captureVideoFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = userVideo.videoWidth;
        canvas.height = userVideo.videoHeight;
        context.drawImage(userVideo, 0, 0, canvas.width, canvas.height);
        
        // Get base64 representation (remove the data URL prefix)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        return dataUrl.split(',')[1];
    }
    
    // Speak the AI response using the Web Speech API
    function speakResponse(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Microsoft Zira') || v.name.includes('Samantha') || v.name.includes('Google US English Female'));
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Function to add a message to the UI
    function addMessageToUI(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role, 'animate-in');
        
        let avatar;
        if (role === 'assistant') {
            avatar = `
                <div class="message-avatar assistant-avatar">
                    <div class="mini-flamey pulse"></div>
                </div>`;
        } else {
            avatar = `
                <div class="message-avatar user-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
                        <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21"/>
                    </svg>
                </div>`;
        }
        
        const formattedContent = formatMessageContent(content);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            ${avatar}
            <div class="message-content">
                <div class="message-bubble">
                    ${formattedContent}
                </div>
                <div class="message-time">${timestamp}</div>
            </div>`;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add fade-in animation
        setTimeout(() => messageElement.classList.add('visible'), 10);
    }
    
    // Function to format message content (handling code, markdown, etc.)
    function formatMessageContent(content) {
        if (!content) return '';

        // Clean up any voice indicators
        content = content.replace(/^\(Voice\)\s+/g, '');

        // Replace code blocks with syntax highlighting
        content = content.replace(/```([^`]*?)```/gs, (match, code) => {
            let language = '';
            const firstLine = code.trim().split('\n')[0];
            if (firstLine && !firstLine.includes(' ')) {
                language = firstLine;
                code = code.substring(firstLine.length).trim();
            }
            return `<pre><code class="language-${language} hljs">${escapeHtml(code)}</code></pre>`;
        });

        // Replace inline code with modern styling
        content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Replace headings with modern styling
        content = content.replace(/^### (.*?)$/gm, '<h3 class="message-heading">$1</h3>');
        content = content.replace(/^## (.*?)$/gm, '<h2 class="message-heading">$1</h2>');
        content = content.replace(/^# (.*?)$/gm, '<h1 class="message-heading">$1</h1>');

        // Replace lists with modern styling
        content = content.replace(/^\* (.*?)$/gm, '<li class="message-list-item">$1</li>');
        content = content.replace(/^- (.*?)$/gm, '<li class="message-list-item">$1</li>');
        content = content.replace(/^(\d+)\. (.*?)$/gm, '<li class="message-list-item numbered">$1. $2</li>');
        
        // Wrap lists with modern styling
        content = content.replace(/(<li.*?<\/li>)+/gs, match => {
            if (match.includes('numbered')) {
                return `<ol class="message-list numbered">${match}</ol>`;
            }
            return `<ul class="message-list">${match}</ul>`;
        });

        // Replace emphasis and strong with modern styling
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong class="message-bold">$1</strong>');
        content = content.replace(/\*([^*]+)\*/g, '<em class="message-emphasis">$1</em>');

        // Replace horizontal rules with modern styling
        content = content.replace(/^---$/gm, '<hr class="message-divider">');

        // Replace links with modern styling
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="message-link">$1</a>');

        // Handle paragraphs with modern styling
        const paragraphs = content.split('\n\n');
        content = paragraphs.map(p => {
            if (p.startsWith('<h') || p.startsWith('<pre>') || p.startsWith('<ul') || p.startsWith('<ol') || p === '<hr>') {
                return p;
            }
            return `<p class="message-paragraph">${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return content;
    }
    
    // Helper function to escape HTML entities
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'assistant', 'typing-indicator-container', 'animate-in');
        
        typingElement.innerHTML = `
            <div class="message-avatar assistant-avatar">
                <div class="mini-flamey pulse"></div>
            </div>
            <div class="message-content">
                <div class="message-bubble typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>`;
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        setTimeout(() => typingElement.classList.add('visible'), 10);
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator-container');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Initialize - set text as default modality
    setActiveModality('text');
}); 