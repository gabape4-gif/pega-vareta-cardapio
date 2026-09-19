/* ============================================
   PEGA VARETA — Restaurant Menu Scripts
   Animations, Navigation & Interactivity
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // === Preloader ===
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 800);
    });

    // Fallback: hide preloader after 3 seconds regardless
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 3000);

    // === Navbar Scroll Effect ===
    const nav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.menu-section, .hero-section');

    function handleNavScroll() {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    // Active section highlighting
    function highlightActiveSection() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', () => {
        handleNavScroll();
        highlightActiveSection();
    }, { passive: true });

    handleNavScroll();

    // === Mobile Menu Toggle ===
    const menuToggle = document.getElementById('menu-toggle');
    const navLinksContainer = document.getElementById('nav-links');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinksContainer.classList.toggle('open');
    });

    // Close mobile menu on link click
    navLinksContainer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinksContainer.classList.remove('open');
        });
    });

    // === Scroll Animations (AOS-like) ===
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });

    // === Hero Particles ===
    const particlesContainer = document.getElementById('hero-particles');
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        particlesContainer.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            particle.remove();
        }, (duration + delay) * 1000);
    }

    // Create initial particles
    for (let i = 0; i < 20; i++) {
        createParticle();
    }

    // Continuously create new particles
    setInterval(() => {
        if (particlesContainer && document.visibilityState === 'visible') {
            createParticle();
        }
    }, 2000);

    // === Smooth Scroll for Anchor Links ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // === Card Tilt Effect (Desktop only) ===
    if (window.matchMedia('(min-width: 769px)').matches) {
        const cards = document.querySelectorAll('.menu-card, .cocktail-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / centerY * -3;
                const rotateY = (x - centerX) / centerX * 3;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // === Image Lazy Load Error Handling ===
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.addEventListener('error', function() {
            this.style.background = 'linear-gradient(135deg, #1c1c28, #2a2a38)';
            this.alt = 'Imagem indisponível';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.style.color = '#6b687a';
            this.style.fontSize = '0.85rem';
        });
    });

    console.log('🔥 Pega Vareta — Menu carregado com sucesso!');
});
