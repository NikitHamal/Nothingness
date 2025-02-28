document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const ctaButton = document.querySelector('.cta-button');
    let currentSlide = 0;

    function updateSlides() {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlides();
    }

    // Auto advance slides
    setInterval(nextSlide, 4000);

    // Manual navigation with dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlides();
        });
    });

    // CTA button animation
    ctaButton.addEventListener('mouseover', () => {
        ctaButton.style.transform = 'translateY(-2px)';
    });

    ctaButton.addEventListener('mouseout', () => {
        ctaButton.style.transform = 'translateY(0)';
    });

    // Add fire filter to SVG
    const svg = document.querySelector('.fire-svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'fire');
    
    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('baseFrequency', '0.02 0.08');
    turbulence.setAttribute('numOctaves', '3');
    turbulence.setAttribute('seed', '3');
    
    const displace = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    displace.setAttribute('in', 'SourceGraphic');
    displace.setAttribute('scale', '3');
    
    filter.appendChild(turbulence);
    filter.appendChild(displace);
    defs.appendChild(filter);
    svg.insertBefore(defs, svg.firstChild);

    // Animate turbulence
    let phase = 0;
    function animateFire() {
        phase += 0.01;
        turbulence.setAttribute('seed', phase);
        requestAnimationFrame(animateFire);
    }
    animateFire();
}); 