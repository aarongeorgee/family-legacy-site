document.addEventListener('DOMContentLoaded', () => {
    // --- Loading Screen Sequence ---
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.querySelector('.loading-progress');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.filter = 'blur(10px)';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    document.getElementById('home').classList.add('active-scene');
                }, 800);
            }, 200);
        }
        progressBar.style.width = `${progress}%`;
    }, 50);

    // --- Audio System ---
    const ambientAudio = document.getElementById('ambient-audio');
    const audioToggle = document.getElementById('audio-toggle');
    const audioIcon = audioToggle.querySelector('.audio-icon');

    if (ambientAudio) {
        ambientAudio.volume = 0.5; // Increased volume for better mobile audibility
        
        const attemptPlay = () => {
            // Web Audio API context resume (often needed for modern mobile browsers)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') ctx.resume();
            }

            ambientAudio.play().then(() => {
                audioToggle.classList.remove('muted');
                if (audioIcon) audioIcon.innerText = 'Sound On';
                // Remove listeners once playing
                removeUnlockListeners();
            }).catch(() => {
                // Autoplay blocked by browser
            });
        };

        const removeUnlockListeners = () => {
            window.removeEventListener('click', attemptPlay);
            window.removeEventListener('touchstart', attemptPlay);
            window.removeEventListener('touchend', attemptPlay);
            window.removeEventListener('scroll', attemptPlay);
            window.removeEventListener('wheel', attemptPlay);
        };

        // 1. Try immediate autoplay
        attemptPlay();

        // 2. Add listeners for any user gesture to unlock audio ASAP
        window.addEventListener('click', attemptPlay, { once: true });
        window.addEventListener('touchstart', attemptPlay, { once: true });
        window.addEventListener('touchend', attemptPlay, { once: true });
        window.addEventListener('scroll', attemptPlay, { once: true });
        window.addEventListener('wheel', attemptPlay, { once: true });

        // Toggle logic
        audioToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the global attemptPlay twice
            if (ambientAudio.paused) {
                ambientAudio.play();
                audioToggle.classList.remove('muted');
                audioIcon.innerText = 'Sound On';
            } else {
                ambientAudio.pause();
                audioToggle.classList.add('muted');
                audioIcon.innerText = 'Sound Off';
            }
        });
    }

    // --- Custom Cursor ---
    const cursor = document.querySelector('.custom-cursor');
    const glow = document.querySelector('.cursor-glow');

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        
        glow.animate({
            left: `${e.clientX}px`,
            top: `${e.clientY}px`
        }, { duration: 800, fill: "forwards", easing: "cubic-bezier(0.19,1,0.22,1)" });
    });

    const interactiveElements = document.querySelectorAll('a, button');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width = '40px';
            cursor.style.height = '40px';
            cursor.style.backgroundColor = 'rgba(253, 253, 253, 0.1)';
            cursor.style.border = '1px solid var(--color-gold)';
            
            glow.style.width = '500px';
            glow.style.height = '500px';
            glow.style.background = 'radial-gradient(circle, var(--color-gold) 0%, transparent 60%)';
            glow.style.opacity = '0.3';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.width = '6px';
            cursor.style.height = '6px';
            cursor.style.backgroundColor = 'var(--color-pearl)';
            cursor.style.border = 'none';
            
            glow.style.width = '300px';
            glow.style.height = '300px';
            glow.style.background = 'radial-gradient(circle, var(--color-cyan-glow) 0%, transparent 70%)';
            glow.style.opacity = '1';
        });
    });


    // --- Scroll Hijacking & Cinematic Transitions ---
    const scenes = document.querySelectorAll('.scene');
    const navLinks = document.querySelectorAll('.floating-nav a');
    let currentSceneIndex = 0;
    let isAnimating = false;

    function goToScene(index) {
        if (isAnimating || index === currentSceneIndex || index < 0 || index >= scenes.length) return;
        isAnimating = true;

        const direction = index > currentSceneIndex ? 'down' : 'up';

        scenes[currentSceneIndex].classList.remove('active-scene');
        if (direction === 'down') {
            scenes[currentSceneIndex].classList.add('prev-scene');
        } else {
            scenes[currentSceneIndex].classList.remove('prev-scene');
            scenes[currentSceneIndex].style.transform = 'scale(1.05) translateZ(50px)';
        }

        scenes[index].classList.remove('prev-scene');
        scenes[index].classList.add('active-scene');

        navLinks.forEach(link => link.classList.remove('active'));
        if(navLinks[index]) navLinks[index].classList.add('active');

        currentSceneIndex = index;

        setTimeout(() => {
            isAnimating = false;
            // Clean up transforms on non-active scenes
            scenes.forEach((scene, i) => {
                if (i !== index) {
                    scene.style.transform = '';
                }
            });
        }, 2000); 
    }

    let lastWheelTime = 0;
    window.addEventListener('wheel', (e) => {
        if(loadingScreen.style.display !== 'none') return;

        const now = Date.now();
        if (now - lastWheelTime < 2200) return; // Cooldown to prevent trackpad inertia double-triggers
        
        if (e.deltaY > 30) {
            goToScene(currentSceneIndex + 1);
            lastWheelTime = now;
        } else if (e.deltaY < -30) {
            goToScene(currentSceneIndex - 1);
            lastWheelTime = now;
        }
    });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if(loadingScreen.style.display !== 'none') return;

        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;

        if (diff > 50) {
            goToScene(currentSceneIndex + 1);
        } else if (diff < -50) {
            goToScene(currentSceneIndex - 1);
        }
    });

    navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            goToScene(index);
        });
    });

    const backBtn = document.getElementById('back-to-top');
    if(backBtn) {
        backBtn.addEventListener('click', () => goToScene(0));
    }

    // --- Canvas Constellation Particles ---
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.2;
            this.alpha = Math.random() * 0.6 + 0.1;
            this.pulse = Math.random() * 0.02;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            this.alpha += this.pulse;
            if (this.alpha > 0.8 || this.alpha < 0.1) {
                this.pulse = -this.pulse;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(253, 253, 253, ${this.alpha})`;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const numParticles = window.innerWidth < 768 ? 60 : 180;
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const mouseDx = particles[i].x - parseInt(cursor.style.left || 0);
                const mouseDy = particles[i].y - parseInt(cursor.style.top || 0);
                const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    
                    let opacity = 0.1 - (distance / 1200);
                    if (mouseDist < 200) opacity += 0.05;
                    
                    ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        drawLines();
        
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();


});
