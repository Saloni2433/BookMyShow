document.addEventListener('DOMContentLoaded', function() {
    // Slider functionality
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    function startSlideInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetSlideInterval() {
        clearInterval(slideInterval);
        startSlideInterval();
    }

    // Add click events to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            resetSlideInterval();
        });
    });

    // Add click events to arrows
    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetSlideInterval();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetSlideInterval();
    });

    // Start auto slide
    startSlideInterval();

    // Movie Details Modal
    const movieCards = document.querySelectorAll('.movie-card');
    const modal = document.querySelector('.movie-details-modal');
    const closeBtn = document.querySelector('.movie-details-close');
    const modalTitle = document.querySelector('.movie-details-title');
    const modalRating = document.querySelector('.movie-details-rating');
    const modalBackdrop = document.querySelector('.movie-details-backdrop');

    function openMovieDetails(movie) {
        const title = movie.querySelector('.movie-title').textContent;
        const rating = movie.querySelector('.movie-rating').textContent;
        const poster = movie.querySelector('.movie-poster').src;

        modalTitle.textContent = title;
        modalRating.textContent = rating;
        modalBackdrop.src = poster;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMovieDetails() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    movieCards.forEach(card => {
        card.addEventListener('click', () => openMovieDetails(card));
    });

    closeBtn.addEventListener('click', closeMovieDetails);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMovieDetails();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMovieDetails();
        }
    });
});