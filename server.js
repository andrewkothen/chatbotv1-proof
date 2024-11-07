// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' directory
app.use(express.static('public'));

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Store system message for each socket
    socket.on('set-system-message', (message) => {
        socket.systemMessage = message;
        console.log(`System message set for ${socket.id}: ${message}`);
    });

    // Handle user messages
    socket.on('user-message', async (message) => {
        console.log(`User message from ${socket.id}: ${message}`);

        // Prepare messages array with system and user messages
        const messages = [];
        if (socket.systemMessage) {
            messages.push({ role: 'system', content: socket.systemMessage });
        } else {
            messages.push({ role: 'system', content: 'You are a helpful assistant.' });
        }
        messages.push({ role: 'user', content: message });

        try {
            console.log('Sending request to OpenAI API with messages:', messages);
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo', // Ensure you have access; otherwise, use 'gpt-3.5-turbo'
                    messages: messages,
                    stream: false, // Disable streaming for initial testing
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                }
            );

            console.log('Received response from OpenAI API:', response.data);

            if (
                response.data &&
                response.data.choices &&
                response.data.choices.length > 0 &&
                response.data.choices[0].message &&
                response.data.choices[0].message.content
            ) {
                const botReply = response.data.choices[0].message.content;
                console.log(`Bot reply to ${socket.id}: ${botReply}`);
                socket.emit('bot-response', botReply);
                console.log(`Emitted bot-response to ${socket.id}`);
            } else {
                console.error('Unexpected response structure from OpenAI API:', response.data);
                socket.emit('bot-response', 'Sorry, I couldn\'t process that. Please try again.');
            }
        } catch (error) {
            // Detailed error logging
            if (error.response) {
                console.error('OpenAI API Error:', error.response.status, error.response.data);
                socket.emit('bot-response', `OpenAI API Error: ${error.response.data.error.message}`);
            } else if (error.request) {
                console.error('No response received from OpenAI API:', error.request);
                socket.emit('bot-response', 'No response from OpenAI API. Please try again later.');
            } else {
                console.error('Error setting up OpenAI API request:', error.message);
                socket.emit('bot-response', 'An error occurred while processing your request.');
            }
        }
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});