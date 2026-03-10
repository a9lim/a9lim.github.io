// Hamburger toggle for the mobile nav overlay.

export function initMobileMenu($) {
    $.menuToggle.addEventListener('click', () => {
        const open = $.mobileNav.classList.toggle('open');
        $.menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (typeof _haptics !== 'undefined') _haptics.trigger('light');
    });
}
