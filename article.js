document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.querySelector('.save-article');
    const shareButton = document.querySelector('.share-button');
    const articleCards = document.querySelectorAll('.article-card');

    // Save article functionality
    saveButton.addEventListener('click', () => {
        saveButton.classList.toggle('saved');
        if (saveButton.classList.contains('saved')) {
            saveButton.style.color = 'var(--primary)';
        } else {
            saveButton.style.color = 'rgba(255, 255, 255, 0.6)';
        }
    });

    // Share functionality
    shareButton.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                text: document.querySelector('.article-excerpt').textContent,
                url: window.location.href
            })
            .catch(console.error);
        } else {
            // Fallback: Copy URL to clipboard
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                    shareButton.textContent = 'Copied!';
                    setTimeout(() => {
                        shareButton.innerHTML = `
                            <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" fill="currentColor"/></svg>
                            Share
                        `;
                    }, 2000);
                })
                .catch(console.error);
        }
    });

    // Related article cards hover effects
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

    // Smooth scroll for headings
    document.querySelectorAll('.article-body h2').forEach(heading => {
        heading.style.cursor = 'pointer';
        heading.addEventListener('click', () => {
            const id = heading.textContent.toLowerCase().replace(/\s+/g, '-');
            heading.setAttribute('id', id);
            window.location.hash = id;
        });
    });
}); 