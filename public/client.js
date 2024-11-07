// public/client.js

const socket = io();

// DOM Elements
const systemMessageTextarea = document.getElementById('systemMessage');
const setSystemMessageBtn = document.getElementById('setSystemMessage');
const transcriptionDiv = document.getElementById('transcription');
const floatingOrb = document.getElementById('floatingOrb');
const micIcon = document.getElementById('micIcon');

// Optional: Send Test Message Button
const testMessageBtn = document.getElementById('testMessage');

// Initialize variables
let recognition;
let isRecording = false;

// Function to append messages to the transcription div
function appendTranscription(text) {
    const p = document.createElement('p');
    p.innerHTML = text; // Use innerHTML to allow HTML content
    transcriptionDiv.appendChild(p);
    transcriptionDiv.scrollTop = transcriptionDiv.scrollHeight;
}

// Set System Message Event
setSystemMessageBtn.addEventListener('click', () => {
    const systemMessage = systemMessageTextarea.value.trim();
    if (systemMessage) {
        socket.emit('set-system-message', systemMessage);
        appendTranscription(`<strong>System:</strong> ${systemMessage}`);
        systemMessageTextarea.value = ''; // Clear textarea after setting
        console.log('System message sent:', systemMessage);
    } else {
        alert('Please enter a system message to define the bot\'s personality.');
    }
});

// Initialize Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Your browser does not support Speech Recognition. Please use Chrome or Edge.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript) {
            appendTranscription(`<strong>You:</strong> ${transcript}`);
            socket.emit('user-message', transcript);
            console.log('User message sent:', transcript);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        appendTranscription('<span class="text-danger">Error: Speech recognition failed.</span>');
    };

    recognition.onend = () => {
        if (isRecording) {
            recognition.start();
        }
    };
}

// Handle Floating Orb Click
floatingOrb.addEventListener('click', () => {
    if (!recognition) {
        initSpeechRecognition();
    }

    if (isRecording) {
        recognition.stop();
        floatingOrb.classList.remove('active');
        micIcon.src = 'mic-icon.png'; // Inactive mic icon
        console.log('Stopped recording.');
    } else {
        recognition.start();
        floatingOrb.classList.add('active');
        micIcon.src = 'mic-active.png'; // Active mic icon
        console.log('Started recording.');
    }

    isRecording = !isRecording;
});

// Optional: Send Test Message Button
if (testMessageBtn) {
    testMessageBtn.addEventListener('click', () => {
        const testMessage = "This is a test message.";
        appendTranscription(`<strong>You:</strong> ${testMessage}`);
        socket.emit('user-message', testMessage);
        console.log('Test message sent:', testMessage);
    });
}

// Receive Bot Responses
socket.on('bot-response', (data) => {
    console.log('Bot response received:', data);
    appendTranscription(`<strong>Bot:</strong> ${data}`);
});

socket.on('bot-response-end', () => {
    console.log('Bot response ended.');
});

// Connection Logs
socket.on('connect', () => {
    console.log('Connected to server via Socket.io');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});