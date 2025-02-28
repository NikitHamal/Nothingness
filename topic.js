document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-button');
    const articleCards = document.querySelectorAll('.article-card');
    const saveButtons = document.querySelectorAll('.save-article');

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const teacher = button.textContent.toLowerCase();
            articleCards.forEach(card => {
                const tag = card.querySelector('.tag').textContent.toLowerCase();
                if (teacher === 'all' || tag === teacher) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    });

    // Article card hover effects
    articleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.background = 'var(--card-bg)';
        });

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.save-article')) {
                window.location.href = 'article.html';
            }
        });
    });

    // Save article functionality
    saveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            button.classList.toggle('saved');
            const icon = button.querySelector('svg');
            if (button.classList.contains('saved')) {
                icon.innerHTML = `<path fill="currentColor" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
            } else {
                icon.innerHTML = `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
            }
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    });
}); 