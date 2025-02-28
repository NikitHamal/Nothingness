document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const searchSuggestions = document.querySelector('.search-suggestions');
    const searchResults = document.querySelector('.search-results');
    const resultsGrid = document.querySelector('.results-grid');
    const resultsCount = document.querySelector('.results-count');
    const topicButtons = document.querySelectorAll('.topic-button');

    // Sample search results data
    const sampleResults = [
        {
            tag: 'Krishnamurti',
            title: 'The End of Thought',
            excerpt: 'Understanding the limitations of thought and discovering what lies beyond...'
        },
        {
            tag: 'Alan Watts',
            title: 'The Wisdom of Insecurity',
            excerpt: 'Exploring the paradox of seeking security in an inherently insecure world...'
        },
        {
            tag: 'Ramana',
            title: 'Who Am I?',
            excerpt: 'A deep dive into self-inquiry and the direct path to self-knowledge...'
        }
    ];

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length > 0) {
            // Filter results based on query
            const filteredResults = sampleResults.filter(result => 
                result.title.toLowerCase().includes(query) || 
                result.excerpt.toLowerCase().includes(query) ||
                result.tag.toLowerCase().includes(query)
            );
            
            // Show results
            searchSuggestions.style.display = 'none';
            searchResults.style.display = 'block';
            resultsCount.textContent = `${filteredResults.length} results`;
            
            // Render results
            resultsGrid.innerHTML = filteredResults.map(result => `
                <div class="result-card" onclick="window.location.href='article.html'">
                    <span class="tag">${result.tag}</span>
                    <h3>${result.title}</h3>
                    <p>${result.excerpt}</p>
                </div>
            `).join('');
        } else {
            // Show suggestions
            searchSuggestions.style.display = 'block';
            searchResults.style.display = 'none';
            resultsGrid.innerHTML = '';
        }
    });

    // Topic buttons click handler
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            searchInput.value = button.textContent;
            searchInput.dispatchEvent(new Event('input'));
        });

        // Hover effects
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