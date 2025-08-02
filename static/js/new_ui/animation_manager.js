/**
 * LocationIQ Modern UI - Animation Manager
 * Manages advanced animations and micro-interactions
 */

class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.animationQueue = [];
        this.isProcessing = false;
        this.reducedMotion = false;
        
        this.init();
    }
    
    /**
     * Initialize animation manager
     */
    init() {
        this.checkReducedMotion();
        this.setupIntersectionObservers();
        this.setupGlobalAnimations();
        this.setupMicroInteractions();
        
        console.log('AnimationManager initialized');
    }
    
    /**
     * Check for reduced motion preference
     */
    checkReducedMotion() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            this.updateAnimationSettings();
        });
        
        // Listen for language changes
        if (window.languageEvents) {
            window.languageEvents.subscribe((lang) => {
                // Update any animation-related text if needed
                this.updateAnimationText();
            });
        }
    }
    
    /**
     * Update animation settings based on reduced motion
     */
    updateAnimationSettings() {
        const root = document.documentElement;
        
        if (this.reducedMotion) {
            root.style.setProperty('--duration-fast', '0.01ms');
            root.style.setProperty('--duration-normal', '0.01ms');
            root.style.setProperty('--duration-slow', '0.01ms');
            root.style.setProperty('--duration-slower', '0.01ms');
        } else {
            root.style.setProperty('--duration-fast', '0.15s');
            root.style.setProperty('--duration-normal', '0.2s');
            root.style.setProperty('--duration-slow', '0.3s');
            root.style.setProperty('--duration-slower', '0.5s');
        }
    }
    
    /**
     * Setup intersection observers for scroll animations
     */
    setupIntersectionObservers() {
        // Fade in observer
        const fadeInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateFadeIn(entry.target);
                    fadeInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        this.observers.set('fadeIn', fadeInObserver);
        
        // Slide in observer
        const slideInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateSlideIn(entry.target);
                    slideInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });
        
        this.observers.set('slideIn', slideInObserver);
        
        // Scale in observer
        const scaleInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateScaleIn(entry.target);
                    scaleInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        
        this.observers.set('scaleIn', scaleInObserver);
        
        // Stagger observer
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateStagger(entry.target);
                    staggerObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        this.observers.set('stagger', staggerObserver);
    }
    
    /**
     * Setup global animations
     */
    setupGlobalAnimations() {
        // Page transition animations
        this.setupPageTransitions();
        
        // Scroll-based animations
        this.setupScrollAnimations();
        
        // Loading animations
        this.setupLoadingAnimations();
    }
    
    /**
     * Setup page transition animations
     */
    setupPageTransitions() {
        // Page enter animation
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('page-enter');
        });
        
        // Navigation transitions
        const navLinks = document.querySelectorAll('a[href]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.hostname === window.location.hostname) {
                    this.animatePageExit();
                }
            });
        });
    }
    
    /**
     * Setup scroll animations
     */
    setupScrollAnimations() {
        let ticking = false;
        
        const updateScrollAnimations = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            
            // Parallax effects
            const parallaxElements = document.querySelectorAll('[data-parallax]');
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.parallax) || 0.5;
                const yPos = -(scrollY * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            // Fade on scroll
            const fadeElements = document.querySelectorAll('[data-fade-scroll]');
            fadeElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const opacity = Math.max(0, Math.min(1, 1 - (Math.abs(rect.top - windowHeight / 2) / windowHeight)));
                element.style.opacity = opacity;
            });
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        });
    }
    
    /**
     * Setup loading animations
     */
    setupLoadingAnimations() {
        // Skeleton shimmer effect
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
            }
            
            .shimmer {
                background: linear-gradient(90deg, 
                    hsl(var(--muted)) 25%, 
                    hsl(var(--background)) 50%, 
                    hsl(var(--muted)) 75%
                );
                background-size: 200px 100%;
                animation: shimmer 1.5s infinite linear;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Setup micro-interactions
     */
    setupMicroInteractions() {
        this.setupButtonInteractions();
        this.setupCardInteractions();
        this.setupInputInteractions();
        this.setupHoverEffects();
        this.setupClickEffects();
    }
    
    /**
     * Setup button interactions
     */
    setupButtonInteractions() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, button') || e.target.closest('.btn, button')) {
                const button = e.target.matches('.btn, button') ? e.target : e.target.closest('.btn, button');
                this.animateButtonPress(button);
            }
        });
        
        // Button hover effects
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.matches && (e.target.matches('.btn') || e.target.closest('.btn'))) {
                const button = e.target.matches('.btn') ? e.target : e.target.closest('.btn');
                this.animateButtonHover(button, true);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.matches && (e.target.matches('.btn') || e.target.closest('.btn'))) {
                const button = e.target.matches('.btn') ? e.target : e.target.closest('.btn');
                this.animateButtonHover(button, false);
            }
        }, true);
    }
    
    /**
     * Setup card interactions
     */
    setupCardInteractions() {
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.matches && (e.target.matches('.card-interactive') || e.target.closest('.card-interactive'))) {
                const card = e.target.matches('.card-interactive') ? e.target : e.target.closest('.card-interactive');
                this.animateCardHover(card, true);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.matches && (e.target.matches('.card-interactive') || e.target.closest('.card-interactive'))) {
                const card = e.target.matches('.card-interactive') ? e.target : e.target.closest('.card-interactive');
                this.animateCardHover(card, false);
            }
        }, true);
        
        // Card selection animation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.card-interactive') || e.target.closest('.card-interactive')) {
                const card = e.target.matches('.card-interactive') ? e.target : e.target.closest('.card-interactive');
                this.animateCardSelect(card);
            }
        });
    }
    
    /**
     * Setup input interactions
     */
    setupInputInteractions() {
        document.addEventListener('focus', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.animateInputFocus(e.target, true);
            }
        }, true);
        
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.animateInputFocus(e.target, false);
            }
        }, true);
        
        // Input typing animation
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[type="text"], input[type="search"], textarea')) {
                this.animateInputTyping(e.target);
            }
        });
    }
    
    /**
     * Setup hover effects
     */
    setupHoverEffects() {
        // Generic hover effects
        const hoverElements = document.querySelectorAll('[data-hover]');
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.animateHover(element, true);
            });
            
            element.addEventListener('mouseleave', () => {
                this.animateHover(element, false);
            });
        });
    }
    
    /**
     * Setup click effects
     */
    setupClickEffects() {
        document.addEventListener('click', (e) => {
            // Ripple effect for clickable elements
            if (e.target.matches('[data-ripple]') || e.target.closest('[data-ripple]')) {
                const element = e.target.matches('[data-ripple]') ? e.target : e.target.closest('[data-ripple]');
                this.createRippleEffect(element, e);
            }
        });
    }
    
    /**
     * Animate fade in
     */
    animateFadeIn(element) {
        if (this.reducedMotion) {
            element.style.opacity = '1';
            return;
        }
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    /**
     * Animate slide in
     */
    animateSlideIn(element) {
        if (this.reducedMotion) return;
        
        const direction = element.dataset.slideDirection || 'left';
        const distance = element.dataset.slideDistance || '50px';
        
        let initialTransform;
        switch (direction) {
            case 'right':
                initialTransform = `translateX(${distance})`;
                break;
            case 'up':
                initialTransform = `translateY(-${distance})`;
                break;
            case 'down':
                initialTransform = `translateY(${distance})`;
                break;
            default:
                initialTransform = `translateX(-${distance})`;
        }
        
        element.style.transform = initialTransform;
        element.style.opacity = '0';
        element.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease';
        
        requestAnimationFrame(() => {
            element.style.transform = 'translate(0, 0)';
            element.style.opacity = '1';
        });
    }
    
    /**
     * Animate scale in
     */
    animateScaleIn(element) {
        if (this.reducedMotion) return;
        
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0';
        element.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
        
        requestAnimationFrame(() => {
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
        });
    }
    
    /**
     * Animate stagger effect
     */
    animateStagger(container) {
        if (this.reducedMotion) return;
        
        const children = container.children;
        const delay = parseInt(container.dataset.staggerDelay) || 100;
        
        Array.from(children).forEach((child, index) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(20px)';
            child.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            setTimeout(() => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            }, index * delay);
        });
    }
    
    /**
     * Animate button press
     */
    animateButtonPress(button) {
        if (this.reducedMotion) return;
        
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }
    
    /**
     * Animate button hover
     */
    animateButtonHover(button, isHovering) {
        if (this.reducedMotion) return;
        
        if (isHovering) {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        } else {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '';
        }
        
        button.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    }
    
    /**
     * Animate card hover
     */
    animateCardHover(card, isHovering) {
        if (this.reducedMotion) return;
        
        if (isHovering) {
            card.style.transform = 'translateY(-4px) scale(1.02)';
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '';
        }
        
        card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease';
    }
    
    /**
     * Animate card selection
     */
    animateCardSelect(card) {
        if (this.reducedMotion) return;
        
        card.style.transform = 'scale(0.98)';
        card.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            card.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 100);
        }, 50);
    }
    
    /**
     * Animate input focus
     */
    animateInputFocus(input, isFocused) {
        if (this.reducedMotion) return;
        
        if (isFocused) {
            input.style.transform = 'scale(1.02)';
            input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        } else {
            input.style.transform = 'scale(1)';
            input.style.boxShadow = '';
        }
        
        input.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    }
    
    /**
     * Animate input typing
     */
    animateInputTyping(input) {
        if (this.reducedMotion) return;
        
        input.style.transform = 'scale(1.01)';
        
        clearTimeout(input.typingTimeout);
        input.typingTimeout = setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, 150);
        
        input.style.transition = 'transform 0.1s ease';
    }
    
    /**
     * Animate hover effect
     */
    animateHover(element, isHovering) {
        if (this.reducedMotion) return;
        
        const effect = element.dataset.hover;
        
        switch (effect) {
            case 'lift':
                element.style.transform = isHovering ? 'translateY(-2px)' : 'translateY(0)';
                break;
            case 'scale':
                element.style.transform = isHovering ? 'scale(1.05)' : 'scale(1)';
                break;
            case 'rotate':
                element.style.transform = isHovering ? 'rotate(2deg)' : 'rotate(0deg)';
                break;
            case 'glow':
                element.style.boxShadow = isHovering ? '0 0 20px rgba(59, 130, 246, 0.3)' : '';
                break;
        }
        
        element.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    }
    
    /**
     * Create ripple effect
     */
    createRippleEffect(element, event) {
        if (this.reducedMotion) return;
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Add ripple keyframes if not exists
        if (!document.getElementById('ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    /**
     * Animate page exit
     */
    animatePageExit() {
        if (this.reducedMotion) return;
        
        document.body.style.opacity = '0';
        document.body.style.transform = 'scale(0.98)';
        document.body.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }
    
    /**
     * Animate score counter
     */
    animateScoreCounter(element, targetScore, duration = 1000) {
        if (this.reducedMotion) {
            element.textContent = targetScore;
            return;
        }
        
        let currentScore = 0;
        const increment = targetScore / (duration / 16); // 60fps
        
        const animate = () => {
            currentScore += increment;
            
            if (currentScore >= targetScore) {
                element.textContent = targetScore;
                return;
            }
            
            element.textContent = Math.floor(currentScore);
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    /**
     * Animate progress bar
     */
    animateProgressBar(element, targetWidth, duration = 800) {
        if (this.reducedMotion) {
            element.style.width = `${targetWidth}%`;
            return;
        }
        
        element.style.width = '0%';
        element.style.transition = `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        requestAnimationFrame(() => {
            element.style.width = `${targetWidth}%`;
        });
    }
    
    /**
     * Queue animation
     */
    queueAnimation(animationFn, delay = 0) {
        this.animationQueue.push({ fn: animationFn, delay });
        
        if (!this.isProcessing) {
            this.processAnimationQueue();
        }
    }
    
    /**
     * Process animation queue
     */
    async processAnimationQueue() {
        this.isProcessing = true;
        
        while (this.animationQueue.length > 0) {
            const { fn, delay } = this.animationQueue.shift();
            
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            fn();
        }
        
        this.isProcessing = false;
    }
    
    /**
     * Observe element for animations
     */
    observe(element, type = 'fadeIn') {
        const observer = this.observers.get(type);
        if (observer) {
            observer.observe(element);
        }
    }
    
    /**
     * Unobserve element
     */
    unobserve(element, type = 'fadeIn') {
        const observer = this.observers.get(type);
        if (observer) {
            observer.unobserve(element);
        }
    }
    
    /**
     * Cleanup animation manager
     */
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.animationQueue = [];
        this.isProcessing = false;
    }
    
    /**
     * Update animation text when language changes
     */
    updateAnimationText() {
        // This would update any animation-related text when the language changes
        // For now, we'll just log that it was called
        console.log('Language changed, updating animation text...');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}

// Make globally available
window.AnimationManager = AnimationManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.animationManager) {
            window.animationManager = new AnimationManager();
        }
    });
} else {
    if (!window.animationManager) {
        window.animationManager = new AnimationManager();
    }
}