/**
 * AdvancedAnimationManager - Enhanced animations and micro-interactions
 * Handles coordinated animations, page transitions, and interactive effects
 */
class AdvancedAnimationManager {
    constructor() {
        this.observers = new Map();
        this.animationQueue = [];
        this.isProcessing = false;
        this.reducedMotion = false;
        this.activeAnimations = new Set();
        
        this.init();
        
        console.log('AdvancedAnimationManager initialized');
    }

    init() {
        this.checkReducedMotion();
        this.setupIntersectionObservers();
        this.setupPageTransitions();
        this.setupMicroInteractions();
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.initializeCounterAnimations();
    }

    checkReducedMotion() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
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

    updateAnimationSettings() {
        const root = document.documentElement;
        
        if (this.reducedMotion) {
            root.style.setProperty('--duration-fast', '0.01ms');
            root.style.setProperty('--duration-normal', '0.01ms');
            root.style.setProperty('--duration-slow', '0.01ms');
        } else {
            root.style.setProperty('--duration-fast', '0.15s');
            root.style.setProperty('--duration-normal', '0.3s');
            root.style.setProperty('--duration-slow', '0.5s');
        }
    }

    // Page Transition Animations
    setupPageTransitions() {
        this.addPageTransitionStyles();
        this.observePageChanges();
    }

    addPageTransitionStyles() {
        if (!document.getElementById('page-transition-styles')) {
            const styles = document.createElement('style');
            styles.id = 'page-transition-styles';
            styles.textContent = `
                /* Page Transitions */
                .page-transition-enter {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .page-transition-enter-active {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .page-transition-exit {
                    opacity: 1;
                    transform: translateY(0);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .page-transition-exit-active {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                
                /* Fade In Animation */
                .fade-in {
                    opacity: 0;
                    animation: fadeIn 0.6s ease-out forwards;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Slide In Animations */
                .slide-in-left {
                    opacity: 0;
                    transform: translateX(-50px);
                    animation: slideInLeft 0.5s ease-out forwards;
                }
                
                .slide-in-right {
                    opacity: 0;
                    transform: translateX(50px);
                    animation: slideInRight 0.5s ease-out forwards;
                }
                
                @keyframes slideInLeft {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInRight {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                /* Scale In Animation */
                .scale-in {
                    opacity: 0;
                    transform: scale(0.8);
                    animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                @keyframes scaleIn {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                /* Stagger Animation */
                .stagger-item {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .stagger-item.animate {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                /* Hover Effects */
                .hover-lift {
                    transition: all 0.2s ease;
                }
                
                .hover-lift:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                }
                
                .hover-scale {
                    transition: transform 0.2s ease;
                }
                
                .hover-scale:hover {
                    transform: scale(1.02);
                }
                
                .hover-glow {
                    transition: all 0.2s ease;
                }
                
                .hover-glow:hover {
                    box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
                }
                
                /* Button Animations */
                .btn-animate {
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s ease;
                }
                
                .btn-animate::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s ease;
                }
                
                .btn-animate:hover::before {
                    left: 100%;
                }
                
                /* Loading Animations */
                .loading-pulse {
                    animation: loadingPulse 1.5s ease-in-out infinite;
                }
                
                @keyframes loadingPulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                
                /* Counter Animation */
                .counter-animate {
                    font-variant-numeric: tabular-nums;
                    transition: all 0.3s ease;
                }
                
                /* Pin Animations */
                .pin-drop {
                    animation: pinDrop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                @keyframes pinDrop {
                    0% {
                        transform: translateY(-100px) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translateY(10px) scale(1.1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }
                
                .pin-bounce {
                    animation: pinBounce 0.8s ease-out;
                }
                
                @keyframes pinBounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }
                
                /* Selection Ring Animation */
                .selection-ring {
                    position: relative;
                }
                
                .selection-ring::after {
                    content: '';
                    position: absolute;
                    top: -3px;
                    left: -3px;
                    right: -3px;
                    bottom: -3px;
                    border: 2px solid hsl(var(--primary));
                    border-radius: inherit;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                }
                
                .selection-ring.selected::after {
                    opacity: 1;
                    transform: scale(1);
                }
                
                /* Notification Animations */
                .notification-enter {
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .notification-enter-active {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .notification-exit {
                    opacity: 1;
                    transform: translateX(0);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .notification-exit-active {
                    opacity: 0;
                    transform: translateX(100%);
                }
                
                /* Progress Animation */
                .progress-animate {
                    position: relative;
                    overflow: hidden;
                }
                
                .progress-animate::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    right: 0;
                    background-image: linear-gradient(
                        -45deg,
                        rgba(255, 255, 255, 0.2) 25%,
                        transparent 25%,
                        transparent 50%,
                        rgba(255, 255, 255, 0.2) 50%,
                        rgba(255, 255, 255, 0.2) 75%,
                        transparent 75%,
                        transparent
                    );
                    background-size: 50px 50px;
                    animation: progressStripes 2s linear infinite;
                }
                
                @keyframes progressStripes {
                    0% {
                        background-position: 0 0;
                    }
                    100% {
                        background-position: 50px 50px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    observePageChanges() {
        // Observe for new content that needs page transition animations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.applyPageTransition(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    applyPageTransition(element) {
        if (element.classList.contains('page-content') || 
            element.classList.contains('main-content')) {
            
            element.classList.add('page-transition-enter');
            
            setTimeout(() => {
                element.classList.add('page-transition-enter-active');
            }, 10);
            
            setTimeout(() => {
                element.classList.remove('page-transition-enter', 'page-transition-enter-active');
            }, 400);
        }
    }

    // Intersection Observer for scroll animations
    setupIntersectionObservers() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        this.observeScrollElements(observer);
        this.observers.set('scroll', observer);
    }

    observeScrollElements(observer) {
        const selectors = [
            '.fade-in',
            '.slide-in-left',
            '.slide-in-right',
            '.scale-in',
            '.stagger-container'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                observer.observe(element);
            });
        });
    }

    animateElement(element) {
        if (element.classList.contains('stagger-container')) {
            this.animateStaggeredChildren(element);
        } else {
            element.classList.add('animate');
        }
    }

    animateStaggeredChildren(container) {
        const children = container.querySelectorAll('.stagger-item');
        
        children.forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('animate');
            }, index * 100);
        });
    }

    // Micro-interactions
    setupMicroInteractions() {
        this.setupButtonAnimations();
        this.setupInputAnimations();
        this.setupCardAnimations();
        this.setupNotificationSystem();
    }

    setupButtonAnimations() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn');
            if (button && !this.reducedMotion) {
                this.createRippleEffect(button, e);
            }
        });

        // Add shine effect to buttons
        document.querySelectorAll('.btn').forEach(button => {
            if (!button.classList.contains('btn-animate')) {
                button.classList.add('btn-animate');
            }
        });
    }

    createRippleEffect(button, event) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

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
        `;

        if (!document.getElementById('ripple-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ripple-styles';
            styles.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    setupInputAnimations() {
        document.querySelectorAll('.input-micro').forEach(input => {
            input.addEventListener('focus', () => {
                input.classList.add('focus-ring-animate');
            });

            input.addEventListener('blur', () => {
                input.classList.remove('focus-ring-animate');
            });
        });
    }

    setupCardAnimations() {
        document.querySelectorAll('.card, .result-item, .address-item').forEach(card => {
            if (!card.classList.contains('hover-lift')) {
                card.classList.add('hover-lift');
            }
        });
    }

    setupNotificationSystem() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    // Scroll animations
    setupScrollAnimations() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        // Parallax effect for hero sections
        document.querySelectorAll('.parallax').forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });

        // Fade elements based on scroll position
        document.querySelectorAll('.scroll-fade').forEach(element => {
            const rect = element.getBoundingClientRect();
            const opacity = Math.max(0, Math.min(1, 1 - (Math.abs(rect.top - windowHeight / 2) / windowHeight)));
            element.style.opacity = opacity;
        });
    }

    // Hover effects
    setupHoverEffects() {
        document.querySelectorAll('.hover-scale').forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!this.reducedMotion) {
                    element.style.transform = 'scale(1.02)';
                }
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
            });
        });
    }

    // Counter animations
    initializeCounterAnimations() {
        document.querySelectorAll('.counter').forEach(counter => {
            this.observers.get('scroll').observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.target);
        const duration = parseInt(element.dataset.duration) || 2000;
        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        
        let current = start;
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            element.textContent = Math.floor(current);
        }, 16);
    }

    // Pin animations
    animatePin(pinElement, type = 'drop') {
        if (this.reducedMotion) return;

        pinElement.classList.add(`pin-${type}`);
        
        setTimeout(() => {
            pinElement.classList.remove(`pin-${type}`);
        }, type === 'drop' ? 600 : 800);
    }

    // Selection animations
    animateSelection(element) {
        if (this.reducedMotion) return;

        element.classList.add('selection-ring', 'selected');
        
        // Add pulse effect
        const pulseKeyframes = [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.05)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 }
        ];
        
        element.animate(pulseKeyframes, {
            duration: 300,
            easing: 'ease-out'
        });
    }

    // Notification animations
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type} notification-enter`;
        notification.style.cssText = `
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: var(--radius);
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            pointer-events: auto;
            max-width: 300px;
            word-wrap: break-word;
        `;

        const colors = {
            success: 'hsl(var(--chart-2))',
            error: 'hsl(var(--destructive))',
            warning: 'hsl(var(--chart-3))',
            info: 'hsl(var(--primary))'
        };

        notification.style.borderLeftColor = colors[type] || colors.info;
        notification.textContent = message;

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('notification-enter-active');
        }, 10);

        // Auto remove
        setTimeout(() => {
            this.hideNotification(notification);
        }, duration);

        return notification;
    }

    hideNotification(notification) {
        notification.classList.remove('notification-enter-active');
        notification.classList.add('notification-exit', 'notification-exit-active');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Progress animations
    animateProgress(progressBar, targetWidth, duration = 1000) {
        if (this.reducedMotion) {
            progressBar.style.width = `${targetWidth}%`;
            return;
        }

        progressBar.classList.add('progress-animate');
        
        const startWidth = parseFloat(progressBar.style.width) || 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentWidth = startWidth + (targetWidth - startWidth) * easeOutCubic;
            
            progressBar.style.width = `${currentWidth}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                progressBar.classList.remove('progress-animate');
            }
        };

        requestAnimationFrame(animate);
    }

    // Queue system for coordinated animations
    queueAnimation(animationFn, delay = 0) {
        this.animationQueue.push({ fn: animationFn, delay });
        
        if (!this.isProcessing) {
            this.processAnimationQueue();
        }
    }

    async processAnimationQueue() {
        this.isProcessing = true;
        
        while (this.animationQueue.length > 0) {
            const { fn, delay } = this.animationQueue.shift();
            
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            await fn();
        }
        
        this.isProcessing = false;
    }

    // Utility methods
    createTimeline() {
        return new AnimationTimeline(this);
    }

    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.animationQueue = [];
        this.activeAnimations.clear();
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

// Animation Timeline helper class
class AnimationTimeline {
    constructor(manager) {
        this.manager = manager;
        this.steps = [];
    }

    add(animationFn, delay = 0) {
        this.steps.push({ fn: animationFn, delay });
        return this;
    }

    async play() {
        for (const step of this.steps) {
            if (step.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, step.delay));
            }
            await step.fn();
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnimationManager;
}