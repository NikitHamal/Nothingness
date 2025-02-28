document.addEventListener('DOMContentLoaded', () => {
    // Navigation handling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Search functionality with animation
    const searchBar = document.querySelector('.search-bar');
    const searchInput = searchBar.querySelector('input');
    
    searchInput.addEventListener('focus', () => {
        searchBar.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', () => {
        searchBar.classList.remove('focused');
        if (searchInput.value.length > 0) {
            searchBar.classList.add('has-content');
        } else {
            searchBar.classList.remove('has-content');
        }
    });

    // Topic buttons interaction
    const topicButtons = document.querySelectorAll('.topic-button');
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('clicked');
            setTimeout(() => button.classList.remove('clicked'), 200);
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-5px)';
            button.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.background = 'var(--card-bg)';
        });
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
        });
    });

    // Featured card parallax effect
    const featuredCard = document.querySelector('.featured-card');
    featuredCard.addEventListener('mousemove', (e) => {
        const rect = featuredCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xPercent = (x / rect.width - 0.5) * 20;
        const yPercent = (y / rect.height - 0.5) * 20;
        
        featuredCard.style.transform = `perspective(1000px) rotateX(${yPercent}deg) rotateY(${xPercent}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    featuredCard.addEventListener('mouseleave', () => {
        featuredCard.style.transform = 'none';
    });

    // Smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
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
            }
        });
    }, observerOptions);

    document.querySelectorAll('.article-card, .topic-button').forEach(el => {
        observer.observe(el);
    });

    // Save article functionality
    const saveButtons = document.querySelectorAll('.save-article');
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

    // Featured card hover effect
    featuredCard.addEventListener('mouseenter', () => {
        featuredCard.style.transform = 'translateY(-5px)';
    });
    
    featuredCard.addEventListener('mouseleave', () => {
        featuredCard.style.transform = 'translateY(0)';
    });

    // Article cards hover effect
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

    // Topic buttons hover effect
    topicButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.background = 'rgba(255, 255, 255, 0.15)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.background = 'var(--card-bg)';
        });
    });
}); 