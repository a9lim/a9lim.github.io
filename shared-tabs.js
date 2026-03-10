// shared-tabs.js — Tab switching for sidebar panels.
// Loaded as a plain <script> (not a module) so tabs work even if the main module fails.
(function () {
    var btns = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');
    btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            btns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            panels.forEach(function (p) { p.classList.remove('active'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            if (typeof _haptics !== 'undefined') _haptics.trigger('selection');
            var target = document.getElementById('tab-' + btn.dataset.tab);
            if (target) target.classList.add('active');
        });
    });
})();
