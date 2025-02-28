document.addEventListener('DOMContentLoaded', () => {
    // Stats cards animation
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.background = 'var(--card-bg)';
        });
    });

    // Timeline items animation
    const timelineItems = document.querySelectorAll('.timeline-content');
    timelineItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(10px)';
            item.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
            item.style.background = 'var(--card-bg)';
        });

        item.addEventListener('click', () => {
            // Navigate to article (to be implemented)
            window.location.href = 'article.html';
        });
    });

    // Preference switches animation
    const switches = document.querySelectorAll('.switch');
    switches.forEach(switchEl => {
        const input = switchEl.querySelector('input');
        const slider = switchEl.querySelector('.slider');

        input.addEventListener('change', () => {
            if (input.checked) {
                slider.style.boxShadow = '0 0 10px var(--primary)';
                // Save preference (to be implemented)
                console.log('Preference saved:', input.checked);
            } else {
                slider.style.boxShadow = 'none';
            }
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

    // Settings button animation
    const settingsButton = document.querySelector('.icon-button');
    settingsButton.addEventListener('click', () => {
        settingsButton.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            settingsButton.style.transform = 'none';
        }, 500);
        // Show settings modal (to be implemented)
        console.log('Settings clicked');
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

    // Animate sections on scroll
    document.querySelectorAll('section, .stats-grid, .profile-header').forEach(el => {
        el.style.transform = 'translateY(20px)';
        el.style.opacity = '0';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });

    // Profile avatar hover effect
    const profileAvatar = document.querySelector('.profile-avatar');
    profileAvatar.addEventListener('mouseenter', () => {
        profileAvatar.style.transform = 'scale(1.1)';
        profileAvatar.style.boxShadow = '0 12px 40px rgba(255, 119, 0, 0.4)';
    });

    profileAvatar.addEventListener('mouseleave', () => {
        profileAvatar.style.transform = 'scale(1)';
        profileAvatar.style.boxShadow = '0 8px 32px rgba(255, 119, 0, 0.3)';
    });
}); 