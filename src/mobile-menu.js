// ─── Mobile Menu ───

export function initMobileMenu($) {
    $.menuToggle.addEventListener('click', () => {
        const open = $.mobileNav.classList.toggle('open');
        $.menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}
