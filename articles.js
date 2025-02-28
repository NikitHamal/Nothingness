document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-button');
    const articleCards = document.querySelectorAll('.article-card');
    const saveButtons = document.querySelectorAll('.save-article');

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.textContent.toLowerCase();
            
            // Filter articles
            articleCards.forEach(card => {
                const tag = card.querySelector('.tag').textContent.toLowerCase();
                if (filter === 'all' || tag === filter) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });

        // Hover effects
        button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('active')) {
                button.style.transform = 'translateY(-2px)';
                button.style.background = 'rgba(255, 255, 255, 0.15)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active')) {
                button.style.transform = 'translateY(0)';
                button.style.background = 'var(--card-bg)';
            }
        });
    });

    // Save article functionality
    saveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            button.classList.toggle('saved');
            if (button.classList.contains('saved')) {
                button.style.color = 'var(--primary)';
            } else {
                button.style.color = 'rgba(255, 255, 255, 0.6)';
            }
        });
    });

    // Article cards hover effects
    articleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.background = 'rgba(255, 255, 255, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.background = 'var(--card-bg)';
        });
    });
}); 