/**
 * LokaSkor Modern UI - Micro-interactions Utility
 * Handles specific micro-interactions and feedback
 */

class MicroInteractions {
    constructor() {
        this.rippleElements = new Set();
        this.init();
    }
    
    /**
     * Initialize micro-interactions
     */
    init() {
        this.setupRippleEffect();
        this.setupScrollAnimations();
        this.setupFormInteractions();
        this.setupTooltips();
        this.setupProgressAnimations();
        this.setupCounterAnimations();
        console.log('MicroInteractions initialized');
    }
    
    /**
     * Setup ripple effect for clickable elements
     */
    setupRippleEffect() {
        document.addEventListener('click', (e) => {
            const element = e.target.closest('.click-ripple, .btn, .card-interactive');
            if (element && !element.disabled) {
                this.createRipple(element, e);
            }
        });
    }
    
    /**
     * Create ripple effect
     */
    createRipple(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        // Add ripple styles
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        // Ensure element has relative positioning
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    /**
     * Setup scroll-based animations
     */
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Handle stagger animations
                    if (entry.target.classList.contains('stagger-container')) {
                        this.animateStaggerChildren(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        const scrollElements = document.querySelectorAll(`
            .scroll-fade-in,
            .scroll-slide-left,
            .scroll-slide-right,
            .scroll-scale-in,
            .stagger-container
        `);
        
        scrollElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    /**
     * Animate stagger children
     */
    animateStaggerChildren(container) {
        const children = container.children;
        Array.from(children).forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('stagger-item-visible');
            }, index * 100);
        });
    }
    
    /**
     * Setup form interactions
     */
    setupFormInteractions() {
        // Floating labels
        document.querySelectorAll('.form-floating input, .form-floating textarea').forEach(input => {
            const updateLabel = () => {
                const label = input.nextElementSibling;
                if (label && label.tagName === 'LABEL') {
                    if (input.value || input === document.activeElement) {
                        label.classList.add('floating');
                    } else {
                        label.classList.remove('floating');
                    }
                }
            };
            
            input.addEventListener('focus', updateLabel);
            input.addEventListener('blur', updateLabel);
            input.addEventListener('input', updateLabel);
            
            // Initial check
            updateLabel();
        });
        
        // Input validation feedback
        document.querySelectorAll('input[required], textarea[required]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    this.validateInput(input);
                }
            });
        });
    }
    
    /**
     * Validate input and show feedback
     */
    validateInput(input) {
        const isValid = input.checkValidity();
        
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
        
        // Show validation message
        const feedback = input.parentNode.querySelector('.validation-feedback');
        if (feedback) {
            feedback.textContent = isValid ? '' : input.validationMessage;
        }
    }
    
    /**
     * Setup tooltips
     */
    setupTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            let tooltip = null;
            
            const showTooltip = (e) => {
                const text = element.getAttribute('data-tooltip');
                if (!text) return;
                
                tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = text;
                tooltip.style.position = 'absolute';
                tooltip.style.background = '#333';
                tooltip.style.color = 'white';
                tooltip.style.padding = '0.5rem';
                tooltip.style.borderRadius = '0.25rem';
                tooltip.style.fontSize = '0.875rem';
                tooltip.style.zIndex = '1000';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.opacity = '0';
                tooltip.style.transition = 'opacity 0.2s';
                
                document.body.appendChild(tooltip);
                
                // Position tooltip
                const rect = element.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                tooltip.style.left = (rect.left + rect.width / 2 - tooltipRect.width / 2) + 'px';
                tooltip.style.top = (rect.top - tooltipRect.height - 8) + 'px';
                
                // Show tooltip
                requestAnimationFrame(() => {
                    tooltip.style.opacity = '1';
                });
            };
            
            const hideTooltip = () => {
                if (tooltip) {
                    tooltip.style.opacity = '0';
                    setTimeout(() => {
                        if (tooltip && tooltip.parentNode) {
                            tooltip.parentNode.removeChild(tooltip);
                        }
                        tooltip = null;
                    }, 200);
                }
            };
            
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
            element.addEventListener('focus', showTooltip);
            element.addEventListener('blur', hideTooltip);
        });
    }
    
    /**
     * Setup progress animations
     */
    setupProgressAnimations() {
        document.querySelectorAll('.progress-bar').forEach(progressBar => {
            const fill = progressBar.querySelector('.progress-fill');
            if (fill) {
                const targetWidth = progressBar.style.getPropertyValue('--progress') || '0%';
                
                // Animate progress
                let currentWidth = 0;
                const targetValue = parseInt(targetWidth);
                const duration = 1000;
                const startTime = performance.now();
                
                const animate = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    currentWidth = targetValue * this.easeOutCubic(progress);
                    fill.style.width = currentWidth + '%';
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                
                requestAnimationFrame(animate);
            }
        });
    }
    
    /**
     * Setup counter animations
     */
    setupCounterAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        document.querySelectorAll('.counter').forEach(counter => {
            observer.observe(counter);
        });
    }
    
    /**
     * Animate counter
     */
    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target')) || 0;
        const duration = 2000;
        const startTime = performance.now();
        let startValue = 0;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (target - startValue) * this.easeOutCubic(progress));
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        element.classList.add('animating');
        requestAnimationFrame(animate);
        
        setTimeout(() => {
            element.classList.remove('animating');
        }, duration);
    }
    
    /**
     * Bounce element animation
     */
    bounceElement(element) {
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1.02)';
        }, 100);
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
        
        setTimeout(() => {
            element.style.transform = '';
            element.style.transition = '';
        }, 300);
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.position = 'fixed';
        notification.style.top = '1rem';
        notification.style.right = '1rem';
        notification.style.padding = '1rem';
        notification.style.borderRadius = '0.5rem';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.zIndex = '1000';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease';
        notification.style.maxWidth = '400px';
        notification.style.wordWrap = 'break-word';
        
        // Set colors based on type
        const colors = {
            success: { bg: '#10b981', text: 'white' },
            error: { bg: '#ef4444', text: 'white' },
            warning: { bg: '#f59e0b', text: 'white' },
            info: { bg: '#3b82f6', text: 'white' }
        };
        
        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.color = color.text;
        
        document.body.appendChild(notification);
        
        // Show notification
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Hide notification after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Easing function
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    /**
     * Cleanup micro-interactions
     */
    cleanup() {
        // Remove event listeners and clean up
        this.rippleElements.clear();
    }
}

// Make globally available
window.MicroInteractions = MicroInteractions;