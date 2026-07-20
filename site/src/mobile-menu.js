// Hamburger toggle for the mobile nav overlay.

export function initMobileMenu($) {
    let previousFocus = null;
    let cleanupTrap = null;

    function openMenu() {
        previousFocus = document.activeElement;
        $.mobileNav.classList.add('open');
        $.menuToggle.setAttribute('aria-expanded', 'true');
        if (typeof _haptics !== 'undefined') _haptics.trigger('light');
        cleanupTrap = trapFocus($.mobileNav);
        const firstLink = $.mobileNav.querySelector('.nav-link');
        if (firstLink) firstLink.focus();
    }

    function closeMenu() {
        $.mobileNav.classList.remove('open');
        $.menuToggle.setAttribute('aria-expanded', 'false');
        if (cleanupTrap) { cleanupTrap(); cleanupTrap = null; }
        if (previousFocus) { previousFocus.focus(); previousFocus = null; }
    }

    $.menuToggle.addEventListener('click', () => {
        if ($.mobileNav.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close on Escape
    $.mobileNav.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
        }
    });

    // Dismiss overlay when tapping the backdrop (not the nav links themselves)
    initOverlayDismiss($.mobileNav, null, () => {
        closeMenu();
    });
}
