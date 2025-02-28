document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');
    const googleBtn = document.querySelector('.btn-google');
    const guestBtn = document.querySelector('.btn-guest');

    // Check if it's user's first visit
    if (!localStorage.getItem('hasVisitedBefore')) {
        localStorage.setItem('hasVisitedBefore', 'true');
        if (window.location.pathname !== '/index.html') {
            window.location.href = 'index.html';
            return;
        }
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            clearMessages();

            if (!terms) {
                showError('Please accept the Terms of Service and Privacy Policy');
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            if (password.length < 8) {
                showError('Password must be at least 8 characters long');
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.sendEmailVerification();
                showSuccess('Account created successfully! Please check your email for verification.');
                setTimeout(() => {
                    window.location.href = 'verification.html';
                }, 2000);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            clearMessages();

            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                if (!userCredential.user.emailVerified && userCredential.user.providerData[0].providerId === 'password') {
                    showError('Please verify your email before signing in');
                    return;
                }
                window.location.href = 'home.html';
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await auth.signInWithPopup(provider);
                window.location.href = 'home.html';
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (guestBtn) {
        guestBtn.addEventListener('click', async () => {
            try {
                await auth.signInAnonymously();
                window.location.href = 'home.html';
            } catch (error) {
                showError(error.message);
            }
        });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        const form = document.querySelector('form');
        form.insertAdjacentElement('beforeend', errorDiv);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        const form = document.querySelector('form');
        form.insertAdjacentElement('beforeend', successDiv);
    }

    function clearMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(message => message.remove());
    }

    // Check authentication state for all pages
    auth.onAuthStateChanged(user => {
        const publicPages = ['index.html', 'signin.html', 'signup.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (!user && !publicPages.includes(currentPage)) {
            window.location.href = 'signin.html';
        } else if (user) {
            if (publicPages.includes(currentPage)) {
                window.location.href = 'home.html';
            }

            // Initialize user data if it's a new user
            if (user.metadata.creationTime === user.metadata.lastSignInTime) {
                const db = firebase.database();
                const userRef = db.ref(`users/${user.uid}`);
                
                userRef.once('value', snapshot => {
                    if (!snapshot.exists()) {
                        userRef.set({
                            displayName: user.displayName || 'Guest User',
                            email: user.email || 'guest@example.com',
                            level: 1,
                            exp: 0,
                            achievements: [],
                            badges: [],
                            createdAt: firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                });
            }
        }
    });
}); 