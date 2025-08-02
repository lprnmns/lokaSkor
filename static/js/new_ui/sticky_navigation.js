/**
 * Sticky Navigation System
 * Handles scroll-based navigation behavior and responsive interactions
 */
class StickyNavigation {
    constructor() {
        this.scrollThreshold = 100;
        this.navbar = document.querySelector('.nav-sticky');
        this.lastScrollY = window.pageYOffset;
        this.ticking = false;
        
        this.init();
    }

    /**
     * Initialize the sticky navigation system
     */
    init() {
        if (!this.navbar) {
            console.warn('Sticky navigation element not found');
            return;
        }

        // Add scroll listener
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Add resize listener for responsive behavior
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initialize smooth scrolling for anchor links
        this.initSmoothScrolling();
        
        // Set initial state
        this.updateNavbarState();
        
        console.log('Sticky Navigation initialized');
    }

    /**
     * Handle scroll events with throttling for 60fps performance
     */
    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                try {
                    this.updateNavbarState();
                } catch (error) {
                    console.error('Error updating navbar state:', error);
                    this.handleNavbarError(error);
                }
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    /**
     * Handle navbar errors gracefully
     */
    handleNavbarError(error) {
        console.warn('Navbar error detected, using fallback behavior:', error);
        
        // Fallback to simple opacity change
        if (this.navbar) {
            const scrollY = window.pageYOffset;
            this.navbar.style.background = scrollY > this.scrollThreshold ? 
                'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)';
        }
    }

    /**
     * Update navbar appearance based on scroll position
     */
    updateNavbarState() {
        const currentScrollY = window.pageYOffset;
        
        // Add enhanced styling when scrolled past threshold
        if (currentScrollY > this.scrollThreshold) {
            this.navbar.classList.add('nav-scroll-enhanced');
        } else {
            this.navbar.classList.remove('nav-scroll-enhanced');
        }
        
        this.lastScrollY = currentScrollY;
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 768) {
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            
            if (mobileMenu && mobileMenuToggle) {
                mobileMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        }
    }

    /**
     * Initialize smooth scrolling for anchor links
     */
    initSmoothScrolling() {
        const anchorLinks = this.navbar.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    
                    // Calculate offset to account for sticky navbar
                    const navbarHeight = this.navbar.offsetHeight;
                    const targetPosition = target.offsetTop - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    const mobileMenu = document.getElementById('mobileMenu');
                    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                    
                    if (mobileMenu && mobileMenuToggle) {
                        mobileMenu.classList.remove('active');
                        mobileMenuToggle.classList.remove('active');
                    }
                }
            });
        });
    }

    /**
     * Get current scroll position
     */
    getScrollPosition() {
        return window.pageYOffset;
    }

    /**
     * Check if navbar is in enhanced state
     */
    isEnhanced() {
        return this.navbar.classList.contains('nav-scroll-enhanced');
    }

    /**
     * Manually trigger navbar state update
     */
    refresh() {
        this.updateNavbarState();
    }

    /**
     * Destroy the sticky navigation instance
     */
    destroy() {
        window.removeEventListener('scroll', this.handleScroll.bind(this));
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        if (this.navbar) {
            this.navbar.classList.remove('nav-scroll-enhanced');
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if sticky navigation element exists
    if (document.querySelector('.nav-sticky')) {
        window.stickyNavigation = new StickyNavigation();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StickyNavigation;
}