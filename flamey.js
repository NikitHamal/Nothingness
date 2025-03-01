// Firebase imports
import { auth, database } from './firebase-config.js';
import { ref, get, child } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const newChatBtn = document.getElementById('new-chat');
    const clearContextBtn = document.getElementById('clear-context');
    const conversationList = document.getElementById('conversation-list');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('chat-sidebar');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Variables to store conversation history
    let conversationHistory = [];
    let currentConversationId = generateId();
    let conversations = loadConversations();
    
    // Database cache for performance
    let databaseCache = {
        users: null,
        posts: null,
        lastFetched: null
    };
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('flamey-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(true);
    }
    
    // Gemini API Key - Replace with your actual API key
    const GEMINI_API_KEY = "AIzaSyBlvhpuRx-ispBO9mCxnMNu78FQ4rLnmrI"; // Store securely in production
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    // Initialize the conversations list
    updateConversationsList();
    
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
    
    // Function to update theme icon
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
            // Add user message to the UI
            addMessageToUI('user', message);
            
            // Save to conversation history
            conversationHistory.push({
                role: 'user',
                content: message
            });
            
            // Clear the input
            userInput.value = '';
            userInput.style.height = 'auto';
            
            // Show typing indicator
            showTypingIndicator();
            
            try {
                // Get AI response
                const response = await getAIResponse(message);
                
                // Remove typing indicator and add the AI response
                removeTypingIndicator();
                addMessageToUI('assistant', response);
                
                // Save to conversation history
                conversationHistory.push({
                    role: 'assistant',
                    content: response
                });
                
                // Keep only the last 15 messages for context window
                if (conversationHistory.length > 30) { // 15 exchanges (user + assistant)
                    conversationHistory = conversationHistory.slice(-30);
                }
                
                // Save the updated conversation
                saveConversation();
                
            } catch (error) {
                removeTypingIndicator();
                addMessageToUI('assistant', 'Sorry, I encountered an error while processing your request. Please try again.');
                console.error('Error getting AI response:', error);
            }
        }
    });
    
    // New chat button
    newChatBtn.addEventListener('click', () => {
        // Save current conversation if not empty
        if (conversationHistory.length > 0) {
            saveConversation();
        }
        
        // Create new conversation
        conversationHistory = [];
        currentConversationId = generateId();
        
        // Clear the chat UI
        chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar">
                    <div class="mini-flamey"></div>
                </div>
                <div class="message-content">
                    <p>Hi there! I'm Flamey, your AI companion. How can I help you today?</p>
                </div>
            </div>
        `;
        
        // Update conversations list
        updateConversationsList();
    });
    
    // Clear context button
    clearContextBtn.addEventListener('click', () => {
        // Clear all conversations from localStorage
        localStorage.removeItem('flamey-conversations');
        conversations = [];
        
        // Reset current conversation
        conversationHistory = [];
        currentConversationId = generateId();
        
        // Keep only welcome message in the UI
        chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar">
                    <div class="mini-flamey"></div>
                </div>
                <div class="message-content">
                    <p>I've cleared all chat history. How can I help you now?</p>
                    <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `;
        
        // Update conversations list
        updateConversationsList();
    });
    
    // Function to add a message to the UI
    function addMessageToUI(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);
        
        let avatar;
        if (role === 'assistant') {
            avatar = '<div class="message-avatar"><div class="mini-flamey"></div></div>';
        } else {
            // Create a user avatar with SVG icon
            avatar = `
                <div class="message-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
            `;
        }
        
        // Process message content for code blocks
        const formattedContent = formatMessageContent(content);
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            ${avatar}
            <div class="message-content">
                ${formattedContent}
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to format message content (handling code, markdown, etc.)
    function formatMessageContent(content) {
        if (!content) return '';

        // Replace code blocks with proper HTML
        content = content.replace(/```([^`]*?)```/gs, (match, code) => {
            let language = '';
            const firstLine = code.trim().split('\n')[0];
            if (firstLine && !firstLine.includes(' ')) {
                language = firstLine;
                code = code.substring(firstLine.length).trim();
            }
            return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
        });

        // Replace inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Replace headings
        content = content.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        content = content.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        content = content.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

        // Replace lists
        content = content.replace(/^\* (.*?)$/gm, '<li>$1</li>');
        content = content.replace(/^- (.*?)$/gm, '<li>$1</li>');
        content = content.replace(/^(\d+)\. (.*?)$/gm, '<li>$1. $2</li>');
        
        // Wrap consecutive list items in ul/ol tags
        content = content.replace(/(<li>.*?<\/li>)+/gs, match => {
            if (match.includes('<li>1. ')) {
                return `<ol>${match}</ol>`;
            } else {
                return `<ul>${match}</ul>`;
            }
        });

        // Replace emphasis and strong
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Replace horizontal rules
        content = content.replace(/^---$/gm, '<hr>');

        // Replace links
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Handle line breaks - replace with paragraph tags for better spacing
        const paragraphs = content.split('\n\n');
        content = paragraphs.map(p => {
            if (p.startsWith('<h1>') || p.startsWith('<h2>') || p.startsWith('<h3>') || 
                p.startsWith('<pre>') || p.startsWith('<ul>') || p.startsWith('<ol>') ||
                p === '<hr>') {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
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
        typingElement.classList.add('message', 'assistant', 'typing-indicator-container');
        typingElement.innerHTML = `
            <div class="message-avatar">
                <div class="mini-flamey"></div>
            </div>
            <div class="message-content typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator-container');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to fetch database data from Firebase
    async function fetchDatabaseData() {
        // Only fetch data if cache is empty or older than 5 minutes
        const now = Date.now();
        if (databaseCache.lastFetched && (now - databaseCache.lastFetched < 5 * 60 * 1000) &&
            databaseCache.users && databaseCache.posts) {
            return {
                users: databaseCache.users,
                posts: databaseCache.posts
            };
        }

        try {
            // Fetch users data
            const usersSnapshot = await get(ref(database, 'users'));
            const usersData = usersSnapshot.val() || {};

            // Fetch posts data
            const postsSnapshot = await get(ref(database, 'posts'));
            const postsData = postsSnapshot.val() || {};

            // Update cache
            databaseCache = {
                users: usersData,
                posts: postsData,
                lastFetched: now
            };

            return {
                users: usersData,
                posts: postsData
            };
        } catch (error) {
            console.error('Error fetching database data:', error);
            
            // Return empty data if fetch fails
            return {
                users: {},
                posts: {}
            };
        }
    }
    
    // Function to get database context for the AI
    async function getDatabaseContext() {
        // Fetch real data from Firebase
        const { users, posts } = await fetchDatabaseData();
        
        // Format the data as a string to provide context to the AI
        let contextString = "DATABASE CONTEXT:\n\n";
        
        // Format users (exclude sensitive info)
        contextString += "USERS:\n";
        const userIds = Object.keys(users);
        userIds.forEach(userId => {
            const user = users[userId];
            // Only include non-sensitive user information
            contextString += `- User ID: ${userId}, Name: ${user.displayName || 'Anonymous'}, Level: ${Math.floor((user.exp || 0) / 1000) + 1}\n`;
            
            if (user.stats) {
                contextString += `  Stats: Posts: ${user.stats.postsPublished || 0}, Comments: ${user.stats.comments || 0}\n`;
            }
            
            if (user.achievements) {
                contextString += `  Achievements: ${user.achievements.join(', ')}\n`;
            }
        });
        
        // Format posts
        contextString += "\nPOSTS:\n";
        const postIds = Object.keys(posts);
        postIds.forEach(postId => {
            const post = posts[postId];
            contextString += `- Post ID: ${postId}, Title: "${post.title}", Author: ${post.author?.name || post.authorId}, Categories: ${post.categories?.join(', ') || 'None'}\n`;
            contextString += `  Stats: Views: ${post.stats?.views || 0}, Likes: ${post.stats?.likes || 0}, Comments: ${post.stats?.comments || 0}\n`;
            
            // Include a short excerpt of the content (first 100 chars)
            if (post.content) {
                // Strip HTML tags for the excerpt
                const textContent = post.content.replace(/<[^>]*>?/gm, '');
                const excerpt = textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
                contextString += `  Excerpt: "${excerpt}"\n`;
            }
        });
        
        return contextString;
    }
    
    // Function to get AI response from Gemini API
    async function getAIResponse(userMessage) {
        try {
            // Format conversation history for Gemini API
            const formattedHistory = conversationHistory.map(msg => {
                return {
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                };
            });
            
            // Get database context
            const dbContext = await getDatabaseContext();
            
            // Build the request body
            const requestBody = {
                // Use systemInstruction instead of including it in contents
                systemInstruction: {
                    parts: [{ 
                        text: "You are Flamey, a helpful AI assistant for a webapp named 'Nothingness' made by 'Nikit Hamal'. " +
                              "You have been given access to user data and post data to help answer questions accurately. " +
                              "Be concise, helpful, and friendly in your responses. In addition to the context, use your own abilities, and be as detailed or as simple and understandable as you can. Remember that the context is optional and use it when it is necessary." +
                              "Format your responses with markdown for better readability. " +
                              "When appropriate, use headings, lists, and emphasis. " +
                              "Here is the database context you have access to:\n\n" + dbContext
                    }]
                },
                contents: [
                    ...formattedHistory,
                    {
                        role: "user",
                        parts: [{ text: userMessage }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            };
            
            // Make API request to Gemini
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
            
            // Extract the response text from the Gemini API response
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                return aiResponse;
            } else {
                throw new Error('Invalid response format from Gemini API');
            }
            
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            
            // Return a fallback message
            return "I'm sorry, I encountered an error while processing your request. Please check your API key or try again later.";
        }
    }
    
    // Function to generate a unique ID for conversations
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    // Function to save the current conversation
    function saveConversation() {
        if (conversationHistory.length > 0) {
            // Get the first user message as the title (or truncated version)
            const userMessage = conversationHistory.find(msg => msg.role === 'user');
            const title = userMessage ? truncateString(userMessage.content, 30) : 'New Conversation';
            
            // Create conversation object
            const conversation = {
                id: currentConversationId,
                title: title,
                timestamp: Date.now(),
                messages: conversationHistory
            };
            
            // Add/update in conversations list
            const existingIndex = conversations.findIndex(c => c.id === currentConversationId);
            if (existingIndex >= 0) {
                conversations[existingIndex] = conversation;
            } else {
                conversations.unshift(conversation);
            }
            
            // Limit to 10 saved conversations
            if (conversations.length > 10) {
                conversations = conversations.slice(0, 10);
            }
            
            // Save to localStorage
            localStorage.setItem('flamey-conversations', JSON.stringify(conversations));
            
            // Update the conversations list in the UI
            updateConversationsList();
        }
    }
    
    // Function to load conversations from localStorage
    function loadConversations() {
        const saved = localStorage.getItem('flamey-conversations');
        return saved ? JSON.parse(saved) : [];
    }
    
    // Function to update the conversations list in the UI
    function updateConversationsList() {
        conversationList.innerHTML = '';
        
        conversations.forEach(conversation => {
            const li = document.createElement('li');
            li.textContent = conversation.title;
            li.dataset.id = conversation.id;
            
            // Add a timestamp if available
            if (conversation.timestamp) {
                const date = new Date(conversation.timestamp);
                const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const timeBadge = document.createElement('span');
                timeBadge.classList.add('conversation-time');
                timeBadge.textContent = formattedDate;
                li.appendChild(timeBadge);
            }
            
            // Add animation delay for staggered entrance
            li.style.animationDelay = `${conversations.indexOf(conversation) * 0.05}s`;
            
            li.addEventListener('click', () => {
                // Save current conversation first
                if (conversationHistory.length > 0) {
                    saveConversation();
                }
                
                // Load selected conversation
                currentConversationId = conversation.id;
                conversationHistory = [...conversation.messages];
                
                // Update UI
                chatMessages.innerHTML = '';
                
                // Close sidebar on mobile when a conversation is selected
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
                
                // Add welcome message if empty
                if (conversationHistory.length === 0) {
                    addMessageToUI('assistant', "Hi there! I'm Flamey, your AI companion. How can I help you today?");
                } else {
                    // Add all messages to UI with staggered animation
                    conversationHistory.forEach((msg, index) => {
                        setTimeout(() => {
                            addMessageToUI(msg.role, msg.content);
                        }, index * 100); // Delay each message by 100ms
                    });
                }
            });
            
            conversationList.appendChild(li);
        });
    }
    
    // Utility function to truncate strings
    function truncateString(str, length) {
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    }
}); 