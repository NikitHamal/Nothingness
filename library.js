document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Create collection modal
    const createBtn = document.getElementById('createCollectionBtn');
    const modal = document.getElementById('createCollectionModal');
    const cancelBtn = document.getElementById('cancelCreate');
    const confirmBtn = document.getElementById('confirmCreate');
    const collectionNameInput = document.getElementById('collectionName');

    createBtn.addEventListener('click', () => {
        modal.classList.add('active');
        collectionNameInput.focus();
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        collectionNameInput.value = '';
    });

    confirmBtn.addEventListener('click', () => {
        const name = collectionNameInput.value.trim();
        if (name) {
            createNewCollection(name);
            modal.classList.remove('active');
            collectionNameInput.value = '';
        }
    });

    // Collection context menu
    const contextMenu = document.getElementById('collectionMenu');
    let activeCollection = null;

    function setupCollectionMenuEvents(card) {
        const menuBtn = card.querySelector('.collection-menu');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeCollection = card;
            
            // Position menu next to button
            const rect = menuBtn.getBoundingClientRect();
            contextMenu.style.top = `${rect.bottom + 5}px`;
            contextMenu.style.left = `${rect.left - 100}px`;
            
            contextMenu.classList.add('active');
        });
    }

    // Setup initial collection cards
    document.querySelectorAll('.collection-card').forEach(setupCollectionMenuEvents);

    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.remove('active');
        }
    });

    // Context menu actions
    const menuItems = contextMenu.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            if (action === 'rename') {
                renameCollection(activeCollection);
            } else if (action === 'delete') {
                deleteCollection(activeCollection);
            }
            contextMenu.classList.remove('active');
        });
    });

    // Remove saved article
    const removeBtns = document.querySelectorAll('.remove-saved');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const article = btn.closest('.article-card');
            article.remove();
        });
    });

    // Helper functions
    function createNewCollection(name) {
        const collectionsGrid = document.querySelector('.collections-grid');
        const newCollection = document.createElement('div');
        newCollection.className = 'collection-card';
        newCollection.setAttribute('data-id', name.toLowerCase().replace(/\s+/g, '-'));
        
        newCollection.innerHTML = `
            <div class="collection-info">
                <h3>${name}</h3>
                <p>0 articles</p>
            </div>
            <button class="collection-menu">
                <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/></svg>
            </button>
        `;
        
        collectionsGrid.appendChild(newCollection);
        setupCollectionMenuEvents(newCollection);
    }

    function renameCollection(collection) {
        const nameElement = collection.querySelector('h3');
        const currentName = nameElement.textContent;
        const newName = prompt('Enter new name:', currentName);
        
        if (newName && newName.trim() !== '') {
            nameElement.textContent = newName;
            collection.setAttribute('data-id', newName.toLowerCase().replace(/\s+/g, '-'));
        }
    }

    function deleteCollection(collection) {
        if (confirm('Are you sure you want to delete this collection?')) {
            collection.remove();
        }
    }

    // Collection cards interaction
    const collectionCards = document.querySelectorAll('.collection-card');
    collectionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.background = 'var(--card-bg)';
        });

        // Special handling for add collection card
        if (card.classList.contains('add-collection')) {
            card.addEventListener('click', () => {
                // Add ripple effect
                const ripple = document.createElement('div');
                ripple.classList.add('ripple');
                card.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);

                // Show create collection dialog (to be implemented)
                console.log('Create new collection');
            });
        }
    });

    // Article cards interaction
    const articleCards = document.querySelectorAll('.article-card');
    articleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.background = 'var(--card-bg)';
        });

        card.addEventListener('click', () => {
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            card.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);

            // Navigate to article (to be implemented)
            window.location.href = 'article.html';
        });
    });

    // Navigation handling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Add scroll-based animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '20px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.opacity = '1';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.collection-card, .article-card').forEach(el => {
        el.style.transform = 'translateY(20px)';
        el.style.opacity = '0';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });

    // Search functionality (to be implemented)
    const searchInput = document.querySelector('.search-bar input');
    searchInput?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Implement search functionality
        console.log('Searching for:', searchTerm);
    });
}); 