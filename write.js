// Firebase imports
import { auth, database } from './firebase-config.js';
import { ref, set, get, push, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// ImgBB API Key
const IMGBB_API_KEY = 'cae25a5efbe778e17c1db8b6f4e44cd7';

let quill;
let editor;
let currentDraft = null;
let autosaveTimeout = null;
let formStatus = {
    title: false,
    content: false,
    category: false
};

// Initialize form elements
const titleInput = document.getElementById('title');
const publishBtn = document.querySelector('.btn-primary');
const categoryButtons = document.querySelectorAll('.category-tag');
const progressModal = document.getElementById('progressModal');
const authorAvatar = document.getElementById('authorAvatar');
const saveDraftBtn = document.getElementById('saveDraft');

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Quill
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            imageResize: {
                displaySize: true
            },
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    editor = document.querySelector('.ql-editor');

    // Setup custom image handler
    quill.getModule('toolbar').addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                showProgress('Uploading image...');
                try {
                    const imageUrl = await uploadToImgBB(file);
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', imageUrl);
                    hideProgress();
                } catch (error) {
                    console.error('Image upload failed:', error);
                    showError('Failed to upload image. Please try again.');
                    hideProgress();
                }
            }
        };
    });

    // Load author data
    auth.onAuthStateChanged(async user => {
        if (!user) {
            window.location.href = 'signin.html';
            return;
        }

        // Load user data
        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                document.getElementById('authorAvatar').src = userData.avatar || 'default-avatar.png';
                const level = Math.floor(userData.exp / 1000) + 1;
                const expProgress = (userData.exp % 1000) / 10;
                document.querySelector('.level').textContent = `Level ${level}`;
                document.querySelector('.exp-progress').style.width = `${expProgress}%`;
            }
        });

        // Load draft
        loadDraft();
    });

    // Handle category selection
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            formStatus.category = document.querySelectorAll('.category-tag.selected').length > 0;
            updatePublishButton();
            autosave();
        });
    });

    // Handle title and content changes
    titleInput.addEventListener('input', () => {
        formStatus.title = titleInput.value.trim().length > 0;
        updatePublishButton();
        autosave();
    });

    quill.on('text-change', () => {
        const text = quill.getText();
        document.getElementById('readingTime').textContent = `${calculateReadingTime(text)} min read`;
        formStatus.content = text.trim().length > 0;
        updatePublishButton();
        autosave();
    });

    // Handle draft saving
    saveDraftBtn.addEventListener('click', () => {
        saveDraft();
        showSuccess('Draft saved successfully!');
    });

    // Handle publishing
    publishBtn.addEventListener('click', async () => {
        if (!auth.currentUser) return;

        const title = titleInput.value;
        const content = quill.root.innerHTML;
        const selectedCategories = Array.from(document.querySelectorAll('.category-tag.selected'))
            .map(button => button.textContent);

        try {
            showProgress('Publishing your post...');
            
            const post = {
                authorId: auth.currentUser.uid,
                title,
                content,
                categories: selectedCategories,
                readingTime: calculateReadingTime(quill.getText()),
                createdAt: new Date().toISOString(),
                likes: 0,
                comments: 0,
                views: 0
            };

            await savePost(post);
            clearDraft();
            showSuccess('Post published successfully!');
            showAchievement('First Post Created', 100);
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } catch (error) {
            showError('Failed to publish post');
        } finally {
            hideProgress();
        }
    });
});

function autosave() {
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
        saveDraft();
    }, 1000);
}

function saveDraft() {
    const draft = {
        title: document.getElementById('title').value,
        content: quill.root.innerHTML,
        categories: Array.from(document.querySelectorAll('.category-tag.selected'))
            .map(button => button.textContent),
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('postDraft', JSON.stringify(draft));
    currentDraft = draft;
}

function loadDraft() {
    const savedDraft = localStorage.getItem('postDraft');
    if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        document.getElementById('title').value = draft.title || '';
        quill.root.innerHTML = draft.content || '';

        if (draft.categories) {
            const categoryButtons = document.querySelectorAll('.category-tag');
            categoryButtons.forEach(button => {
                if (draft.categories.includes(button.textContent)) {
                    button.classList.add('selected');
                }
            });
        }

        currentDraft = draft;
        
        // Update form status
        formStatus.title = draft.title?.trim().length > 0;
        formStatus.content = quill.getText().trim().length > 0;
        formStatus.category = document.querySelectorAll('.category-tag.selected').length > 0;
        
        updatePublishButton();
    }
}

function clearDraft() {
    localStorage.removeItem('postDraft');
    currentDraft = null;
}

// Upload image to ImgBB
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error?.message || 'Upload failed');
    }

    return data.data.url;
}

// Update publish button state
function updatePublishButton() {
    const isComplete = Object.values(formStatus).every(status => status);
    publishBtn.disabled = !isComplete;
    publishBtn.style.opacity = isComplete ? '1' : '0.5';
}

// Progress modal functions
function showProgress(message) {
    progressModal.querySelector('.progress-message').textContent = message;
    progressModal.classList.add('active');
}

function hideProgress() {
    progressModal.classList.remove('active');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// Calculate reading time
function calculateReadingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 200); // Assuming 200 words per minute
    return `${time} min read`;
}

// Save post to Firebase
async function savePost(post) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const postRef = push(ref(database, 'posts'));
    const postData = {
        ...post,
        id: postRef.key,
        author: {
            uid: user.uid,
            name: user.displayName || 'Anonymous',
            avatar: user.photoURL || null
        },
        status: 'published',
        stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
        },
        seo: {
            description: quill.getText().slice(0, 160),
            keywords: post.categories.join(', ')
        }
    };

    await set(postRef, postData);

    // Update user stats and exp
    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();

    const updates = {
        exp: (userData.exp || 0) + 100,
        stats: {
            ...userData.stats,
            postsPublished: (userData.stats?.postsPublished || 0) + 1
        }
    };

    // Check for achievements
    if (!userData.achievements) userData.achievements = [];
    
    if (!userData.achievements.includes('first_post')) {
        updates.achievements = [...userData.achievements, 'first_post'];
        showAchievement('First Post Created', 100);
    }

    await set(userRef, { ...userData, ...updates });
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = 'rgba(52, 199, 89, 0.1)';
    errorDiv.style.color = '#34c759';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function showAchievement(title, exp) {
    const modal = document.getElementById('achievementModal');
    const titleEl = modal.querySelector('.achievement-title');
    const expEl = modal.querySelector('.achievement-exp');

    titleEl.textContent = title;
    expEl.textContent = `+${exp} XP`;
    modal.classList.add('active');

    setTimeout(() => {
        modal.classList.remove('active');
    }, 3000);
} 